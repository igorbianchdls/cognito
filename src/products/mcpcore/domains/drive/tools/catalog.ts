// Drive tools: find, open, organize and bring files into the company's Drive, the same rows the /drive screens use
// (schema drive). Big files and uploads from a computer go through the code path (Claude Code with the Otto key).
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import type { Member } from '../../editor/server/database'
import { download, removeObjects, signObject, storeFile } from '../../editor/server/media'
import { company, confirmed, tool, uuid, type WorkspaceTool } from '../../workspace/context'

const kinds = { video: 'video', imagem: 'image', audio: 'audio', texto: 'text' } as const
const kindName = (k: string) => (Object.entries(kinds).find(([, v]) => v === k)?.[0] ?? k)
const base = () => ({ empresa_id: company() })
const tags = () => z.array(z.string().trim().min(1).max(40)).max(20).describe('Etiquetas, ex.: ["Reels", "Natal"].')
const link = (ctx: { origin: string }, path: string) => `${ctx.origin}${path}`

type FileRow = { id: string; name: string; kind: string; size: string; duration: number | null; width: number; height: number; drive_id: string; folder_id: string | null; tags: string[]; updated_at: string; storage_path: string; trashed_at: string | null }
const fileView = (f: FileRow, ctx: { origin: string }) => ({
  id: f.id, nome: f.name, tipo: kindName(f.kind), tamanho_mb: Math.round(Number(f.size) / 1e5) / 10,
  duracao_s: f.duration ?? undefined, largura: f.width || undefined, altura: f.height || undefined,
  drive_id: f.drive_id, pasta_id: f.folder_id ?? undefined, etiquetas: f.tags.length ? f.tags : undefined, atualizado_em: f.updated_at,
  na_lixeira: f.trashed_at ? true : undefined, link: link(ctx, f.folder_id ? `/drive/pastas/${f.folder_id}?arquivo=${f.id}` : `/drive/${f.drive_id}?arquivo=${f.id}`),
})
const FILE_COLS = 'f.id, f.name, f.kind, f.size::text, f.duration::float8 AS duration, f.width, f.height, f.drive_id, f.folder_id, f.tags, f.updated_at, f.storage_path, f.trashed_at'

async function needDrive(m: Member, id: string) {
  const [d] = await m.db.query<{ id: string; name: string }>('SELECT id, name FROM drive.drives WHERE id = $1 AND workspace_id = $2', [id, m.ws])
  if (!d) throw new PluginError('NOT_FOUND', 'Drive não encontrado nesta empresa. Use drive_listar_drives.', 404)
  return d
}
async function needFolder(m: Member, id: string, live = true) {
  const [f] = await m.db.query<{ id: string; name: string; drive_id: string; parent_id: string | null; trashed_at: string | null }>(
    'SELECT id, name, drive_id, parent_id, trashed_at FROM drive.folders WHERE id = $1 AND workspace_id = $2', [id, m.ws])
  if (!f) throw new PluginError('NOT_FOUND', 'Pasta não encontrada nesta empresa.', 404)
  if (live && f.trashed_at) throw new PluginError('INVALID_STATE', 'Essa pasta está na lixeira. Restaure com drive_lixeira.', 409)
  return f
}
/** The folder and every folder inside it. */
async function subtree(m: Member, id: string) {
  const rows = await m.db.query<{ id: string }>(`WITH RECURSIVE t AS (SELECT id FROM drive.folders WHERE id = $1 AND workspace_id = $2
    UNION ALL SELECT f.id FROM drive.folders f JOIN t ON f.parent_id = t.id) SELECT id FROM t`, [id, m.ws])
  return rows.map(r => r.id)
}

// ---------- consultas ----------

const listDrives = tool({
  name: 'drive_listar_drives', title: 'Drives da empresa', write: false,
  description: 'Os drives da empresa (cada um guarda as pastas e arquivos de uma marca ou projeto), com quantidade de arquivos e espaço usado.',
  schema: z.object(base()).strict(),
  run: (_i, ctx) => ctx.as(async m => {
    const rows = await m.db.query<{ id: string; name: string; files: string; folders: string; bytes: string }>(`
      SELECT d.id, d.name,
        (SELECT count(*) FROM drive.files f WHERE f.drive_id = d.id AND f.trashed_at IS NULL)::text AS files,
        (SELECT count(*) FROM drive.folders f WHERE f.drive_id = d.id AND f.trashed_at IS NULL)::text AS folders,
        (SELECT coalesce(sum(size), 0) FROM drive.files f WHERE f.drive_id = d.id AND f.trashed_at IS NULL)::text AS bytes
      FROM drive.drives d WHERE d.workspace_id = $1 ORDER BY d.created_at`, [m.ws])
    return { drives: rows.map(d => ({ id: d.id, nome: d.name, arquivos: Number(d.files), pastas: Number(d.folders), tamanho_mb: Math.round(Number(d.bytes) / 1e5) / 10, link: link(ctx, `/drive/${d.id}`) })) }
  }),
})

const listFolder = tool({
  name: 'drive_listar_pasta', title: 'Conteúdo de um drive ou pasta', write: false,
  description: 'Pastas e arquivos dentro de uma pasta, ou na raiz de um drive. Informe pasta_id ou drive_id.',
  schema: z.object({ ...base(), drive_id: uuid('Drive, para ver a raiz dele.').optional(), pasta_id: uuid('Pasta, para ver o que tem dentro.').optional(),
    limite: z.number().int().min(1).max(200).default(100).describe('Quantos arquivos trazer.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (!input.pasta_id && !input.drive_id) throw new PluginError('INVALID_INPUT', 'Informe drive_id ou pasta_id.', 422)
    const folder = input.pasta_id ? await needFolder(m, input.pasta_id) : null
    const driveId = folder?.drive_id ?? (await needDrive(m, input.drive_id!)).id
    const folders = await m.db.query<{ id: string; name: string; description: string; tags: string[] }>(
      `SELECT id, name, description, tags FROM drive.folders WHERE workspace_id = $1 AND drive_id = $2 AND parent_id IS NOT DISTINCT FROM $3 AND trashed_at IS NULL ORDER BY name`,
      [m.ws, driveId, folder?.id ?? null])
    const files = await m.db.query<FileRow>(`SELECT ${FILE_COLS} FROM drive.files f WHERE f.workspace_id = $1 AND f.drive_id = $2 AND f.folder_id IS NOT DISTINCT FROM $3 AND f.trashed_at IS NULL ORDER BY f.name LIMIT $4`,
      [m.ws, driveId, folder?.id ?? null, input.limite])
    return { drive_id: driveId, pasta: folder ? { id: folder.id, nome: folder.name, pasta_pai_id: folder.parent_id ?? undefined } : undefined,
      pastas: folders.map(f => ({ id: f.id, nome: f.name, descricao: f.description || undefined, etiquetas: f.tags.length ? f.tags : undefined })),
      arquivos: files.map(f => fileView(f, ctx)), link: link(ctx, folder ? `/drive/pastas/${folder.id}` : `/drive/${driveId}`) }
  }),
})

const search = tool({
  name: 'drive_buscar', title: 'Buscar no Drive', write: false,
  description: 'Procura arquivos e pastas por nome, tipo, etiqueta ou data, em todos os drives da empresa (fora da lixeira).',
  schema: z.object({ ...base(), busca: z.string().trim().max(80).optional().describe('Parte do nome.'),
    tipo: z.enum(['video', 'imagem', 'audio', 'texto', 'pasta']).optional().describe('Só um tipo.'), etiqueta: z.string().trim().max(40).optional().describe('Só itens com esta etiqueta.'),
    desde: z.string().date().optional().describe('Alterados a partir desta data (AAAA-MM-DD).'), drive_id: uuid('Só neste drive.').optional(),
    limite: z.number().int().min(1).max(100).default(30).describe('Quantos itens trazer.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const args = [m.ws, input.busca || null, input.etiqueta || null, input.desde || null, input.drive_id || null, input.limite]
    const folders = input.tipo && input.tipo !== 'pasta' ? [] : await m.db.query<{ id: string; name: string; drive_id: string; tags: string[] }>(`
      SELECT id, name, drive_id, tags FROM drive.folders WHERE workspace_id = $1 AND trashed_at IS NULL
        AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%') AND ($3::text IS NULL OR $3 = ANY(tags)) AND ($4::date IS NULL OR updated_at >= $4)
        AND ($5::uuid IS NULL OR drive_id = $5) ORDER BY updated_at DESC LIMIT $6`, args)
    const files = input.tipo === 'pasta' ? [] : await m.db.query<FileRow>(`
      SELECT ${FILE_COLS} FROM drive.files f WHERE f.workspace_id = $1 AND f.trashed_at IS NULL
        AND ($2::text IS NULL OR f.name ILIKE '%' || $2 || '%') AND ($3::text IS NULL OR $3 = ANY(f.tags)) AND ($4::date IS NULL OR f.updated_at >= $4)
        AND ($5::uuid IS NULL OR f.drive_id = $5) AND ($7::text IS NULL OR f.kind::text = $7) ORDER BY f.updated_at DESC LIMIT $6`,
      [...args, input.tipo ? kinds[input.tipo as keyof typeof kinds] : null])
    return { pastas: folders.map(f => ({ id: f.id, nome: f.name, drive_id: f.drive_id, etiquetas: f.tags.length ? f.tags : undefined, link: link(ctx, `/drive/pastas/${f.id}`) })),
      arquivos: files.map(f => fileView(f, ctx)) }
  }),
})

const viewFile = tool({
  name: 'drive_ver_arquivo', title: 'Ver arquivo do Drive', write: false,
  description: 'Detalhes de um arquivo (tamanho, duração, dimensões, onde está) e um link temporário (1 hora) para ver ou baixar.',
  schema: z.object({ ...base(), arquivo_id: uuid('Arquivo, de drive_buscar ou drive_listar_pasta.'), baixar: z.boolean().default(false).describe('true: o link baixa o arquivo em vez de abrir.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const [f] = await m.db.query<FileRow & { mime: string; drive: string; folder: string | null }>(`
      SELECT ${FILE_COLS}, f.mime, d.name AS drive, fo.name AS folder FROM drive.files f JOIN drive.drives d ON d.id = f.drive_id
        LEFT JOIN drive.folders fo ON fo.id = f.folder_id WHERE f.id = $1 AND f.workspace_id = $2`, [input.arquivo_id, m.ws])
    if (!f) throw new PluginError('NOT_FOUND', 'Arquivo não encontrado nesta empresa.', 404)
    const url = f.storage_path ? await signObject(f.storage_path, 3600, input.baixar ? f.name : undefined, ctx.storage) : null
    return { arquivo: { ...fileView(f, ctx), formato: f.mime || undefined, drive: f.drive, pasta: f.folder ?? undefined }, link_temporario: url, valido_por_min: url ? 60 : undefined }
  }),
})

const recentsFavorites = tool({
  name: 'drive_recentes_favoritos', title: 'Recentes e favoritos', write: false,
  description: 'Os itens que a pessoa abriu por último no Drive, ou os que marcou como favoritos.',
  schema: z.object({ ...base(), lista: z.enum(['recentes', 'favoritos']).describe('Qual lista.'), limite: z.number().int().min(1).max(50).default(20).describe('Quantos itens trazer.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const table = input.lista === 'recentes' ? 'drive.recents' : 'drive.favorites'
    const order = input.lista === 'recentes' ? 'x.opened_at DESC' : 'x.created_at DESC'
    const rows = await m.db.query<{ item_type: string; item_id: string; name: string | null; kind: string | null }>(`
      SELECT x.item_type, x.item_id, coalesce(f.name, fo.name) AS name, f.kind FROM ${table} x
        LEFT JOIN drive.files f ON x.item_type = 'file' AND f.id = x.item_id AND f.trashed_at IS NULL
        LEFT JOIN drive.folders fo ON x.item_type = 'folder' AND fo.id = x.item_id AND fo.trashed_at IS NULL
      WHERE x.workspace_id = $1 AND x.user_id = $2 AND coalesce(f.id, fo.id) IS NOT NULL ORDER BY ${order} LIMIT $3`, [m.ws, m.userId, input.limite])
    return { itens: rows.map(r => ({ tipo: r.item_type === 'folder' ? 'pasta' : kindName(r.kind ?? ''), id: r.item_id, nome: r.name,
      link: link(ctx, r.item_type === 'folder' ? `/drive/pastas/${r.item_id}` : `/drive/recentes`) })) }
  }),
})

const usage = tool({
  name: 'drive_uso', title: 'Espaço usado no Drive', write: false,
  description: 'Quanto espaço a empresa usa no Drive: por drive, por tipo de arquivo, os 10 maiores arquivos e o que está na lixeira.',
  schema: z.object(base()).strict(),
  run: (_i, ctx) => ctx.as(async m => {
    const [byDrive, byKind, biggest, trash] = await Promise.all([
      m.db.query<{ name: string; bytes: string }>(`SELECT d.name, coalesce(sum(f.size), 0)::text AS bytes FROM drive.drives d LEFT JOIN drive.files f ON f.drive_id = d.id AND f.trashed_at IS NULL WHERE d.workspace_id = $1 GROUP BY d.id ORDER BY sum(f.size) DESC NULLS LAST`, [m.ws]),
      m.db.query<{ kind: string; n: string; bytes: string }>(`SELECT kind, count(*)::text AS n, sum(size)::text AS bytes FROM drive.files WHERE workspace_id = $1 AND trashed_at IS NULL GROUP BY kind`, [m.ws]),
      m.db.query<FileRow>(`SELECT ${FILE_COLS} FROM drive.files f WHERE f.workspace_id = $1 AND f.trashed_at IS NULL ORDER BY f.size DESC LIMIT 10`, [m.ws]),
      m.db.query<{ n: string; bytes: string }>(`SELECT count(*)::text AS n, coalesce(sum(size), 0)::text AS bytes FROM drive.files WHERE workspace_id = $1 AND trashed_at IS NOT NULL`, [m.ws]),
    ])
    const mb = (b: string) => Math.round(Number(b) / 1e5) / 10
    return { total_mb: mb(String(byKind.reduce((v, k) => v + Number(k.bytes), 0))), por_drive: byDrive.map(d => ({ drive: d.name, tamanho_mb: mb(d.bytes) })),
      por_tipo: byKind.map(k => ({ tipo: kindName(k.kind), arquivos: Number(k.n), tamanho_mb: mb(k.bytes) })), maiores: biggest.map(f => fileView(f, ctx)),
      lixeira: { arquivos: Number(trash[0].n), tamanho_mb: mb(trash[0].bytes) } }
  }),
})

// ---------- criação e organização ----------

const createDrive = tool({
  name: 'drive_criar_drive', title: 'Criar drive', write: true,
  description: 'Cria um drive novo, por exemplo para uma marca, cliente ou projeto.',
  schema: z.object({ ...base(), nome: z.string().trim().min(1).max(80).describe('Nome do drive.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const [d] = await m.db.query<{ id: string }>('INSERT INTO drive.drives (workspace_id, name) VALUES ($1, $2) RETURNING id', [m.ws, input.nome])
    return { drive: { id: d.id, nome: input.nome, link: link(ctx, `/drive/${d.id}`) } }
  }),
})

const createFolder = tool({
  name: 'drive_criar_pasta', title: 'Criar pasta', write: true,
  description: 'Cria uma pasta na raiz de um drive (drive_id) ou dentro de outra pasta (pasta_pai_id), com descrição e etiquetas.',
  schema: z.object({ ...base(), drive_id: uuid('Drive, para criar na raiz.').optional(), pasta_pai_id: uuid('Pasta onde criar.').optional(),
    nome: z.string().trim().min(1).max(120).describe('Nome da pasta.'), descricao: z.string().max(500).default('').describe('Para que serve a pasta.'), etiquetas: tags().default([]) }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (!input.drive_id && !input.pasta_pai_id) throw new PluginError('INVALID_INPUT', 'Informe drive_id ou pasta_pai_id.', 422)
    const parent = input.pasta_pai_id ? await needFolder(m, input.pasta_pai_id) : null
    const driveId = parent?.drive_id ?? (await needDrive(m, input.drive_id!)).id
    const [f] = await m.db.query<{ id: string }>('INSERT INTO drive.folders (workspace_id, drive_id, parent_id, name, description, tags) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [m.ws, driveId, parent?.id ?? null, input.nome, input.descricao, input.etiquetas])
    return { pasta: { id: f.id, nome: input.nome, drive_id: driveId, link: link(ctx, `/drive/pastas/${f.id}`) } }
  }),
})

const fromLink = tool({
  name: 'drive_trazer_de_link', title: 'Trazer arquivo de um link', write: true, openWorld: true,
  description: 'Baixa um vídeo, imagem ou áudio de um link https público (até 50 MB) e guarda no Drive, numa pasta (pasta_id) ou na raiz de um drive (drive_id). Aceita MP4, MOV, WEBM, PNG, JPG, WEBP, GIF, MP3, M4A e WAV. Arquivos maiores: envie pela tela do Drive ou pelo Claude Code.',
  schema: z.object({ ...base(), url: z.string().url().max(2000).describe('Link https direto para o arquivo.'), nome: z.string().trim().min(1).max(200).optional().describe('Nome no Drive; sem ele, vem do link.'),
    pasta_id: uuid('Pasta de destino.').optional(), drive_id: uuid('Drive de destino (raiz). Sem pasta e sem drive, vai para o primeiro drive.').optional() }).strict(),
  run: async (input, ctx) => {
    // The download happens before the transaction, so a slow link doesn't hold the database.
    const { bytes, name } = await (ctx.storage?.download ?? download)(input.url, ctx.storage?.send)
    const f = await ctx.as(m => storeFile(m, { bytes, name: input.nome ?? (name || 'Arquivo'), folderId: input.pasta_id, driveId: input.drive_id }, ctx.storage))
    return { arquivo: { id: f.id, nome: f.name, tipo: kindName(f.kind), duracao_s: f.duration ?? undefined, largura: f.width || undefined, altura: f.height || undefined, tamanho_mb: Math.round(f.size / 1e5) / 10 } }
  },
})

const item = () => z.object({ tipo: z.enum(['arquivo', 'pasta']).describe('Arquivo ou pasta.'), id: uuid('ID do item.') }).strict()
const organize = tool({
  name: 'drive_organizar', title: 'Organizar o Drive', write: true,
  description: 'Move, renomeia, troca etiquetas e marca ou desmarca favoritos, em vários itens de uma vez. Mover uma pasta leva tudo o que está dentro; para mover para a raiz de um drive, use mover_para_drive_id.',
  schema: z.object({ ...base(), mudancas: z.array(z.object({
    item: item().describe('O arquivo ou a pasta a mudar.'), mover_para_pasta_id: uuid('Pasta de destino.').optional(), mover_para_drive_id: uuid('Raiz deste drive.').optional(),
    novo_nome: z.string().trim().min(1).max(255).optional().describe('Novo nome.'), etiquetas: tags().optional(), favorito: z.boolean().optional().describe('Marca ou desmarca como favorito (da pessoa).'),
    descricao: z.string().max(500).optional().describe('Pastas: nova descrição.'),
  }).strict()).min(1).max(100).describe('Mudanças, aplicadas em ordem, todas ou nenhuma.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    let done = 0
    for (const c of input.mudancas) {
      const { tipo, id } = c.item
      const target = c.mover_para_pasta_id ? await needFolder(m, c.mover_para_pasta_id) : null
      const targetDrive = target?.drive_id ?? (c.mover_para_drive_id ? (await needDrive(m, c.mover_para_drive_id)).id : null)
      if (tipo === 'arquivo') {
        const [f] = await m.db.query<{ id: string }>('SELECT id FROM drive.files WHERE id = $1 AND workspace_id = $2', [id, m.ws])
        if (!f) throw new PluginError('NOT_FOUND', `Arquivo ${id} não encontrado.`, 404)
        if (targetDrive) await m.db.query('UPDATE drive.files SET drive_id = $2, folder_id = $3 WHERE id = $1', [id, targetDrive, target?.id ?? null])
        if (c.novo_nome) await m.db.query('UPDATE drive.files SET name = $2 WHERE id = $1', [id, c.novo_nome])
        if (c.etiquetas) await m.db.query('UPDATE drive.files SET tags = $2 WHERE id = $1', [id, c.etiquetas])
      } else {
        await needFolder(m, id, false)
        if (targetDrive) {
          const inside = await subtree(m, id)
          if (target && inside.includes(target.id)) throw new PluginError('INVALID_INPUT', 'Uma pasta não pode ir para dentro dela mesma.', 422)
          await m.db.query('UPDATE drive.folders SET parent_id = $2, drive_id = $3 WHERE id = $1', [id, target?.id ?? null, targetDrive])
          await m.db.query('UPDATE drive.folders SET drive_id = $2 WHERE id = ANY($1::uuid[])', [inside, targetDrive])
          await m.db.query('UPDATE drive.files SET drive_id = $2 WHERE folder_id = ANY($1::uuid[])', [inside, targetDrive])
        }
        if (c.novo_nome) await m.db.query('UPDATE drive.folders SET name = $2 WHERE id = $1', [id, c.novo_nome.slice(0, 120)])
        if (c.etiquetas) await m.db.query('UPDATE drive.folders SET tags = $2 WHERE id = $1', [id, c.etiquetas])
        if (c.descricao !== undefined) await m.db.query('UPDATE drive.folders SET description = $2 WHERE id = $1', [id, c.descricao])
      }
      if (c.favorito !== undefined) {
        const type = tipo === 'pasta' ? 'folder' : 'file'
        if (c.favorito) await m.db.query('INSERT INTO drive.favorites (user_id, workspace_id, item_type, item_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING', [m.userId, m.ws, type, id])
        else await m.db.query('DELETE FROM drive.favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3', [m.userId, type, id])
      }
      done++
    }
    return { alterados: done }
  }),
})

const trash = tool({
  name: 'drive_lixeira', title: 'Lixeira do Drive', write: true, destructive: true,
  description: 'Manda itens para a lixeira ou restaura. Itens na lixeira somem do Drive, do editor e dos posts novos, mas podem voltar. Mostre o que vai para a lixeira e peça confirmação antes; só então chame com confirmado: true.',
  schema: z.object({ ...base(), acao: z.enum(['enviar', 'restaurar']).describe('Mandar para a lixeira ou tirar de lá.'), itens: z.array(item()).min(1).max(100).describe('Itens.'), confirmado: confirmed() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const at = input.acao === 'enviar' ? new Date().toISOString() : null
    let n = 0
    for (const { tipo, id } of input.itens) {
      const table = tipo === 'pasta' ? 'drive.folders' : 'drive.files'
      const r = await m.db.query(`UPDATE ${table} SET trashed_at = $3 WHERE id = $1 AND workspace_id = $2 RETURNING id`, [id, m.ws, at])
      if (!r.length) throw new PluginError('NOT_FOUND', `Item ${id} não encontrado.`, 404)
      n++
    }
    return { [input.acao === 'enviar' ? 'na_lixeira' : 'restaurados']: n, link: link(ctx, '/drive/lixeira') }
  }),
})

const emptyTrash = tool({
  name: 'drive_esvaziar_lixeira', title: 'Esvaziar a lixeira', write: true, destructive: true,
  description: 'Apaga DE VEZ tudo o que está na lixeira do Drive da empresa (arquivos, pastas e o que estiver dentro delas). Não tem volta. Antes, use drive_uso para dizer quantos itens e quanto espaço são, peça confirmação explícita e só então chame com confirmado: true.',
  schema: z.object({ ...base(), confirmado: confirmed() }).strict(),
  run: (_i, ctx) => ctx.as(async m => {
    const folders = await m.db.query<{ id: string }>('SELECT id FROM drive.folders WHERE workspace_id = $1 AND trashed_at IS NOT NULL', [m.ws])
    const inside = (await Promise.all(folders.map(f => subtree(m, f.id)))).flat()
    const files = await m.db.query<{ id: string; storage_path: string; thumb_path: string | null; proxy_path: string | null }>(
      'SELECT id, storage_path, thumb_path, proxy_path FROM drive.files WHERE workspace_id = $1 AND (trashed_at IS NOT NULL OR folder_id = ANY($2::uuid[]))', [m.ws, inside])
    const paths = files.flatMap(f => [f.storage_path, f.thumb_path, f.proxy_path]).filter((p): p is string => !!p && p.startsWith(m.ws + '/'))
    // Rows first (inside the transaction), then the bytes: if storage fails, the transaction rolls back and nothing is lost.
    await m.db.query('DELETE FROM drive.files WHERE id = ANY($1::uuid[])', [files.map(f => f.id)])
    await m.db.query('DELETE FROM drive.folders WHERE id = ANY($1::uuid[])', [folders.map(f => f.id)])
    await removeObjects(paths, ctx.storage)
    return { arquivos_apagados: files.length, pastas_apagadas: inside.length }
  }),
})

export const driveTools: WorkspaceTool[] = [listDrives, listFolder, search, viewFile, recentsFavorites, usage, createDrive, createFolder, fromLink, organize, trash, emptyTrash]
