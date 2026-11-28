// The server's own reads of the analytics settings (who owns a public key) and access checks for the screens.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import type { Property } from './capture'

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 3, connectionTimeoutMillis: 5000 })
  return pool
}

const cache = new Map<string, { property: PublicProperty | null; until: number }>()
/** The property of a public key, cached for a minute (the script sends often). */
export type PublicProperty = Property & { autocapture: boolean; replay_sample: number; replay_mask_text: boolean }
export async function propertyByKey(key: string): Promise<PublicProperty | null> {
  const hit = cache.get(key)
  if (hit && hit.until > Date.now()) return hit.property
  const { rows } = await getPool().query('SELECT id, workspace_id, domains, autocapture, replay_sample, replay_mask_text FROM analytics.properties WHERE public_key = $1', [key])
  const property = (rows[0] as PublicProperty | undefined) ?? null
  if (cache.size > 1000) cache.clear()
  cache.set(key, { property, until: Date.now() + 60000 })
  return property
}

/**
 * A property the person can see: run as them (role authenticated with their Clerk user and organization), so the same
 * policies as the screens decide. Returns null when the property isn't theirs.
 */
export async function visibleProperty(clerkUserId: string, orgId: string, propertyId: string): Promise<Property | null> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: clerkUserId, role: 'authenticated', o: { id: orgId } })])
    await client.query("SELECT set_config('role', 'authenticated', true)")
    const { rows } = await client.query('SELECT id, workspace_id, domains FROM analytics.properties WHERE id = $1 AND workspace_id = $2', [propertyId, orgId])
    await client.query('COMMIT')
    return (rows[0] as Property | undefined) ?? null
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
