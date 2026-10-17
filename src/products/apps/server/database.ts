import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import { AppsError } from '../shared/contracts'

export type Session = Pick<AuthTenantContext, 'tenantId' | 'sharedUserId' | 'role'>
// Matches the existing pg adapter; rows are mapped in the repository.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, any>[] }> }
let pool: InstanceType<typeof Pool> | undefined
export async function transaction<T>(session: Session, write: boolean, run: (db: Database) => Promise<T>): Promise<T> {
  if (![session.tenantId, session.sharedUserId].every(v => Number.isSafeInteger(v) && v > 0)) throw new AppsError('UNAUTHENTICATED', 'Entre novamente.', 401)
  if (!process.env.SUPABASE_DB_URL) throw new AppsError('UNAVAILABLE', 'O banco não está configurado.', 503)
  if (write && session.role === 'viewer') throw new AppsError('READ_ONLY', 'Seu acesso permite apenas consultas.', 403)
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    await db.query("SELECT set_config('app.apps_empresa_id',$1,true),set_config('app.apps_usuario_id',$2,true),set_config('role','apps_runtime',true),set_config('statement_timeout','15000',true),set_config('lock_timeout','5000',true)", [String(session.tenantId), String(session.sharedUserId)])
    const result = await run(db)
    await db.query('COMMIT'); return result
  } catch (e) { await db.query('ROLLBACK').catch(() => undefined); throw e }
  finally { db.release() }
}

/** Transaction owned by the MCP coordinator (plugin drafts and audit), outside the Apps role. */
export async function withAppsControlTransaction<T>(run: (db: Database) => Promise<T>): Promise<T> {
  if (!process.env.SUPABASE_DB_URL) throw new AppsError('UNAVAILABLE', 'O banco não está configurado.', 503)
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    await db.query("SELECT set_config('statement_timeout','20000',true),set_config('lock_timeout','5000',true)")
    const result = await run(db)
    await db.query('COMMIT'); return result
  } catch (e) { await db.query('ROLLBACK').catch(() => undefined); throw e }
  finally { db.release() }
}
/** Runs Apps operations with the restricted role and the person's company, inside the coordinator's transaction. */
export async function withAppsClient<T>(db: Database, session: Session, run: (db: Database) => Promise<T>): Promise<T> {
  const previous = (await db.query('SELECT current_user AS role')).rows[0].role as string
  await db.query("SELECT set_config('app.apps_empresa_id',$1,true),set_config('app.apps_usuario_id',$2,true),set_config('role','apps_runtime',true)", [String(session.tenantId), String(session.sharedUserId)])
  try { const result = await run(db); await db.query("SELECT set_config('role',$1,true)", [previous]); return result }
  catch (error) { await db.query("SELECT set_config('role',$1,true)", [previous]).catch(() => undefined); throw error }
}
