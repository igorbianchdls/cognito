import { runQuery } from '@/lib/postgres'
import type { BigQuery } from '@google-cloud/bigquery'
import {
  createBigQueryClient,
  getBigQueryProjectId,
} from '@/lib/bigqueryClient'
import { getIntegrationsCloudConfig } from '@/products/integracoes/datawarehouse/config/gcpConfig'
import { getTenantBigQueryDatasets } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import type { IntegrationConnectionStatus } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'

export type ObservabilityTenant = {
  id: number
  name: string
  slug: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export type ObservabilityConnection = {
  id: string
  tenantId: number
  tenantName: string
  tenantSlug: string | null
  domain: IntegrationDomain
  provider: string
  displayName: string
  status: IntegrationConnectionStatus
  lastSyncAt: string | null
  lastSuccessAt: string | null
  lastError: string | null
  recordsSynced: number
  updatedAt: string
  createdAt: string
}

type TenantRow = {
  id: string | number
  name: string
  slug: string | null
  status: string
  created_at: string | Date
  updated_at: string | Date
}

type ConnectionRow = {
  id: string | number
  tenant_id: string | number
  tenant_name: string | null
  tenant_slug: string | null
  domain: string
  provider: string
  display_name: string
  status: string
  last_sync_at: string | Date | null
  last_success_at: string | Date | null
  last_error: string | null
  records_synced: string | number | null
  created_at: string | Date
  updated_at: string | Date
}

type TenantBigQueryRow = TenantRow & {
  clerk_organization_id: string | null
  clerk_organization_slug: string | null
  metadata: unknown
  member_count: string | number | null
  connection_count: string | number | null
}

type TenantMemberRow = {
  tenant_id: string | number
  user_id: string | number
  email: string
  full_name: string | null
  role: string
  status: string
  clerk_user_id: string | null
}

type DestinationRow = {
  id: string | number
  tenant_id: string | number
  name: string
  status: string
  config: unknown
  metadata: unknown
  updated_at: string | Date
}

export type ObservabilityTenantMember = {
  userId: number
  email: string
  fullName: string | null
  role: string
  status: string
  clerkUserId: string | null
}

export type ObservabilityDatasetStatus = {
  dataset: string
  expected: boolean
  exists: boolean
  ok: boolean
  tableCount: number
  totalRows: number
  tables: Array<{
    tableName: string
    rowCount: number
    lastModifiedAt: string | null
  }>
  error?: string
}

export type ObservabilityBigQueryTenantRow = {
  tenantId: number
  tenantName: string
  tenantSlug: string | null
  tenantStatus: string
  clerkOrganizationId: string | null
  clerkOrganizationSlug: string | null
  memberCount: number
  connectionCount: number
  members: ObservabilityTenantMember[]
  destination: {
    id: string
    name: string
    status: string
    config: Record<string, unknown>
    metadata: Record<string, unknown>
    updatedAt: string
  } | null
  expectedDatasets: {
    rawDataset: string
    normalizedDataset: string
  }
  datasets: {
    raw: ObservabilityDatasetStatus
    normalized: ObservabilityDatasetStatus
  }
  provisioningStatus: string
  provisioningUpdatedAt: string | null
  issue: string | null
  ok: boolean
}

function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function normalizeConnectionStatus(status: string): IntegrationConnectionStatus {
  if (
    status === 'draft'
    || status === 'pending_auth'
    || status === 'connected'
    || status === 'syncing'
    || status === 'warning'
    || status === 'error'
    || status === 'disabled'
  ) {
    return status
  }

  return 'error'
}

function toTenant(row: TenantRow): ObservabilityTenant {
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function toConnection(row: ConnectionRow): ObservabilityConnection {
  return {
    id: String(row.id),
    tenantId: Number(row.tenant_id),
    tenantName: row.tenant_name || `Tenant ${row.tenant_id}`,
    tenantSlug: row.tenant_slug,
    domain: row.domain as IntegrationDomain,
    provider: row.provider,
    displayName: row.display_name,
    status: normalizeConnectionStatus(row.status),
    lastSyncAt: toIsoString(row.last_sync_at),
    lastSuccessAt: toIsoString(row.last_success_at),
    lastError: row.last_error,
    recordsSynced: Number(row.records_synced || 0),
    createdAt: toIsoString(row.created_at) || '',
    updatedAt: toIsoString(row.updated_at) || '',
  }
}

function asJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}
    } catch {
      return {}
    }
  }
  return {}
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toBigQueryDate(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'object' && 'value' in value && typeof value.value === 'string') return value.value
  return String(value)
}

async function inspectBigQueryDataset(
  client: BigQuery,
  dataset: string,
): Promise<ObservabilityDatasetStatus> {
  try {
    const datasetRef = client.dataset(dataset)
    const [exists] = await datasetRef.exists()

    if (!exists) {
      return {
        dataset,
        expected: true,
        exists: false,
        ok: false,
        tableCount: 0,
        totalRows: 0,
        tables: [],
      }
    }

    const [tables] = await datasetRef.getTables({ maxResults: 25 })
    const tableRows = tables.map((table) => {
      const metadata = table.metadata as Record<string, unknown>
      return {
        tableName: table.id || toText(metadata.id).split('.').pop() || '',
        rowCount: Number(metadata.numRows || 0),
        lastModifiedAt: toBigQueryDate(metadata.modifiedTime || metadata.lastModifiedTime),
      }
    })

    return {
      dataset,
      expected: true,
      exists: true,
      ok: true,
      tableCount: tableRows.length,
      totalRows: tableRows.reduce((sum, table) => sum + table.rowCount, 0),
      tables: tableRows,
    }
  } catch (error) {
    return {
      dataset,
      expected: true,
      exists: false,
      ok: false,
      tableCount: 0,
      totalRows: 0,
      tables: [],
      error: error instanceof Error ? error.message : 'Falha ao consultar dataset BigQuery',
    }
  }
}

export async function getConnectorsObservabilitySnapshot(params?: {
  tenantLimit?: number
  connectionLimit?: number
}) {
  const tenantLimit = Math.min(Math.max(Number(params?.tenantLimit || 200), 1), 500)
  const connectionLimit = Math.min(Math.max(Number(params?.connectionLimit || 500), 1), 1000)

  const [tenantRows, connectionRows] = await Promise.all([
    runQuery<TenantRow>(
      `SELECT id, name, slug, status, created_at, updated_at
       FROM shared.tenants
       WHERE status = 'active'
       ORDER BY updated_at DESC, id DESC
       LIMIT $1`,
      [tenantLimit],
    ),
    runQuery<ConnectionRow>(
      `SELECT
         connections.id,
         connections.tenant_id,
         tenants.name AS tenant_name,
         tenants.slug AS tenant_slug,
         connections.domain,
         connections.provider,
         connections.display_name,
         connections.status,
         connections.last_sync_at,
         connections.last_success_at,
         connections.last_error,
         connections.records_synced,
         connections.created_at,
         connections.updated_at
       FROM integrations.connections AS connections
       LEFT JOIN shared.tenants AS tenants
         ON tenants.id = connections.tenant_id
       ORDER BY connections.updated_at DESC, connections.id DESC
       LIMIT $1`,
      [connectionLimit],
    ),
  ])

  return {
    tenants: tenantRows.map(toTenant),
    connections: connectionRows.map(toConnection),
    generatedAt: new Date().toISOString(),
  }
}

export async function getTenantBigQueryObservabilitySnapshot(params?: {
  tenantLimit?: number
}) {
  const tenantLimit = Math.min(Math.max(Number(params?.tenantLimit || 200), 1), 500)
  const config = getIntegrationsCloudConfig()
  const projectId = getBigQueryProjectId(config.projectId) || config.projectId
  const client = createBigQueryClient({ projectId })

  const [tenantRows, memberRows, destinationRows] = await Promise.all([
    runQuery<TenantBigQueryRow>(
      `SELECT
         tenants.id,
         tenants.name,
         tenants.slug,
         tenants.status,
         tenants.created_at,
         tenants.updated_at,
         tenants.clerk_organization_id,
         tenants.clerk_organization_slug,
         tenants.metadata,
         (SELECT count(*)::int FROM shared.tenant_memberships WHERE tenant_id = tenants.id AND status = 'active') AS member_count,
         (SELECT count(*)::int FROM integrations.connections WHERE tenant_id = tenants.id) AS connection_count
       FROM shared.tenants AS tenants
       WHERE tenants.status = 'active'
       ORDER BY tenants.updated_at DESC, tenants.id DESC
       LIMIT $1`,
      [tenantLimit],
    ),
    runQuery<TenantMemberRow>(
      `SELECT
         memberships.tenant_id,
         users.id AS user_id,
         users.email,
         users.full_name,
         memberships.role,
         memberships.status,
         users.clerk_user_id
       FROM shared.tenant_memberships AS memberships
       JOIN shared.users AS users
         ON users.id = memberships.user_id
       WHERE memberships.status = 'active'
       ORDER BY memberships.tenant_id ASC, memberships.role ASC, users.email ASC`,
    ),
    runQuery<DestinationRow>(
      `SELECT id, tenant_id, name, status, config, metadata, updated_at
       FROM integrations.destinations
       WHERE type = 'bigquery'
         AND (metadata->>'isDefault') = 'true'
       ORDER BY tenant_id ASC, id ASC`,
    ),
  ])

  const membersByTenant = new Map<number, ObservabilityTenantMember[]>()
  for (const row of memberRows) {
    const tenantId = Number(row.tenant_id)
    const current = membersByTenant.get(tenantId) || []
    current.push({
      userId: Number(row.user_id),
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      status: row.status,
      clerkUserId: row.clerk_user_id,
    })
    membersByTenant.set(tenantId, current)
  }

  const destinationByTenant = new Map<number, DestinationRow>()
  for (const row of destinationRows) {
    if (!destinationByTenant.has(Number(row.tenant_id))) {
      destinationByTenant.set(Number(row.tenant_id), row)
    }
  }

  const rows = await Promise.all(tenantRows.map(async (tenant): Promise<ObservabilityBigQueryTenantRow> => {
    const tenantId = Number(tenant.id)
    const expectedDatasets = getTenantBigQueryDatasets(tenantId)
    const destinationRow = destinationByTenant.get(tenantId) || null
    const destinationConfig = asJsonObject(destinationRow?.config)
    const destinationMetadata = asJsonObject(destinationRow?.metadata)
    const provisioning = asJsonObject(destinationMetadata.bigQueryProvisioning)
    const [raw, normalized] = await Promise.all([
      inspectBigQueryDataset(client, expectedDatasets.rawDataset),
      inspectBigQueryDataset(client, expectedDatasets.normalizedDataset),
    ])
    const destinationOk = Boolean(destinationRow)
      && destinationConfig.rawDataset === expectedDatasets.rawDataset
      && destinationConfig.normalizedDataset === expectedDatasets.normalizedDataset
    const ok = destinationOk && raw.ok && normalized.ok
    const issue = ok
      ? null
      : !destinationRow
        ? 'Destino BigQuery default ausente'
        : !destinationOk
          ? 'Config do destino diverge dos datasets esperados'
          : raw.error || normalized.error || 'Dataset BigQuery ausente'

    return {
      tenantId,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      tenantStatus: tenant.status,
      clerkOrganizationId: tenant.clerk_organization_id,
      clerkOrganizationSlug: tenant.clerk_organization_slug,
      memberCount: Number(tenant.member_count || 0),
      connectionCount: Number(tenant.connection_count || 0),
      members: membersByTenant.get(tenantId) || [],
      destination: destinationRow
        ? {
          id: String(destinationRow.id),
          name: destinationRow.name,
          status: destinationRow.status,
          config: destinationConfig,
          metadata: destinationMetadata,
          updatedAt: toIsoString(destinationRow.updated_at) || '',
        }
        : null,
      expectedDatasets,
      datasets: {
        raw,
        normalized,
      },
      provisioningStatus: toText(provisioning.status) || (destinationRow ? 'unknown' : 'missing'),
      provisioningUpdatedAt: toText(provisioning.updatedAt) || null,
      issue,
      ok,
    }
  }))

  return {
    projectId,
    summary: {
      totalTenants: rows.length,
      okTenants: rows.filter((row) => row.ok).length,
      attentionTenants: rows.filter((row) => !row.ok).length,
      missingDestinations: rows.filter((row) => !row.destination).length,
      missingDatasets: rows.reduce((count, row) => (
        count
        + (row.datasets.raw.exists ? 0 : 1)
        + (row.datasets.normalized.exists ? 0 : 1)
      ), 0),
    },
    rows,
    generatedAt: new Date().toISOString(),
  }
}
