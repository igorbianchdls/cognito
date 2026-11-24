// Sound effects, read by the server: the catalog runs as the person (role authenticated with their Clerk user), so the
// same policy as the table decides (marketing.can_use_sound_effects); the files get signed URLs from the private bucket.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'

export const SOUND_EFFECTS_BUCKET = 'sound-effects'
const URL_SECONDS = 3600
export const PAGE_SIZE = 40

export type SoundEffect = { id: string; storage_path: string; title: string; category: string; duration_ms: number | null; tags: string[]; url: string | null }
export type SoundEffectPage = { efeitos: SoundEffect[]; total: number }
export type SoundEffectQuery = { category?: string; search?: string; offset?: number; id?: string }

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

/** A page of effects (one category or all, optionally searched in title and tags), with signed URLs. */
export async function soundEffectPage(clerkUserId: string, q: SoundEffectQuery): Promise<SoundEffectPage> {
  const search = (q.search ?? '').trim().slice(0, 100)
  const { rows, total } = await asPerson(clerkUserId, async client => {
    const { rows } = await client.query(
      `SELECT id, storage_path, title, category, duration_ms, tags, count(*) OVER ()::int AS total
       FROM marketing.sound_effects
       WHERE ($1::uuid IS NULL OR id = $1::uuid)
         AND ($2::text IS NULL OR category = $2)
         AND ($3::text = '' OR title ILIKE '%' || $3 || '%' OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || $3 || '%'))
       ORDER BY title, id
       LIMIT $4 OFFSET $5`,
      [q.id ?? null, q.category ?? null, search.replace(/[\\%_]/g, m => '\\' + m), PAGE_SIZE, Math.max(0, q.offset ?? 0)],
    )
    return { rows: rows as (Omit<SoundEffect, 'url'> & { total: number })[], total: (rows[0] as { total?: number } | undefined)?.total ?? 0 }
  })
  const urls = rows.length ? await signedUrls(rows.map(e => e.storage_path)) : new Map<string, string>()
  return { efeitos: rows.map(({ total: _total, ...e }) => ({ ...e, url: urls.get(e.storage_path) ?? null })), total }
}
