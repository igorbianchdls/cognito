// Sound effects, read by the server: the catalog runs as the person (role authenticated with their Clerk user), so the
// same policy as the table decides (marketing.can_use_sound_effects); the files get signed URLs from the private bucket.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'

export const SOUND_EFFECTS_BUCKET = 'sound-effects'
const URL_SECONDS = 3600

export type SoundEffect = { id: string; storage_path: string; title: string; category: string; duration_ms: number | null; tags: string[]; url: string | null }

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 3, connectionTimeoutMillis: 5000 })
  return pool
}

/** The effects the person can see (none when they aren't an active member of any company). */
async function visibleEffects(clerkUserId: string) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: clerkUserId, role: 'authenticated' })])
    await client.query("SELECT set_config('role', 'authenticated', true)")
    const { rows } = await client.query('SELECT id, storage_path, title, category, duration_ms, tags FROM marketing.sound_effects ORDER BY category, title')
    await client.query('COMMIT')
    return rows as Omit<SoundEffect, 'url'>[]
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
  if (!base || !key) throw new Error('Supabase Storage não configurado')
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

export async function listSoundEffects(clerkUserId: string): Promise<SoundEffect[]> {
  const effects = await visibleEffects(clerkUserId)
  if (!effects.length) return []
  const urls = await signedUrls(effects.map(e => e.storage_path))
  return effects.map(e => ({ ...e, url: urls.get(e.storage_path) ?? null }))
}
