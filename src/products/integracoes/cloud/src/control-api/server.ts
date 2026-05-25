import { handleProviderCallback } from '@/products/integracoes/cloud/src/control-api/routes/callbacks'
import { handleConnectionSetup } from '@/products/integracoes/cloud/src/control-api/routes/connections'
import { handleHealthCheck } from '@/products/integracoes/cloud/src/control-api/routes/health'
import { handleSyncDispatch } from '@/products/integracoes/cloud/src/control-api/routes/sync'

export type ControlApiRequest = {
  method: string
  path: string
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
