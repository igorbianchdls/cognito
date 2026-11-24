// The person's companies with their category, and changing the category of the active company.
import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { isCategoria, type Categoria } from '../shared/categorias'

export type EmpresaDaPessoa = { id: number; nome: string; organizacao: string | null; categoria: Categoria }

let pool: InstanceType<typeof Pool> | undefined
function getPool() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL ausente')
  pool ??= new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL), max: 3, connectionTimeoutMillis: 5000 })
  return pool
}

/** The active companies the person (Clerk user) belongs to, with their category. */
export async function empresasDaPessoa(clerkUserId: string): Promise<EmpresaDaPessoa[]> {
  const { rows } = await getPool().query(
    `SELECT e.id, e.name, e.clerk_organization_id, e.categoria
     FROM shared.usuarios u
     JOIN shared.usuarios_empresas ue ON ue.usuario_id = u.id AND ue.status = 'active' AND NOT coalesce(ue.suspenso_localmente, false)
     JOIN shared.empresas e ON e.id = ue.empresa_id AND e.status = 'active'
     WHERE u.clerk_user_id = $1 AND u.status = 'active'
     ORDER BY e.name`,
    [clerkUserId],
  )
  return (rows as Record<string, unknown>[]).map(r => ({ id: Number(r.id), nome: String(r.name), organizacao: r.clerk_organization_id ? String(r.clerk_organization_id) : null, categoria: isCategoria(r.categoria) ? r.categoria : 'completo' }))
}

/** Changes the category of a company (the caller checks that the person is owner or admin of it). */
export async function definirCategoria(empresaId: number, categoria: Categoria): Promise<void> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query("SELECT set_config('app.shared_source', 'plataforma_categoria', true)")
    const { rowCount } = await client.query("UPDATE shared.empresas SET categoria = $2, updated_at = now() WHERE id = $1 AND status = 'active'", [empresaId, categoria])
    if (!rowCount) throw new Error('Empresa não encontrada.')
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    client.release()
  }
}
