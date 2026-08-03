import type {
  ErpClient,
  ErpEntityCreateRequest,
  ErpEntityCreateResponse,
  ErpEntityActionRequest,
  ErpEntityActionResponse,
  ErpEntityListRequest,
  ErpEntityListResponse,
  ErpEntityUpdateRequest,
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
  if (request?.page) params.set('page', String(request.page))
  if (request?.pageSize) params.set('pageSize', String(request.pageSize))

  Object.entries(request?.filters || {}).forEach(([key, value]) => {
    if (value) params.set(`filter.${key}`, value)
  })

  const suffix = params.toString()
  return `/api/erp/${encodeURIComponent(config.id)}${suffix ? `?${suffix}` : ''}`
}

function buildActionUrl(config: ErpEntityConfig, request: ErpEntityActionRequest) {
  if (config.id === 'pedidos') {
    return `/api/erp/vendas/${encodeURIComponent(request.recordId)}/${encodeURIComponent(request.actionId)}`
  }

  if (config.id === 'pedidos-compra') {
    return `/api/erp/compras/${encodeURIComponent(request.recordId)}/${encodeURIComponent(request.actionId)}`
  }

  if (config.id === 'contas-a-receber' && request.actionId === 'baixar') {
    return `/api/erp/contas-receber-parcelas/${encodeURIComponent(request.recordId)}/baixar`
  }

  if (config.id === 'contas-a-pagar' && request.actionId === 'baixar') {
    return `/api/erp/contas-pagar-parcelas/${encodeURIComponent(request.recordId)}/baixar`
  }

  throw new Error('Acao indisponivel para este modulo.')
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
        'Idempotency-Key': typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      },
      body: JSON.stringify({ values: request.values }),
    })
    return parseJsonResponse<ErpEntityCreateResponse<TRecord>>(response)
  },

  async getEntityRecord<TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string) {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}/${encodeURIComponent(id)}`, { cache: 'no-store' })
    return parseJsonResponse<ErpEntityCreateResponse<TRecord>>(response)
  },

  async updateEntityRecord<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>, id: string, request: ErpEntityUpdateRequest,
  ) {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return parseJsonResponse<ErpEntityCreateResponse<TRecord>>(response)
  },

  async deactivateEntityRecord<TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string, expectedVersion: number) {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedVersion }),
    })
    return parseJsonResponse<ErpEntityCreateResponse<TRecord>>(response)
  },

  async runEntityAction(
    config: ErpEntityConfig,
    request: ErpEntityActionRequest,
  ): Promise<ErpEntityActionResponse> {
    const idempotencyKey = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
    const response = await fetch(buildActionUrl(config, request), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ values: request.values || {} }),
    })
    return {
      result: await parseJsonResponse<unknown>(response),
    }
  },
}
