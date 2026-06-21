import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import { ProviderError } from '@/products/integracoes/connectors/runtime/providerErrors'
import type {
  TinyCredentials,
  TinyPagePayload,
  TinyPageResult,
  TinyResourceConfig,
} from '@/products/integracoes/connectors/erp/tiny/tinyTypes'

const DEFAULT_BASE_URL = 'https://erp.tiny.com.br/public-api/v3'
const DEFAULT_MAX_PAGES = 100
const DEFAULT_RATE_LIMIT_MS = 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseCredentials(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : { accessToken: value }
  } catch {
    return { accessToken: value }
  }
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizeTinyCredentials(value: unknown): TinyCredentials {
  const credentials = parseCredentials(value)
  const accessToken = credentials?.accessToken ?? credentials?.access_token ?? credentials?.token
  if (!credentials || !nonEmptyString(accessToken)) {
    throw new ProviderError({
      provider: 'olist_erp',
      kind: 'auth',
      message: 'Credenciais Olist ERP invalidas. OAuth precisa retornar accessToken.',
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

export function validateTinyConnectorCredentials(value: unknown): { ok: boolean; error?: string } {
  try {
    normalizeTinyCredentials(value)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Credenciais Olist ERP invalidas.' }
  }
}

function getBaseUrl() {
  return (process.env.OLIST_ERP_API_BASE_URL || process.env.TINY_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function buildUrlFromPath(path: string, query?: Record<string, string | number | boolean>) {
  const url = new URL(`${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function buildUrl(config: TinyResourceConfig, query?: Record<string, string | number | boolean>) {
  return buildUrlFromPath(config.path, query)
}

function asNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function extractTotalPages(payload: TinyPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  return asNumber(payload.totalPaginas ?? payload.total_paginas ?? payload.totalPages ?? payload.pages)
}

function extractTotalRecords(payload: TinyPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  return asNumber(payload.totalRegistros ?? payload.total_registros ?? payload.totalItems ?? payload.total)
}

function extractItems(payload: TinyPagePayload, itemKeys: string[]): Record<string, unknown>[] {
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

function getMaxPages() {
  const value = Number(process.env.TINY_MAX_PAGES_PER_RESOURCE || DEFAULT_MAX_PAGES)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX_PAGES
}

function getRateLimitMs() {
  const value = Number(process.env.INTEGRATIONS_RATE_LIMIT_TINY_MS || DEFAULT_RATE_LIMIT_MS)
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_RATE_LIMIT_MS
}

export class TinyClient {
  private credentials: TinyCredentials

  constructor(credentials: TinyCredentials) {
    this.credentials = credentials
  }

  async request<T extends TinyPagePayload = TinyPagePayload>(
    config: TinyResourceConfig,
    input: {
      page: number
      pageSize: number
      cursor?: Record<string, unknown>
    },
  ): Promise<T> {
    const response = await connectorJsonRequest<T>({
      provider: 'olist_erp',
      resource: config.resource,
      url: buildUrl(config, config.buildQuery?.(input)),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
      rateLimitMs: getRateLimitMs(),
    })

    return response.payload
  }

  async requestPath<T extends TinyPagePayload = TinyPagePayload>(
    input: {
      resource: string
      path: string
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      query?: Record<string, string | number | boolean>
      body?: Record<string, unknown>
    },
  ): Promise<T> {
    const response = await connectorJsonRequest<T>({
      provider: 'olist_erp',
      resource: input.resource,
      url: buildUrlFromPath(input.path, input.query),
      method: input.method || 'GET',
      headers: {
        Authorization: `Bearer ${this.credentials.accessToken}`,
      },
      body: input.body,
      rateLimitMs: getRateLimitMs(),
    })

    return response.payload
  }

  async *paginate(
    config: TinyResourceConfig,
    input?: {
      initialPage?: number
      cursor?: Record<string, unknown>
      pageSize?: number
    },
  ): AsyncGenerator<TinyPageResult> {
    const pageSize = input?.pageSize || Number(process.env.TINY_PAGE_SIZE || config.defaultPageSize)
    const maxPages = getMaxPages()
    let page = Math.max(Number(input?.initialPage || input?.cursor?.page || 1), 1)
    let loadedPages = 0

    while (loadedPages < maxPages) {
      const payload = await this.request(config, {
        page,
        pageSize,
        cursor: input?.cursor,
      })
      const items = extractItems(payload, config.itemKeys)
      const totalPages = extractTotalPages(payload)
      const totalRecords = extractTotalRecords(payload)
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

export function createTinyClient(credentials: unknown): TinyClient {
  return new TinyClient(normalizeTinyCredentials(credentials))
}
