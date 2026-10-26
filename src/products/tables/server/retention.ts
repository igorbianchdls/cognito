import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'

// Retention, run by the daily maintenance after the cron bearer check, with the privileged pool:
//  - records in the trash for more than 30 days are deleted for good, with their relations and comments;
//    their files are marked for the storage cleanup first, and the record goes once the files are gone;
//  - history older than one year is removed, and finished webhook deliveries after 90 days.
export const TRASH_DAYS = 30, HISTORY_DAYS = 365, DELIVERY_DAYS = 90
let pool: InstanceType<typeof Pool> | undefined
type Client = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>; release?: () => void }

export async function maintainTablesRetention(connect?: () => Promise<Client>) {
  if (!connect) {
    if (!process.env.SUPABASE_DB_URL) throw new Error('Tables database unavailable')
    pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
    connect = () => pool!.connect()
  }
  const client = await connect()
  let removed = 0, files = 0, history = 0, deliveries = 0, usage = 0
  try {
    // Deletions are audited in the name of whoever moved the records to the trash.
    const groups = (await client.query(`SELECT empresa_id,atualizado_por,array_agg(id) ids FROM (SELECT empresa_id,atualizado_por,id FROM tables.registros WHERE excluido_em < now()-make_interval(days=>$1) ORDER BY excluido_em LIMIT 500) r GROUP BY 1,2`, [TRASH_DAYS])).rows
    for (const g of groups) {
      await client.query('BEGIN')
      try {
        await client.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('lock_timeout','2000',true),set_config('statement_timeout','30000',true)", [String(g.empresa_id), String(g.atualizado_por)])
        const ids = (await client.query('SELECT id FROM tables.registros WHERE empresa_id=$1 AND id=ANY($2::uuid[]) AND excluido_em IS NOT NULL FOR UPDATE SKIP LOCKED', [g.empresa_id, g.ids])).rows.map(r => r.id)
        files += (await client.query("UPDATE tables.anexos SET estado='excluido' WHERE empresa_id=$1 AND registro_id=ANY($2::uuid[]) AND estado<>'excluido' RETURNING id", [g.empresa_id, ids])).rows.length
        const ready = (await client.query('SELECT id FROM tables.registros r WHERE empresa_id=$1 AND id=ANY($2::uuid[]) AND NOT EXISTS(SELECT 1 FROM tables.anexos a WHERE a.empresa_id=r.empresa_id AND a.registro_id=r.id)', [g.empresa_id, ids])).rows.map(r => r.id)
        if (ready.length) {
          for (const table of ['registro_opcoes', 'registro_usuarios', 'comentarios']) await client.query(`DELETE FROM tables.${table} WHERE empresa_id=$1 AND registro_id=ANY($2::uuid[])`, [g.empresa_id, ready])
          await client.query('DELETE FROM tables.registro_vinculos WHERE empresa_id=$1 AND (registro_id=ANY($2::uuid[]) OR registro_destino_id=ANY($2::uuid[]))', [g.empresa_id, ready])
          removed += (await client.query('DELETE FROM tables.registros WHERE empresa_id=$1 AND id=ANY($2::uuid[]) RETURNING id', [g.empresa_id, ready])).rows.length
        }
        await client.query('COMMIT')
      } catch (error) { await client.query('ROLLBACK').catch(() => undefined); throw error }
    }
    history = (await client.query(`DELETE FROM tables.historico WHERE id IN (SELECT id FROM tables.historico WHERE criado_em < now()-make_interval(days=>$1) LIMIT 5000) RETURNING id`, [HISTORY_DAYS])).rows.length
    // Finished webhook deliveries are kept 90 days; per-minute key usage only matters for the current minute.
    deliveries = (await client.query(`DELETE FROM tables.entregas WHERE id IN (SELECT id FROM tables.entregas WHERE estado<>'pendente' AND coalesce(concluido_em,criado_em) < now()-make_interval(days=>$1) LIMIT 5000) RETURNING id`, [DELIVERY_DAYS])).rows.length
    usage = (await client.query(`DELETE FROM tables.uso_api WHERE minuto < now()-interval '1 day' RETURNING chave_id`)).rows.length
  } finally { client.release?.() }
  return { status: 'completed', registros_excluidos: removed, anexos_marcados: files, historico_removido: history, entregas_removidas: deliveries, uso_api_removido: usage }
}
