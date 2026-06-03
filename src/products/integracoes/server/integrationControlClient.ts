import {
  createIntegrationEvent,
  createIntegrationSyncRun,
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
    message: 'Setup local criado. A autenticacao real sera conectada ao Cloud Run em etapa futura.',
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
  trigger?: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}): Promise<IntegrationSyncResult | null> {
  const cloud = await requestCloudControlApi('/sync', {
    tenantId: params.tenantId,
    connectionId: params.connectionId,
    trigger: params.trigger || 'manual',
    resources: params.resources,
    requestedBy: params.requestedBy || 'api',
  })
  const run = await createIntegrationSyncRun({
    tenantId: params.tenantId,
    connectionId: params.connectionId,
    trigger: params.trigger || 'manual',
    status: cloud ? 'queued' : 'success',
    resources: params.resources,
    metadata: {
      requestedBy: params.requestedBy || 'api',
      setupMode: cloud ? 'cloud' : 'local_stub',
      cloudDispatch: cloud
        ? {
            mode: cloud.mode,
            message: cloud.message,
            messageId: cloud.messageId,
          }
        : undefined,
    },
  })

  if (!run) return null

  return {
    connectionId: run.connectionId,
    runId: run.id,
    status: run.status,
    recordsIn: run.recordsIn,
    recordsUpdated: run.recordsUpdated,
    recordsFailed: run.recordsFailed,
    errorMessage: run.errorMessage,
  }
}
