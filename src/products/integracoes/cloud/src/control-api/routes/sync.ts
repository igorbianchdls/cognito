import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { publishSyncMessage } from '@/products/integracoes/cloud/src/lib/pubsub'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

const syncTriggers: IntegrationSyncTrigger[] = ['manual', 'scheduled', 'webhook', 'initial']

type SyncDispatchBody = {
  tenantId?: number
  connectionId?: string
  pipelineId?: string
  destinationId?: string
  runId?: string
  trigger?: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseSyncDispatchBody(body: unknown): SyncDispatchBody {
  if (!isRecord(body)) return {}

  return {
    tenantId: typeof body.tenantId === 'number' ? body.tenantId : undefined,
    connectionId: typeof body.connectionId === 'string' ? body.connectionId : undefined,
    pipelineId: typeof body.pipelineId === 'string' ? body.pipelineId : undefined,
    destinationId: typeof body.destinationId === 'string' ? body.destinationId : undefined,
    runId: typeof body.runId === 'string' ? body.runId : undefined,
    trigger: typeof body.trigger === 'string' && syncTriggers.includes(body.trigger as IntegrationSyncTrigger)
      ? body.trigger as IntegrationSyncTrigger
      : undefined,
    resources: Array.isArray(body.resources)
      ? body.resources.filter((resource): resource is string => typeof resource === 'string')
      : undefined,
    requestedBy: typeof body.requestedBy === 'string' ? body.requestedBy : undefined,
  }
}

export async function handleSyncDispatch(request: ControlApiRequest): Promise<ControlApiResponse> {
  try {
    const body = parseSyncDispatchBody(request.body)
    if (!body.tenantId || !body.connectionId) {
      return {
        status: 400,
        body: {
          ok: false,
          error: 'tenantId e connectionId sao obrigatorios para despachar sync.',
        },
      }
    }

    const publish = await publishSyncMessage({
      tenantId: body.tenantId,
      connectionId: body.connectionId,
      pipelineId: body.pipelineId,
      destinationId: body.destinationId,
      runId: body.runId,
      trigger: body.trigger || 'manual',
      resources: body.resources,
      requestedBy: body.requestedBy,
    })

    return {
      status: 202,
      body: {
        ok: true,
        mode: publish.mode,
        message: 'Sync publicado no Pub/Sub.',
        messageId: publish.messageId,
        runId: body.runId,
        topic: publish.topic,
      },
    }
  } catch (error) {
    return {
      status: 500,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : 'Falha ao despachar sync.',
      },
    }
  }
}
