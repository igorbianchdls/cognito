import { runQuery } from '@/lib/postgres'
import type { ErpOperationListInput, ErpOperationPage } from './erpManagementRepository'

export async function readOperationPage(tenantId: number, selectSql: string, orderBy: string, input: ErpOperationListInput): Promise<ErpOperationPage> {
  const page = Math.max(1, Math.floor(Number(input.page) || 1))
  const pageSize = input.exportLimit ? Math.min(10_000, Math.max(1, Math.floor(input.exportLimit))) : Math.min(100, Math.max(10, Math.floor(Number(input.pageSize) || 50)))
  const offset = input.exportLimit ? 0 : (page - 1) * pageSize
  // The aggregate returns one row, even beyond the last page. Both values share a snapshot.
  const rows = await runQuery<{ total: number; records: Record<string, unknown>[] }>(
    `WITH operation_records AS (${selectSql}), filtered AS (
       SELECT * FROM operation_records WHERE ($2='' OR to_jsonb(operation_records)::text ILIKE '%' || $2 || '%')
     ), page_records AS (SELECT * FROM filtered ORDER BY ${orderBy} LIMIT $3 OFFSET $4)
     SELECT (SELECT count(*)::int FROM filtered) AS total,
       COALESCE((SELECT jsonb_agg(to_jsonb(page_records)) FROM page_records),'[]'::jsonb) AS records`,
    [tenantId, input.query?.trim() || '', pageSize, offset],
  )
  return { records: rows[0].records, total: Number(rows[0].total), page, pageSize }
}
