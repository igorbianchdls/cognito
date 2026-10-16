import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import { TablesError } from '../shared/contracts'

export type TablesSession = Pick<AuthTenantContext, 'tenantId' | 'sharedUserId' | 'role'>
// Query rows are mapped and validated by each repository method. Keep this
// structural contract compatible with the project's ambient pg declaration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, any>[] }> }
let pool: InstanceType<typeof Pool> | undefined

/** Same restricted Tables context on a transaction owned by the MCP coordinator. */
export async function withTablesClient<T>(db: Database, session: TablesSession, operationId: string, invoke: (db: Database) => Promise<T>): Promise<T> {
  const previous = (await db.query('SELECT current_user AS role')).rows[0].role as string
  await db.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('app.tables_operacao_id',$3,true),set_config('role','tables_runtime',true)", [String(session.tenantId), String(session.sharedUserId), operationId])
  try { const result = await invoke(db); await db.query("SELECT set_config('role',$1,true)", [previous]); return result }
  catch (error) { await db.query("SELECT set_config('role',$1,true)", [previous]).catch(() => undefined); throw error }
}

export async function withTablesControlTransaction<T>(invoke: (db: Database) => Promise<T>): Promise<T> {
  if (!process.env.SUPABASE_DB_URL) throw new TablesError('UNAVAILABLE', 'O banco não está configurado.', 503)
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('statement_timeout','15000',true),set_config('lock_timeout','5000',true),set_config('app.tables_operacao_id',$1,true)", [randomUUID()])
    const result = await invoke(client); await client.query('COMMIT'); return result
  } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error }
  finally { client.release() }
}

export async function withTablesTransaction<T>(session: TablesSession, write: boolean, invoke: (db: Database) => Promise<T>): Promise<T> {
  if (!Number.isSafeInteger(session.tenantId) || !Number.isSafeInteger(session.sharedUserId) || session.tenantId <= 0 || session.sharedUserId <= 0) throw new TablesError('UNAUTHENTICATED', 'Entre novamente para continuar.', 401)
  if (write && session.role === 'viewer') throw new TablesError('READ_ONLY', 'Seu acesso permite apenas consultas.', 403)
  if (!process.env.SUPABASE_DB_URL) throw new TablesError('UNAVAILABLE', 'O banco não está configurado.', 503)
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  const client = await pool.connect()
  try {
    await client.query(write ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await client.query("SELECT set_config('app.tables_empresa_id',$1,true), set_config('app.tables_usuario_id',$2,true), set_config('app.tables_operacao_id',gen_random_uuid()::text,true), set_config('statement_timeout','15000',true), set_config('lock_timeout','5000',true), set_config('role','tables_runtime',true)", [String(session.tenantId), String(session.sharedUserId)])
    const result = await invoke(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally { client.release() }
}
