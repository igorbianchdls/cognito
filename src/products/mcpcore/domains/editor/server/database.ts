// The Editor and Social tools read and write as the person, not as the server: each call runs in a transaction with
// the role `authenticated` and the same token claims the browser sends (Clerk user and organization), so the database
// policies (supabase/migrations/20261121130000_editor_social_roles.sql) decide exactly what the editor itself allows.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { PluginError, type PluginCompany, type PluginPrincipal } from '../../../shared/contracts'

export type Db = { query<Row = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<Row[]> }
export type Member = { db: Db; ws: string; role: 'owner' | 'admin' | 'member' | 'viewer'; userId: string }

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!pool) {
    if (!process.env.SUPABASE_DB_URL) throw new PluginError('CONFIGURATION_REQUIRED', 'Configure a conexão do banco.', 503)
    pool = new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 5, connectionTimeoutMillis: 5000 })
  }
  return pool
}
export async function closeEditorDatabase() { await pool?.end(); pool = undefined }

/** For tests: run against another connection (a local database with the same schemas). */
export type Connect = () => Promise<{ query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>; release(): void }> // eslint-disable-line @typescript-eslint/no-explicit-any
const connectPool: Connect = () => getPool().connect()

/**
 * Runs `fn` as the person in the company's organization. Writes need the owner, admin or member role;
 * viewers only read (the policies refuse their writes too, this only gives a clearer message).
 */
export async function asMember<T>(principal: PluginPrincipal, company: PluginCompany, write: boolean, fn: (m: Member) => Promise<T>, connect: Connect = connectPool): Promise<T> {
  const client = await connect()
  const db: Db = { query: async (sql, params) => (await client.query(sql, params)).rows }
  try {
    await client.query('BEGIN')
    const [org] = await db.query<{ clerk_organization_id: string | null }>('SELECT clerk_organization_id FROM shared.empresas WHERE id = $1', [company.id])
    if (!org?.clerk_organization_id) throw new PluginError('NOT_AVAILABLE', 'Esta empresa ainda não usa o Editor e o Marketing.', 404)
    const claims = JSON.stringify({ sub: principal.clerkUserId, role: 'authenticated', o: { id: org.clerk_organization_id } })
    await db.query("SELECT set_config('request.jwt.claims', $1, true), set_config('statement_timeout', '15000', true)", [claims])
    await db.query("SELECT set_config('role', 'authenticated', true)")
    const [access] = await db.query<{ role: Member['role'] | null }>('SELECT editor.member_role($1) AS role', [org.clerk_organization_id])
    if (!access?.role) throw new PluginError('ACCESS_DENIED', 'Você não tem acesso ao Editor e ao Marketing desta empresa.', 403)
    if (write && access.role === 'viewer') throw new PluginError('ACCESS_DENIED', 'Seu perfil nesta empresa só permite visualizar.', 403)
    const result = await fn({ db, ws: org.clerk_organization_id, role: access.role, userId: principal.clerkUserId })
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
