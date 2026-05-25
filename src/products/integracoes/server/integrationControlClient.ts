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
  mode: 'local_stub'
  connection: IntegrationConnection
  message: string
}

export async function prepareLocalConnectionSetup(connection: IntegrationConnection): Promise<LocalSetupResult> {
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
  const updated = await updateIntegrationConnection(params.connection.id, params.tenantId, {
    status: 'pending_auth',
    metadata: {
      reconnectRequestedAt: new Date().toISOString(),
      setupMode: 'local_stub',
    },
  })
  await createIntegrationEvent({
    tenantId: params.tenantId,
    connectionId: params.connection.id,
    eventType: 'connection.reconnect_requested',
    actor: 'integracoes-api',
    message: 'Reconexao registrada localmente aguardando fluxo real de autenticacao.',
    metadata: {
      setupMode: 'local_stub',
      provider: params.connection.provider,
    },
  })

  return {
    mode: 'local_stub',
    connection: updated || params.connection,
    message: 'Reconexao registrada localmente. O fluxo real de autenticacao sera adicionado depois.',
  }
}

export async function requestLocalSync(params: {
  tenantId: number
  connectionId: string
  trigger?: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}): Promise<IntegrationSyncResult | null> {
  const run = await createIntegrationSyncRun({
    tenantId: params.tenantId,
    connectionId: params.connectionId,
    trigger: params.trigger || 'manual',
    status: 'success',
    resources: params.resources,
    metadata: {
      requestedBy: params.requestedBy || 'api',
      setupMode: 'local_stub',
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
