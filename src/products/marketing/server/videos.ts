// Marketing → Vídeos, no servidor. A leitura roda como a pessoa (role authenticated com o usuário e a empresa ativa do
// Clerk), então as mesmas políticas da tabela decidem (editor.can_read). As gravações também conferem a pessoa
// (editor.can_write) e então gravam com a conexão do servidor: o banco não deixa a tela gravar direto, porque cada
// vídeo gasta cota e dinheiro no provedor. Os arquivos ficam no bucket privado marketing-videos e saem por URL assinada.
import { randomUUID } from 'node:crypto'
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import {
  COTA_PADRAO_MINUTOS, emAndamento, modeloVideo, validarCota, validarPedidoVideo,
  type FormatoVideo, type SituacaoVideo,
} from '@/products/marketing/shared/videoModels'
import { videoProvider } from './videoProviders'

export const VIDEOS_BUCKET = 'marketing-videos'
export const VIDEOS_POR_PAGINA = 30
const URL_SEGUNDOS = 3600
const REFERENCIA_MAXIMA = 10 * 1024 * 1024
const VIDEO_MAXIMO = 500 * 1024 * 1024
const FUSO = 'America/Sao_Paulo'

export class VideoError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export type Contexto = { userId: string; orgId: string; origem: string }
export type Aba = 'todos' | 'salvos' | 'meus'
export type FiltrosVideo = { aba: Aba; modelo?: string; formato?: string; situacao?: SituacaoVideo; inicio?: number }

export type Video = {
  id: string; prompt: string; modelo: string; formato: FormatoVideo; duracao_s: number; estilo: string
  status: SituacaoVideo; erro: string | null; criado_em: string; concluido_em: string | null
  criado_por_mim: boolean; salvo: boolean; url: string | null; referencia_url: string | null
}
export type Cota = { usado_segundos: number; limite_minutos: number }

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 3, connectionTimeoutMillis: 5000 })
  return pool
}
type Client = Awaited<ReturnType<InstanceType<typeof Pool>['connect']>>

async function inTransaction<T>(run: (client: Client) => Promise<T>) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await run(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

/** Roda como a pessoa, na empresa ativa: as políticas da tabela decidem o que ela vê. */
function asPerson<T>(ctx: Contexto, run: (client: Client) => Promise<T>) {
  return inTransaction(async client => {
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: ctx.userId, role: 'authenticated', o: { id: ctx.orgId } })])
    await client.query("SELECT set_config('role', 'authenticated', true)")
    return run(client)
  })
}

async function exigirAcesso(ctx: Contexto, escrita: boolean) {
  const rows = await asPerson(ctx, async client => (await client.query('SELECT editor.can_read($1) AS ler, editor.can_write($1) AS gravar', [ctx.orgId])).rows as { ler: boolean; gravar: boolean }[])
  if (!rows[0]?.ler) throw new VideoError(403, 'Você não tem acesso aos vídeos desta empresa.')
  if (escrita && !rows[0]?.gravar) throw new VideoError(403, 'Seu acesso a esta empresa é só de visualização.')
}

// ---------------------------------------------------------------- storage

function storageBase() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes')
  return { base, headers: { apikey: key, authorization: `Bearer ${key}` } }
}

async function enviarArquivo(path: string, conteudo: ArrayBuffer, mime: string) {
  const { base, headers } = storageBase()
  const response = await fetch(`${base}/storage/v1/object/${VIDEOS_BUCKET}/${path}`, {
    method: 'POST', headers: { ...headers, 'content-type': mime, 'x-upsert': 'true' }, body: conteudo, cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Storage respondeu ${response.status} ao gravar`)
}

async function apagarArquivos(paths: string[]) {
  if (!paths.length) return
  const { base, headers } = storageBase()
  await fetch(`${base}/storage/v1/object/${VIDEOS_BUCKET}`, {
    method: 'DELETE', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ prefixes: paths }), cache: 'no-store',
  }).catch(() => undefined)
}

async function assinar(paths: string[]) {
  const urls = new Map<string, string>()
  if (!paths.length) return urls
  const { base, headers } = storageBase()
  const response = await fetch(`${base}/storage/v1/object/sign/${VIDEOS_BUCKET}`, {
    method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ expiresIn: URL_SEGUNDOS, paths }), cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Storage respondeu ${response.status} ao assinar`)
  for (const item of await response.json() as { path: string | null; signedURL: string | null }[]) {
    if (item.path && item.signedURL) urls.set(item.path, `${base}/storage/v1${encodeURI(item.signedURL)}`)
  }
  return urls
}

// ---------------------------------------------------------------- consulta

type Linha = {
  id: string; prompt: string; modelo: string; formato: FormatoVideo; duracao_s: number; estilo: string; status: SituacaoVideo
  erro: string | null; criado_em: Date; concluido_em: Date | null; created_by: string; salvo: boolean
  resultado_path: string | null; referencia_path: string | null
}
const COLUNAS = `g.id, g.prompt, g.modelo, g.formato, g.duracao_s, g.estilo, g.status, g.erro, g.criado_em, g.concluido_em, g.created_by,
  g.resultado_path, g.referencia_path, EXISTS (SELECT 1 FROM marketing.video_saves s WHERE s.generation_id = g.id AND s.user_id = editor.uid()) AS salvo`

async function paraTela(ctx: Contexto, linhas: Linha[]): Promise<Video[]> {
  const urls = await assinar(linhas.flatMap(l => [l.resultado_path, l.referencia_path]).filter((p): p is string => Boolean(p)))
  return linhas.map(l => ({
    id: l.id, prompt: l.prompt, modelo: l.modelo, formato: l.formato, duracao_s: l.duracao_s, estilo: l.estilo, status: l.status,
    erro: l.erro, criado_em: l.criado_em.toISOString(), concluido_em: l.concluido_em?.toISOString() ?? null,
    criado_por_mim: l.created_by === ctx.userId, salvo: l.salvo,
    url: l.resultado_path ? urls.get(l.resultado_path) ?? null : null,
    referencia_url: l.referencia_path ? urls.get(l.referencia_path) ?? null : null,
  }))
}

async function cota(client: Client, workspace: string): Promise<Cota> {
  const { rows } = await client.query(
    `SELECT coalesce((SELECT minutos_mes FROM marketing.video_quotas WHERE workspace_id = $1), $2)::float AS limite,
       coalesce((SELECT sum(duracao_s) FROM marketing.video_generations WHERE workspace_id = $1 AND status IN ('na_fila', 'gerando', 'pronto')
         AND criado_em >= date_trunc('month', now() AT TIME ZONE '${FUSO}') AT TIME ZONE '${FUSO}'), 0)::int AS usado`,
    [workspace, COTA_PADRAO_MINUTOS])
  return { usado_segundos: rows[0].usado, limite_minutos: rows[0].limite }
}

/** Página de vídeos da empresa (30 por vez), com URLs assinadas por uma hora, e a cota do mês. */
export async function listarVideos(ctx: Contexto, filtros: FiltrosVideo) {
  await exigirAcesso(ctx, false)
  const { linhas, total, usoCota } = await asPerson(ctx, async client => {
    const params: unknown[] = [ctx.orgId]
    let where = 'g.workspace_id = $1'
    if (filtros.aba === 'meus') where += ` AND g.created_by = $${params.push(ctx.userId)}`
    if (filtros.aba === 'salvos') where += ' AND EXISTS (SELECT 1 FROM marketing.video_saves s WHERE s.generation_id = g.id AND s.user_id = editor.uid())'
    if (filtros.modelo) where += ` AND g.modelo = $${params.push(filtros.modelo)}`
    if (filtros.formato) where += ` AND g.formato = $${params.push(filtros.formato)}`
    if (filtros.situacao) where += ` AND g.status = $${params.push(filtros.situacao)}`
    const total = (await client.query(`SELECT count(*)::int AS n FROM marketing.video_generations g WHERE ${where}`, params)).rows[0].n as number
    const { rows } = await client.query(`SELECT ${COLUNAS} FROM marketing.video_generations g WHERE ${where}
      ORDER BY g.criado_em DESC, g.id LIMIT ${VIDEOS_POR_PAGINA} OFFSET $${params.push(Math.max(0, filtros.inicio ?? 0))}`, params)
    return { linhas: rows as Linha[], total, usoCota: await cota(client, ctx.orgId) }
  })
  // Quem está gerando avança aqui também (a tela consulta enquanto houver vídeo em andamento).
  const atualizadas = await Promise.all(linhas.map(linha => emAndamento(linha.status) ? atualizarSituacao(ctx, linha.id).then(nova => nova ?? linha) : linha))
  return { videos: await paraTela(ctx, atualizadas), total, cota: usoCota }
}

async function lerUma(ctx: Contexto, id: string) {
  const rows = await asPerson(ctx, async client => (await client.query(`SELECT ${COLUNAS} FROM marketing.video_generations g WHERE g.id = $1 AND g.workspace_id = $2`, [id, ctx.orgId])).rows)
  return (rows[0] as Linha | undefined) ?? null
}

/** Um vídeo, avançando a situação no provedor quando ainda está gerando. */
export async function obterVideo(ctx: Contexto, id: string) {
  await exigirAcesso(ctx, false)
  if (!(await lerUma(ctx, id))) throw new VideoError(404, 'Vídeo não encontrado.')
  await atualizarSituacao(ctx, id)
  const linha = await lerUma(ctx, id)
  if (!linha) throw new VideoError(404, 'Vídeo não encontrado.')
  const [video] = await paraTela(ctx, [linha])
  return video
}

// ---------------------------------------------------------------- gerar

export type PedidoTela = { prompt: string; modelo: string; formato: string; duracao: number; estilo: string; referenciaPath?: string | null }

/** Cria o pedido, reserva a cota e inicia no provedor. Erro do provedor vira vídeo com erro (a cota volta). */
export async function gerarVideo(ctx: Contexto, pedido: PedidoTela) {
  await exigirAcesso(ctx, true)
  const referencia = pedido.referenciaPath || null
  if (referencia && !referencia.startsWith(`${ctx.orgId}/referencias/`)) throw new VideoError(400, 'Imagem de referência inválida.')
  const recusa = validarPedidoVideo({ ...pedido, temReferencia: Boolean(referencia) })
  if (recusa) throw new VideoError(422, recusa)
  const modelo = modeloVideo(pedido.modelo)!
  const provedor = videoProvider()
  const id = await inTransaction(async client => {
    // Uma geração por vez por empresa enquanto confere a cota: dois pedidos juntos não passam do limite.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`marketing:videos:${ctx.orgId}`])
    const atual = await cota(client, ctx.orgId)
    const semCota = validarCota({ usadoSegundos: atual.usado_segundos, limiteMinutos: atual.limite_minutos, pedidoSegundos: pedido.duracao })
    if (semCota) throw new VideoError(409, semCota)
    const { rows } = await client.query(
      `INSERT INTO marketing.video_generations (workspace_id, created_by, prompt, modelo, formato, duracao_s, estilo, referencia_path, provedor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [ctx.orgId, ctx.userId, pedido.prompt.trim(), modelo.id, pedido.formato, pedido.duracao, pedido.estilo, referencia, provedor.id])
    return rows[0].id as string
  })
  try {
    const referenciaUrl = referencia ? (await assinar([referencia])).get(referencia) ?? null : null
    const { jobId } = await provedor.iniciar({ id, prompt: pedido.prompt.trim(), modelo: modelo.id, formato: pedido.formato as FormatoVideo,
      duracao: pedido.duracao, estilo: pedido.estilo, referenciaUrl }, { origem: ctx.origem })
    await getPool().query(`UPDATE marketing.video_generations SET status = 'gerando', provedor_job_id = $2, iniciado_em = now()
      WHERE id = $1 AND status = 'na_fila'`, [id, jobId])
  } catch (error) {
    console.error(JSON.stringify({ scope: 'marketing', code: 'VIDEO_START_FAILED', id, message: (error as Error).message }))
    await getPool().query(`UPDATE marketing.video_generations SET status = 'erro', erro = $2, concluido_em = now() WHERE id = $1 AND status = 'na_fila'`,
      [id, 'O provedor não aceitou o pedido. Tente de novo em instantes.'])
  }
  return obterVideo(ctx, id)
}

/**
 * Consulta o provedor e, quando o vídeo fica pronto, baixa e guarda no bucket da empresa. Uma consulta por vez por
 * vídeo (FOR UPDATE SKIP LOCKED): consultas simultâneas da tela não baixam o vídeo duas vezes.
 */
async function atualizarSituacao(ctx: Contexto, id: string): Promise<Linha | null> {
  await inTransaction(async client => {
    const { rows } = await client.query(`SELECT id, workspace_id, status, provedor, provedor_job_id, iniciado_em, formato, duracao_s
      FROM marketing.video_generations WHERE id = $1 AND workspace_id = $2 AND status = 'gerando' FOR UPDATE SKIP LOCKED`, [id, ctx.orgId])
    const linha = rows[0]
    if (!linha?.provedor_job_id) return
    const situacao = await videoProvider(linha.provedor).consultar(
      { jobId: linha.provedor_job_id, iniciadoEm: new Date(linha.iniciado_em), formato: linha.formato }, { origem: ctx.origem })
    if (situacao.estado === 'gerando') return
    if (situacao.estado === 'erro') {
      await client.query(`UPDATE marketing.video_generations SET status = 'erro', erro = $2, concluido_em = now() WHERE id = $1`, [id, situacao.mensagem.slice(0, 500)])
      return
    }
    const resposta = await fetch(situacao.videoUrl, { cache: 'no-store' })
    if (!resposta.ok) throw new Error(`Download do vídeo respondeu ${resposta.status}`)
    const conteudo = await resposta.arrayBuffer()
    if (conteudo.byteLength > VIDEO_MAXIMO) {
      await client.query(`UPDATE marketing.video_generations SET status = 'erro', erro = $2, concluido_em = now() WHERE id = $1`, [id, 'O vídeo gerado passou de 500 MB.'])
      return
    }
    const path = `${linha.workspace_id}/${id}.mp4`
    await enviarArquivo(path, conteudo, situacao.mime)
    await client.query(`UPDATE marketing.video_generations SET status = 'pronto', resultado_path = $2, custo_segundos = duracao_s, concluido_em = now() WHERE id = $1`, [id, path])
  }).catch(error => console.error(JSON.stringify({ scope: 'marketing', code: 'VIDEO_REFRESH_FAILED', id, message: (error as Error).message })))
  return lerUma(ctx, id)
}

// ---------------------------------------------------------------- ações

export async function salvarVideo(ctx: Contexto, id: string, salvo: boolean) {
  await exigirAcesso(ctx, false)
  if (!(await lerUma(ctx, id))) throw new VideoError(404, 'Vídeo não encontrado.')
  if (salvo) await getPool().query(`INSERT INTO marketing.video_saves (generation_id, user_id, workspace_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`, [id, ctx.userId, ctx.orgId])
  else await getPool().query('DELETE FROM marketing.video_saves WHERE generation_id = $1 AND user_id = $2', [id, ctx.userId])
}

export async function cancelarVideo(ctx: Contexto, id: string) {
  await exigirAcesso(ctx, true)
  const linha = await lerUma(ctx, id)
  if (!linha) throw new VideoError(404, 'Vídeo não encontrado.')
  if (!emAndamento(linha.status)) throw new VideoError(409, 'Só dá para cancelar um vídeo que ainda está sendo gerado.')
  const { rows } = await getPool().query(`UPDATE marketing.video_generations SET status = 'cancelado', concluido_em = now()
    WHERE id = $1 AND status IN ('na_fila', 'gerando') RETURNING provedor, provedor_job_id`, [id])
  if (rows[0]?.provedor_job_id) await videoProvider(rows[0].provedor).cancelar({ jobId: rows[0].provedor_job_id }).catch(() => undefined)
}

/** Exclui da galeria (o registro fica para a cota do mês) e apaga os arquivos. */
export async function excluirVideo(ctx: Contexto, id: string) {
  await exigirAcesso(ctx, true)
  const linha = await lerUma(ctx, id)
  if (!linha) throw new VideoError(404, 'Vídeo não encontrado.')
  if (emAndamento(linha.status)) await cancelarVideo(ctx, id)
  await getPool().query('UPDATE marketing.video_generations SET excluido_em = now() WHERE id = $1 AND workspace_id = $2', [id, ctx.orgId])
  await apagarArquivos([linha.resultado_path].filter((p): p is string => Boolean(p)))
}

const TIPOS_IMAGEM: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Guarda a imagem de referência no bucket da empresa; devolve o caminho (vai no pedido) e uma URL para a prévia. */
export async function enviarReferencia(ctx: Contexto, arquivo: { tipo: string; conteudo: ArrayBuffer }) {
  await exigirAcesso(ctx, true)
  const extensao = TIPOS_IMAGEM[arquivo.tipo]
  if (!extensao) throw new VideoError(415, 'Use uma imagem JPG, PNG ou WebP.')
  if (arquivo.conteudo.byteLength > REFERENCIA_MAXIMA) throw new VideoError(413, 'A imagem pode ter até 10 MB.')
  const path = `${ctx.orgId}/referencias/${randomUUID()}.${extensao}`
  await enviarArquivo(path, arquivo.conteudo, arquivo.tipo)
  return { path, url: (await assinar([path])).get(path) ?? null }
}
