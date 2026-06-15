import {
  createIntegrationEvent,
  createIntegrationSyncRun,
  getIntegrationConnection,
  updateIntegrationConnection,
} from '@/products/integracoes/server/integrationConnectionRepository'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  IntegrationSyncResult,
  IntegrationSyncTrigger,
} from '@/products/integracoes/shared/contracts/syncContracts'

export type LocalSetupResult = {
  mode: 'cloud' | 'local_stub'
  connection: IntegrationConnection
  message: string
  authorizationUrl?: string
  status?: string
}

type CloudControlApiResponse = {
  ok?: boolean
  error?: string
  message?: string
  mode?: string
  messageId?: string
  status?: string
  secretRef?: string
  authorizationUrl?: string
}

const SYNC_READY_CONNECTION_STATUSES = new Set(['connected', 'syncing', 'warning'])

function getCloudControlApiUrl(): string | null {
  const value = process.env.INTEGRATIONS_CONTROL_API_URL?.trim()
  if (!value) return null
  return value.replace(/\/+$/, '')
}

async function requestCloudControlApi(path: string, body: Record<string, unknown>): Promise<CloudControlApiResponse | null> {
  const baseUrl = getCloudControlApiUrl()
  if (!baseUrl) return null

  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.INTEGRATIONS_INTERNAL_API_KEY
        ? { Authorization: `Bearer ${process.env.INTEGRATIONS_INTERNAL_API_KEY}` }
        : {}),
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({})) as CloudControlApiResponse

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Falha na chamada Cloud Run ${path}`)
  }

  return payload
}

export async function prepareLocalConnectionSetup(connection: IntegrationConnection): Promise<LocalSetupResult> {
  return prepareConnectionSetup({ connection })
}

export async function prepareConnectionSetup(params: {
  connection: IntegrationConnection
  credentials?: Record<string, unknown>
}): Promise<LocalSetupResult> {
  const { connection } = params
  const cloud = await requestCloudControlApi('/connections/setup', {
    tenantId: connection.tenantId,
    connectionId: connection.id,
    provider: connection.provider,
    credentials: params.credentials,
    resources: connection.selectedResources,
  })

  if (cloud) {
    return {
      mode: 'cloud',
      connection,
      message: cloud.message || 'Setup enviado ao Cloud Run.',
      authorizationUrl: cloud.authorizationUrl,
      status: cloud.status,
    }
  }

  return {
    mode: 'local_stub',
    connection,
    message: 'OAuth real indisponivel: INTEGRATIONS_CONTROL_API_URL nao esta configurada no deploy web.',
  }
}

export async function requestLocalReconnect(params: {
  tenantId: number
  connection: IntegrationConnection
}): Promise<LocalSetupResult> {
  const cloud = await requestCloudControlApi('/connections/setup', {
    tenantId: params.tenantId,
    connectionId: params.connection.id,
    provider: params.connection.provider,
    reconnect: true,
    resources: params.connection.selectedResources,
  })
  const updated = await updateIntegrationConnection(params.connection.id, params.tenantId, {
    status: 'pending_auth',
    metadata: {
      reconnectRequestedAt: new Date().toISOString(),
      setupMode: cloud ? 'cloud' : 'local_stub',
    },
  })
  await createIntegrationEvent({
    tenantId: params.tenantId,
    connectionId: params.connection.id,
    eventType: 'connection.reconnect_requested',
    actor: 'integracoes-api',
    message: 'Reconexao registrada localmente aguardando fluxo real de autenticacao.',
    metadata: {
      setupMode: cloud ? 'cloud' : 'local_stub',
      provider: params.connection.provider,
    },
  })

  return {
    mode: cloud ? 'cloud' : 'local_stub',
    connection: updated || params.connection,
    message: cloud?.message || 'Reconexao registrada localmente. O fluxo real de autenticacao sera adicionado depois.',
  }
}

export async function requestLocalSync(params: {
  tenantId: number
  connectionId: string
  pipelineId?: string
  destinationId?: string
  trigger?: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}): Promise<IntegrationSyncResult | null> {
  const hasCloudControlApi = Boolean(getCloudControlApiUrl())
  const connection = await getIntegrationConnection(params.connectionId, params.tenantId)
  if (!connection) return null

  if (!SYNC_READY_CONNECTION_STATUSES.has(connection.status)) {
    throw new Error(`Conexao ${params.connectionId} esta com status ${connection.status} e ainda nao pode sincronizar. Conclua a autorizacao real primeiro.`)
  }

  if (!hasCloudControlApi && process.env.INTEGRATIONS_ALLOW_LOCAL_SYNC_STUB !== 'true') {
    throw new Error('Sync real indisponivel sem INTEGRATIONS_CONTROL_API_URL. Para desenvolvimento local, defina INTEGRATIONS_ALLOW_LOCAL_SYNC_STUB=true.')
  }

  const run = await createIntegrationSyncRun({
    tenantId: params.tenantId,
    connectionId: params.connectionId,
    pipelineId: params.pipelineId,
    destinationId: params.destinationId,
    trigger: params.trigger || 'manual',
    status: hasCloudControlApi ? 'queued' : 'warning',
    resources: params.resources,
    metadata: {
      requestedBy: params.requestedBy || 'api',
      setupMode: hasCloudControlApi ? 'cloud' : 'local_stub',
    },
  })

  if (!run) return null

  if (hasCloudControlApi) {
    await requestCloudControlApi('/sync', {
      tenantId: params.tenantId,
      connectionId: params.connectionId,
      pipelineId: params.pipelineId,
      destinationId: params.destinationId,
      runId: run.id,
      trigger: params.trigger || 'manual',
      resources: params.resources,
      requestedBy: params.requestedBy || 'api',
    })
  }

  return {
    connectionId: run.connectionId,
    pipelineId: run.pipelineId,
    destinationId: run.destinationId,
    runId: run.id,
    status: run.status,
    recordsIn: run.recordsIn,
    recordsUpdated: run.recordsUpdated,
    recordsFailed: run.recordsFailed,
    errorMessage: run.errorMessage,
  }
}
