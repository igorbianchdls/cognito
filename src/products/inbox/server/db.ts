// Database access for the Inbox server: the service connection (webhook, sending) and "as the person" transactions,
// where the same row level security as the screens decides what a request may see or change.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'

export class InboxError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message) }
}

export type Query = <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<T[]>
export type Person = { userId: string; orgId: string }
export type Db = { service: Query; asPerson: <T>(person: Person, fn: (q: Query) => Promise<T>) => Promise<T> }

/** Db helpers over a pool (the app's, or a test database's). */
export function makeDb(getPool: () => InstanceType<typeof Pool>): Db {
  return {
    service: async (sql, params = []) => (await getPool().query(sql, params)).rows,
    async asPerson(person, fn) {
      const client = await getPool().connect()
      try {
        await client.query('BEGIN')
        await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: person.userId, role: 'authenticated', o: { id: person.orgId } })])
        await client.query("SELECT set_config('role', 'authenticated', true)")
        const result = await fn(async (sql, params = []) => (await client.query(sql, params)).rows)
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined)
        throw error
      } finally {
        client.release()
      }
    },
  }
}

let pool: InstanceType<typeof Pool> | undefined
export const appDb = makeDb(() => {
  if (!process.env.SUPABASE_DB_URL) throw new InboxError('DB_UNAVAILABLE', 'Banco de dados indisponível.', 503)
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 4, connectionTimeoutMillis: 5000 })
  return pool
})

/** Fails unless the person can change things in their company (ERP role with write access). */
export async function requireWriter(q: Query, orgId: string) {
  const [row] = await q<{ ok: boolean }>('SELECT editor.can_write($1) AS ok', [orgId])
  if (!row?.ok) throw new InboxError('FORBIDDEN', 'Seu perfil só pode visualizar.', 403)
}
