import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { authorizedJsonRequest } from '@/products/integracoes/cloud/src/lib/googleAuth'

export type BigQueryWriteInput = {
  dataset?: string
  table: string
  tenantId: number
  connectionId: string
  provider: string
  resource: string
  runId?: string | null
  rows: Record<string, unknown>[]
}

export type BigQueryWriteOutput = {
  ok: boolean
  mode: 'bigquery'
  dataset: string
  table: string
  insertedRows: number
}

type BigQueryInsertResponse = {
  insertErrors?: Array<{ index?: number; errors?: Array<{ message?: string }> }>
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

function getTableApiPath(projectId: string, dataset: string, table: string) {
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
        },
      }),
    },
  )
}

async function ensureRawTable(projectId: string, dataset: string, table: string) {
  const tableUrl = getTableApiPath(projectId, dataset, table)
  const existing = await authorizedJsonRequest<unknown>(tableUrl, { method: 'GET', allowNotFound: true })
  if (existing.ok) return

  await authorizedJsonRequest<unknown>(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dataset}/tables`,
    {
      method: 'POST',
      body: JSON.stringify({
        tableReference: {
          projectId,
          datasetId: dataset,
          tableId: table,
        },
        schema: {
          fields: [
            { name: 'tenant_id', type: 'INTEGER', mode: 'REQUIRED' },
            { name: 'connection_id', type: 'STRING', mode: 'REQUIRED' },
            { name: 'provider', type: 'STRING', mode: 'REQUIRED' },
            { name: 'resource', type: 'STRING', mode: 'REQUIRED' },
            { name: 'run_id', type: 'STRING', mode: 'NULLABLE' },
            { name: 'external_id', type: 'STRING', mode: 'NULLABLE' },
            { name: 'synced_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
            { name: 'raw_payload', type: 'JSON', mode: 'REQUIRED' },
          ],
        },
        timePartitioning: {
          type: 'DAY',
          field: 'synced_at',
        },
        clustering: {
          fields: ['tenant_id', 'provider', 'resource'],
        },
      }),
    },
  )
}

function getExternalId(row: Record<string, unknown>) {
  const value = row.external_id ?? row.externalId ?? row.id ?? row.codigo ?? row.numero
  if (value == null) return null
  return typeof value === 'string' || typeof value === 'number' ? String(value) : null
}

function chunkRows(rows: Record<string, unknown>[]) {
  const maxRows = Number(process.env.BIGQUERY_INSERT_MAX_ROWS || DEFAULT_MAX_ROWS_PER_BATCH)
  const maxBytes = Number(process.env.BIGQUERY_INSERT_MAX_BYTES || DEFAULT_MAX_BATCH_BYTES)
  const chunks: Record<string, unknown>[][] = []
  let current: Record<string, unknown>[] = []
  let currentBytes = 0

  for (const row of rows) {
    const rowBytes = Buffer.byteLength(JSON.stringify(row), 'utf8')
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

export async function writeRowsToBigQuery(input: BigQueryWriteInput): Promise<BigQueryWriteOutput> {
  const config = getIntegrationsCloudConfig()
  const dataset = normalizeBigQueryIdentifier(input.dataset || config.bigQuery.customRawDataset, 'dataset')
  const table = normalizeBigQueryIdentifier(input.table, 'table')

  if (!input.rows.length) {
    return { ok: true, mode: 'bigquery', dataset, table, insertedRows: 0 }
  }

  await ensureDataset(config.projectId, dataset)
  await ensureRawTable(config.projectId, dataset, table)

  const syncedAt = new Date().toISOString()
  let insertedRows = 0

  for (const [batchIndex, batch] of chunkRows(input.rows).entries()) {
    const response = await authorizedJsonRequest<BigQueryInsertResponse>(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${config.projectId}/datasets/${dataset}/tables/${table}/insertAll`,
      {
        method: 'POST',
        body: JSON.stringify({
          skipInvalidRows: false,
          ignoreUnknownValues: false,
          rows: batch.map((row, index) => {
            const externalId = getExternalId(row)
            return {
              insertId: `${input.connectionId}:${input.resource}:${input.runId || 'run'}:${externalId || `${batchIndex}-${index}`}`,
              json: {
                tenant_id: input.tenantId,
                connection_id: input.connectionId,
                provider: input.provider,
                resource: input.resource,
                run_id: input.runId || null,
                external_id: externalId,
                synced_at: syncedAt,
                raw_payload: JSON.stringify(row),
              },
            }
          }),
        }),
      },
    )

    if (response.payload?.insertErrors?.length) {
      const firstError = response.payload.insertErrors[0]?.errors?.[0]?.message
      throw new Error(firstError || `Falha ao inserir lote ${batchIndex + 1} no BigQuery`)
    }
    insertedRows += batch.length
  }

  return {
    ok: true,
    mode: 'bigquery',
    dataset,
    table,
    insertedRows,
  }
}
