// Social tools: drafts, scheduling and the connected accounts, in the same rows the Postar and Agendados screens use.
// Publishing on the networks themselves comes with the account connectors; until then scheduling only plans the post.
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import { company, type MarketingTool, type ToolContext } from '../../editor/tools/catalog'
import type { Member } from '../../editor/server/database'

const tool = <S extends z.AnyZodObject>(t: { name: string; title: string; description: string; write: boolean; destructive?: boolean; schema: S; run: (input: z.infer<S>, ctx: ToolContext) => Promise<unknown> }) => t as unknown as MarketingTool
const base = { empresa_id: company }
const postId = z.string().uuid().describe('ID do post, de social_listar_posts.')
const formats = z.enum(['reel', 'story', 'feed']).describe('reel (vídeo vertical), story ou feed (imagem, vídeo ou carrossel).')
const files = z.array(z.string().uuid().describe('ID de arquivo dos Spaces.')).max(20).describe('Vídeos e imagens dos Spaces, na ordem (carrossel no feed).')
const accounts = z.array(z.string().uuid().describe('ID de conta, de social_listar_contas.')).max(10).describe('Contas em que o post sai.')
const CAPTION_MAX = 5000

type PostRow = { id: string; caption: string; format: string; status: string; scheduled_at: string | null; published_at: string | null; created_at: string; files: { id: string; nome: string; tipo: string }[] | null; accounts: { id: string; rede: string; perfil: string; status: string; url: string | null; erro: string | null }[] | null }
const postSql = `SELECT p.id, p.caption, p.format, p.status, p.scheduled_at, p.published_at, p.created_at,
  (SELECT json_agg(json_build_object('id', f.id, 'nome', f.name, 'tipo', f.kind) ORDER BY pf.position) FROM social.post_files pf JOIN editor.files f ON f.id = pf.file_id WHERE pf.post_id = p.id) AS files,
  (SELECT json_agg(json_build_object('id', a.id, 'rede', a.network, 'perfil', a.handle, 'status', pa.status, 'url', pa.url, 'erro', pa.error)) FROM social.post_accounts pa JOIN social.social_accounts a ON a.id = pa.account_id WHERE pa.post_id = p.id) AS accounts
  FROM social.posts p`
const postView = (r: PostRow) => ({
  id: r.id, legenda: r.caption, formato: r.format, status: r.status, agendado_para: r.status === 'publicado' ? undefined : r.scheduled_at ?? undefined,
  publicado_em: r.published_at ?? undefined, arquivos: r.files ?? [], contas: (r.accounts ?? []).map(a => ({ ...a, url: a.url ?? undefined, erro: a.erro ?? undefined })),
})

async function getPost(m: Member, id: string, lock = false) {
  const [row] = await m.db.query<PostRow>(`${postSql} WHERE p.id = $1 AND p.workspace_id = $2${lock ? ' FOR UPDATE OF p' : ''}`, [id, m.ws])
  if (!row) throw new PluginError('NOT_FOUND', 'Post não encontrado nesta empresa. Use social_listar_posts.', 404)
  return row
}

async function checkFiles(m: Member, ids: string[], format: string) {
  if (!ids.length) return
  const rows = await m.db.query<{ id: string; kind: string; trashed_at: string | null }>('SELECT id, kind, trashed_at FROM editor.files WHERE workspace_id = $1 AND id = ANY($2::uuid[])', [m.ws, ids])
  for (const id of ids) {
    const f = rows.find(r => r.id === id)
    if (!f || f.trashed_at) throw new PluginError('NOT_FOUND', `Arquivo ${id} não encontrado nos Spaces. Use video_buscar_arquivos.`, 404)
    if (f.kind !== 'video' && f.kind !== 'image') throw new PluginError('INVALID_INPUT', 'Posts aceitam vídeos e imagens.', 422)
  }
  if (format === 'reel' && !rows.some(r => r.kind === 'video')) throw new PluginError('INVALID_INPUT', 'Reel precisa de um vídeo. Para imagens, use feed ou story.', 422)
}
async function checkAccounts(m: Member, ids: string[]) {
  if (!ids.length) return
  const rows = await m.db.query<{ id: string }>('SELECT id FROM social.social_accounts WHERE workspace_id = $1 AND id = ANY($2::uuid[])', [m.ws, ids])
  const missing = ids.find(id => !rows.some(r => r.id === id))
  if (missing) throw new PluginError('NOT_FOUND', `Conta ${missing} não encontrada. Use social_listar_contas.`, 404)
}
async function replaceLinks(m: Member, postId: string, status: string, fileIds?: string[], accountIds?: string[]) {
  if (fileIds) {
    await m.db.query('DELETE FROM social.post_files WHERE post_id = $1', [postId])
    for (const [position, id] of fileIds.entries()) await m.db.query('INSERT INTO social.post_files (post_id, file_id, position) VALUES ($1, $2, $3)', [postId, id, position])
  }
  if (accountIds) {
    await m.db.query('DELETE FROM social.post_accounts WHERE post_id = $1', [postId])
    for (const id of accountIds) await m.db.query('INSERT INTO social.post_accounts (post_id, account_id, status) VALUES ($1, $2, $3)', [postId, id, status])
  }
}

const listAccounts = tool({
  name: 'social_listar_contas', title: 'Contas sociais', write: false,
  description: 'Contas de Instagram, TikTok, LinkedIn e YouTube da empresa e a situação de cada uma (conectada, reconectar, desconectada).',
  schema: z.object(base).strict(),
  run: (_input, ctx) => ctx.as(async m => ({
    contas: (await m.db.query<{ id: string; network: string; handle: string; name: string; status: string }>('SELECT id, network, handle, name, status FROM social.social_accounts WHERE workspace_id = $1 ORDER BY created_at', [m.ws]))
      .map(a => ({ id: a.id, rede: a.network, perfil: a.handle, nome: a.name || undefined, status: a.status })),
  })),
})

const listPosts = tool({
  name: 'social_listar_posts', title: 'Listar posts', write: false,
  description: 'Rascunhos, posts agendados, publicados e com erro, com legenda, arquivos e contas. Filtre por situação e período.',
  schema: z.object({
    ...base, status: z.enum(['rascunho', 'agendado', 'publicado', 'erro']).optional().describe('Só posts nesta situação.'),
    de: z.string().datetime({ offset: true }).optional().describe('A partir desta data e hora (ISO com fuso).'), ate: z.string().datetime({ offset: true }).optional().describe('Até esta data e hora (ISO com fuso).'),
    limite: z.number().int().min(1).max(50).default(20).describe('Quantos posts trazer.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const rows = await m.db.query<PostRow>(`${postSql} WHERE p.workspace_id = $1 AND ($2::social.post_status IS NULL OR p.status = $2)
      AND ($3::timestamptz IS NULL OR coalesce(p.published_at, p.scheduled_at, p.created_at) >= $3) AND ($4::timestamptz IS NULL OR coalesce(p.published_at, p.scheduled_at, p.created_at) <= $4)
      ORDER BY coalesce(p.published_at, p.scheduled_at, p.created_at) DESC LIMIT $5`, [m.ws, input.status ?? null, input.de ?? null, input.ate ?? null, input.limite])
    return { posts: rows.map(postView) }
  }),
})

const createPost = tool({
  name: 'social_criar_post', title: 'Criar post', write: true,
  description: 'Cria um rascunho de post com legenda, formato, arquivos dos Spaces (por exemplo o vídeo exportado do editor) e contas. Para agendar, use social_agendar_post depois.',
  schema: z.object({ ...base, legenda: z.string().max(CAPTION_MAX).default('').describe('Texto do post, com hashtags e menções.'), formato: formats.default('reel'), arquivo_ids: files.optional(), conta_ids: accounts.optional() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    await checkFiles(m, input.arquivo_ids ?? [], input.formato)
    await checkAccounts(m, input.conta_ids ?? [])
    const [row] = await m.db.query<{ id: string }>('INSERT INTO social.posts (workspace_id, caption, format, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id', [m.ws, input.legenda, input.formato, 'rascunho', m.userId])
    await replaceLinks(m, row.id, 'rascunho', input.arquivo_ids ?? [], input.conta_ids ?? [])
    return { post: postView(await getPost(m, row.id)), link: `${ctx.origin}/social/postar` }
  }),
})

const editPost = tool({
  name: 'social_editar_post', title: 'Editar post', write: true,
  description: 'Muda legenda, formato, arquivos ou contas de um rascunho ou post agendado (posts publicados não mudam). Listas informadas substituem as atuais.',
  schema: z.object({ ...base, post_id: postId, legenda: z.string().max(CAPTION_MAX).optional().describe('Nova legenda.'), formato: formats.optional(), arquivo_ids: files.optional(), conta_ids: accounts.optional() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const post = await getPost(m, input.post_id, true)
    if (post.status === 'publicado') throw new PluginError('INVALID_STATE', 'Post já publicado não pode ser editado.', 409)
    const formatNext = input.formato ?? post.format
    await checkFiles(m, input.arquivo_ids ?? (post.files ?? []).map(f => f.id), formatNext)
    await checkAccounts(m, input.conta_ids ?? [])
    await m.db.query('UPDATE social.posts SET caption = coalesce($2, caption), format = $3 WHERE id = $1', [post.id, input.legenda ?? null, formatNext])
    await replaceLinks(m, post.id, post.status, input.arquivo_ids, input.conta_ids)
    return { post: postView(await getPost(m, post.id)) }
  }),
})

const schedulePost = tool({
  name: 'social_agendar_post', title: 'Agendar post', write: true, destructive: true,
  description: 'Agenda o post para uma data e hora futuras, ou volta para rascunho com agendar_para null. Mostre o post, as contas e o horário e peça confirmação explícita antes; só então chame com confirmado: true. Enquanto as contas não estiverem conectadas por conector, o agendamento fica no calendário do Otto e a publicação na rede é feita pela pessoa.',
  schema: z.object({
    ...base, post_id: postId, agendar_para: z.union([z.string().datetime({ offset: true }), z.null()]).describe('Data e hora ISO com fuso (ex.: 2026-12-01T18:00:00-03:00); null desagenda.'),
    confirmado: z.literal(true).describe('true somente depois que a pessoa confirmou.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const post = await getPost(m, input.post_id, true)
    if (post.status === 'publicado') throw new PluginError('INVALID_STATE', 'Post já publicado.', 409)
    if (input.agendar_para === null) {
      await m.db.query("UPDATE social.posts SET status = 'rascunho' WHERE id = $1", [post.id])
      await m.db.query("UPDATE social.post_accounts SET status = 'rascunho' WHERE post_id = $1", [post.id])
    } else {
      if (Date.parse(input.agendar_para) < Date.now() + 60000) throw new PluginError('INVALID_INPUT', 'Escolha um horário no futuro.', 422)
      if (!post.accounts?.length) throw new PluginError('INVALID_STATE', 'Escolha ao menos uma conta (social_editar_post com conta_ids) antes de agendar.', 409)
      if (!post.files?.length) throw new PluginError('INVALID_STATE', 'Adicione um vídeo ou imagem antes de agendar.', 409)
      await m.db.query("UPDATE social.posts SET status = 'agendado', scheduled_at = $2 WHERE id = $1", [post.id, input.agendar_para])
      await m.db.query("UPDATE social.post_accounts SET status = 'agendado', error = NULL WHERE post_id = $1", [post.id])
    }
    return { post: postView(await getPost(m, post.id)), link: `${ctx.origin}/social/posts` }
  }),
})

const deletePost = tool({
  name: 'social_excluir_post', title: 'Excluir post', write: true, destructive: true,
  description: 'Exclui o post do Otto (não apaga o que já saiu nas redes). Mostre o post e peça confirmação explícita antes; só então chame com confirmado: true.',
  schema: z.object({ ...base, post_id: postId, confirmado: z.literal(true).describe('true somente depois que a pessoa confirmou.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const post = await getPost(m, input.post_id, true)
    await m.db.query('DELETE FROM social.posts WHERE id = $1', [post.id])
    return { excluido: true, post: { id: post.id, legenda: post.caption.slice(0, 80) } }
  }),
})

export const socialTools: MarketingTool[] = [listAccounts, listPosts, createPost, editPost, schedulePost, deletePost]
