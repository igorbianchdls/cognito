// Conexão do Analytics com o Postgres: como a pessoa (papel authenticated com usuário e empresa do Clerk, para as regras
// de acesso valerem) nas telas e no conector, e como o servidor só para receber eventos e gravações dos sites.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'

export type Contexto = { userId: string; orgId: string }
export type Db = { query<R = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<R[]> }

let pool: InstanceType<typeof Pool> | undefined
export function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 4, connectionTimeoutMillis: 5000 })
  return pool
}

type Cliente = { query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }> }
const comoDb = (c: Cliente): Db => ({ query: async <R,>(sql: string, params?: unknown[]) => (await c.query(sql, params)).rows as R[] })

/** Roda como a pessoa numa transação (as regras de acesso decidem o que ela vê e altera), com teto de 20 s por consulta. */
export async function comoPessoa<T>(ctx: Contexto, run: (db: Db) => Promise<T>) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: ctx.userId, role: 'authenticated', o: { id: ctx.orgId } })])
    await client.query("SELECT set_config('role', 'authenticated', true)")
    await client.query("SET LOCAL statement_timeout = '20s'")
    const result = await run(comoDb(client))
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}

/** O servidor (receber eventos e gravações): sem as regras de acesso, então só para gravar o que já foi conferido. */
export async function doServidor<T>(run: (db: Db) => Promise<T>) {
  const client = await getPool().connect()
  try { return await run(comoDb(client)) } finally { client.release() }
}

export class AnalyticsError extends Error {
  constructor(message: string, readonly status = 400) { super(message) }
}
