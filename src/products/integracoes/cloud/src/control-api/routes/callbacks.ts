import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'

export async function handleProviderCallback(_request: ControlApiRequest): Promise<ControlApiResponse> {
  return {
    status: 202,
    body: {
      ok: true,
      mode: 'stub',
      message: 'Callback cloud reservado para OAuth futuro.',
    },
  }
}
