import { authorizedJsonRequest } from '@/products/integracoes/cloud/src/lib/googleAuth'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import type { NormalizedRow, NormalizedTableName } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { getNormalizedTableSchema } from '@/products/integracoes/datawarehouse/normalization/bigquery/normalizedTableSchemas'
import { ensureTenantAnalyticsViews } from '@/products/integracoes/datawarehouse/analytics/semanticViews'

type BigQueryInsertResponse = {
  insertErrors?: Array<{ index?: number; errors?: Array<{ message?: string }> }>
}

type WriteNormalizedRowsInput = {
  tenantId: number
  rows: NormalizedRow[]
  ensureTables?: NormalizedTableName[]
}

export type WriteNormalizedRowsOutput = {
  ok: boolean
  mode: 'bigquery_normalized'
  dataset: string
  insertedRows: number
  tables: Array<{
    table: NormalizedTableName
    insertedRows: number
  }>
}

const DEFAULT_MAX_ROWS_PER_BATCH = 500
const DEFAULT_MAX_BATCH_BYTES = 4 * 1024 * 1024

function normalizeBigQueryIdentifier(value: string, label: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  if (!/^[a-z_][a-z0-9_]{0,1023}$/.test(normalized)) {
    throw new Error(`${label} BigQuery invalido: ${value}`)
  }
  return normalized
}

function tableApiPath(projectId: string, dataset: string, table: string) {
  return `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dataset}/tables/${table}`
}

async function ensureDataset(projectId: string, dataset: string) {
  const existing = await authorizedJsonRequest<unknown>(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dataset}`,
    { method: 'GET', allowNotFound: true },
  )
  if (existing.ok) return

  await authorizedJsonRequest<unknown>(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`,
    {
      method: 'POST',
      body: JSON.stringify({
        datasetReference: {
          projectId,
          datasetId: dataset,
        },
        location: process.env.BIGQUERY_LOCATION || process.env.GCP_BIGQUERY_LOCATION || 'US',
        labels: {
          managed_by: 'integracoes',
          dataset_mode: 'per_tenant',
          layer: 'normalized',
        },
      }),
    },
  )
}

async function ensureNormalizedTable(projectId: string, dataset: string, table: NormalizedTableName) {
  const normalizedTable = normalizeBigQueryIdentifier(table, 'table')
  const existing = await authorizedJsonRequest<unknown>(
    tableApiPath(projectId, dataset, normalizedTable),
    { method: 'GET', allowNotFound: true },
  )
  if (existing.ok) {
    await authorizedJsonRequest<unknown>(
      tableApiPath(projectId, dataset, normalizedTable),
      {
        method: 'PATCH',
        body: JSON.stringify({
          schema: {
            fields: getNormalizedTableSchema(table),
          },
        }),
      },
    )
    return
  }

  await authorizedJsonRequest<unknown>(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dataset}/tables`,
    {
      method: 'POST',
      body: JSON.stringify({
        tableReference: {
          projectId,
          datasetId: dataset,
          tableId: normalizedTable,
        },
        schema: {
          fields: getNormalizedTableSchema(table),
        },
        timePartitioning: {
          type: 'DAY',
          field: 'normalized_at',
        },
        clustering: {
          fields: ['tenant_id', 'provider', 'resource'],
        },
      }),
    },
  )
}

function chunkRows(rows: NormalizedRow[]) {
  const maxRows = Number(process.env.BIGQUERY_INSERT_MAX_ROWS || DEFAULT_MAX_ROWS_PER_BATCH)
  const maxBytes = Number(process.env.BIGQUERY_INSERT_MAX_BYTES || DEFAULT_MAX_BATCH_BYTES)
  const chunks: NormalizedRow[][] = []
  let current: NormalizedRow[] = []
  let currentBytes = 0

  for (const row of rows) {
    const rowBytes = Buffer.byteLength(JSON.stringify(row.data), 'utf8')
    if (current.length && (current.length >= maxRows || currentBytes + rowBytes > maxBytes)) {
      chunks.push(current)
      current = []
      currentBytes = 0
    }
    current.push(row)
    currentBytes += rowBytes
  }

  if (current.length) chunks.push(current)
  return chunks
}

function groupByTable(rows: NormalizedRow[]) {
  const grouped = new Map<NormalizedTableName, NormalizedRow[]>()
  for (const row of rows) {
    grouped.set(row.table, [...(grouped.get(row.table) || []), row])
  }
  return grouped
}

function serializeJsonFields(row: Record<string, unknown>) {
  const payload = row.source_payload && typeof row.source_payload === 'object' && !Array.isArray(row.source_payload)
    ? row.source_payload as Record<string, unknown>
    : {}
  const deletedRaw = row.is_deleted ?? payload.is_deleted ?? payload.deleted ?? payload.excluido ?? payload.removido
  const isDeleted = deletedRaw === true || deletedRaw === 1 || ['true', '1', 'deleted', 'excluido', 'removido'].includes(String(deletedRaw || '').toLowerCase())
  const sourceUpdatedAt = row.source_updated_at
    ?? payload.updated_at
    ?? payload.updatedAt
    ?? payload.alterado_em
    ?? payload.data_alteracao
    ?? null
  return {
    ...row,
    source_updated_at: sourceUpdatedAt,
    is_deleted: isDeleted,
    source_payload: JSON.stringify(row.source_payload ?? null),
  }
}

export async function writeNormalizedRowsToBigQuery(input: WriteNormalizedRowsInput): Promise<WriteNormalizedRowsOutput> {
  const config = getIntegrationsCloudConfig()
  const dataset = normalizeBigQueryIdentifier(getTenantBigQueryDatasets(input.tenantId).normalizedDataset, 'dataset')
  const ensureTables = Array.from(new Set(input.ensureTables || []))
  if (!input.rows.length && !ensureTables.length) {
    return { ok: true, mode: 'bigquery_normalized', dataset, insertedRows: 0, tables: [] }
  }

  await ensureDataset(config.projectId, dataset)

  let insertedRows = 0
  const tables: WriteNormalizedRowsOutput['tables'] = []
  const grouped = groupByTable(input.rows)

  for (const table of ensureTables) {
    await ensureNormalizedTable(config.projectId, dataset, table)
    if (!grouped.has(table)) tables.push({ table, insertedRows: 0 })
  }

  for (const [table, rows] of grouped.entries()) {
    await ensureNormalizedTable(config.projectId, dataset, table)
    let tableInsertedRows = 0
    const tableId = normalizeBigQueryIdentifier(table, 'table')

    for (const batch of chunkRows(rows)) {
      const response = await authorizedJsonRequest<BigQueryInsertResponse>(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${config.projectId}/datasets/${dataset}/tables/${tableId}/insertAll`,
        {
          method: 'POST',
          body: JSON.stringify({
            skipInvalidRows: false,
            ignoreUnknownValues: false,
            rows: batch.map((row) => ({
              insertId: row.insertId,
              json: serializeJsonFields(row.data),
            })),
          }),
        },
      )

      if (response.payload?.insertErrors?.length) {
        const firstError = response.payload.insertErrors[0]?.errors?.[0]?.message
        throw new Error(firstError || `Falha ao inserir normalized em ${dataset}.${tableId}`)
      }
      tableInsertedRows += batch.length
    }

    insertedRows += tableInsertedRows
    tables.push({ table, insertedRows: tableInsertedRows })
  }

  await ensureTenantAnalyticsViews({
    tenantId: input.tenantId,
    tables: Array.from(new Set([...ensureTables, ...grouped.keys()])),
  })

  return {
    ok: true,
    mode: 'bigquery_normalized',
    dataset,
    insertedRows,
    tables,
  }
}
