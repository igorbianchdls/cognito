import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'

export async function handleConnectionSetup(_request: ControlApiRequest): Promise<ControlApiResponse> {
  return {
    status: 202,
    body: {
      ok: true,
      mode: 'stub',
      message: 'Setup cloud reservado. A implementacao real sera adicionada quando Google Cloud entrar.',
    },
  }
}
