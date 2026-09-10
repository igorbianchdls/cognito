import { ErpMutation } from './erpMutation'
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
import { parseErpPayload, parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { erpListEnvelopeSchema, erpRecordEnvelopeSchema } from '@/products/erp/shared/erpTransport'

const requests = new WeakMap<object, ErpMutation>()
function operationFor(request: object, replaySafe: boolean) {
  let operation = requests.get(request)
  if (!operation) { operation = new ErpMutation(undefined, replaySafe); requests.set(request, operation) }
  return operation
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
    return parseErpResponse<ErpEntityListResponse<TRecord>>(response, erpListEnvelopeSchema)
  },

  async createEntityRecord<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request: ErpEntityCreateRequest,
  ): Promise<ErpEntityCreateResponse<TRecord>> {
    const operation = request.operation || operationFor(request, ['pedidos', 'pedidos-compra', 'contas-a-pagar'].includes(config.id))
    return operation.submit<ErpEntityCreateResponse<TRecord>>(`/api/erp/${encodeURIComponent(config.id)}`, { values: request.values },
      body => parseErpPayload<ErpEntityCreateResponse<TRecord>>(body, erpRecordEnvelopeSchema))
  },

  async getEntityRecord<TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string) {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}/${encodeURIComponent(id)}`, { cache: 'no-store' })
    return parseErpResponse<ErpEntityCreateResponse<TRecord>>(response, erpRecordEnvelopeSchema)
  },

  async updateEntityRecord<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>, id: string, request: ErpEntityUpdateRequest,
  ) {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    return parseErpResponse<ErpEntityCreateResponse<TRecord>>(response, erpRecordEnvelopeSchema)
  },

  async deactivateEntityRecord<TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string, expectedVersion: number) {
    const response = await fetch(`/api/erp/${encodeURIComponent(config.id)}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ expectedVersion }),
    })
    return parseErpResponse<ErpEntityCreateResponse<TRecord>>(response, erpRecordEnvelopeSchema)
  },

  async runEntityAction(
    config: ErpEntityConfig,
    request: ErpEntityActionRequest,
  ): Promise<ErpEntityActionResponse> {
    const operation = request.operation || operationFor(request, request.actionId === 'baixar')
    return { result: await operation.submit<unknown>(buildActionUrl(config, request), { values: request.values || {} }) }
  },
}
