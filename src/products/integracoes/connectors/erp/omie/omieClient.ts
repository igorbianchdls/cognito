import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import { ProviderError } from '@/products/integracoes/connectors/runtime/providerErrors'
import type {
  OmieCredentials,
  OmiePagePayload,
  OmiePageResult,
  OmieRequestPayload,
  OmieResourceConfig,
} from '@/products/integracoes/connectors/erp/omie/omieTypes'

const DEFAULT_BASE_URL = 'https://app.omie.com.br/api/v1'
const DEFAULT_MAX_PAGES = 100

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCredentials(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizeOmieCredentials(value: unknown): OmieCredentials {
  const credentials = parseCredentials(value)
  if (!credentials || !nonEmptyString(credentials.app_key) || !nonEmptyString(credentials.app_secret)) {
    throw new ProviderError({
      provider: 'omie',
      kind: 'auth',
      message: 'Credenciais Omie invalidas. Informe app_key e app_secret.',
      retryable: false,
    })
  }

  return {
    app_key: credentials.app_key.trim(),
    app_secret: credentials.app_secret.trim(),
  }
}

export function validateOmieConnectorCredentials(value: unknown): { ok: boolean; error?: string } {
  try {
    normalizeOmieCredentials(value)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Credenciais Omie invalidas.' }
  }
}

function getBaseUrl() {
  return (process.env.OMIE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function buildUrl(endpoint: string) {
  return `${getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

function asNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function getTotalPages(payload: OmiePagePayload): number | undefined {
  return asNumber(payload.total_de_paginas ?? payload.nTotPaginas)
}

function getTotalRecords(payload: OmiePagePayload): number | undefined {
  return asNumber(payload.total_de_registros ?? payload.nTotRegistros)
}

function getMaxPages() {
  const value = Number(process.env.OMIE_MAX_PAGES_PER_RESOURCE || DEFAULT_MAX_PAGES)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX_PAGES
}

function extractItems(payload: OmiePagePayload, itemKeys: string[]): Record<string, unknown>[] {
  for (const key of itemKeys) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => isRecord(item))
    }
  }

  const arrays = Object.values(payload).filter(Array.isArray) as unknown[][]
  if (arrays.length === 1) {
    return arrays[0].filter((item): item is Record<string, unknown> => isRecord(item))
  }

  return []
}

function assertNoOmieFault(payload: unknown, resource: string) {
  if (!isRecord(payload)) return
  const fault = payload.faultstring ?? payload.faultcode ?? payload.error ?? payload.message
  if (!fault) return

  throw new ProviderError({
    provider: 'omie',
    resource,
    kind: 'validation',
    message: String(payload.faultstring || payload.message || fault),
    retryable: false,
    details: { payload },
  })
}

export class OmieClient {
  private credentials: OmieCredentials

  constructor(credentials: OmieCredentials) {
    this.credentials = credentials
  }

  async call<T extends OmiePagePayload = OmiePagePayload>(
    config: Pick<OmieResourceConfig, 'endpoint' | 'call' | 'resource'>,
    params: Record<string, unknown>,
  ): Promise<T> {
    const body: OmieRequestPayload = {
      call: config.call,
      app_key: this.credentials.app_key,
      app_secret: this.credentials.app_secret,
      param: [params],
    }
    const response = await connectorJsonRequest<T>({
      provider: 'omie',
      resource: config.resource,
      url: buildUrl(config.endpoint),
      method: 'POST',
      body,
    })

    assertNoOmieFault(response.payload, config.resource)
    return response.payload
  }

  async requestCall<T extends OmiePagePayload = OmiePagePayload>(input: {
    resource: string
    endpoint: string
    call: string
    params: Record<string, unknown>
  }): Promise<T> {
    return this.call<T>({
      resource: input.resource,
      endpoint: input.endpoint,
      call: input.call,
    }, input.params)
  }

  async *paginate(
    config: OmieResourceConfig,
    input?: {
      initialPage?: number
      cursor?: Record<string, unknown>
      pageSize?: number
    },
  ): AsyncGenerator<OmiePageResult> {
    const pageSize = input?.pageSize || Number(process.env.OMIE_PAGE_SIZE || config.defaultPageSize)
    const maxPages = getMaxPages()
    let page = Math.max(Number(input?.initialPage || input?.cursor?.page || 1), 1)
    let loadedPages = 0

    while (loadedPages < maxPages) {
      const payload = await this.call(config, (config.buildParams || ((params) => params))({
        page,
        pageSize,
        cursor: input?.cursor,
      }))
      const items = extractItems(payload, config.itemKeys)
      const totalPages = getTotalPages(payload)
      const totalRecords = getTotalRecords(payload)
      loadedPages += 1

      const hasMoreByTotal = totalPages ? page < totalPages : undefined
      const hasMore = hasMoreByTotal ?? items.length >= pageSize
      const truncated = hasMore && loadedPages >= maxPages

      yield {
        page,
        pageSize,
        items,
        payload,
        totalPages,
        totalRecords,
        hasMore,
        truncated,
      }

      if (!hasMore || truncated) return
      page += 1
    }
  }
}

export function createOmieClient(credentials: unknown): OmieClient {
  return new OmieClient(normalizeOmieCredentials(credentials))
}
