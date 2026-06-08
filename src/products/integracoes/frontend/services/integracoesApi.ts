import type {
  CreateIntegrationConnectionInput,
  IntegrationConnection,
  UpdateIntegrationConnectionInput,
} from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationEvent } from '@/products/integracoes/shared/contracts/eventContracts'
import type {
  IntegrationMcpPermissions,
  UpsertIntegrationMcpPermissionsInput,
} from '@/products/integracoes/shared/contracts/mcpPermissionContracts'
import type {
  IntegrationSyncResult,
  IntegrationSyncRun,
  TriggerIntegrationSyncInput,
} from '@/products/integracoes/shared/contracts/syncContracts'
import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'

export type IntegrationConnectionWithUi = IntegrationConnection & {
  uiStatus?: {
    label: string
    tone: string
    description: string
  }
}

export type IntegrationSyncRunWithUi = IntegrationSyncRun & {
  uiStatus?: {
    label: string
    tone: string
    description: string
  }
}

export type IntegrationEventWithUi = IntegrationEvent & {
  uiEventType?: {
    label: string
    tone: string
    description: string
  }
  uiSeverity?: {
    label: string
    tone: string
    description: string
  }
}

type ProvidersResponse = {
  ok?: boolean
  error?: string
  providers?: IntegrationProvider[]
}

type ConnectionsResponse = {
  ok?: boolean
  error?: string
  connections?: IntegrationConnectionWithUi[]
}

type ConnectionResponse = {
  ok?: boolean
  error?: string
  connection?: IntegrationConnectionWithUi
  syncRuns?: IntegrationSyncRunWithUi[]
  events?: IntegrationEventWithUi[]
}

type CreateConnectionResponse = {
  ok?: boolean
  error?: string
  connection?: IntegrationConnectionWithUi
  setup?: {
    mode?: string
    message?: string
    authorizationUrl?: string
    status?: string
  }
}

type SyncResponse = {
  ok?: boolean
  error?: string
  result?: IntegrationSyncResult
}

type McpPermissionsResponse = {
  ok?: boolean
  error?: string
  permissions?: IntegrationMcpPermissions
}

function buildQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }

  return query.toString()
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || 'Falha na requisição')
  }

  return payload as T
}

export async function fetchIntegrationProviders(domain?: string): Promise<IntegrationProvider[]> {
  const query = buildQuery({ domain })
  const suffix = query ? `?${query}` : ''
  const payload = await requestJson<ProvidersResponse>(`/api/integracoes/providers${suffix}`)

  return Array.isArray(payload.providers) ? payload.providers : []
}

export async function fetchIntegrationConnections(params?: {
  tenantId?: number
  domain?: string
  provider?: string
  status?: string
  limit?: number
}): Promise<IntegrationConnectionWithUi[]> {
  const query = buildQuery({
    tenantId: params?.tenantId ? String(params.tenantId) : undefined,
    domain: params?.domain,
    provider: params?.provider,
    status: params?.status,
    limit: params?.limit ? String(params.limit) : undefined,
  })
  const suffix = query ? `?${query}` : ''
  const payload = await requestJson<ConnectionsResponse>(`/api/integracoes/connections${suffix}`)

  return Array.isArray(payload.connections) ? payload.connections : []
}

export async function fetchIntegrationConnectionDetail(
  id: string,
  tenantId = 1,
): Promise<{
  connection: IntegrationConnectionWithUi
  syncRuns: IntegrationSyncRunWithUi[]
  events: IntegrationEventWithUi[]
}> {
  const query = buildQuery({ tenantId: String(tenantId) })
  const payload = await requestJson<ConnectionResponse>(`/api/integracoes/connections/${encodeURIComponent(id)}?${query}`)

  if (!payload.connection) throw new Error('Conexão não encontrada')

  return {
    connection: payload.connection,
    syncRuns: Array.isArray(payload.syncRuns) ? payload.syncRuns : [],
    events: Array.isArray(payload.events) ? payload.events : [],
  }
}

export async function createIntegrationConnection(
  input: Omit<CreateIntegrationConnectionInput, 'tenantId'> & { tenantId?: number },
): Promise<IntegrationConnectionWithUi> {
  const payload = await requestJson<CreateConnectionResponse>('/api/integracoes/connections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: input.tenantId || 1, ...input }),
  })

  if (!payload.connection) throw new Error('Conexão não retornada')
  if (payload.setup?.authorizationUrl && typeof window !== 'undefined') {
    window.location.assign(payload.setup.authorizationUrl)
  }

  return payload.connection
}

export async function updateIntegrationConnection(
  id: string,
  input: UpdateIntegrationConnectionInput & { tenantId?: number },
): Promise<IntegrationConnectionWithUi> {
  const payload = await requestJson<CreateConnectionResponse>(`/api/integracoes/connections/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!payload.connection) throw new Error('Conexão não retornada')

  return payload.connection
}

export async function requestIntegrationSync(
  input: Omit<TriggerIntegrationSyncInput, 'tenantId'> & { tenantId?: number },
): Promise<IntegrationSyncResult> {
  const payload = await requestJson<SyncResponse>(`/api/integracoes/connections/${encodeURIComponent(input.connectionId)}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: input.tenantId || 1, ...input }),
  })

  if (!payload.result) throw new Error('Resultado de sync não retornado')

  return payload.result
}

export async function requestIntegrationReconnect(id: string, tenantId = 1): Promise<void> {
  await requestJson(`/api/integracoes/connections/${encodeURIComponent(id)}/reconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId }),
  })
}

export async function fetchIntegrationMcpPermissions(
  connectionId: string,
  tenantId = 1,
): Promise<IntegrationMcpPermissions> {
  const query = buildQuery({ tenantId: String(tenantId) })
  const payload = await requestJson<McpPermissionsResponse>(
    `/api/integracoes/connections/${encodeURIComponent(connectionId)}/mcp-permissions?${query}`,
  )
  if (!payload.permissions) throw new Error('Permissoes MCP nao retornadas')
  return payload.permissions
}

export async function updateIntegrationMcpPermissions(
  connectionId: string,
  input: Omit<UpsertIntegrationMcpPermissionsInput, 'connectionId'>,
): Promise<IntegrationMcpPermissions> {
  const payload = await requestJson<McpPermissionsResponse>(
    `/api/integracoes/connections/${encodeURIComponent(connectionId)}/mcp-permissions`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  if (!payload.permissions) throw new Error('Permissoes MCP nao retornadas')
  return payload.permissions
}
