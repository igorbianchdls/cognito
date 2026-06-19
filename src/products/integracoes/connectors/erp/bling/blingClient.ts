import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import { ProviderError } from '@/products/integracoes/connectors/runtime/providerErrors'
import type {
  BlingCredentials,
  BlingPagePayload,
  BlingPageResult,
  BlingResourceConfig,
} from '@/products/integracoes/connectors/erp/bling/blingTypes'

const DEFAULT_BASE_URL = 'https://api.bling.com.br/Api/v3'
const DEFAULT_MAX_PAGES = 100
const DEFAULT_RATE_LIMIT_MS = 350

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

export function normalizeBlingCredentials(value: unknown): BlingCredentials {
  const credentials = parseCredentials(value)
  const accessToken = credentials?.accessToken ?? credentials?.access_token
  if (!credentials || !nonEmptyString(accessToken)) {
    throw new ProviderError({
      provider: 'bling',
      kind: 'auth',
      message: 'Credenciais Bling invalidas. OAuth precisa retornar accessToken.',
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

export function validateBlingConnectorCredentials(value: unknown): { ok: boolean; error?: string } {
  try {
    normalizeBlingCredentials(value)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Credenciais Bling invalidas.' }
  }
}

function getBaseUrl() {
  return (process.env.BLING_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function buildUrlFromPath(path: string, query?: Record<string, string | number | boolean>) {
  const url = new URL(`${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function buildUrl(config: BlingResourceConfig, query?: Record<string, string | number | boolean>) {
  return buildUrlFromPath(config.path, query)
}

function asNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function extractTotalPages(payload: BlingPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  return asNumber(payload.totalPaginas ?? payload.total_paginas ?? payload.totalPages ?? payload.pages)
}

function extractTotalRecords(payload: BlingPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  return asNumber(payload.totalRegistros ?? payload.total_registros ?? payload.totalItems ?? payload.total)
}

function extractItems(payload: BlingPagePayload, itemKeys: string[]): Record<string, unknown>[] {
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
  const value = Number(process.env.BLING_MAX_PAGES_PER_RESOURCE || DEFAULT_MAX_PAGES)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX_PAGES
}

function getRateLimitMs() {
  const value = Number(process.env.INTEGRATIONS_RATE_LIMIT_BLING_MS || DEFAULT_RATE_LIMIT_MS)
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_RATE_LIMIT_MS
}

export class BlingClient {
  private credentials: BlingCredentials

  constructor(credentials: BlingCredentials) {
    this.credentials = credentials
  }

  async request<T extends BlingPagePayload = BlingPagePayload>(
    config: BlingResourceConfig,
    input: {
      page: number
      pageSize: number
      cursor?: Record<string, unknown>
    },
  ): Promise<T> {
    const response = await connectorJsonRequest<T>({
      provider: 'bling',
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

  async requestPath<T extends BlingPagePayload = BlingPagePayload>(
    input: {
      resource: string
      path: string
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      query?: Record<string, string | number | boolean>
      body?: Record<string, unknown>
    },
  ): Promise<T> {
    const response = await connectorJsonRequest<T>({
      provider: 'bling',
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
    config: BlingResourceConfig,
    input?: {
      initialPage?: number
      cursor?: Record<string, unknown>
      pageSize?: number
    },
  ): AsyncGenerator<BlingPageResult> {
    const pageSize = input?.pageSize || Number(process.env.BLING_PAGE_SIZE || config.defaultPageSize)
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

export function createBlingClient(credentials: unknown): BlingClient {
  return new BlingClient(normalizeBlingCredentials(credentials))
}
