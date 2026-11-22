// Video Hosting tools: the sales videos with the Otto player, the same rows the /videohosting screens use (schema
// videohosting), read and changed as the person. The page that shows the video only needs the script with its code.
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import type { Member } from '../../editor/server/database'
import { cleanDomain, controlsSchema, mergeSettings, settingsSchema } from '@/products/videohosting/shared/settings'
import { company, confirmed, tool, uuid, type ToolContext, type WorkspaceTool } from '../../workspace/context'

const base = () => ({ empresa_id: company() })
const videoId = () => uuid('Vídeo, de videohosting_listar.')
/** Every field optional; controls too. A fresh schema each call keeps descriptions in the published JSON Schema. */
const settingsInput = (what: string) => settingsSchema.omit({ controles: true }).partial()
  .extend({ controles: controlsSchema.partial().optional().describe('Quais controles a pessoa que assiste tem.') }).strict().describe(what)
const embed = (ctx: ToolContext, code: string) => `<script async src="${ctx.origin}/videohosting.js" data-video="${code}"></script>`
const domainList = () => z.array(z.string().min(3).max(120)).max(50)

type VideoRow = { id: string; title: string; status: string; duration: number | null; width: number; height: number; public_code: string; settings: Record<string, unknown>; domains: string[] | null; trashed_at: string | null; created_at: string; source_file_id: string | null }
async function needVideo(m: Member, id: string, live = true) {
  const [v] = await m.db.query<VideoRow>(`SELECT id, title, status, duration::float8 AS duration, width, height, public_code, settings, domains, trashed_at, created_at, source_file_id
    FROM videohosting.videos WHERE id = $1 AND workspace_id = $2`, [id, m.ws])
  if (!v) throw new PluginError('NOT_FOUND', 'Vídeo não encontrado nesta empresa. Use videohosting_listar.', 404)
  if (live && v.trashed_at) throw new PluginError('INVALID_STATE', 'Este vídeo foi tirado do ar.', 409)
  return v
}
function cleanDomains(list: string[]) {
  const out = list.map(d => ({ raw: d, clean: cleanDomain(d) }))
  const bad = out.filter(d => !d.clean).map(d => d.raw)
  if (bad.length) throw new PluginError('INVALID_INPUT', `Domínio inválido: ${bad.join(', ')}. Ex.: minhapagina.com.br`, 422)
  return [...new Set(out.map(d => d.clean!))]
}

// ---------- consultas ----------

const list = tool({
  name: 'videohosting_listar', title: 'Vídeos publicados', write: false,
  description: 'Os vídeos de venda publicados com o player do Otto, com duração, quantidade de botões e se têm aparência própria.',
  schema: z.object({ ...base(), incluir_fora_do_ar: z.boolean().default(false).describe('Incluir os que foram tirados do ar.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const rows = await m.db.query<VideoRow & { ctas: string }>(`SELECT v.id, v.title, v.status, v.duration::float8 AS duration, v.width, v.height, v.public_code, v.settings, v.domains, v.trashed_at, v.created_at, v.source_file_id,
        (SELECT count(*) FROM videohosting.ctas c WHERE c.video_id = v.id)::text AS ctas
      FROM videohosting.videos v WHERE v.workspace_id = $1 AND ($2 OR v.trashed_at IS NULL) ORDER BY v.created_at DESC LIMIT 200`, [m.ws, input.incluir_fora_do_ar])
    return { videos: rows.map(v => ({ id: v.id, titulo: v.title, duracao_s: v.duration ?? undefined, formato: v.width && v.height ? `${v.width}x${v.height}` : undefined,
      botoes: Number(v.ctas), aparencia_propria: Object.keys(v.settings).length > 0, dominios_proprios: v.domains ?? undefined, fora_do_ar: v.trashed_at ? true : undefined,
      criado_em: v.created_at, link: `${ctx.origin}/videohosting/${v.id}` })) }
  }),
})

const get = tool({
  name: 'videohosting_obter', title: 'Detalhes do vídeo', write: false,
  description: 'Um vídeo: o código para colar na página, a aparência final (padrão da empresa + do vídeo), os botões com seus tempos e onde ele pode tocar.',
  schema: z.object({ ...base(), video_id: videoId() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const v = await needVideo(m, input.video_id, false)
    const [preset] = await m.db.query<{ settings: object }>('SELECT settings FROM videohosting.presets WHERE workspace_id = $1', [m.ws])
    const domains = await m.db.query<{ domain: string }>('SELECT domain FROM videohosting.domains WHERE workspace_id = $1 ORDER BY domain', [m.ws])
    const ctas = await m.db.query<{ id: string; start_s: number; end_s: number | null; text: string; url: string; position: string; background: string; color: string; new_tab: boolean }>(
      'SELECT id, start_s::float8 AS start_s, end_s::float8 AS end_s, text, url, position, background, color, new_tab FROM videohosting.ctas WHERE video_id = $1 ORDER BY start_s', [v.id])
    const where = v.domains ?? domains.map(d => d.domain)
    return { id: v.id, titulo: v.title, duracao_s: v.duration ?? undefined, fora_do_ar: v.trashed_at ? true : undefined,
      codigo_para_colar: v.trashed_at ? undefined : embed(ctx, v.public_code), arquivo_drive_id: v.source_file_id ?? undefined,
      aparencia: mergeSettings(preset?.settings, v.settings), aparencia_propria: Object.keys(v.settings).length ? v.settings : undefined,
      botoes: ctas.map(c => ({ id: c.id, texto: c.text, link: c.url, aparece_em_s: c.start_s, some_em_s: c.end_s ?? undefined, posicao: c.position, fundo: c.background, cor_texto: c.color, nova_aba: c.new_tab })),
      toca_em: where.length ? where : 'qualquer site (nenhum domínio cadastrado)', dominios_do_video: v.domains ? true : undefined,
      link: `${ctx.origin}/videohosting/${v.id}` }
  }),
})

const companySettings = tool({
  name: 'videohosting_configuracoes', title: 'Padrão do player da empresa', write: false,
  description: 'A aparência padrão do player para todos os vídeos da empresa e os domínios onde eles podem tocar.',
  schema: z.object(base()).strict(),
  run: (_i, ctx) => ctx.as(async m => {
    const [preset] = await m.db.query<{ settings: object }>('SELECT settings FROM videohosting.presets WHERE workspace_id = $1', [m.ws])
    const domains = await m.db.query<{ domain: string }>('SELECT domain FROM videohosting.domains WHERE workspace_id = $1 ORDER BY domain', [m.ws])
    return { padrao: mergeSettings(preset?.settings), dominios: domains.map(d => d.domain),
      aviso: domains.length ? undefined : 'Sem domínios cadastrados: os vídeos tocam em qualquer site que tiver o código.', link: `${ctx.origin}/videohosting/configuracoes` }
  }),
})

// ---------- ações ----------

const publish = tool({
  name: 'videohosting_publicar', title: 'Publicar vídeo do Drive', write: true,
  description: 'Publica um vídeo do Drive com o player do Otto e devolve o código para colar na página de vendas. Use drive_buscar (tipo video) para achar o arquivo.',
  schema: z.object({ ...base(), arquivo_id: uuid('Arquivo de vídeo do Drive, de drive_buscar.'), titulo: z.string().trim().min(1).max(160).optional().describe('Título; padrão: nome do arquivo.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const [f] = await m.db.query<{ id: string; name: string; kind: string; duration: number | null; width: number; height: number; trashed_at: string | null }>(
      'SELECT id, name, kind, duration::float8 AS duration, width, height, trashed_at FROM drive.files WHERE id = $1 AND workspace_id = $2', [input.arquivo_id, m.ws])
    if (!f) throw new PluginError('NOT_FOUND', 'Arquivo não encontrado no Drive desta empresa.', 404)
    if (f.kind !== 'video') throw new PluginError('INVALID_INPUT', 'Esse arquivo não é um vídeo.', 422)
    if (f.trashed_at) throw new PluginError('INVALID_STATE', 'Esse arquivo está na lixeira do Drive. Restaure antes.', 409)
    const [v] = await m.db.query<{ id: string; public_code: string }>(`INSERT INTO videohosting.videos (workspace_id, title, source_file_id, duration, width, height)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, public_code`, [m.ws, (input.titulo ?? f.name.replace(/\.[a-z0-9]{2,5}$/i, '')).slice(0, 160), f.id, f.duration, f.width, f.height])
    return { video_id: v.id, codigo_para_colar: embed(ctx, v.public_code), link: `${ctx.origin}/videohosting/${v.id}` }
  }),
})

const edit = tool({
  name: 'videohosting_editar', title: 'Editar vídeo', write: true,
  description: 'Muda o título e a aparência deste vídeo (só os campos informados). usar_padrao_da_empresa: true apaga a aparência própria e volta ao padrão da empresa.',
  schema: z.object({ ...base(), video_id: videoId(), titulo: z.string().trim().min(1).max(160).optional().describe('Novo título.'),
    aparencia: settingsInput('Campos da aparência a mudar só neste vídeo.').optional(),
    usar_padrao_da_empresa: z.boolean().optional().describe('true: descarta a aparência própria do vídeo.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const v = await needVideo(m, input.video_id)
    let settings: Record<string, unknown> = input.usar_padrao_da_empresa ? {} : v.settings
    if (input.aparencia) {
      const { controles, ...rest } = input.aparencia
      settings = { ...settings, ...rest, ...(controles ? { controles: { ...(settings.controles as object ?? {}), ...controles } } : {}) }
    }
    await m.db.query('UPDATE videohosting.videos SET title = $2, settings = $3 WHERE id = $1', [v.id, input.titulo ?? v.title, settings])
    const [preset] = await m.db.query<{ settings: object }>('SELECT settings FROM videohosting.presets WHERE workspace_id = $1', [m.ws])
    return { video_id: v.id, titulo: input.titulo ?? v.title, aparencia_final: mergeSettings(preset?.settings, settings), link: `${ctx.origin}/videohosting/${v.id}` }
  }),
})

const buttons = tool({
  name: 'videohosting_botoes', title: 'Botões do vídeo', write: true,
  description: 'Adiciona, altera ou remove botões (ex.: "Comprar agora") que aparecem num momento do vídeo. Tempos em segundos; some_em_s vazio = fica até o fim.',
  schema: z.object({ ...base(), video_id: videoId(), acao: z.enum(['adicionar', 'alterar', 'remover']).describe('O que fazer.'),
    botao_id: uuid('Botão, para alterar ou remover (de videohosting_obter).').optional(),
    texto: z.string().trim().min(1).max(120).optional().describe('Texto do botão.'),
    link: z.string().url().regex(/^https?:\/\//).max(2000).optional().describe('Para onde o botão leva (checkout, WhatsApp…).'),
    aparece_em_s: z.number().min(0).optional().describe('Segundo em que aparece.'),
    some_em_s: z.number().positive().nullable().optional().describe('Segundo em que some; null = até o fim.'),
    posicao: z.enum(['abaixo', 'sobre']).optional().describe('Abaixo do vídeo ou sobre ele.'),
    fundo: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor de fundo, ex.: #16a34a.'),
    cor_texto: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Cor do texto.'),
    nova_aba: z.boolean().optional().describe('Abrir o link em outra aba.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const v = await needVideo(m, input.video_id)
    if (input.acao === 'adicionar') {
      if (!input.texto || !input.link) throw new PluginError('INVALID_INPUT', 'Para adicionar, informe texto e link.', 422)
      const [c] = await m.db.query<{ id: string }>(`INSERT INTO videohosting.ctas (workspace_id, video_id, start_s, end_s, text, url, position, background, color, new_tab)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [m.ws, v.id, input.aparece_em_s ?? 0, input.some_em_s ?? null, input.texto, input.link, input.posicao ?? 'abaixo', input.fundo ?? '#16a34a', input.cor_texto ?? '#ffffff', input.nova_aba ?? false])
      return { botao_id: c.id, adicionado: true, link: `${ctx.origin}/videohosting/${v.id}` }
    }
    if (!input.botao_id) throw new PluginError('INVALID_INPUT', 'Informe botao_id (de videohosting_obter).', 422)
    if (input.acao === 'remover') {
      const gone = await m.db.query('DELETE FROM videohosting.ctas WHERE id = $1 AND video_id = $2 RETURNING id', [input.botao_id, v.id])
      if (!gone.length) throw new PluginError('NOT_FOUND', 'Botão não encontrado neste vídeo.', 404)
      return { botao_id: input.botao_id, removido: true }
    }
    const cols: [string, unknown][] = [['start_s', input.aparece_em_s], ['end_s', input.some_em_s], ['text', input.texto], ['url', input.link], ['position', input.posicao],
      ['background', input.fundo], ['color', input.cor_texto], ['new_tab', input.nova_aba]]
    const changes = cols.filter(([, val]) => val !== undefined)
    if (!changes.length) throw new PluginError('INVALID_INPUT', 'Nada para alterar.', 422)
    const done = await m.db.query(`UPDATE videohosting.ctas SET ${changes.map(([c], i) => `${c} = $${i + 3}`).join(', ')} WHERE id = $1 AND video_id = $2 RETURNING id`,
      [input.botao_id, v.id, ...changes.map(([, val]) => val)])
    if (!done.length) throw new PluginError('NOT_FOUND', 'Botão não encontrado neste vídeo.', 404)
    return { botao_id: input.botao_id, alterado: true }
  }),
})

const domains = tool({
  name: 'videohosting_dominios', title: 'Onde os vídeos tocam', write: true,
  description: 'Define os sites onde os vídeos podem tocar (subdomínios valem). Sem video_id: a lista da empresa (adicionar/remover). Com video_id: a lista só desse vídeo (substitui a da empresa; lista vazia com usar_da_empresa volta à da empresa).',
  schema: z.object({ ...base(), video_id: videoId().optional(), adicionar: domainList().default([]).describe('Domínios a incluir, ex.: ["minhapagina.com.br"].'),
    remover: domainList().default([]).describe('Domínios a tirar.'), usar_da_empresa: z.boolean().optional().describe('Com video_id: volta a usar a lista da empresa.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const add = cleanDomains(input.adicionar), drop = cleanDomains(input.remover)
    if (input.video_id) {
      const v = await needVideo(m, input.video_id)
      const next = input.usar_da_empresa ? null : [...new Set([...(v.domains ?? []), ...add])].filter(d => !drop.includes(d)).sort()
      await m.db.query('UPDATE videohosting.videos SET domains = $2 WHERE id = $1', [v.id, next])
      return { video_id: v.id, dominios: next ?? 'os da empresa' }
    }
    for (const d of add) await m.db.query('INSERT INTO videohosting.domains (workspace_id, domain) VALUES ($1, $2) ON CONFLICT DO NOTHING', [m.ws, d])
    if (drop.length) await m.db.query('DELETE FROM videohosting.domains WHERE workspace_id = $1 AND domain = ANY($2)', [m.ws, drop])
    const now = await m.db.query<{ domain: string }>('SELECT domain FROM videohosting.domains WHERE workspace_id = $1 ORDER BY domain', [m.ws])
    return { dominios_da_empresa: now.map(d => d.domain), aviso: now.length ? undefined : 'Sem domínios: os vídeos tocam em qualquer site que tiver o código.', link: `${ctx.origin}/videohosting/configuracoes` }
  }),
})

const companyDefault = tool({
  name: 'videohosting_padrao_empresa', title: 'Mudar padrão do player', write: true,
  description: 'Muda a aparência padrão do player para todos os vídeos da empresa que não têm aparência própria (só os campos informados).',
  schema: z.object({ ...base(), aparencia: settingsInput('Campos do padrão a mudar.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const [preset] = await m.db.query<{ settings: Record<string, unknown> }>('SELECT settings FROM videohosting.presets WHERE workspace_id = $1', [m.ws])
    const { controles, ...rest } = input.aparencia
    const current = mergeSettings(preset?.settings)
    const next = mergeSettings(current, { ...rest, ...(controles ? { controles } : {}) })
    await m.db.query(`INSERT INTO videohosting.presets (workspace_id, settings) VALUES ($1, $2) ON CONFLICT (workspace_id) DO UPDATE SET settings = excluded.settings`, [m.ws, next])
    return { padrao: next, link: `${ctx.origin}/videohosting/configuracoes` }
  }),
})

const takeDown = tool({
  name: 'videohosting_tirar_do_ar', title: 'Tirar vídeo do ar', write: true, destructive: true,
  description: 'Tira um vídeo do ar: as páginas que usam o código param de mostrar o vídeo na hora. O arquivo continua no Drive. Peça confirmação explícita e chame com confirmado: true.',
  schema: z.object({ ...base(), video_id: videoId(), confirmado: confirmed() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const v = await needVideo(m, input.video_id)
    await m.db.query('UPDATE videohosting.videos SET trashed_at = now() WHERE id = $1', [v.id])
    return { video_id: v.id, titulo: v.title, fora_do_ar: true, link: `${ctx.origin}/videohosting` }
  }),
})

export const videohostingTools: WorkspaceTool[] = [list, get, companySettings, publish, edit, buttons, domains, companyDefault, takeDown]
