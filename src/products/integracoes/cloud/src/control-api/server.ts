import { handleProviderCallback } from '@/products/integracoes/cloud/src/control-api/routes/callbacks'
import { handleConnectionSetup } from '@/products/integracoes/cloud/src/control-api/routes/connections'
import { handleDispatchOutbox } from '@/products/integracoes/cloud/src/control-api/routes/dispatchOutbox'
import { handleHealthCheck } from '@/products/integracoes/cloud/src/control-api/routes/health'
import { handleProviderOAuthReadiness } from '@/products/integracoes/cloud/src/control-api/routes/providerReadiness'
import { handleScheduledSync } from '@/products/integracoes/cloud/src/control-api/routes/scheduledSync'
import { handleSyncDispatch } from '@/products/integracoes/cloud/src/control-api/routes/sync'
import { isInternalRequestAuthorized } from '@/products/integracoes/cloud/src/lib/internalAuth'

export type ControlApiRequest = {
  method: string
  path: string
  query?: Record<string, string | string[] | undefined>
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

export type ControlApiResponse = {
  status: number
  body: Record<string, unknown>
  headers?: Record<string, string>
}

export type ControlApiServer = {
  handle: (request: ControlApiRequest) => Promise<ControlApiResponse>
}

export function createControlApiServer(): ControlApiServer {
  return {
    async handle(request) {
      if (request.path === '/health') return handleHealthCheck()
      if (
        (
          request.path === '/connections/setup'
          || request.path === '/providers/oauth-readiness'
          || request.path === '/sync'
          || request.path === '/scheduled-sync'
          || request.path === '/dispatch-outbox'
        )
        && !(await isInternalRequestAuthorized(request.headers, {
          allowGoogleOidc: request.path === '/scheduled-sync',
        }))
      ) {
        return {
          status: 401,
          body: {
            ok: false,
            error: 'Token interno ausente ou invalido.',
          },
        }
      }

      if (request.path === '/connections/setup') return handleConnectionSetup(request)
      if (request.path === '/providers/oauth-readiness') return handleProviderOAuthReadiness(request)
      if (request.path === '/callbacks/provider') return handleProviderCallback(request)
      if (request.path === '/sync') return handleSyncDispatch(request)
      if (request.path === '/scheduled-sync') return handleScheduledSync(request)
      if (request.path === '/dispatch-outbox') return handleDispatchOutbox(request)

      return {
        status: 404,
        body: {
          ok: false,
          error: 'Rota cloud de integracoes nao encontrada',
        },
      }
    },
  }
}
