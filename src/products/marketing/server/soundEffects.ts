// Sound effects, read by the server: the catalog runs as the person (role authenticated with their Clerk user), so the
// same policy as the table decides (marketing.can_use_sound_effects); the files get signed URLs from the private bucket.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { namesMatching } from '@/products/marketing/shared/soundTaxonomy'

export const SOUND_EFFECTS_BUCKET = 'sound-effects'
const URL_SECONDS = 3600
export const PAGE_SIZE = 40

export type SoundEffect = {
  id: string; storage_path: string; title: string; category: string; duration_ms: number | null; tags: string[]; url: string | null
  epidemic_category: string | null; epidemic_subcategory: string | null; waveform: number[] | null; favorite: boolean
}
export type SoundEffectPage = { efeitos: SoundEffect[]; total: number }
export type SoundEffectQuery = {
  category?: string; epidemicCategory?: string; epidemicSubcategory?: string; favorites?: boolean
  minMs?: number; maxMs?: number; sort?: SoundEffectSort; search?: string; offset?: number; id?: string
}

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 3, connectionTimeoutMillis: 5000 })
  return pool
}

/** Runs queries as the person (none of the rows are visible when they aren't an active member of any company). */
type Client = Awaited<ReturnType<InstanceType<typeof Pool>["connect"]>>
async function asPerson<T>(clerkUserId: string, run: (client: Client) => Promise<T>) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: clerkUserId, role: 'authenticated' })])
    await client.query("SELECT set_config('role', 'authenticated', true)")
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

/** Signed URLs (valid for an hour) for files of the bucket, by path. */
async function signedUrls(paths: string[]) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes')
  const urls = new Map<string, string>()
  for (let i = 0; i < paths.length; i += 100) {
    const response = await fetch(`${base}/storage/v1/object/sign/${SOUND_EFFECTS_BUCKET}`, {
      method: 'POST',
      headers: { apikey: key, authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: URL_SECONDS, paths: paths.slice(i, i + 100) }),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Storage respondeu ${response.status}`)
    for (const item of await response.json() as { path: string | null; signedURL: string | null; error: string | null }[]) {
      // The signed path comes back unescaped (file names have spaces and commas).
      if (item.path && item.signedURL) urls.set(item.path, `${base}/storage/v1${encodeURI(item.signedURL)}`)
    }
  }
  return urls
}

/** How many effects each category has (the filters of the screen). */
export function soundEffectCategories(clerkUserId: string) {
  return asPerson(clerkUserId, async client => {
    const { rows } = await client.query('SELECT category, count(*)::int AS total FROM marketing.sound_effects GROUP BY category')
    return rows as { category: string; total: number }[]
  })
}

export type SoundEffectSort = 'nome' | 'curtos' | 'longos' | 'recentes'
const ORDER: Record<SoundEffectSort, string> = {
  nome: 'title, id', curtos: 'duration_ms NULLS LAST, title, id', longos: 'duration_ms DESC NULLS LAST, title, id', recentes: 'created_at DESC, id',
}

/** The Epidemic categories and subcategories of the library, with how many effects each has (the index of the screen). */
export function soundEffectIndex(clerkUserId: string) {
  return asPerson(clerkUserId, async client => {
    const { rows } = await client.query(
      `SELECT epidemic_category AS category, coalesce(epidemic_subcategory, '') AS subcategory, count(*)::int AS total
       FROM marketing.sound_effects WHERE epidemic_category IS NOT NULL GROUP BY 1, 2 ORDER BY 1, 2`)
    return rows as { category: string; subcategory: string; total: number }[]
  })
}

/**
 * A page of effects with signed URLs: one of our categories, one Epidemic category or subcategory, the person's favorites,
 * a duration range and a search (title, tags, and category names in English or Portuguese).
 */
export async function soundEffectPage(clerkUserId: string, q: SoundEffectQuery): Promise<SoundEffectPage> {
  const search = (q.search ?? '').trim().slice(0, 100)
  const names = namesMatching(search)
  const { rows, total } = await asPerson(clerkUserId, async client => {
    const { rows } = await client.query(
      `SELECT e.id, e.storage_path, e.title, e.category, e.duration_ms, e.tags, e.epidemic_category, e.epidemic_subcategory, e.waveform,
              (f.user_id IS NOT NULL) AS favorite, count(*) OVER ()::int AS total
       FROM marketing.sound_effects e
       LEFT JOIN marketing.sound_effect_favorites f ON f.sound_effect_id = e.id AND f.user_id = $11
       WHERE ($1::uuid IS NULL OR e.id = $1::uuid)
         AND ($2::text IS NULL OR e.category = $2)
         AND ($3::text IS NULL OR e.epidemic_category = $3)
         AND ($4::text IS NULL OR e.epidemic_subcategory = $4)
         AND (NOT $5::boolean OR f.user_id IS NOT NULL)
         AND ($6::int IS NULL OR e.duration_ms >= $6) AND ($7::int IS NULL OR e.duration_ms < $7)
         AND ($8::text = '' OR e.title ILIKE '%' || $8 || '%' OR EXISTS (SELECT 1 FROM unnest(e.tags) t WHERE t ILIKE '%' || $8 || '%')
              OR e.epidemic_category = ANY($9::text[]) OR e.epidemic_subcategory = ANY($10::text[]))
       ORDER BY ${ORDER[q.sort ?? 'nome'].split(', ').map(c => 'e.' + c).join(', ')}
       LIMIT $12 OFFSET $13`,
      [q.id ?? null, q.category ?? null, q.epidemicCategory ?? null, q.epidemicSubcategory ?? null, !!q.favorites,
        q.minMs ?? null, q.maxMs ?? null, search.replace(/[\\%_]/g, m => '\\' + m), names.categories, names.subcategories, clerkUserId,
        PAGE_SIZE, Math.max(0, q.offset ?? 0)],
    )
    return { rows: rows as (Omit<SoundEffect, 'url'> & { total: number })[], total: (rows[0] as { total?: number } | undefined)?.total ?? 0 }
  })
  const urls = rows.length ? await signedUrls(rows.map(e => e.storage_path)) : new Map<string, string>()
  return { efeitos: rows.map(({ total: _total, ...e }) => ({ ...e, url: urls.get(e.storage_path) ?? null })), total }
}

/** Marks or unmarks an effect as a favorite of the person. */
export function setSoundEffectFavorite(clerkUserId: string, id: string, favorite: boolean) {
  return asPerson(clerkUserId, async client => {
    if (favorite) await client.query('INSERT INTO marketing.sound_effect_favorites (user_id, sound_effect_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [clerkUserId, id])
    else await client.query('DELETE FROM marketing.sound_effect_favorites WHERE user_id = $1 AND sound_effect_id = $2', [clerkUserId, id])
  })
}
