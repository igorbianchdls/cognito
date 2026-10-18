import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { removeOldExports, removeStoredAttachment } from './storage'

let pool: InstanceType<typeof Pool> | undefined

/** Privileged worker, called only after the existing cron bearer validation. */
export async function maintainTablesStorage() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('Tables database unavailable')
  pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
  const candidates = await pool.query("SELECT id,empresa_id,registro_id,criado_por FROM tables.anexos WHERE estado IN ('pendente','excluido') AND criado_em < now()-interval '24 hours' ORDER BY criado_em,id LIMIT 25")
  let removed = 0, failed = 0
  const deadline = Date.now() + 45000
  for (const file of candidates.rows) {
    if (Date.now() >= deadline) break
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('lock_timeout','2000',true),set_config('statement_timeout','15000',true)", [String(file.empresa_id), String(file.criado_por)])
      // Same lock order as user edits: parent record, then attachment. Concurrent
      // confirmations cannot race the eligibility check and physical deletion.
      const parent = await client.query('SELECT id FROM tables.registros WHERE empresa_id=$1 AND id=$2 FOR UPDATE SKIP LOCKED', [file.empresa_id, file.registro_id])
      if (!parent.rows[0]) { await client.query('ROLLBACK'); continue }
      const eligible = await client.query("SELECT caminho FROM tables.anexos WHERE empresa_id=$1 AND id=$2 AND estado IN ('pendente','excluido') AND criado_em < now()-interval '24 hours' FOR UPDATE SKIP LOCKED", [file.empresa_id, file.id])
      if (!eligible.rows[0]) { await client.query('ROLLBACK'); continue }
      await removeStoredAttachment(eligible.rows[0].caminho)
      // Keep audit history; retry safely if storage deletion or commit fails.
      await client.query('DELETE FROM tables.anexos WHERE empresa_id=$1 AND id=$2', [file.empresa_id, file.id])
      await client.query('COMMIT')
      removed++
    } catch {
      await client.query('ROLLBACK').catch(() => undefined)
      failed++
    } finally { client.release() }
  }
  // Old exports are cleaned apart: a failure there is reported on its own and never counts as a file failure.
  const exports = await removeOldExports().catch(() => null)
  return { status: failed || exports === null ? 'partial' : 'completed', removed, failed, exportacoes_removidas: exports ?? 'indisponivel' }
}
