// What a page with the player receives for a public code: where to play from, poster, merged settings and buttons.
// Only the server reads the database here; the page never does.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { signObject } from '@/products/mcpcore/domains/editor/server/media'
import { domainAllowed, mergeSettings, type PlayerSettings } from '../shared/settings'

export type EmbedConfig = {
  codigo: string; titulo: string; duracao: number | null; largura: number; altura: number
  fonte: { tipo: 'mp4' | 'hls'; url: string } | null; capa: string | null; configuracoes: PlayerSettings
  botoes: { id: string; inicio: number; fim: number | null; texto: string; url: string; posicao: 'abaixo' | 'sobre'; fundo: string; cor: string; nova_aba: boolean }[]
}
type Row = { id: string; workspace_id: string; title: string; status: string; provider: string; duration: string | null; width: number; height: number; settings: object;
  domains: string[] | null; trashed_at: string | null; storage_path: string | null; file_trashed: string | null; thumb_path: string | null; poster_path: string | null; preset: object | null; company_domains: string[] }

let pool: InstanceType<typeof Pool> | undefined
const db = () => {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 3, connectionTimeoutMillis: 5000 })
  return pool
}
export type Deps = { query?: (sql: string, params: unknown[]) => Promise<unknown[]>; sign?: (path: string, seconds: number) => Promise<string> }

export type EmbedResult = { status: 200; config: EmbedConfig } | { status: 403 | 404; erro: string }

/**
 * The player config for `code`, if the page's host may play it. `ownHost` (the Otto itself, for the preview)
 * is always allowed. Without any domain registered, any page can play (the screens warn about it).
 */
export async function embedConfig(code: string, host: string | null, ownHost: string, deps: Deps = {}): Promise<EmbedResult> {
  const query = deps.query ?? (async (sql: string, params: unknown[]) => (await db().query(sql, params)).rows)
  const [v] = await query(`
    SELECT v.id, v.workspace_id, v.title, v.status, v.provider, v.duration::text, v.width, v.height, v.settings, v.domains, v.trashed_at, v.poster_path,
      f.storage_path, f.trashed_at AS file_trashed, f.thumb_path, p.settings AS preset,
      coalesce((SELECT array_agg(d.domain) FROM videohosting.domains d WHERE d.workspace_id = v.workspace_id), '{}') AS company_domains
    FROM videohosting.videos v LEFT JOIN drive.files f ON f.id = v.source_file_id LEFT JOIN videohosting.presets p ON p.workspace_id = v.workspace_id
    WHERE v.public_code = $1`, [code]) as Row[]
  if (!v || v.trashed_at) return { status: 404, erro: 'Vídeo não encontrado.' }
  const domains = v.domains ?? v.company_domains
  if (host !== ownHost && domains.length && (!host || !domainAllowed(domains, host))) return { status: 403, erro: 'Este vídeo não pode tocar neste site.' }
  const ctas = await query(`SELECT id, start_s::float8 AS inicio, end_s::float8 AS fim, text AS texto, url, position AS posicao, background AS fundo, color AS cor, new_tab AS nova_aba
    FROM videohosting.ctas WHERE video_id = $1 ORDER BY start_s`, [v.id]) as EmbedConfig['botoes']
  const sign = deps.sign ?? ((path: string, seconds: number) => signObject(path, seconds))
  const ready = v.status === 'pronto' && v.provider === 'drive' && v.storage_path && !v.file_trashed
  const poster = v.poster_path ?? v.thumb_path
  return { status: 200, config: {
    codigo: code, titulo: v.title, duracao: v.duration ? Number(v.duration) : null, largura: v.width, altura: v.height,
    fonte: ready ? { tipo: 'mp4', url: await sign(v.storage_path!, 4 * 3600) } : null,
    capa: poster ? await sign(poster, 4 * 3600).catch(() => null) : null,
    configuracoes: mergeSettings(v.preset, v.settings), botoes: ctas.map(c => ({ ...c, inicio: Number(c.inicio), fim: c.fim === null ? null : Number(c.fim) })),
  } }
}
