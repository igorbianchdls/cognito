import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { PluginError } from './contracts'

let pool: InstanceType<typeof Pool> | undefined
// Este pool atende identidade, limites e auditoria; consultas ERP usam o contexto restrito do ERP.
export async function pluginQuery<Row>(sql: string, params: unknown[]): Promise<Row[]> {
  if (!pool) {
    if (!process.env.SUPABASE_DB_URL) throw new PluginError('CONFIGURATION_REQUIRED','Configure a conexão do banco.',503)
    pool = new Pool({ ...buildPostgresPoolConfig(process.env.SUPABASE_DB_URL),
      connectionTimeoutMillis:5000, query_timeout:10000, statement_timeout:10000 })
  }
  return (await pool.query(sql,params)).rows as Row[]
}
export async function closePluginDatabase() { await pool?.end(); pool = undefined }
