import type { Connector, ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorResult, ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'
import { connectorJsonRequest } from '@/products/integracoes/cloud/src/lib/connectorHttp'
import { ProviderError } from '@/products/integracoes/cloud/src/lib/providerErrors'

export type CrmOAuthCredentials = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
  baseUrl?: string
  portalUrl?: string
  domain?: string
}

export type CrmResourceConfig = {
  resource: string
  path: string
  itemKeys: string[]
  defaultPageSize: number
  supportsIncremental?: boolean
  requiredFields?: string[]
  method?: 'GET' | 'POST'
  buildQuery?: (input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, string | number | boolean | undefined>
  buildBody?: (input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, unknown>
  getNextCursor?: (payload: Record<string, unknown>, items: Record<string, unknown>[], input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, unknown> | undefined
  transformItems?: (items: Record<string, unknown>[], payload: Record<string, unknown>) => Record<string, unknown>[]
}

type CreateOAuthRestCrmConnectorInput = {
  provider: string
  defaultBaseUrl: string
  envBaseUrlKey: string
  resources: CrmResourceConfig[]
  testResource: string
  rateLimitMs?: number
  authPlacement?: 'header' | 'query_auth'
  mapRow?: (input: {
    resource: string
    row: Record<string, unknown>
    page: number
    index: number
  }) => ConnectorRow
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown): Record<string, unknown> | null {
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

function normalizeOAuthCredentials(provider: string, value: unknown): CrmOAuthCredentials {
  const credentials = asRecord(value)
  const accessToken = credentials?.accessToken ?? credentials?.access_token
  if (!credentials || !nonEmptyString(accessToken)) {
    throw new ProviderError({
      provider,
      kind: 'auth',
      message: `Credenciais ${provider} invalidas. OAuth precisa retornar accessToken.`,
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
    baseUrl: nonEmptyString(credentials.baseUrl)
      ? credentials.baseUrl.trim()
      : nonEmptyString(credentials.base_url)
        ? credentials.base_url.trim()
        : undefined,
    portalUrl: nonEmptyString(credentials.portalUrl)
      ? credentials.portalUrl.trim()
      : nonEmptyString(credentials.portal_url)
        ? credentials.portal_url.trim()
        : undefined,
    domain: nonEmptyString(credentials.domain) ? credentials.domain.trim() : undefined,
  }
}

function defaultMapRow(provider: string, input: {
  resource: string
  row: Record<string, unknown>
  page: number
  index: number
}): ConnectorRow {
  const externalId = input.row.id ?? input.row.ID ?? input.row.uuid ?? input.row.key ?? `${provider}_row_${input.index + 1}`
  return {
    external_id: typeof externalId === 'string' || typeof externalId === 'number' ? String(externalId) : `${provider}_row_${input.index + 1}`,
    crm_resource: input.resource,
    crm_page: input.page,
    raw: input.row,
  }
}

function extractItems(payload: unknown, itemKeys: string[]): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => isRecord(item))
  if (!isRecord(payload)) return []

  for (const key of itemKeys) {
    const value = key.split('.').reduce<unknown>((current, part) => {
      if (!isRecord(current)) return undefined
      return current[part]
    }, payload)
    if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => isRecord(item))
  }

  const arrays = Object.values(payload).filter(Array.isArray) as unknown[][]
  if (arrays.length === 1) return arrays[0].filter((item): item is Record<string, unknown> => isRecord(item))
  return []
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function getBaseUrl(input: CreateOAuthRestCrmConnectorInput, credentials: CrmOAuthCredentials) {
  return (
    process.env[input.envBaseUrlKey]
    || credentials.baseUrl
    || credentials.portalUrl
    || (credentials.domain ? `https://${credentials.domain}` : '')
    || input.defaultBaseUrl
  ).replace(/\/+$/, '')
}

function defaultNextCursor(payload: Record<string, unknown>, items: Record<string, unknown>[], input: {
  page: number
  pageSize: number
}): Record<string, unknown> | undefined {
  const paging = isRecord(payload.paging) ? payload.paging : undefined
  const next = isRecord(paging?.next) ? paging.next : undefined
  const after = next?.after
  if (typeof after === 'string' || typeof after === 'number') return { after }

  const additionalData = isRecord(payload.additional_data) ? payload.additional_data : undefined
  const pagination = isRecord(additionalData?.pagination) ? additionalData.pagination : undefined
  if (pagination?.more_items_in_collection === true && (typeof pagination.next_start === 'number' || typeof pagination.next_start === 'string')) {
    return { start: pagination.next_start }
  }

  const nextPage = payload.next_page ?? payload.nextPage
  if (typeof nextPage === 'number' || typeof nextPage === 'string') return { page: Number(nextPage) }

  const total = Number(payload.total ?? payload.total_count ?? payload.totalCount ?? 0)
  if (Number.isFinite(total) && total > input.page * input.pageSize) return { page: input.page + 1 }
  if (items.length >= input.pageSize) return { page: input.page + 1 }
  return undefined
}

export function createOAuthRestCrmConnector(input: CreateOAuthRestCrmConnectorInput): Connector {
  const resourceMap = new Map(input.resources.map((resource) => [resource.resource, resource]))
  const manifest: ConnectorResourceManifest[] = input.resources.map((resource) => ({
    resource: resource.resource,
    supportsIncremental: resource.supportsIncremental,
    defaultPageSize: resource.defaultPageSize,
    requiredFields: resource.requiredFields || ['accessToken'],
  }))

  async function requestPage(context: ConnectorContext, resource: CrmResourceConfig, pageInput: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) {
    const credentials = normalizeOAuthCredentials(input.provider, context.credentials)
    const method = resource.method || 'GET'
    const query = resource.buildQuery?.(pageInput) || {}
    const body = method === 'POST' ? resource.buildBody?.(pageInput) : undefined
    if (input.authPlacement === 'query_auth') query.auth = credentials.accessToken

    const response = await connectorJsonRequest<Record<string, unknown> | Record<string, unknown>[]>({
      provider: input.provider,
      resource: resource.resource,
      url: buildUrl(getBaseUrl(input, credentials), resource.path, query),
      method,
      headers: input.authPlacement === 'query_auth' ? undefined : {
        Authorization: `Bearer ${credentials.accessToken}`,
      },
      body,
      rateLimitMs: input.rateLimitMs,
    })

    return response.payload
  }

  return {
    domain: 'crm',
    provider: input.provider,
    resources: manifest,
    validateCredentials(credentials) {
      try {
        normalizeOAuthCredentials(input.provider, credentials)
        return { ok: true }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : `Credenciais ${input.provider} invalidas.` }
      }
    },
    async testConnection(context) {
      const resource = resourceMap.get(input.testResource) || input.resources[0]
      const payload = await requestPage(context, resource, { page: 1, pageSize: 1, cursor: undefined })
      const items = extractItems(payload, resource.itemKeys)
      return {
        status: 'success',
        recordsIn: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        metadata: {
          mode: `${input.provider}_api`,
          testResource: resource.resource,
          sampleCount: items.length,
        },
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
          errorMessage: `Recurso ${input.provider} nao mapeado: ${resourceName}.`,
          metadata: { supportedResources: input.resources.map((item) => item.resource) },
        }
      }

      const pageSize = Number(process.env[`${input.provider.toUpperCase()}_PAGE_SIZE`] || resource.defaultPageSize)
      const maxPages = Number(process.env[`${input.provider.toUpperCase()}_MAX_PAGES_PER_RESOURCE`] || 100)
      const batches = []
      let page = Math.max(Number(context.cursor?.page || 1), 1)
      let cursor = context.cursor
      let recordsIn = 0
      let truncated = false

      for (let loadedPages = 0; loadedPages < maxPages; loadedPages += 1) {
        const payload = await requestPage(context, resource, { page, pageSize, cursor })
        const payloadRecord = isRecord(payload) ? payload : { data: payload }
        const rawItems = extractItems(payload, resource.itemKeys)
        const items = resource.transformItems ? resource.transformItems(rawItems, payloadRecord) : rawItems
        const rows = items.map((row, index) => (input.mapRow || ((rowInput) => defaultMapRow(input.provider, rowInput)))({
          resource: resource.resource,
          row,
          page,
          index,
        }))
        recordsIn += rows.length
        const nextCursor = (resource.getNextCursor || defaultNextCursor)(payloadRecord, items, { page, pageSize, cursor })
        batches.push({
          resource: resource.resource,
          rows,
          nextCursor,
        })

        if (!nextCursor) break
        if (loadedPages + 1 >= maxPages) {
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
        metadata: {
          mode: `${input.provider}_api`,
          resource: resource.resource,
          truncated,
        },
      }
    },
    async refreshToken() {
      return {
        status: 'success',
        recordsIn: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        metadata: { mode: 'oauth2', refreshed: false },
      }
    },
  }
}
