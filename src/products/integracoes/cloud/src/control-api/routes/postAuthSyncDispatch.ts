import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { handleDispatchOutbox } from '@/products/integracoes/cloud/src/control-api/routes/dispatchOutbox'
import { createIntegrationEvent } from '@/products/integracoes/cloud/src/lib/postgresStatus'

type DispatchableFinalizeResult = {
  dispatchQueued?: boolean
  initialSync?: {
    id?: string | number | null
  } | null
}

function getInitialSyncRunId(finalizeResult: DispatchableFinalizeResult) {
  const runId = String(finalizeResult.initialSync?.id || '').trim()
  return /^\d+$/.test(runId) ? runId : null
}

function isDispatchOk(response: ControlApiResponse) {
  const body = response.body || {}
  return response.status < 400 && body.ok !== false && Number(body.published || 0) > 0
}

export async function dispatchPostAuthInitialSync(input: {
  request: ControlApiRequest
  tenantId: number
  connectionId: string
  requestedBy: string
  finalizeResult: DispatchableFinalizeResult
}) {
  if (!input.finalizeResult.dispatchQueued) return null
  const runId = getInitialSyncRunId(input.finalizeResult)
  if (!runId) return null

  try {
    const dispatch = await handleDispatchOutbox({
      ...input.request,
      method: 'POST',
      path: '/dispatch-outbox',
      body: {
        limit: 1,
        runId,
        requestedBy: input.requestedBy,
      },
    })
    const ok = isDispatchOk(dispatch)
    await createIntegrationEvent({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      eventType: 'system.note',
      severity: ok ? 'info' : 'warning',
      actor: 'integrations-control-api',
      message: ok
        ? 'Sync inicial publicado automaticamente apos autenticacao.'
        : 'Sync inicial enfileirado, mas dispatch automatico nao publicou mensagem.',
      metadata: {
        runId,
        requestedBy: input.requestedBy,
        dispatchStatus: dispatch.status,
        dispatchBody: dispatch.body,
      },
    }).catch(() => undefined)
    return dispatch
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    await createIntegrationEvent({
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      eventType: 'system.note',
      severity: 'warning',
      actor: 'integrations-control-api',
      message: 'Sync inicial enfileirado, mas dispatch automatico falhou.',
      metadata: {
        runId,
        requestedBy: input.requestedBy,
        errorMessage,
      },
    }).catch(() => undefined)
    return {
      status: 500,
      body: {
        ok: false,
        runId,
        error: errorMessage,
      },
    } satisfies ControlApiResponse
  }
}
