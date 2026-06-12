import type { Connector, ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'
import { connectorJsonRequest } from '@/products/integracoes/cloud/src/lib/connectorHttp'
import { ProviderError } from '@/products/integracoes/cloud/src/lib/providerErrors'

export type EcommerceCredentials = {
  accessToken?: string
  apiKey?: string
  apiSecret?: string
  consumerKey?: string
  consumerSecret?: string
  baseUrl?: string
  shop?: string
  storeId?: string
  accountId?: string
  sellerId?: string
  appKey?: string
  appToken?: string
  userAgent?: string
}

export type EcommerceResourceConfig = {
  resource: string
  path: string
  itemKeys: string[]
  defaultPageSize: number
  supportsIncremental?: boolean
  method?: 'GET' | 'POST'
  requiredFields?: string[]
  buildPath?: (input: PageInput & { credentials: EcommerceCredentials }) => string
  buildQuery?: (input: PageInput & { credentials: EcommerceCredentials }) => Record<string, string | number | boolean | undefined>
  buildBody?: (input: PageInput & { credentials: EcommerceCredentials }) => Record<string, unknown>
  headers?: (credentials: EcommerceCredentials) => Record<string, string>
  getNextCursor?: (payload: Record<string, unknown>, items: Record<string, unknown>[], input: PageInput) => Record<string, unknown> | undefined
  transformItems?: (items: Record<string, unknown>[], payload: Record<string, unknown>) => Record<string, unknown>[]
}

type PageInput = {
  page: number
  pageSize: number
  cursor?: Record<string, unknown>
}

type CreateEcommerceConnectorInput = {
  provider: string
  defaultBaseUrl: string
  envBaseUrlKey: string
  resources: EcommerceResourceConfig[]
  testResource: string
  rateLimitMs?: number
  authMode?: 'bearer' | 'api_key_header' | 'api_key_query' | 'basic' | 'custom'
  apiKeyHeader?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseRecord(value: unknown): Record<string, unknown> | null {
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

function pickString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (nonEmptyString(value)) return value.trim()
  }
  return undefined
}

function normalizeCredentials(provider: string, value: unknown): EcommerceCredentials {
  const credentials = parseRecord(value)
  if (!credentials) {
    throw new ProviderError({
      provider,
      kind: 'auth',
      message: `Credenciais ${provider} invalidas.`,
      retryable: false,
    })
  }

  const normalized = {
    accessToken: pickString(credentials, 'accessToken', 'access_token', 'token'),
    apiKey: pickString(credentials, 'apiKey', 'api_key', 'key'),
    apiSecret: pickString(credentials, 'apiSecret', 'api_secret', 'secret'),
    consumerKey: pickString(credentials, 'consumerKey', 'consumer_key'),
    consumerSecret: pickString(credentials, 'consumerSecret', 'consumer_secret'),
    baseUrl: pickString(credentials, 'baseUrl', 'base_url', 'url'),
    shop: pickString(credentials, 'shop', 'shopDomain', 'shop_domain', 'domain'),
    storeId: pickString(credentials, 'storeId', 'store_id'),
    accountId: pickString(credentials, 'accountId', 'account_id'),
    sellerId: pickString(credentials, 'sellerId', 'seller_id'),
    appKey: pickString(credentials, 'appKey', 'app_key'),
    appToken: pickString(credentials, 'appToken', 'app_token'),
    userAgent: pickString(credentials, 'userAgent', 'user_agent'),
  }

  if (!normalized.accessToken && !normalized.apiKey && !normalized.consumerKey && !normalized.appKey) {
    throw new ProviderError({
      provider,
      kind: 'auth',
      message: `Credenciais ${provider} invalidas. Informe accessToken, apiKey, consumerKey ou appKey.`,
      retryable: false,
    })
  }

  return normalized
}

function extractItems(payload: unknown, itemKeys: string[]): Record<string, unknown>[] {
  const normalizeArray = (items: unknown[]) => items
    .map((item) => isRecord(item) ? item : { value: item })
    .filter((item) => item.value !== undefined || Object.keys(item).length > 0)

  if (Array.isArray(payload)) return normalizeArray(payload)
  if (!isRecord(payload)) return []
  for (const key of itemKeys) {
    const value = key.split('.').reduce<unknown>((current, part) => isRecord(current) ? current[part] : undefined, payload)
    if (Array.isArray(value)) return normalizeArray(value)
    if (isRecord(value)) return [value]
  }
  const arrays = Object.values(payload).filter(Array.isArray) as unknown[][]
  if (arrays.length === 1) return normalizeArray(arrays[0])
  return []
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function defaultHeaders(input: CreateEcommerceConnectorInput, credentials: EcommerceCredentials): Record<string, string> {
  if (input.authMode === 'custom') return {}
  if (input.authMode === 'api_key_header') {
    const token = credentials.apiKey || credentials.accessToken || credentials.appToken
    return token ? { [input.apiKeyHeader || 'X-API-Key']: token } : {}
  }
  if (input.authMode === 'basic' && credentials.consumerKey && credentials.consumerSecret) {
    return { Authorization: `Basic ${Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64')}` }
  }
  const token = credentials.accessToken || credentials.apiKey || credentials.appToken
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function defaultNextCursor(payload: Record<string, unknown>, items: Record<string, unknown>[], input: PageInput) {
  const paging = isRecord(payload.paging) ? payload.paging : undefined
  const next = isRecord(paging?.next) ? paging.next : undefined
  const after = next?.after ?? payload.next_cursor ?? payload.nextCursor
  if (typeof after === 'string' || typeof after === 'number') return { after }

  const total = Number(payload.total ?? payload.total_count ?? payload.totalCount ?? payload.count ?? 0)
  if (Number.isFinite(total) && total > input.page * input.pageSize) return { page: input.page + 1 }
  if (payload.has_more === true || payload.hasMore === true) return { page: input.page + 1 }
  if (items.length >= input.pageSize) return { page: input.page + 1 }
  return undefined
}

function mapRow(provider: string, resource: string, row: Record<string, unknown>, page: number, index: number): ConnectorRow {
  const externalId = row.id ?? row.ID ?? row.uuid ?? row.code ?? row.order_number ?? row.number ?? row.reference ?? `${provider}_${resource}_${page}_${index + 1}`
  return {
    external_id: typeof externalId === 'string' || typeof externalId === 'number' ? String(externalId) : `${provider}_${resource}_${page}_${index + 1}`,
    ecommerce_resource: resource,
    ecommerce_page: page,
    raw: row,
  }
}

function resolveBaseUrl(input: CreateEcommerceConnectorInput, credentials: EcommerceCredentials) {
  if (process.env[input.envBaseUrlKey]) return process.env[input.envBaseUrlKey] as string
  if (credentials.baseUrl) return credentials.baseUrl
  if (input.provider === 'shopify' && credentials.shop) return `https://${credentials.shop.replace(/^https?:\/\//, '')}`
  return input.defaultBaseUrl
}

export function createPaginatedEcommerceConnector(input: CreateEcommerceConnectorInput): Connector {
  const resourceMap = new Map(input.resources.map((resource) => [resource.resource, resource]))
  const manifest: ConnectorResourceManifest[] = input.resources.map((resource) => ({
    resource: resource.resource,
    supportsIncremental: resource.supportsIncremental,
    defaultPageSize: resource.defaultPageSize,
    requiredFields: resource.requiredFields || ['accessToken'],
  }))

  async function requestPage(context: ConnectorContext, resource: EcommerceResourceConfig, pageInput: PageInput) {
    const credentials = normalizeCredentials(input.provider, context.credentials)
    const buildInput = { ...pageInput, credentials }
    const method = resource.method || 'GET'
    const query = resource.buildQuery?.(buildInput) || {}
    if (input.authMode === 'api_key_query' && credentials.apiKey) query.api_key = credentials.apiKey
    const body = method === 'POST' ? resource.buildBody?.(buildInput) : undefined
    const baseUrl = resolveBaseUrl(input, credentials)
    const path = resource.buildPath?.(buildInput) || resource.path

    const response = await connectorJsonRequest<Record<string, unknown> | Record<string, unknown>[]>({
      provider: input.provider,
      resource: resource.resource,
      url: buildUrl(baseUrl, path, query),
      method,
      headers: {
        ...defaultHeaders(input, credentials),
        ...(credentials.userAgent ? { 'User-Agent': credentials.userAgent } : {}),
        ...(resource.headers?.(credentials) || {}),
      },
      body,
      rateLimitMs: input.rateLimitMs,
    })

    return response.payload
  }

  return {
    domain: 'ecommerce',
    provider: input.provider,
    resources: manifest,
    validateCredentials(credentials) {
      try {
        normalizeCredentials(input.provider, credentials)
        return { ok: true }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : `Credenciais ${input.provider} invalidas.` }
      }
    },
    async testConnection(context) {
      const resource = resourceMap.get(input.testResource) || input.resources[0]
      const payload = await requestPage(context, resource, { page: 1, pageSize: 1, cursor: undefined })
      return {
        status: 'success',
        recordsIn: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        metadata: { mode: `${input.provider}_api`, testResource: resource.resource, sampleCount: extractItems(payload, resource.itemKeys).length },
      }
    },
    async syncResource(context, resourceName) {
      const resource = resourceMap.get(resourceName)
      if (!resource) return { status: 'warning', recordsIn: 0, recordsUpdated: 0, recordsFailed: 0, errorMessage: `Recurso nao mapeado: ${resourceName}` }

      const pageSize = Number(process.env[`${input.provider.toUpperCase()}_PAGE_SIZE`] || resource.defaultPageSize)
      const maxPages = Number(process.env[`${input.provider.toUpperCase()}_MAX_PAGES_PER_RESOURCE`] || 100)
      const batches = []
      let cursor = context.cursor
      let page = Math.max(Number(cursor?.page || 1), 1)
      let recordsIn = 0
      let truncated = false

      for (let loaded = 0; loaded < maxPages; loaded += 1) {
        const payload = await requestPage(context, resource, { page, pageSize, cursor })
        const payloadRecord = isRecord(payload) ? payload : { data: payload }
        const rawItems = extractItems(payload, resource.itemKeys)
        const items = resource.transformItems ? resource.transformItems(rawItems, payloadRecord) : rawItems
        const rows = items.map((row, index) => mapRow(input.provider, resource.resource, row, page, index))
        recordsIn += rows.length
        const nextCursor = (resource.getNextCursor || defaultNextCursor)(payloadRecord, items, { page, pageSize, cursor })
        batches.push({ resource: resource.resource, rows, nextCursor })
        if (!nextCursor) break
        if (loaded + 1 >= maxPages) {
          truncated = true
          break
        }
        cursor = nextCursor
        page = Number(nextCursor.page || page + 1)
      }

      return {
        status: truncated ? 'warning' : 'success',
        recordsIn,
        recordsUpdated: recordsIn,
        recordsFailed: 0,
        batches,
        metadata: { mode: `${input.provider}_api`, resource: resource.resource, truncated },
      }
    },
    async refreshToken() {
      return { status: 'success', recordsIn: 0, recordsUpdated: 0, recordsFailed: 0, metadata: { mode: 'oauth2', refreshed: false } }
    },
  }
}
