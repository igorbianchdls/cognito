import { runQuery } from '@/lib/postgres'
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
