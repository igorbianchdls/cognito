import type { Connector, ConnectorResourceManifest } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorResult, ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'
import { connectorJsonRequest } from '@/products/integracoes/cloud/src/lib/connectorHttp'
import { ProviderError } from '@/products/integracoes/cloud/src/lib/providerErrors'
import type { IntegrationDomain } from '@/products/integracoes/shared/providers/providerTypes'

type Credentials = {
  accessToken: string
  baseUrl?: string
  accountId?: string
  storeId?: string
  locationId?: string
  propertyId?: string
  siteUrl?: string
  customerId?: string
  developerToken?: string
  loginCustomerId?: string
}

type RequestBuildInput = {
  page: number
  pageSize: number
  cursor?: Record<string, unknown>
  credentials: Credentials
  dateStart: string
  dateEnd: string
}

export type ReportResourceConfig = {
  resource: string
  path: string
  itemKeys: string[]
  defaultPageSize: number
  supportsIncremental?: boolean
  method?: 'GET' | 'POST'
  buildPath?: (input: RequestBuildInput) => string
  buildQuery?: (input: RequestBuildInput) => Record<string, string | number | boolean | undefined>
  buildBody?: (input: RequestBuildInput) => Record<string, unknown>
  getNextCursor?: (payload: Record<string, unknown>, items: Record<string, unknown>[], page: number) => Record<string, unknown> | undefined
  transformItems?: (items: Record<string, unknown>[], payload: Record<string, unknown>) => Record<string, unknown>[]
  headers?: (credentials: Credentials) => Record<string, string>
}

type CreateReportConnectorInput = {
  domain: IntegrationDomain
  provider: string
  defaultBaseUrl: string
  envBaseUrlKey: string
  resources: ReportResourceConfig[]
  testResource: string
  rateLimitMs?: number
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

function normalizeCredentials(provider: string, value: unknown): Credentials {
  const credentials = parseRecord(value)
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
    baseUrl: nonEmptyString(credentials.baseUrl) ? credentials.baseUrl.trim() : nonEmptyString(credentials.base_url) ? credentials.base_url.trim() : undefined,
    accountId: nonEmptyString(credentials.accountId) ? credentials.accountId.trim() : nonEmptyString(credentials.account_id) ? credentials.account_id.trim() : undefined,
    storeId: nonEmptyString(credentials.storeId) ? credentials.storeId.trim() : nonEmptyString(credentials.store_id) ? credentials.store_id.trim() : undefined,
    locationId: nonEmptyString(credentials.locationId) ? credentials.locationId.trim() : nonEmptyString(credentials.location_id) ? credentials.location_id.trim() : undefined,
    propertyId: nonEmptyString(credentials.propertyId) ? credentials.propertyId.trim() : nonEmptyString(credentials.property_id) ? credentials.property_id.trim() : undefined,
    siteUrl: nonEmptyString(credentials.siteUrl) ? credentials.siteUrl.trim() : nonEmptyString(credentials.site_url) ? credentials.site_url.trim() : undefined,
    customerId: nonEmptyString(credentials.customerId) ? credentials.customerId.trim() : nonEmptyString(credentials.customer_id) ? credentials.customer_id.trim() : undefined,
    developerToken: nonEmptyString(credentials.developerToken) ? credentials.developerToken.trim() : nonEmptyString(credentials.developer_token) ? credentials.developer_token.trim() : undefined,
    loginCustomerId: nonEmptyString(credentials.loginCustomerId) ? credentials.loginCustomerId.trim() : nonEmptyString(credentials.login_customer_id) ? credentials.login_customer_id.trim() : undefined,
  }
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function resolveDateWindow(context: ConnectorContext) {
  const metadata = context.metadata || {}
  const lookbackDays = Number(metadata.lookbackDays || metadata.lookback_days || process.env.INTEGRATIONS_MARKETING_LOOKBACK_DAYS || 30)
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (Number.isFinite(lookbackDays) && lookbackDays > 0 ? lookbackDays : 30))
  return {
    dateStart: typeof metadata.dateStart === 'string' ? metadata.dateStart : formatDate(start),
    dateEnd: typeof metadata.dateEnd === 'string' ? metadata.dateEnd : formatDate(end),
  }
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
  }
  const arrays = Object.values(payload).filter(Array.isArray) as unknown[][]
  if (arrays.length === 1) return normalizeArray(arrays[0])
  return []
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(/^https?:\/\//.test(path) ? path : `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function mapRow(provider: string, resource: string, row: Record<string, unknown>, page: number, index: number): ConnectorRow {
  const externalId = row.id ?? row.resourceName ?? row.name ?? row.date ?? `${provider}_${resource}_${page}_${index + 1}`
  return {
    external_id: typeof externalId === 'string' || typeof externalId === 'number' ? String(externalId) : `${provider}_${resource}_${page}_${index + 1}`,
    marketing_resource: resource,
    report_page: page,
    raw: row,
  }
}

export function createDateRangeReportConnector(input: CreateReportConnectorInput): Connector {
  const resourceMap = new Map(input.resources.map((resource) => [resource.resource, resource]))
  const manifest: ConnectorResourceManifest[] = input.resources.map((resource) => ({
    resource: resource.resource,
    supportsIncremental: resource.supportsIncremental,
    defaultPageSize: resource.defaultPageSize,
    requiredFields: ['accessToken'],
  }))

  async function request(context: ConnectorContext, resource: ReportResourceConfig, page: number, pageSize: number, cursor?: Record<string, unknown>) {
    const credentials = normalizeCredentials(input.provider, context.credentials)
    const { dateStart, dateEnd } = resolveDateWindow(context)
    const baseUrl = (process.env[input.envBaseUrlKey] || credentials.baseUrl || input.defaultBaseUrl).replace(/\/+$/, '')
    const method = resource.method || 'GET'
    const buildInput = { page, pageSize, cursor, credentials, dateStart, dateEnd }
    const path = resource.buildPath?.(buildInput) || resource.path
    const query = resource.buildQuery?.(buildInput)
    const body = method === 'POST' ? resource.buildBody?.(buildInput) : undefined
    const response = await connectorJsonRequest<Record<string, unknown> | Record<string, unknown>[]>({
      provider: input.provider,
      resource: resource.resource,
      url: buildUrl(baseUrl, path, query),
      method,
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        ...(resource.headers?.(credentials) || {}),
      },
      body,
      rateLimitMs: input.rateLimitMs,
    })
    return { payload: response.payload, dateStart, dateEnd }
  }

  return {
    domain: input.domain,
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
      const { payload } = await request(context, resource, 1, 1)
      return { status: 'success', recordsIn: 0, recordsUpdated: 0, recordsFailed: 0, metadata: { mode: `${input.provider}_api`, sampleCount: extractItems(payload, resource.itemKeys).length } }
    },
    async syncResource(context, resourceName) {
      const resource = resourceMap.get(resourceName)
      if (!resource) return { status: 'warning', recordsIn: 0, recordsUpdated: 0, recordsFailed: 0, errorMessage: `Recurso nao mapeado: ${resourceName}` }

      const pageSize = Number(process.env[`${input.provider.toUpperCase()}_PAGE_SIZE`] || resource.defaultPageSize)
      const maxPages = Number(process.env[`${input.provider.toUpperCase()}_MAX_PAGES_PER_RESOURCE`] || 50)
      const batches = []
      let cursor = context.cursor
      let page = Math.max(Number(cursor?.page || 1), 1)
      let recordsIn = 0
      let truncated = false
      let dateStart = ''
      let dateEnd = ''

      for (let loaded = 0; loaded < maxPages; loaded += 1) {
        const result = await request(context, resource, page, pageSize, cursor)
        dateStart = result.dateStart
        dateEnd = result.dateEnd
        const payloadRecord = isRecord(result.payload) ? result.payload : { data: result.payload }
        const rawItems = extractItems(result.payload, resource.itemKeys)
        const items = resource.transformItems ? resource.transformItems(rawItems, payloadRecord) : rawItems
        const rows = items.map((row, index) => mapRow(input.provider, resource.resource, row, page, index))
        recordsIn += rows.length
        const nextCursor = resource.getNextCursor?.(payloadRecord, items, page)
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
        metadata: { mode: `${input.provider}_api`, resource: resource.resource, dateStart, dateEnd, truncated },
      }
    },
    async refreshToken() {
      return { status: 'success', recordsIn: 0, recordsUpdated: 0, recordsFailed: 0, metadata: { mode: 'oauth2', refreshed: false } }
    },
  }
}
