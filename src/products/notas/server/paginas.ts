// Notas: operações das páginas. Tudo roda como a pessoa (db.ts → comoPessoa), então o banco decide quem vê e quem
// altera (espaço equipe x particular, perfil só de visualização). Aqui ficam as regras do fluxo: versão (uma gravação
// não sobrescreve a outra), árvore sem ciclos, lixeira junto com as subpáginas, duplicar com as subpáginas.
import { randomUUID } from 'node:crypto'
import type { Propriedade, Visao } from '../shared/bases'
import { moverCriaCiclo, posicaoEntre, textoDoConteudo, type Espaco, type PaginaResumo } from '../shared/arvore'
import { comoPessoa, gravarArquivo, NotasError, type Client, type Contexto } from './db'

const RESUMO = 'id, parent_id, espaco, titulo, icone, posicao, tipo, base_id'
export type Pagina = PaginaResumo & {
  capa: string | null; capa_posicao: number; conteudo: unknown; largura_total: boolean; texto_pequeno: boolean
  fonte: 'padrao' | 'serifa' | 'mono'; bloqueada: boolean; versao: number; created_by: string; updated_by: string | null
  created_at: string; updated_at: string; arquivada_em: string | null; pode_editar: boolean; favorita: boolean
  esquema: Propriedade[]; visoes: Visao[]; propriedades: Record<string, unknown>; e_modelo: boolean
}
export const COMPLETA = `p.id, p.parent_id, p.espaco, p.titulo, p.icone, p.posicao, p.tipo, p.base_id, p.e_modelo, p.esquema, p.visoes, p.propriedades, p.capa, p.capa_posicao, p.conteudo, p.largura_total, p.texto_pequeno,
  p.fonte, p.bloqueada, p.versao, p.created_by, p.updated_by, p.created_at, p.updated_at, p.arquivada_em,
  notas.pode_editar(p.workspace_id, p.espaco, p.created_by) AS pode_editar,
  EXISTS (SELECT 1 FROM notas.favoritos f WHERE f.pagina_id = p.id AND f.user_id = editor.uid()) AS favorita`

/** A política do banco recusou (42501): a pessoa só visualiza a empresa. */
export function semPermissao(erro: unknown): never {
  throw (erro as { code?: string }).code === '42501' ? new NotasError(403, 'Seu acesso a esta empresa é só de visualização.') : erro
}

export async function exigirLeitura(client: Client, ctx: Contexto) {
  const { rows } = await client.query('SELECT editor.can_read($1) AS ler, editor.can_write($1) AS gravar', [ctx.orgId])
  if (!rows[0]?.ler) throw new NotasError(403, 'Você não tem acesso às notas desta empresa.')
  return { podeEditarEquipe: Boolean(rows[0].gravar) }
}

export async function lerPagina(client: Client, ctx: Contexto, id: string, incluirLixeira = false): Promise<Pagina> {
  const { rows } = await client.query(`SELECT ${COMPLETA} FROM notas.paginas p WHERE p.id = $1 AND p.workspace_id = $2${incluirLixeira ? '' : ' AND p.arquivada_em IS NULL'}`, [id, ctx.orgId])
  if (!rows[0]) throw new NotasError(404, 'Página não encontrada.')
  return rows[0] as Pagina
}

export async function exigirEdicao(client: Client, ctx: Contexto, id: string, incluirLixeira = false) {
  const pagina = await lerPagina(client, ctx, id, incluirLixeira)
  if (!pagina.pode_editar) throw new NotasError(403, 'Você não pode editar esta página.')
  return pagina
}

/** Todas as páginas que a pessoa vê (fora da lixeira), favoritos e recentes: a barra lateral. */
export function arvore(ctx: Contexto) {
  return comoPessoa(ctx, async client => {
    const { podeEditarEquipe } = await exigirLeitura(client, ctx)
    const paginas = (await client.query(`SELECT ${RESUMO} FROM notas.paginas WHERE workspace_id = $1 AND arquivada_em IS NULL AND NOT e_modelo ORDER BY posicao LIMIT 5000`, [ctx.orgId])).rows as PaginaResumo[]
    const favoritos = (await client.query(`SELECT f.pagina_id FROM notas.favoritos f JOIN notas.paginas p ON p.id = f.pagina_id AND p.arquivada_em IS NULL
      WHERE f.workspace_id = $1 AND f.user_id = editor.uid() ORDER BY f.posicao, f.created_at`, [ctx.orgId])).rows.map((r: { pagina_id: string }) => r.pagina_id)
    const recentes = (await client.query(`SELECT r.pagina_id FROM notas.recentes r JOIN notas.paginas p ON p.id = r.pagina_id AND p.arquivada_em IS NULL
      WHERE r.workspace_id = $1 AND r.user_id = editor.uid() ORDER BY r.visto_em DESC LIMIT 12`, [ctx.orgId])).rows.map((r: { pagina_id: string }) => r.pagina_id)
    return { paginas, favoritos, recentes, pode_editar_equipe: podeEditarEquipe }
  })
}

/** Uma página inteira; registra que a pessoa a abriu (recentes). */
export function obterPagina(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await lerPagina(client, ctx, id, true)
    if (!pagina.arquivada_em) await client.query(`INSERT INTO notas.recentes (pagina_id, workspace_id) VALUES ($1, $2)
      ON CONFLICT (user_id, pagina_id) DO UPDATE SET visto_em = now()`, [id, ctx.orgId])
    return pagina
  })
}

export async function proximaPosicao(client: Client, ctx: Contexto, parentId: string | null, espaco: Espaco) {
  const { rows } = await client.query(`SELECT max(posicao) AS fim FROM notas.paginas WHERE workspace_id = $1 AND espaco = $2
    AND parent_id IS NOT DISTINCT FROM $3 AND arquivada_em IS NULL`, [ctx.orgId, espaco, parentId])
  return posicaoEntre(rows[0]?.fim ?? null, null)
}

/** Nova página no fim da lista do lugar escolhido (subpágina herda o espaço da mãe). */
export function criarPagina(ctx: Contexto, dados: { parent_id?: string | null; espaco?: Espaco; titulo?: string; icone?: string | null }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    let espaco: Espaco = dados.espaco === 'particular' ? 'particular' : 'equipe'
    const parentId = dados.parent_id || null
    let baseId: string | null = null
    if (parentId) {
      const mae = await exigirEdicao(client, ctx, parentId)
      espaco = mae.espaco
      // Página criada "dentro" de uma base é um item dela (o "+" da barra lateral numa base).
      if (mae.tipo === 'base') baseId = mae.id
      else if (mae.base_id) throw new NotasError(409, 'Itens de uma base não têm subpáginas nesta versão. Escreva no conteúdo do item.')
    }
    const posicao = await proximaPosicao(client, ctx, parentId, espaco)
    const { rows } = await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, base_id, posicao, titulo, icone)
      VALUES ($1, $2, $3, $7, $4, $5, $6) RETURNING id`, [ctx.orgId, espaco, parentId, posicao, (dados.titulo ?? '').slice(0, 500), dados.icone ?? null, baseId])
      .catch(semPermissao)
    return lerPagina(client, ctx, rows[0].id)
  })
}

export type Alteracao = Partial<Pick<Pagina, 'titulo' | 'icone' | 'capa' | 'capa_posicao' | 'conteudo' | 'largura_total' | 'texto_pequeno' | 'fonte' | 'bloqueada'>>
const CAMPOS: (keyof Alteracao)[] = ['titulo', 'icone', 'capa', 'capa_posicao', 'conteudo', 'largura_total', 'texto_pequeno', 'fonte', 'bloqueada']
const CAMPOS_DO_TEXTO: (keyof Alteracao)[] = ['titulo', 'icone', 'capa', 'capa_posicao', 'conteudo']

/**
 * Grava só os campos enviados, se a página ainda estiver na versão que a pessoa abriu. Se outra pessoa salvou antes,
 * recusa com a página atual (a tela mostra o aviso e oferece recarregar), em vez de sobrescrever.
 */
export function atualizarPagina(ctx: Contexto, id: string, versaoPedida: number | null, alteracao: Alteracao) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const atual = await exigirEdicao(client, ctx, id)
    const versao = versaoPedida ?? atual.versao
    if (atual.versao !== versao) throw new NotasError(409, 'Esta página foi alterada em outro lugar. Recarregue para ver a versão atual.', atual)
    const mexeNoTexto = CAMPOS_DO_TEXTO.some(c => alteracao[c] !== undefined)
    if (atual.bloqueada && mexeNoTexto && alteracao.bloqueada !== false) throw new NotasError(409, 'A página está bloqueada. Desbloqueie para editar.')
    const sets: string[] = [], params: unknown[] = [id, versao]
    for (const campo of CAMPOS) {
      if (alteracao[campo] === undefined) continue
      sets.push(`${campo} = $${params.push(campo === 'conteudo' ? JSON.stringify(alteracao[campo]) : alteracao[campo])}${campo === 'conteudo' ? '::jsonb' : ''}`)
    }
    if (alteracao.conteudo !== undefined) sets.push(`conteudo_texto = $${params.push(textoDoConteudo(alteracao.conteudo))}`)
    if (!sets.length) return atual
    if (alteracao.conteudo !== undefined || alteracao.titulo !== undefined || alteracao.icone !== undefined) await fotografar(client, ctx, atual)
    const { rowCount } = await client.query(`UPDATE notas.paginas SET ${sets.join(', ')}, versao = versao + 1, updated_by = editor.uid()
      WHERE id = $1 AND versao = $2 AND arquivada_em IS NULL`, params)
    if (!rowCount) throw new NotasError(409, 'Esta página foi alterada em outro lugar. Recarregue para ver a versão atual.', await lerPagina(client, ctx, id))
    return lerPagina(client, ctx, id)
  })
}

const INTERVALO_FOTOS_MIN = 10, FOTOS_POR_PAGINA = 100, DIAS_DE_HISTORICO = 30

/**
 * Histórico: guarda como a página estava antes de gravar, no máximo uma foto a cada 10 minutos por pessoa (ou sempre,
 * com `forcar`, antes de restaurar uma versão). Página nova e vazia não gera foto.
 */
export async function fotografar(client: Client, ctx: Contexto, pagina: Pagina, forcar = false) {
  if (!pagina.titulo && !textoDoConteudo(pagina.conteudo).trim() && !(pagina.conteudo as unknown[]).length) return
  if (!forcar) {
    const { rows } = await client.query(`SELECT created_by, created_at > now() - make_interval(mins => $2) AS recente FROM notas.versoes
      WHERE pagina_id = $1 ORDER BY created_at DESC LIMIT 1`, [pagina.id, INTERVALO_FOTOS_MIN])
    if (rows[0]?.recente && rows[0].created_by === ctx.userId) return
  }
  await client.query(`INSERT INTO notas.versoes (pagina_id, workspace_id, titulo, icone, conteudo, propriedades, versao, autor)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)`,
  [pagina.id, ctx.orgId, pagina.titulo, pagina.icone, JSON.stringify(pagina.conteudo ?? []), JSON.stringify(pagina.propriedades ?? {}), pagina.versao, pagina.updated_by ?? pagina.created_by])
    .catch(semPermissao)
  await client.query(`DELETE FROM notas.versoes WHERE pagina_id = $1 AND (created_at < now() - make_interval(days => $2)
    OR id NOT IN (SELECT id FROM notas.versoes WHERE pagina_id = $1 ORDER BY created_at DESC LIMIT $3))`, [pagina.id, DIAS_DE_HISTORICO, FOTOS_POR_PAGINA])
}

async function arvoreDaEmpresa(client: Client, ctx: Contexto) {
  return (await client.query(`SELECT ${RESUMO}, created_by FROM notas.paginas WHERE workspace_id = $1`, [ctx.orgId])).rows as (PaginaResumo & { created_by: string })[]
}

/** Subárvore da página, da raiz para as folhas (as mães antes das filhas). */
function subarvore(todas: (PaginaResumo & { created_by: string })[], id: string) {
  const ordem: (PaginaResumo & { created_by: string })[] = []
  const fila = [id]
  while (fila.length) {
    const atual = fila.shift()!
    const pagina = todas.find(p => p.id === atual)
    if (!pagina || ordem.includes(pagina)) continue
    ordem.push(pagina)
    fila.push(...todas.filter(p => p.parent_id === atual).map(p => p.id))
  }
  return ordem
}

/** Move a página (com as subpáginas) para outra mãe, outro espaço ou outra posição. */
export function moverPagina(ctx: Contexto, id: string, destino: { parent_id: string | null; espaco: Espaco; posicao: number }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await exigirEdicao(client, ctx, id)
    if (!Number.isFinite(destino.posicao)) throw new NotasError(400, 'Posição inválida.')
    if (pagina.base_id) throw new NotasError(409, 'Itens ficam dentro da base. Para mudar a ordem, arraste na própria base.')
    let espaco = destino.espaco
    if (destino.parent_id) {
      const mae = await exigirEdicao(client, ctx, destino.parent_id)
      if (mae.tipo === 'base' || mae.base_id) throw new NotasError(409, 'Uma página não pode ir para dentro de uma base. Crie um item nela.')
      espaco = mae.espaco
    }
    const todas = await arvoreDaEmpresa(client, ctx)
    if (moverCriaCiclo(todas, id, destino.parent_id)) throw new NotasError(409, 'Uma página não pode ir para dentro dela mesma.')
    const grupo = subarvore(todas, id)
    if (espaco === 'particular' && grupo.some(p => p.created_by !== ctx.userId)) {
      throw new NotasError(409, 'Há subpáginas criadas por outras pessoas; elas deixariam de ver. Mova só as suas para Particular.')
    }
    await client.query('UPDATE notas.paginas SET parent_id = $2, posicao = $3, espaco = $4 WHERE id = $1', [id, destino.parent_id, destino.posicao, espaco])
    if (espaco !== pagina.espaco) {
      for (const filha of grupo.slice(1)) await client.query('UPDATE notas.paginas SET espaco = $2 WHERE id = $1', [filha.id, espaco])
    }
    return lerPagina(client, ctx, id)
  })
}

/** Duplica a página e as subpáginas, logo abaixo da original. */
export function duplicarPagina(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const original = await lerPagina(client, ctx, id)
    const vizinhas = (await client.query(`SELECT posicao FROM notas.paginas WHERE workspace_id = $1 AND espaco = $2 AND parent_id IS NOT DISTINCT FROM $3
      AND arquivada_em IS NULL AND posicao > $4 ORDER BY posicao LIMIT 1`, [ctx.orgId, original.espaco, original.parent_id, original.posicao])).rows
    const todas = (await client.query(`SELECT ${RESUMO}, created_by FROM notas.paginas WHERE workspace_id = $1 AND arquivada_em IS NULL`, [ctx.orgId])).rows
    const grupo = subarvore(todas, id)
    const novosIds = new Map(grupo.map(p => [p.id, randomUUID()]))
    for (const [indice, p] of grupo.entries()) {
      const mae = indice === 0 ? original.parent_id : novosIds.get(p.parent_id!)
      // Item duplicado continua na mesma base; itens de uma base duplicada vão para a base nova.
      const base = p.base_id ? (indice === 0 ? p.base_id : novosIds.get(p.base_id) ?? null) : null
      await client.query(`INSERT INTO notas.paginas (id, workspace_id, espaco, parent_id, base_id, posicao, titulo, icone, capa, capa_posicao, conteudo, conteudo_texto,
          largura_total, texto_pequeno, fonte, tipo, esquema, visoes, propriedades)
        SELECT $1, workspace_id, espaco, $2, $6, $3, $4, icone, capa, capa_posicao, conteudo, conteudo_texto, largura_total, texto_pequeno, fonte, tipo, esquema, visoes, propriedades
        FROM notas.paginas WHERE id = $5`,
      [novosIds.get(p.id), mae, indice === 0 ? posicaoEntre(original.posicao, vizinhas[0]?.posicao ?? null) : p.posicao,
        indice === 0 ? `${original.titulo || 'Sem título'} (cópia)`.slice(0, 500) : p.titulo, p.id, base]).catch(semPermissao)
    }
    return lerPagina(client, ctx, novosIds.get(id)!)
  })
}

/** Manda a página e as subpáginas para a lixeira. */
export function arquivarPagina(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await exigirEdicao(client, ctx, id)
    const grupo = subarvore(await arvoreDaEmpresa(client, ctx), id)
    await client.query(`UPDATE notas.paginas SET arquivada_em = now(), arquivada_por = editor.uid() WHERE id = ANY($1::uuid[]) AND arquivada_em IS NULL`, [grupo.map(p => p.id)])
  })
}

/** Tira da lixeira (com as subpáginas que foram junto). Se a mãe ainda está na lixeira, volta para a raiz. */
export function restaurarPagina(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await exigirEdicao(client, ctx, id, true)
    if (!pagina.arquivada_em) return pagina
    const grupo = subarvore(await arvoreDaEmpresa(client, ctx), id)
    await client.query(`UPDATE notas.paginas SET arquivada_em = NULL, arquivada_por = NULL WHERE id = ANY($1::uuid[]) AND arquivada_em >= $2::timestamptz - interval '5 seconds'`,
      [grupo.map(p => p.id), pagina.arquivada_em])
    if (pagina.parent_id) {
      const mae = (await client.query('SELECT arquivada_em FROM notas.paginas WHERE id = $1', [pagina.parent_id])).rows[0]
      if (!mae || mae.arquivada_em) await client.query('UPDATE notas.paginas SET parent_id = NULL, base_id = NULL, posicao = $2 WHERE id = $1', [id, await proximaPosicao(client, ctx, null, pagina.espaco)])
    }
    return lerPagina(client, ctx, id)
  })
}

/** Apaga de vez (só da lixeira); as subpáginas vão junto. */
export function apagarPagina(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await exigirEdicao(client, ctx, id, true)
    if (!pagina.arquivada_em) throw new NotasError(409, 'Mande a página para a lixeira antes de apagar de vez.')
    await client.query('DELETE FROM notas.paginas WHERE id = $1', [id])
  })
}

/** Páginas na lixeira (só as que foram excluídas diretamente; as subpáginas vêm junto ao restaurar). */
export function lixeira(ctx: Contexto) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const { rows } = await client.query(`SELECT p.id, p.titulo, p.icone, p.espaco, p.arquivada_em, m.titulo AS mae
      FROM notas.paginas p LEFT JOIN notas.paginas m ON m.id = p.parent_id
      WHERE p.workspace_id = $1 AND p.arquivada_em IS NOT NULL AND (m.id IS NULL OR m.arquivada_em IS NULL OR m.arquivada_em < p.arquivada_em - interval '5 seconds')
      ORDER BY p.arquivada_em DESC LIMIT 200`, [ctx.orgId])
    return rows
  })
}

export function favoritar(ctx: Contexto, id: string, favorita: boolean) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await lerPagina(client, ctx, id)
    if (favorita) await client.query(`INSERT INTO notas.favoritos (pagina_id, workspace_id, posicao)
      VALUES ($1, $2, extract(epoch FROM now())) ON CONFLICT DO NOTHING`, [id, ctx.orgId])
    else await client.query('DELETE FROM notas.favoritos WHERE pagina_id = $1 AND user_id = editor.uid()', [id])
  })
}

/** Busca no título e no conteúdo (português), com o trecho encontrado; o título também casa pelo começo das palavras. */
export function buscar(ctx: Contexto, termo: string) {
  const q = termo.trim().slice(0, 200)
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    if (!q) return []
    const { rows } = await client.query(`SELECT id, titulo, icone, espaco, parent_id, updated_at,
        ts_headline('portuguese', conteudo_texto, websearch_to_tsquery('portuguese', $2), 'MaxWords=18, MinWords=6, StartSel=«, StopSel=»') AS trecho
      FROM notas.paginas
      WHERE workspace_id = $1 AND arquivada_em IS NULL AND (busca @@ websearch_to_tsquery('portuguese', $2) OR titulo ILIKE '%' || $3 || '%')
      ORDER BY (titulo ILIKE $3 || '%') DESC, ts_rank(busca, websearch_to_tsquery('portuguese', $2)) DESC, updated_at DESC LIMIT 20`,
    [ctx.orgId, q, q.replace(/[%_\\]/g, m => `\\${m}`)])
    return rows
  })
}

const ARQUIVO_MAXIMO = 100 * 1024 * 1024
/** Guarda uma imagem ou arquivo da página; devolve o endereço estável do Otto (que assina na hora de abrir). */
export async function enviarArquivo(ctx: Contexto, arquivo: { nome: string; tipo: string; conteudo: ArrayBuffer }) {
  await comoPessoa(ctx, client => exigirLeitura(client, ctx))
  if (arquivo.conteudo.byteLength > ARQUIVO_MAXIMO) throw new NotasError(413, 'O arquivo pode ter até 100 MB.')
  const nome = arquivo.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').slice(-80) || 'arquivo'
  const path = `${ctx.orgId}/${randomUUID()}/${nome}`
  await gravarArquivo(path, arquivo.conteudo, arquivo.tipo)
  return { url: `/api/notas/arquivos/${path}` }
}
