import { createBigQueryClient, getBigQueryProjectId } from '@/lib/bigqueryClient'
import { readDashboardArtifact, ArtifactToolError } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import { NORMALIZED_TABLE_NAMES } from '@/products/integracoes/datawarehouse/normalization/bigquery/normalizedTableSchemas'

type JsonRecord = Record<string, unknown>

const TABLE_SET = new Set([
  ...NORMALIZED_TABLE_NAMES,
  ...NORMALIZED_TABLE_NAMES.map((table) => `${table}_history`),
])

function normalizeQuery(sql: string) {
  const cleaned = String(sql || '').trim().replace(/;+\s*$/g, '')
  if (!cleaned) throw new ArtifactToolError(400, 'dashboard_query_empty', 'query obrigatória')
  if (cleaned.includes(';')) throw new ArtifactToolError(400, 'dashboard_query_multiple_statements', 'Apenas uma query é permitida')
  if (!/^(select|with)\b/i.test(cleaned)) {
    throw new ArtifactToolError(400, 'dashboard_query_read_only', 'Somente SELECT ou WITH é permitido')
  }
  if (/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|call|execute|merge|copy|export)\b/i.test(cleaned)) {
    throw new ArtifactToolError(400, 'dashboard_query_read_only', 'A query contém comando não permitido')
  }
  if (/[`]/.test(cleaned)) {
    throw new ArtifactToolError(400, 'dashboard_query_qualified_table', 'Projeto e dataset não podem ser informados na DSL')
  }

  const ctes = new Set(
    [...cleaned.matchAll(/(?:with|,)\s*([a-z_][a-z0-9_]*)\s+as\s*\(/gi)]
      .map((match) => match[1].toLowerCase()),
  )
  for (const match of cleaned.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_.-]*)/gi)) {
    const table = match[1].toLowerCase()
    if (table.includes('.') || (!TABLE_SET.has(table) && !ctes.has(table))) {
      throw new ArtifactToolError(400, 'dashboard_query_table_not_allowed', `Tabela não permitida: ${table}`)
    }
  }
  return cleaned
}

function normalizeParams(filters: JsonRecord | undefined) {
  const params: JsonRecord = {}
  for (const [key, value] of Object.entries(filters || {})) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(key)) continue
    if (
      value == null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value)
    ) {
      params[key] = value
    }
  }
  return params
}

function normalizeJsonValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'bigint') return value.toString()
  if (Array.isArray(value)) return value.map(normalizeJsonValue)
  if (value && typeof value === 'object') {
    const record = value as JsonRecord
    if (Object.keys(record).length === 1 && 'value' in record) {
      return normalizeJsonValue(record.value)
    }
    return Object.fromEntries(
      Object.entries(record).map(([key, nested]) => [key, normalizeJsonValue(nested)]),
    )
  }
  return value
}

function normalizeRows(rows: unknown[]) {
  return rows.map(normalizeJsonValue)
}

export async function executeDashboardQuery(input: {
  artifactId: string
  tenantId: number
  query: string
  filters?: JsonRecord
  limit?: number
}) {
  const artifact = await readDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
  })
  if (!artifact.tenant_id) {
    throw new ArtifactToolError(409, 'artifact_tenant_required', 'Dashboard legado precisa ser vinculado a um tenant antes de consultar dados')
  }
  if (artifact.tenant_id !== input.tenantId) {
    throw new ArtifactToolError(403, 'artifact_tenant_forbidden', 'Dashboard não pertence ao tenant autenticado')
  }

  const safeQuery = normalizeQuery(input.query)
  const limit = Math.min(Math.max(Number(input.limit || 1000), 1), 5000)
  const projectId = getBigQueryProjectId('creatto-463117') || 'creatto-463117'
  const datasetId = getTenantBigQueryDatasets(input.tenantId).analyticsDataset
  const client = createBigQueryClient({ projectId })
  const params = normalizeParams(input.filters)
  const maximumBytesBilled = String(process.env.DASHBOARD_QUERY_MAX_BYTES || 100_000_000)
  const jobTimeoutMs = Number(process.env.DASHBOARD_QUERY_TIMEOUT_MS || 30_000)
  const query = `SELECT * FROM (${safeQuery}) AS dashboard_query LIMIT ${limit}`
  const startedAt = Date.now()

  const [dryRunJob] = await client.createQueryJob({
    query,
    params,
    useLegacySql: false,
    dryRun: true,
    defaultDataset: { projectId, datasetId },
    maximumBytesBilled,
    jobTimeoutMs,
  })
  const dryMetadata = dryRunJob.metadata as {
    statistics?: { query?: { totalBytesProcessed?: string } }
  }
  const bytesProcessed = Number(dryMetadata.statistics?.query?.totalBytesProcessed || 0)
  if (bytesProcessed > Number(maximumBytesBilled)) {
    throw new ArtifactToolError(413, 'dashboard_query_too_expensive', 'Consulta excede o limite de bytes processados', {
      bytes_processed: bytesProcessed,
      maximum_bytes_billed: Number(maximumBytesBilled),
    })
  }

  const [rows] = await client.query({
    query,
    params,
    useLegacySql: false,
    defaultDataset: { projectId, datasetId },
    maximumBytesBilled,
    jobTimeoutMs,
  })
  const normalizedRows = normalizeRows(rows)
  const firstRow = normalizedRows[0]
  const columns = firstRow && typeof firstRow === 'object' && !Array.isArray(firstRow)
    ? Object.keys(firstRow as JsonRecord)
    : []

  return {
    rows: normalizedRows,
    columns,
    count: normalizedRows.length,
    metadata: {
      bytesProcessed,
      durationMs: Date.now() - startedAt,
    },
  }
}
