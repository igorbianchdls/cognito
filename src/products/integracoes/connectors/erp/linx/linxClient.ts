import { connectorJsonRequest } from '@/products/integracoes/cloud/src/lib/connectorHttp'
import { ProviderError } from '@/products/integracoes/cloud/src/lib/providerErrors'
import type {
  LinxCredentials,
  LinxPagePayload,
  LinxPageResult,
  LinxResourceConfig,
} from '@/products/integracoes/connectors/erp/linx/linxTypes'

const DEFAULT_BASE_URL = 'https://api.linx.com.br'
const DEFAULT_MAX_PAGES = 100
const DEFAULT_RATE_LIMIT_MS = 500

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

export function normalizeLinxCredentials(value: unknown): LinxCredentials {
  const credentials = parseCredentials(value)
  const accessToken = credentials?.accessToken ?? credentials?.access_token ?? credentials?.token
  if (!credentials || !nonEmptyString(accessToken)) {
    throw new ProviderError({
      provider: 'linx',
      kind: 'auth',
      message: 'Credenciais Linx invalidas. Informe accessToken ou conclua OAuth.',
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

export function validateLinxConnectorCredentials(value: unknown): { ok: boolean; error?: string } {
  try {
    normalizeLinxCredentials(value)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Credenciais Linx invalidas.' }
  }
}

function getBaseUrl() {
  return (process.env.LINX_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

function buildUrl(config: LinxResourceConfig, query?: Record<string, string | number | boolean>) {
  const url = new URL(`${getBaseUrl()}${config.path.startsWith('/') ? config.path : `/${config.path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function asNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function extractTotalPages(payload: LinxPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  return asNumber(payload.totalPages ?? payload.total_paginas ?? payload.totalPaginas ?? payload.pages)
}

function extractTotalRecords(payload: LinxPagePayload): number | undefined {
  if (!isRecord(payload)) return undefined
  return asNumber(payload.totalItems ?? payload.total_registros ?? payload.totalRegistros ?? payload.total)
}

function extractItems(payload: LinxPagePayload, itemKeys: string[]): Record<string, unknown>[] {
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
  const value = Number(process.env.LINX_MAX_PAGES_PER_RESOURCE || DEFAULT_MAX_PAGES)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX_PAGES
}

function getRateLimitMs() {
  const value = Number(process.env.INTEGRATIONS_RATE_LIMIT_LINX_MS || DEFAULT_RATE_LIMIT_MS)
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_RATE_LIMIT_MS
}

export class LinxClient {
  private credentials: LinxCredentials

  constructor(credentials: LinxCredentials) {
    this.credentials = credentials
  }

  async request<T extends LinxPagePayload = LinxPagePayload>(
    config: LinxResourceConfig,
    input: {
      page: number
      pageSize: number
      cursor?: Record<string, unknown>
    },
  ): Promise<T> {
    const response = await connectorJsonRequest<T>({
      provider: 'linx',
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

  async *paginate(
    config: LinxResourceConfig,
    input?: {
      initialPage?: number
      cursor?: Record<string, unknown>
      pageSize?: number
    },
  ): AsyncGenerator<LinxPageResult> {
    const pageSize = input?.pageSize || Number(process.env.LINX_PAGE_SIZE || config.defaultPageSize)
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

export function createLinxClient(credentials: unknown): LinxClient {
  return new LinxClient(normalizeLinxCredentials(credentials))
}
