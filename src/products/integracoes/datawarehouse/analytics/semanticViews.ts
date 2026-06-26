import { createBigQueryClient, getBigQueryProjectId } from '@/lib/bigqueryClient'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import type { NormalizedTableName } from '@/products/integracoes/datawarehouse/normalization/contracts'

function identifier(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  if (!/^[a-z_][a-z0-9_]{0,1023}$/.test(normalized)) throw new Error(`Identificador BigQuery invalido: ${value}`)
  return normalized
}

function currentViewQuery(projectId: string, normalizedDataset: string, table: string) {
  const source = `\`${projectId}.${normalizedDataset}.${table}\``
  return `
SELECT * EXCEPT (__row_number)
FROM (
  SELECT
    source.*,
    ROW_NUMBER() OVER (
      PARTITION BY
        tenant_id,
        connection_id,
        provider,
        resource,
        COALESCE(external_id, TO_JSON_STRING(source_payload))
      ORDER BY normalized_at DESC, synced_at DESC
    ) AS __row_number
  FROM ${source} AS source
)
WHERE __row_number = 1
  AND COALESCE(is_deleted, false) = false
  `.trim()
}

export async function ensureTenantAnalyticsViews(input: {
  tenantId: number
  tables: NormalizedTableName[]
}) {
  const tables = Array.from(new Set(input.tables))
  if (!tables.length) return

  const projectId = getBigQueryProjectId('creatto-463117') || 'creatto-463117'
  const datasets = getTenantBigQueryDatasets(input.tenantId)
  const client = createBigQueryClient({ projectId })
  const analytics = client.dataset(datasets.analyticsDataset)

  for (const rawTable of tables) {
    const table = identifier(rawTable)
    const views = [
      {
        name: table,
        query: currentViewQuery(projectId, datasets.normalizedDataset, table),
      },
      {
        name: `${table}_history`,
        query: `SELECT * FROM \`${projectId}.${datasets.normalizedDataset}.${table}\``,
      },
    ]

    for (const view of views) {
      const viewTable = analytics.table(view.name)
      const [exists] = await viewTable.exists()
      const metadata = {
        view: {
          query: view.query,
          useLegacySql: false,
        },
      }
      if (exists) await viewTable.setMetadata(metadata)
      else await analytics.createTable(view.name, metadata)
    }
  }
}
