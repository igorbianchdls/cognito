import { withTransaction, type SQLClient } from '@/lib/postgres'
import type {
  IntegrationDestination,
  IntegrationDestinationStatus,
} from '@/products/integracoes/destinations/shared/destinationContracts'
import { buildTenantBigQueryDestinationConfig } from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryNaming'

type JsonObject = Record<string, unknown>

type DbDestinationRow = {
  id: string | number
  tenant_id: number
  type: string
  name: string
  status: string
  config: unknown
  secret_ref: string | null
  metadata: unknown
  created_at: string | Date
  updated_at: string | Date
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function asJsonObject(value: unknown): JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as JsonObject
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as JsonObject : {}
    } catch {
      return {}
    }
  }
  return {}
}

function getDefaultBigQueryProjectId() {
  return process.env.GCP_PROJECT_ID || 'creatto-463117'
}

function toDestination(row: DbDestinationRow): IntegrationDestination {
  const status: IntegrationDestinationStatus = row.status === 'disabled' || row.status === 'error'
    ? row.status
    : 'active'

  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    type: 'bigquery',
    name: row.name,
    status,
    config: asJsonObject(row.config),
    secretRef: row.secret_ref,
    metadata: asJsonObject(row.metadata),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function provisioningMetadata(status: 'pending' | 'succeeded' | 'failed', extra: JsonObject = {}) {
  return {
    bigQueryProvisioning: {
      status,
      updatedAt: new Date().toISOString(),
      ...extra,
    },
  }
}

export async function ensureDefaultTenantBigQueryDestination(
  input: {
    tenantId: number
    reason?: string
    client?: Pick<SQLClient, 'query'>
  },
): Promise<IntegrationDestination> {
  const run = async (client: Pick<SQLClient, 'query'>) => {
    const tenantId = Number(input.tenantId)
    const desiredConfig = buildTenantBigQueryDestinationConfig(tenantId, {}, getDefaultBigQueryProjectId())
    const existing = await client.query(
      `SELECT *
       FROM integrations.destinations
       WHERE tenant_id = $1
         AND type = 'bigquery'
         AND (metadata->>'isDefault') = 'true'
       ORDER BY id ASC
       LIMIT 1`,
      [tenantId],
    )
    const existingRow = existing.rows[0] as DbDestinationRow | undefined

    if (existingRow) {
      const updated = await client.query(
        `UPDATE integrations.destinations
         SET
           name = COALESCE(NULLIF(name, ''), 'BigQuery padrao'),
           status = CASE WHEN status = 'disabled' THEN status ELSE 'active' END,
           config = $3::jsonb,
           metadata = COALESCE(metadata, '{}'::jsonb) || $4::jsonb,
           updated_at = now()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [
          existingRow.id,
          tenantId,
          JSON.stringify(desiredConfig),
          JSON.stringify({
            isDefault: true,
            datasetMode: 'per_tenant',
            datasetModeMigratedAt: new Date().toISOString(),
            ...provisioningMetadata('pending', { reason: input.reason || 'ensure_default_destination' }),
          }),
        ],
      )
      return toDestination(updated.rows[0] as DbDestinationRow)
    }

    const result = await client.query(
      `INSERT INTO integrations.destinations
        (tenant_id, type, name, status, config, metadata, updated_at)
       VALUES
        ($1, 'bigquery', 'BigQuery padrao', 'active', $2::jsonb, $3::jsonb, now())
       RETURNING *`,
      [
        tenantId,
        JSON.stringify(desiredConfig),
        JSON.stringify({
          isDefault: true,
          createdBy: 'tenant_bigquery_provisioning',
          datasetMode: 'per_tenant',
          ...provisioningMetadata('pending', { reason: input.reason || 'ensure_default_destination' }),
        }),
      ],
    )
    return toDestination(result.rows[0] as DbDestinationRow)
  }

  if (input.client) return run(input.client)
  return withTransaction(run)
}

export async function markTenantBigQueryProvisioningSucceeded(input: {
  tenantId: number
  destinationId: string
  projectId: string
  rawDataset: string
  normalizedDataset: string
  analyticsDataset: string
  reason?: string
}) {
  await withTransaction(async (client) => {
    const metadata = provisioningMetadata('succeeded', {
      projectId: input.projectId,
      rawDataset: input.rawDataset,
      normalizedDataset: input.normalizedDataset,
      analyticsDataset: input.analyticsDataset,
      reason: input.reason || 'provision',
    })
    await client.query(
      `UPDATE integrations.destinations
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
           updated_at = now()
       WHERE id = $1 AND tenant_id = $2`,
      [input.destinationId, input.tenantId, JSON.stringify(metadata)],
    )
    await client.query(
      `UPDATE shared.tenants
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = now()
       WHERE id = $1`,
      [input.tenantId, JSON.stringify(metadata)],
    )
  })
}

export async function markTenantBigQueryProvisioningFailed(input: {
  tenantId: number
  destinationId?: string | null
  projectId?: string
  error: unknown
  reason?: string
}) {
  const message = input.error instanceof Error ? input.error.message : String(input.error || 'Erro desconhecido')
  await withTransaction(async (client) => {
    const metadata = provisioningMetadata('failed', {
      projectId: input.projectId || null,
      reason: input.reason || 'provision',
      error: message.slice(0, 1000),
    })
    if (input.destinationId) {
      await client.query(
        `UPDATE integrations.destinations
         SET metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
             updated_at = now()
         WHERE id = $1 AND tenant_id = $2`,
        [input.destinationId, input.tenantId, JSON.stringify(metadata)],
      )
    }
    await client.query(
      `UPDATE shared.tenants
       SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
           updated_at = now()
       WHERE id = $1`,
      [input.tenantId, JSON.stringify(metadata)],
    )
  })
}
