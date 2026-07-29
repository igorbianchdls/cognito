import type {
  ErpClient,
  ErpEntityCreateRequest,
  ErpEntityCreateResponse,
  ErpEntityListRequest,
  ErpEntityListResponse,
} from '@/products/erp/shared/contracts'
import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    throw new Error(body.error || 'Nao foi possivel completar a operacao.')
  }
  return body as T
}

function buildListUrl<TRecord extends ErpEntityRecord>(
  config: ErpEntityConfig<TRecord>,
  request?: ErpEntityListRequest,
) {
  const params = new URLSearchParams()
  const query = request?.query?.trim()
  if (query) params.set('query', query)

  Object.entries(request?.filters || {}).forEach(([key, value]) => {
    if (value) params.set(`filter.${key}`, value)
  })

  const suffix = params.toString()
  return `/api/erp/${encodeURIComponent(config.id)}${suffix ? `?${suffix}` : ''}`
}

export const erpClient: ErpClient = {
  async listEntityRecords<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request?: ErpEntityListRequest,
  ): Promise<ErpEntityListResponse<TRecord>> {
    const response = await fetch(buildListUrl(config, request), {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    })
    return parseJsonResponse<ErpEntityListResponse<TRecord>>(response)
  },

  async createEntityRecord<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request: ErpEntityCreateRequest,
  ): Promise<ErpEntityCreateResponse<TRecord>> {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: request.values }),
    })
    return parseJsonResponse<ErpEntityCreateResponse<TRecord>>(response)
  },
}
