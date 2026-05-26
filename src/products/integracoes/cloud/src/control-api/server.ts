import { handleProviderCallback } from '@/products/integracoes/cloud/src/control-api/routes/callbacks'
import { handleConnectionSetup } from '@/products/integracoes/cloud/src/control-api/routes/connections'
import { handleHealthCheck } from '@/products/integracoes/cloud/src/control-api/routes/health'
import { handleSyncDispatch } from '@/products/integracoes/cloud/src/control-api/routes/sync'
import { isInternalRequestAuthorized } from '@/products/integracoes/cloud/src/lib/internalAuth'

export type ControlApiRequest = {
  method: string
  path: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

export type ControlApiResponse = {
  status: number
  body: Record<string, unknown>
}

export type ControlApiServer = {
  handle: (request: ControlApiRequest) => Promise<ControlApiResponse>
}

export function createControlApiServer(): ControlApiServer {
  return {
    async handle(request) {
      if (request.path === '/health') return handleHealthCheck()
      if ((request.path === '/connections/setup' || request.path === '/sync') && !isInternalRequestAuthorized(request.headers)) {
        return {
          status: 401,
          body: {
            ok: false,
            error: 'Token interno ausente ou invalido.',
          },
        }
      }

      if (request.path === '/connections/setup') return handleConnectionSetup(request)
      if (request.path === '/callbacks/provider') return handleProviderCallback(request)
      if (request.path === '/sync') return handleSyncDispatch(request)

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
