import { createHash } from 'node:crypto'

import { createBigQueryClient, getBigQueryProjectId } from '@/lib/bigqueryClient'
import { runQuery, withTransaction } from '@/lib/postgres'
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
  if (/\b(information_schema|external_query|external_object_transform|ml\.predict|table_date_range|table_query)\b/i.test(cleaned)) {
    throw new ArtifactToolError(400, 'dashboard_query_external_source', 'A query contém fonte ou função externa não permitida')
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

function queryHash(query: string) {
  return createHash('sha256').update(query).digest('hex')
}

async function writeQueryAudit(input: {
  tenantId: number
  artifactId: string
  actorId?: number | null
  hash: string
  bytesProcessed?: number
  durationMs?: number
  status: 'started' | 'success' | 'rejected' | 'error'
  errorCode?: string | null
  errorMessage?: string | null
}) {
  const rows = await runQuery<{ id: string }>(
    `INSERT INTO artifacts.dashboard_query_audit
      (tenant_id, artifact_id, actor_id, query_hash, bytes_processed, duration_ms, status, error_code, error_message)
     VALUES
      ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id::text`,
    [
      input.tenantId,
      input.artifactId,
      input.actorId || null,
      input.hash,
      Math.max(0, Math.floor(input.bytesProcessed || 0)),
      input.durationMs == null ? null : Math.max(0, Math.floor(input.durationMs)),
      input.status,
      input.errorCode || null,
      input.errorMessage?.slice(0, 1000) || null,
    ],
  )
  return rows[0]?.id || null
}

async function updateQueryAudit(input: {
  auditId: string
  status: 'success' | 'error'
  durationMs: number
  errorCode?: string | null
  errorMessage?: string | null
}) {
  await runQuery(
    `UPDATE artifacts.dashboard_query_audit
     SET status = $2,
         duration_ms = $3,
         error_code = $4,
         error_message = $5
     WHERE id = $1`,
    [
      input.auditId,
      input.status,
      Math.max(0, Math.floor(input.durationMs)),
      input.errorCode || null,
      input.errorMessage?.slice(0, 1000) || null,
    ],
  )
}

async function reserveQueryBudget(input: {
  tenantId: number
  artifactId: string
  actorId?: number | null
  hash: string
  bytesProcessed: number
}) {
  const queryLimit = Math.max(1, Number(process.env.DASHBOARD_QUERY_LIMIT_PER_MINUTE || 30))
  const byteLimit = Math.max(1, Number(process.env.DASHBOARD_QUERY_BYTES_PER_MINUTE || 1_000_000_000))
  return withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock($1)', [input.tenantId])
    const usage = await client.query(
      `SELECT
         count(*)::int AS query_count,
         COALESCE(sum(bytes_processed), 0)::bigint AS bytes_processed
       FROM artifacts.dashboard_query_audit
       WHERE tenant_id = $1
         AND created_at >= now() - interval '1 minute'
         AND status IN ('started', 'success')`,
      [input.tenantId],
    )
    const queryCount = Number(usage.rows[0]?.query_count || 0)
    const bytesUsed = Number(usage.rows[0]?.bytes_processed || 0)
    if (queryCount >= queryLimit || bytesUsed + input.bytesProcessed > byteLimit) {
      await client.query(
        `INSERT INTO artifacts.dashboard_query_audit
          (tenant_id, artifact_id, actor_id, query_hash, bytes_processed, status, error_code, error_message)
         VALUES ($1, $2::uuid, $3, $4, $5, 'rejected', 'dashboard_query_budget_exceeded', $6)`,
        [
          input.tenantId,
          input.artifactId,
          input.actorId || null,
          input.hash,
          input.bytesProcessed,
          'Orçamento de consultas do tenant excedido.',
        ],
      )
      throw new ArtifactToolError(429, 'dashboard_query_budget_exceeded', 'Limite de consultas do tenant excedido')
    }
    const inserted = await client.query(
      `INSERT INTO artifacts.dashboard_query_audit
        (tenant_id, artifact_id, actor_id, query_hash, bytes_processed, status)
       VALUES ($1, $2::uuid, $3, $4, $5, 'started')
       RETURNING id::text`,
      [input.tenantId, input.artifactId, input.actorId || null, input.hash, input.bytesProcessed],
    )
    return String(inserted.rows[0]?.id || '')
  })
}

function validateReferencedTables(input: {
  referencedTables: Array<{ projectId?: string; datasetId?: string; tableId?: string }>
  projectId: string
  analyticsDataset: string
  normalizedDataset: string
}) {
  for (const table of input.referencedTables) {
    const projectId = String(table.projectId || '')
    const datasetId = String(table.datasetId || '')
    const tableId = String(table.tableId || '').replace(/\$.+$/, '')
    const allowedDataset = datasetId === input.analyticsDataset || datasetId === input.normalizedDataset
    const allowedTable = TABLE_SET.has(tableId) || (NORMALIZED_TABLE_NAMES as readonly string[]).includes(tableId)
    if (
      projectId !== input.projectId
      || !allowedDataset
      || !allowedTable
      || /[*@]/.test(String(table.tableId || ''))
    ) {
      throw new ArtifactToolError(
        400,
        'dashboard_query_referenced_table_not_allowed',
        `Tabela resolvida não permitida: ${projectId}.${datasetId}.${table.tableId || ''}`,
      )
    }
  }
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
  actorId?: number | null
}) {
  const artifact = await readDashboardArtifact({
    artifactId: input.artifactId,
    tenantId: input.tenantId,
  })
  if (!artifact.tenant_id) {
    throw new ArtifactToolError(409, 'artifact_tenant_required', 'Dashboard precisa pertencer a um tenant antes de consultar dados')
  }
  if (artifact.tenant_id !== input.tenantId) {
    throw new ArtifactToolError(403, 'artifact_tenant_forbidden', 'Dashboard não pertence ao tenant autenticado')
  }

  const hash = queryHash(String(input.query || ''))
  let safeQuery: string
  try {
    safeQuery = normalizeQuery(input.query)
  } catch (error) {
    const artifactError = error instanceof ArtifactToolError ? error : null
    await writeQueryAudit({
      tenantId: input.tenantId,
      artifactId: input.artifactId,
      actorId: input.actorId,
      hash,
      status: 'rejected',
      errorCode: artifactError?.code || 'dashboard_query_invalid',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
  const limit = Math.min(Math.max(Number(input.limit || 1000), 1), 5000)
  const projectId = getBigQueryProjectId('creatto-463117') || 'creatto-463117'
  const datasets = getTenantBigQueryDatasets(input.tenantId)
  const datasetId = datasets.analyticsDataset
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
    statistics?: {
      query?: {
        totalBytesProcessed?: string
        referencedTables?: Array<{ projectId?: string; datasetId?: string; tableId?: string }>
      }
    }
  }
  const bytesProcessed = Number(dryMetadata.statistics?.query?.totalBytesProcessed || 0)
  validateReferencedTables({
    referencedTables: dryMetadata.statistics?.query?.referencedTables || [],
    projectId,
    analyticsDataset: datasets.analyticsDataset,
    normalizedDataset: datasets.normalizedDataset,
  })
  if (bytesProcessed > Number(maximumBytesBilled)) {
    throw new ArtifactToolError(413, 'dashboard_query_too_expensive', 'Consulta excede o limite de bytes processados', {
      bytes_processed: bytesProcessed,
      maximum_bytes_billed: Number(maximumBytesBilled),
    })
  }

  const auditId = await reserveQueryBudget({
    tenantId: input.tenantId,
    artifactId: input.artifactId,
    actorId: input.actorId,
    hash,
    bytesProcessed,
  })
  let rows: unknown[]
  try {
    ;[rows] = await client.query({
      query,
      params,
      useLegacySql: false,
      defaultDataset: { projectId, datasetId },
      maximumBytesBilled,
      jobTimeoutMs,
    })
    await updateQueryAudit({
      auditId,
      status: 'success',
      durationMs: Date.now() - startedAt,
    })
  } catch (error) {
    await updateQueryAudit({
      auditId,
      status: 'error',
      durationMs: Date.now() - startedAt,
      errorCode: 'dashboard_query_execution_failed',
      errorMessage: error instanceof Error ? error.message : String(error),
    }).catch(() => undefined)
    throw error
  }
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
