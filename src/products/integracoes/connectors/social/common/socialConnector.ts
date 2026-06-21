import type { Connector, ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'
import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import { ProviderError } from '@/products/integracoes/connectors/runtime/providerErrors'

export type SocialCredentials = {
  accessToken: string
  baseUrl?: string
  accountId?: string
  pageId?: string
  channelId?: string
  organizationUrn?: string
  openId?: string
}

export type SocialPageInput = {
  page: number
  pageSize: number
  cursor?: Record<string, unknown>
  credentials: SocialCredentials
}

export type SocialResourceConfig = {
  resource: string
  path: string
  itemKeys: string[]
  defaultPageSize: number
  supportsIncremental?: boolean
  method?: 'GET' | 'POST'
  buildPath?: (input: SocialPageInput) => string
  buildQuery?: (input: SocialPageInput) => Record<string, string | number | boolean | undefined>
  buildBody?: (input: SocialPageInput) => Record<string, unknown>
  transformItems?: (items: Record<string, unknown>[], payload: Record<string, unknown>) => Record<string, unknown>[]
  getNextCursor?: (payload: Record<string, unknown>, items: Record<string, unknown>[], input: SocialPageInput) => Record<string, unknown> | undefined
}

type CreateSocialConnectorInput = {
  provider: string
  defaultBaseUrl: string
  envBaseUrlKey: string
  resources: SocialResourceConfig[]
  testResource: string
  rateLimitMs?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseRecord(value: unknown) {
  if (isRecord(value)) return value
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function pickString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

export function normalizeSocialCredentials(provider: string, value: unknown): SocialCredentials {
  const credentials = parseRecord(value)
  const accessToken = credentials ? pickString(credentials, 'accessToken', 'access_token', 'token') : undefined
  if (!credentials || !accessToken) {
    throw new ProviderError({
      provider,
      kind: 'auth',
      message: `Credenciais ${provider} invalidas. OAuth precisa retornar accessToken.`,
      retryable: false,
    })
  }

  return {
    accessToken,
    baseUrl: pickString(credentials, 'baseUrl', 'base_url', 'url'),
    accountId: pickString(credentials, 'accountId', 'account_id', 'igUserId', 'ig_user_id', 'businessAccountId', 'business_account_id'),
    pageId: pickString(credentials, 'pageId', 'page_id'),
    channelId: pickString(credentials, 'channelId', 'channel_id'),
    organizationUrn: pickString(credentials, 'organizationUrn', 'organization_urn', 'organizationId', 'organization_id'),
    openId: pickString(credentials, 'openId', 'open_id'),
  }
}

function extractItems(payload: unknown, itemKeys: string[]) {
  const normalizeArray = (items: unknown[]) => items.map((item) => isRecord(item) ? item : { value: item })
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
  const url = new URL(
    /^https?:\/\//.test(path)
      ? path
      : `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`,
  )
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function defaultNextCursor(payload: Record<string, unknown>, items: Record<string, unknown>[], input: SocialPageInput) {
  const paging = isRecord(payload.paging) ? payload.paging : undefined
  const next = isRecord(paging?.next) ? paging.next : undefined
  const cursors = isRecord(paging?.cursors) ? paging.cursors : undefined
  const after = next?.after ?? cursors?.after ?? payload.next_cursor ?? payload.nextCursor
  if (typeof after === 'string' || typeof after === 'number') return { after }

  const nextPageToken = payload.nextPageToken ?? payload.next_page_token
  if (typeof nextPageToken === 'string' && nextPageToken) return { pageToken: nextPageToken }

  const cursor = payload.cursor
  if (typeof cursor === 'string' && cursor) return { cursor }

  if (payload.has_more === true || payload.hasMore === true) return { page: input.page + 1 }
  if (items.length >= input.pageSize) return { page: input.page + 1 }
  return undefined
}

function mapRow(provider: string, resource: string, row: Record<string, unknown>, page: number, index: number): ConnectorRow {
  const externalId = row.id ?? row.ID ?? row.urn ?? row.video_id ?? row.comment_id ?? row.date ?? row.day ?? `${provider}_${resource}_${page}_${index + 1}`
  return {
    external_id: typeof externalId === 'string' || typeof externalId === 'number' ? String(externalId) : `${provider}_${resource}_${page}_${index + 1}`,
    social_resource: resource,
    social_page: page,
    raw: row,
  }
}

export function createSocialConnector(input: CreateSocialConnectorInput): Connector {
  const resourceMap = new Map(input.resources.map((resource) => [resource.resource, resource]))
  const manifest: ConnectorResourceManifest[] = input.resources.map((resource) => ({
    resource: resource.resource,
    supportsIncremental: resource.supportsIncremental,
    defaultPageSize: resource.defaultPageSize,
    requiredFields: ['accessToken'],
  }))

  async function requestPage(context: ConnectorContext, resource: SocialResourceConfig, pageInput: Omit<SocialPageInput, 'credentials'>) {
    const credentials = normalizeSocialCredentials(input.provider, context.credentials)
    const fullInput = { ...pageInput, credentials }
    const method = resource.method || 'GET'
    const baseUrl = process.env[input.envBaseUrlKey] || credentials.baseUrl || input.defaultBaseUrl
    const response = await connectorJsonRequest<Record<string, unknown> | Record<string, unknown>[]>({
      provider: input.provider,
      resource: resource.resource,
      url: buildUrl(baseUrl, resource.buildPath?.(fullInput) || resource.path, resource.buildQuery?.(fullInput)),
      method,
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? resource.buildBody?.(fullInput) : undefined,
      rateLimitMs: input.rateLimitMs,
    })
    return response.payload
  }

  return {
    domain: 'social',
    provider: input.provider,
    resources: manifest,
    validateCredentials(credentials) {
      try {
        normalizeSocialCredentials(input.provider, credentials)
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
      if (!resource) {
        return {
          status: 'warning',
          recordsIn: 0,
          recordsUpdated: 0,
          recordsFailed: 0,
          errorMessage: `Recurso ${input.provider}/${resourceName} nao suportado pela API oficial/configurada neste adapter.`,
          metadata: { supportedResources: input.resources.map((item) => item.resource) },
        }
      }

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
        const nextCursor = (resource.getNextCursor || defaultNextCursor)(payloadRecord, items, { page, pageSize, cursor, credentials: normalizeSocialCredentials(input.provider, context.credentials) })
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
