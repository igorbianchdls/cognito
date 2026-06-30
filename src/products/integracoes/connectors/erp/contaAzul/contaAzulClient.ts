import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import { ProviderError } from '@/products/integracoes/connectors/runtime/providerErrors'
import type {
  ContaAzulCredentials,
  ContaAzulPagePayload,
  ContaAzulPageResult,
  ContaAzulResourceConfig,
} from '@/products/integracoes/connectors/erp/contaAzul/contaAzulTypes'

const DEFAULT_BASE_URL = 'https://api-v2.contaazul.com'
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

export function normalizeContaAzulCredentials(value: unknown): ContaAzulCredentials {
  const credentials = parseCredentials(value)
  const accessToken = credentials?.accessToken ?? credentials?.access_token
  if (!credentials || !nonEmptyString(accessToken)) {
    throw new ProviderError({
      provider: 'conta_azul',
      kind: 'auth',
      message: 'Credenciais Conta Azul invalidas. OAuth precisa retornar accessToken.',
      retryable: false,
    })
  }

  return {
    accessToken: accessToken.trim(),
    refreshToken: nonEmptyString(credentials.refreshToken)
      ? credentials.refreshToken.trim()
      : nonEmptyString(credentials.refresh_token)
        ? credentials.refresh_token.trim()
        : undefined,
    expiresAt: nonEmptyString(credentials.expiresAt)
      ? credentials.expiresAt.trim()
      : nonEmptyString(credentials.expires_at)
        ? credentials.expires_at.trim()
        : undefined,
    tokenType: nonEmptyString(credentials.tokenType)
      ? credentials.tokenType.trim()
      : nonEmptyString(credentials.token_type)
        ? credentials.token_type.trim()
        : undefined,
    scope: nonEmptyString(credentials.scope) ? credentials.scope.trim() : undefined,
  }
}

export function validateContaAzulConnectorCredentials(value: unknown): { ok: boolean; error?: string } {
  try {
    normalizeContaAzulCredentials(value)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Credenciais Conta Azul invalidas.' }
  }
}

function getBaseUrl() {
  return (process.env.CONTA_AZUL_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function buildUrl(path: string, query?: Record<string, string | number | boolean>) {
  const url = new URL(`${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function asNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function extractTotalPages(payload: ContaAzulPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  const pagination = isRecord(payload.paginacao) ? payload.paginacao : {}
  return asNumber(
    payload.total_paginas
    ?? payload.totalPages
    ?? payload.total_de_paginas
    ?? payload.pages
    ?? pagination.total_paginas
    ?? pagination.totalPages,
  )
}

function extractTotalRecords(payload: ContaAzulPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  const pagination = isRecord(payload.paginacao) ? payload.paginacao : {}
  return asNumber(
    payload.total_itens
    ?? payload.totalItems
    ?? payload.total
    ?? payload.total_de_registros
    ?? pagination.total_itens
    ?? pagination.totalItems,
  )
}

function getMaxPages() {
  const value = Number(process.env.CONTA_AZUL_MAX_PAGES_PER_RESOURCE || DEFAULT_MAX_PAGES)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX_PAGES
}

export function extractContaAzulItems(
  payload: ContaAzulPagePayload,
  itemKeys: string[],
  responseMode: ContaAzulResourceConfig['responseMode'] = 'paginated',
): Record<string, unknown>[] {
  if (responseMode === 'single') {
    if (isRecord(payload)) return [payload]
    return [{ value: payload }]
  }

  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => isRecord(item))
  }

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

export class ContaAzulClient {
  private credentials: ContaAzulCredentials

  constructor(credentials: ContaAzulCredentials) {
    this.credentials = credentials
  }

  async request<T extends ContaAzulPagePayload = ContaAzulPagePayload>(
    config: ContaAzulResourceConfig,
    input: {
      page: number
      pageSize: number
      cursor?: Record<string, unknown>
    },
  ): Promise<T> {
    const method = config.method || 'GET'
    const query = method === 'GET' ? config.buildQuery?.(input) : undefined
    const body = method === 'POST' ? config.buildBody?.(input) : undefined

    const response = await connectorJsonRequest<T>({
      provider: 'conta_azul',
      resource: config.resource,
      url: buildUrl(config.path, query),
      method,
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
      body,
    })

    return response.payload
  }

  async requestPath<T extends ContaAzulPagePayload = ContaAzulPagePayload>(
    input: {
      resource: string
      path: string
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      query?: Record<string, string | number | boolean>
      body?: Record<string, unknown>
    },
  ): Promise<T> {
    const response = await connectorJsonRequest<T>({
      provider: 'conta_azul',
      resource: input.resource,
      url: buildUrl(input.path, input.query),
      method: input.method || 'GET',
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
      body: input.body,
    })

    return response.payload
  }

  async fetchPage(
    config: ContaAzulResourceConfig,
    input?: {
      page?: number
      cursor?: Record<string, unknown>
      pageSize?: number
    },
  ): Promise<ContaAzulPageResult> {
    const pageSize = input?.pageSize || Number(process.env.CONTA_AZUL_PAGE_SIZE || config.defaultPageSize)
    const page = Math.max(Number(input?.page || input?.cursor?.page || 1), 1)
    const payload = await this.request(config, {
      page,
      pageSize,
      cursor: input?.cursor,
    })
    const items = extractContaAzulItems(payload, config.itemKeys, config.responseMode)
    const totalPages = extractTotalPages(payload)
    const totalRecords = extractTotalRecords(payload)
    const hasMoreByTotal = totalPages ? page < totalPages : undefined
    const hasMore = config.responseMode === 'single' || config.paginationMode === 'none'
      ? false
      : hasMoreByTotal ?? items.length >= pageSize

    return {
      page,
      pageSize,
      items,
      payload,
      totalPages,
      totalRecords,
      hasMore,
      truncated: false,
    }
  }

  async *paginate(
    config: ContaAzulResourceConfig,
    input?: {
      initialPage?: number
      cursor?: Record<string, unknown>
      pageSize?: number
    },
  ): AsyncGenerator<ContaAzulPageResult> {
    const pageSize = input?.pageSize || Number(process.env.CONTA_AZUL_PAGE_SIZE || config.defaultPageSize)
    const maxPages = getMaxPages()
    let page = Math.max(Number(input?.initialPage || input?.cursor?.page || 1), 1)
    let loadedPages = 0

    while (loadedPages < maxPages) {
      const pageResult = await this.fetchPage(config, {
        page,
        pageSize,
        cursor: input?.cursor,
      })
      loadedPages += 1
      const truncated = pageResult.hasMore && loadedPages >= maxPages

      yield {
        ...pageResult,
        truncated,
      }

      if (!pageResult.hasMore || truncated) return
      page += 1
    }
  }
}

export function createContaAzulClient(credentials: unknown): ContaAzulClient {
  return new ContaAzulClient(normalizeContaAzulCredentials(credentials))
}
