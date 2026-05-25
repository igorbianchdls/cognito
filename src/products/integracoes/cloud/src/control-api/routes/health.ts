import type { ControlApiResponse } from '@/products/integracoes/cloud/src/control-api/server'

export async function handleHealthCheck(): Promise<ControlApiResponse> {
  return {
    status: 200,
    body: {
      ok: true,
      service: 'integracoes-control-api',
      mode: 'stub',
    },
  }
}
