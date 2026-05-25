import type { IntegracaoUserItem, ToolkitStatusMap } from '@/products/integracoes/shared/types'
import type {
  CreateIntegrationConnectionInput,
  IntegrationConnection,
  UpdateIntegrationConnectionInput,
} from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  IntegrationSyncResult,
  IntegrationSyncRun,
  TriggerIntegrationSyncInput,
} from '@/products/integracoes/shared/contracts/syncContracts'
import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'

type StatusItem = {
  slug?: string
  connection?: {
    connectedAccount?: { id?: string }
    isActive?: boolean
  }
}

type StatusResponse = {
  ok?: boolean
  error?: string
  connected?: boolean
  items?: StatusItem[]
}

type UsersResponse = {
  ok?: boolean
  error?: string
  items?: IntegracaoUserItem[]
}

type AuthorizeResponse = {
  ok?: boolean
  error?: string
  redirectUrl?: string
}

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
}

type CreateConnectionResponse = {
  ok?: boolean
  error?: string
  connection?: IntegrationConnectionWithUi
}

type SyncResponse = {
  ok?: boolean
  error?: string
  result?: IntegrationSyncResult
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

function mapStatusItems(items: StatusItem[] | undefined): ToolkitStatusMap {
  const map: ToolkitStatusMap = {}

  for (const item of items || []) {
    const slug = (item.slug || '').toLowerCase()
    if (!slug) continue

    const connected = Boolean(item.connection?.connectedAccount?.id || item.connection?.isActive)
    map[slug] = connected
  }

  return map
}

export async function fetchToolkitStatusMap(params?: {
  toolkit?: string
  userId?: string
}): Promise<ToolkitStatusMap> {
  const query = buildQuery({ toolkit: params?.toolkit, userId: params?.userId })
  const suffix = query ? `?${query}` : ''

  const payload = await requestJson<StatusResponse>(`/api/integracoes/status${suffix}`)

  if (params?.toolkit && typeof payload.connected === 'boolean') {
    return {
      [params.toolkit]: payload.connected,
      [params.toolkit.toLowerCase()]: payload.connected,
    }
  }

  return mapStatusItems(payload.items)
}

export async function fetchToolkitConnection(toolkit: string, userId?: string): Promise<boolean> {
  const map = await fetchToolkitStatusMap({ toolkit, userId })
  const key = toolkit || ''

  return Boolean(map[key] ?? map[key.toLowerCase()])
}

export async function fetchIntegracoesUsers(query?: string): Promise<IntegracaoUserItem[]> {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  const payload = await requestJson<UsersResponse>(`/api/integracoes/users${suffix}`)

  return Array.isArray(payload.items) ? payload.items : []
}

export async function requestIntegracaoAuthorize(toolkit: string, userId: string): Promise<string> {
  const payload = await requestJson<AuthorizeResponse>('/api/integracoes/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolkit, userId }),
  })

  const redirectUrl = (payload.redirectUrl || '').toString()
  if (!redirectUrl) throw new Error('Redirect URL vazio')

  return redirectUrl
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
): Promise<{ connection: IntegrationConnectionWithUi; syncRuns: IntegrationSyncRunWithUi[] }> {
  const query = buildQuery({ tenantId: String(tenantId) })
  const payload = await requestJson<ConnectionResponse>(`/api/integracoes/connections/${encodeURIComponent(id)}?${query}`)

  if (!payload.connection) throw new Error('Conexão não encontrada')

  return {
    connection: payload.connection,
    syncRuns: Array.isArray(payload.syncRuns) ? payload.syncRuns : [],
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
