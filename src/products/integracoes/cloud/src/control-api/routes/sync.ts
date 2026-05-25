import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'

export async function handleSyncDispatch(_request: ControlApiRequest): Promise<ControlApiResponse> {
  return {
    status: 202,
    body: {
      ok: true,
      mode: 'stub',
      message: 'Despacho de sync reservado para Pub/Sub ou Cloud Run Jobs.',
    },
  }
}
