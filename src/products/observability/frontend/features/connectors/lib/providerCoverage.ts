import type { IntegrationConnectionStatus } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'
import { normalizeProviderSlug } from '@/products/integracoes/shared/providers/providerTypes'
import type {
  ObservabilityConnection,
  ObservabilityTenant,
} from '@/products/observability/server/connectorsObservabilityRepository'

export type ProviderCoverageStatus = 'connected' | 'pending' | 'attention' | 'disabled' | 'missing'

export type ProviderCoverageRow = {
  providerSlug: string
  providerName: string
  domain: string
  authType: string
  status: ProviderCoverageStatus
  connectedTenants: number
  pendingTenants: number
  attentionTenants: number
  missingTenants: number
  totalTenants: number
  connectionCount: number
  lastUpdatedAt: string | null
}

export type TenantCoverageRow = {
  tenantId: number
  tenantName: string
  tenantSlug: string | null
  connectedProviders: number
  pendingProviders: number
  attentionProviders: number
  missingProviders: number
  totalProviders: number
  coveragePercent: number
  lastUpdatedAt: string | null
}

export type ConnectorsCoverageSummary = {
  totalProviders: number
  totalTenants: number
  connectedProviders: number
  missingProviders: number
  pendingProviders: number
  attentionProviders: number
  totalConnections: number
  coveragePercent: number
}

function statusBucket(status: IntegrationConnectionStatus): Exclude<ProviderCoverageStatus, 'missing'> {
  if (status === 'connected' || status === 'syncing') return 'connected'
  if (status === 'pending_auth' || status === 'draft') return 'pending'
  if (status === 'warning' || status === 'error') return 'attention'
  return 'disabled'
}

function latestDate(current: string | null, candidate: string | null | undefined): string | null {
  if (!candidate) return current
  if (!current) return candidate
  return new Date(candidate).getTime() > new Date(current).getTime() ? candidate : current
}

function chooseOverallStatus(row: Pick<ProviderCoverageRow, 'connectedTenants' | 'pendingTenants' | 'attentionTenants'>): ProviderCoverageStatus {
  if (row.attentionTenants > 0) return 'attention'
  if (row.connectedTenants > 0) return 'connected'
  if (row.pendingTenants > 0) return 'pending'
  return 'missing'
}

export function buildConnectorsCoverage(params: {
  providers: IntegrationProvider[]
  tenants: ObservabilityTenant[]
  connections: ObservabilityConnection[]
}) {
  const providers = params.providers
  const activeTenants = params.tenants
  const totalTenants = activeTenants.length
  const totalProviders = providers.length
  const providerBySlug = new Map(providers.map((provider) => [provider.slug, provider]))
  const tenantProviderBuckets = new Map<string, Map<string, ProviderCoverageStatus>>()

  for (const connection of params.connections) {
    const providerSlug = normalizeProviderSlug(connection.provider)
    if (!providerBySlug.has(providerSlug)) continue

    const tenantBuckets = tenantProviderBuckets.get(connection.tenantId.toString()) || new Map<string, ProviderCoverageStatus>()
    const nextBucket = statusBucket(connection.status)
    const currentBucket = tenantBuckets.get(providerSlug)

    if (!currentBucket || currentBucket === 'missing' || nextBucket === 'attention' || (nextBucket === 'connected' && currentBucket === 'pending')) {
      tenantBuckets.set(providerSlug, nextBucket)
    }
    tenantProviderBuckets.set(connection.tenantId.toString(), tenantBuckets)
  }

  const providerRows = providers.map<ProviderCoverageRow>((provider) => {
    const providerSlug = provider.slug
    const providerConnections = params.connections.filter((connection) => normalizeProviderSlug(connection.provider) === providerSlug)
    const tenantStatuses = new Map<number, ProviderCoverageStatus>()
    let lastUpdatedAt: string | null = null

    for (const connection of providerConnections) {
      const bucket = statusBucket(connection.status)
      const current = tenantStatuses.get(connection.tenantId)
      if (!current || current === 'missing' || bucket === 'attention' || (bucket === 'connected' && current === 'pending')) {
        tenantStatuses.set(connection.tenantId, bucket)
      }
      lastUpdatedAt = latestDate(lastUpdatedAt, connection.updatedAt)
    }

    const connectedTenants = [...tenantStatuses.values()].filter((status) => status === 'connected').length
    const pendingTenants = [...tenantStatuses.values()].filter((status) => status === 'pending').length
    const attentionTenants = [...tenantStatuses.values()].filter((status) => status === 'attention').length
    const missingTenants = Math.max(totalTenants - tenantStatuses.size, 0)

    return {
      providerSlug,
      providerName: provider.name,
      domain: provider.domain,
      authType: provider.authType,
      status: chooseOverallStatus({ connectedTenants, pendingTenants, attentionTenants }),
      connectedTenants,
      pendingTenants,
      attentionTenants,
      missingTenants,
      totalTenants,
      connectionCount: providerConnections.length,
      lastUpdatedAt,
    }
  })

  const tenantRows = activeTenants.map<TenantCoverageRow>((tenant) => {
    const buckets = tenantProviderBuckets.get(tenant.id.toString()) || new Map<string, ProviderCoverageStatus>()
    const connectedProviders = [...buckets.values()].filter((status) => status === 'connected').length
    const pendingProviders = [...buckets.values()].filter((status) => status === 'pending').length
    const attentionProviders = [...buckets.values()].filter((status) => status === 'attention').length
    const missingProviders = Math.max(totalProviders - buckets.size, 0)
    const tenantConnections = params.connections.filter((connection) => connection.tenantId === tenant.id)
    const lastUpdatedAt = tenantConnections.reduce<string | null>(
      (current, connection) => latestDate(current, connection.updatedAt),
      null,
    )

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      connectedProviders,
      pendingProviders,
      attentionProviders,
      missingProviders,
      totalProviders,
      coveragePercent: totalProviders ? Math.round((connectedProviders / totalProviders) * 100) : 0,
      lastUpdatedAt,
    }
  })

  const connectedProviders = providerRows.filter((row) => row.connectedTenants > 0).length
  const pendingProviders = providerRows.filter((row) => row.pendingTenants > 0).length
  const attentionProviders = providerRows.filter((row) => row.attentionTenants > 0).length
  const missingProviders = providerRows.filter((row) => row.connectionCount === 0).length

  const summary: ConnectorsCoverageSummary = {
    totalProviders,
    totalTenants,
    connectedProviders,
    missingProviders,
    pendingProviders,
    attentionProviders,
    totalConnections: params.connections.length,
    coveragePercent: totalProviders ? Math.round((connectedProviders / totalProviders) * 100) : 0,
  }

  return {
    summary,
    providerRows,
    tenantRows: tenantRows.sort((a, b) => a.coveragePercent - b.coveragePercent || a.tenantName.localeCompare(b.tenantName)),
  }
}
