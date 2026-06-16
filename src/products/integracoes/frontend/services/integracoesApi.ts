import type {
  CreateIntegrationConnectionInput,
  IntegrationConnection,
  UpdateIntegrationConnectionInput,
} from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  CreateIntegrationDestinationInput,
  IntegrationDestination,
} from '@/products/integracoes/destinations/shared/destinationContracts'
import type { IntegrationEvent } from '@/products/integracoes/shared/contracts/eventContracts'
import type {
  CreateIntegrationPipelineInput,
  IntegrationPipeline,
} from '@/products/integracoes/shared/contracts/pipelineContracts'
import type {
  IntegrationPluginPermissions,
  UpsertIntegrationPluginPermissionsInput,
} from '@/products/integracoes/shared/contracts/pluginPermissionContracts'
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

type ReconnectResponse = {
  ok?: boolean
  error?: string
  reconnect?: {
    mode?: string
    message?: string
    authorizationUrl?: string
    status?: string
    connection?: IntegrationConnectionWithUi
  }
}

type SyncResponse = {
  ok?: boolean
  error?: string
  result?: IntegrationSyncResult
}

type PluginPermissionsResponse = {
  ok?: boolean
  error?: string
  permissions?: IntegrationPluginPermissions
}

type DestinationsResponse = {
  ok?: boolean
  error?: string
  destinations?: IntegrationDestination[]
}

type DestinationResponse = {
  ok?: boolean
  error?: string
  destination?: IntegrationDestination
}

type PipelinesResponse = {
  ok?: boolean
  error?: string
  pipelines?: IntegrationPipeline[]
}

type PipelineResponse = {
  ok?: boolean
  error?: string
  pipeline?: IntegrationPipeline
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
  tenantId?: number,
): Promise<{
  connection: IntegrationConnectionWithUi
  syncRuns: IntegrationSyncRunWithUi[]
  events: IntegrationEventWithUi[]
}> {
  const query = buildQuery({ tenantId: tenantId ? String(tenantId) : undefined })
  const suffix = query ? `?${query}` : ''
  const payload = await requestJson<ConnectionResponse>(`/api/integracoes/connections/${encodeURIComponent(id)}${suffix}`)

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
    body: JSON.stringify(input),
  })

  if (!payload.connection) throw new Error('Conexão não retornada')
  if (payload.setup?.authorizationUrl && typeof window !== 'undefined') {
    window.location.assign(payload.setup.authorizationUrl)
  }

  if (!payload.setup?.authorizationUrl && (payload.setup?.status === 'pending_auth' || payload.setup?.mode === 'local_stub')) {
    throw new Error(
      payload.setup.message
        || 'OAuth pendente, mas a URL de autorizacao nao foi retornada. Verifique INTEGRATIONS_CONTROL_API_URL no deploy web.',
    )
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
    body: JSON.stringify(input),
  })

  if (!payload.result) throw new Error('Resultado de sync não retornado')

  return payload.result
}

export async function requestIntegrationReconnect(id: string, tenantId?: number): Promise<ReconnectResponse['reconnect']> {
  const payload = await requestJson<ReconnectResponse>(`/api/integracoes/connections/${encodeURIComponent(id)}/reconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tenantId ? { tenantId } : {}),
  })

  if (payload.reconnect?.authorizationUrl && typeof window !== 'undefined') {
    window.location.assign(payload.reconnect.authorizationUrl)
  }

  if (!payload.reconnect?.authorizationUrl && (payload.reconnect?.status === 'pending_auth' || payload.reconnect?.mode === 'local_stub')) {
    throw new Error(
      payload.reconnect.message
        || 'OAuth pendente, mas a URL de autorizacao nao foi retornada. Verifique a configuracao do provider.',
    )
  }

  return payload.reconnect
}

export async function fetchIntegrationPluginPermissions(
  connectionId: string,
  tenantId?: number,
): Promise<IntegrationPluginPermissions> {
  const query = buildQuery({ tenantId: tenantId ? String(tenantId) : undefined })
  const payload = await requestJson<PluginPermissionsResponse>(
    `/api/integracoes/connections/${encodeURIComponent(connectionId)}/plugin-permissions?${query}`,
  )
  if (!payload.permissions) throw new Error('Permissoes do plugin nao retornadas')
  return payload.permissions
}

export async function updateIntegrationPluginPermissions(
  connectionId: string,
  input: Omit<UpsertIntegrationPluginPermissionsInput, 'connectionId'>,
): Promise<IntegrationPluginPermissions> {
  const payload = await requestJson<PluginPermissionsResponse>(
    `/api/integracoes/connections/${encodeURIComponent(connectionId)}/plugin-permissions`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  if (!payload.permissions) throw new Error('Permissoes do plugin nao retornadas')
  return payload.permissions
}

export async function fetchIntegrationDestinations(params?: {
  tenantId?: number
  type?: string
  status?: string
}): Promise<IntegrationDestination[]> {
  const query = buildQuery({
    tenantId: params?.tenantId ? String(params.tenantId) : undefined,
    type: params?.type,
    status: params?.status,
  })
  const suffix = query ? `?${query}` : ''
  const payload = await requestJson<DestinationsResponse>(`/api/integracoes/destinations${suffix}`)

  return Array.isArray(payload.destinations) ? payload.destinations : []
}

export async function createIntegrationDestination(
  input: Omit<CreateIntegrationDestinationInput, 'tenantId'> & { tenantId?: number },
): Promise<IntegrationDestination> {
  const payload = await requestJson<DestinationResponse>('/api/integracoes/destinations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!payload.destination) throw new Error('Destino nao retornado')

  return payload.destination
}

export async function fetchIntegrationPipelines(params?: {
  tenantId?: number
  sourceConnectionId?: string
  destinationId?: string
  status?: string
}): Promise<IntegrationPipeline[]> {
  const query = buildQuery({
    tenantId: params?.tenantId ? String(params.tenantId) : undefined,
    sourceConnectionId: params?.sourceConnectionId,
    destinationId: params?.destinationId,
    status: params?.status,
  })
  const suffix = query ? `?${query}` : ''
  const payload = await requestJson<PipelinesResponse>(`/api/integracoes/pipelines${suffix}`)

  return Array.isArray(payload.pipelines) ? payload.pipelines : []
}

export async function createIntegrationPipeline(
  input: Omit<CreateIntegrationPipelineInput, 'tenantId'> & { tenantId?: number },
): Promise<IntegrationPipeline> {
  const payload = await requestJson<PipelineResponse>('/api/integracoes/pipelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!payload.pipeline) throw new Error('Pipeline nao retornado')

  return payload.pipeline
}
