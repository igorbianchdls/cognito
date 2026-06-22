import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { GOOGLE_MY_BUSINESS_RESOURCES } from '@/products/integracoes/connectors/analytics/googleMyBusiness/googleMyBusinessResources'
import { GOOGLE_ANALYTICS_4_RESOURCES } from '@/products/integracoes/connectors/marketing/googleAnalytics4/googleAnalytics4Resources'
import { GOOGLE_SEARCH_CONSOLE_RESOURCES } from '@/products/integracoes/connectors/marketing/googleSearchConsole/googleSearchConsoleResources'
import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainRecord,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import type { ConnectedProviderActionInput } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'
import type {
  AnalyticsApiAdapter,
  AnalyticsResource,
} from '@/products/plugin/server/domain-adapters/analytics/analyticsTypes'

type JsonRecord = Record<string, unknown>
type Provider = 'google_analytics_4' | 'google_search_console' | 'google_my_business'

type Credentials = {
  accessToken: string
  baseUrl?: string
  accountId?: string
  storeId?: string
  locationId?: string
  propertyId?: string
  siteUrl?: string
}

const RESOURCE_ALIAS: Record<AnalyticsResource, string> = {
  propriedades: 'accounts',
  paginas: 'pages_daily',
  'landing-pages': 'pages_daily',
  eventos: 'events_daily',
  conversoes: 'events_daily',
  canais: 'traffic_daily',
  consultas: 'queries_daily',
  'perfil-negocio': 'locations',
  reviews: 'reviews',
  'posts-locais': 'local_posts',
}

const PROVIDER_RESOURCES: Record<Provider, ReportResourceConfig[]> = {
  google_analytics_4: GOOGLE_ANALYTICS_4_RESOURCES,
  google_search_console: GOOGLE_SEARCH_CONSOLE_RESOURCES,
  google_my_business: GOOGLE_MY_BUSINESS_RESOURCES,
}

const DEFAULT_BASE_URL: Record<Provider, string> = {
  google_analytics_4: 'https://analyticsdata.googleapis.com/v1beta',
  google_search_console: 'https://www.googleapis.com/webmasters/v3',
  google_my_business: 'https://mybusiness.googleapis.com',
}

const BASE_URL_ENV: Record<Provider, string> = {
  google_analytics_4: 'GOOGLE_ANALYTICS_4_API_BASE_URL',
  google_search_console: 'GOOGLE_SEARCH_CONSOLE_API_BASE_URL',
  google_my_business: 'GOOGLE_MY_BUSINESS_API_BASE_URL',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function parseCredentials(value: unknown): JsonRecord {
  if (isRecord(value)) return value
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function normalizeCredentials(provider: Provider, value: unknown, filters: JsonRecord): Credentials {
  const credentials = parseCredentials(value)
  const accessToken = toText(credentials.accessToken ?? credentials.access_token)
  if (!accessToken) throw new Error(`Credencial ${provider} sem accessToken. Reautentique a conexao OAuth.`)
  return {
    accessToken,
    baseUrl: toText(credentials.baseUrl ?? credentials.base_url) || undefined,
    accountId: toText(filters.account_id ?? filters.conta_id ?? credentials.accountId ?? credentials.account_id) || undefined,
    storeId: toText(filters.store_id ?? filters.loja_id ?? credentials.storeId ?? credentials.store_id) || undefined,
    locationId: toText(filters.location_id ?? filters.local_id ?? credentials.locationId ?? credentials.location_id) || undefined,
    propertyId: toText(filters.property_id ?? filters.propriedade_id ?? credentials.propertyId ?? credentials.property_id) || undefined,
    siteUrl: toText(filters.site_url ?? filters.site ?? credentials.siteUrl ?? credentials.site_url) || undefined,
  }
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
  provider: Provider
  filters: JsonRecord
}) {
  if (!input.connection.secretRef) {
    throw new Error(`Credencial ausente para ${input.provider}. Reautentique a conexao OAuth.`)
  }
  const raw = await readSecret(input.connection.secretRef)
  const credentials = parseCredentials(raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: input.provider,
    credentials,
  })
  return normalizeCredentials(input.provider, refreshed || credentials, input.filters)
}

function configFor(provider: Provider, resource: AnalyticsResource) {
  const providerResource = RESOURCE_ALIAS[resource]
  return PROVIDER_RESOURCES[provider].find((config) => config.resource === providerResource)
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function dateWindow(filters: JsonRecord) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  return {
    dateStart: /^\d{4}-\d{2}-\d{2}$/.test(toText(filters.de)) ? toText(filters.de) : formatDate(start),
    dateEnd: /^\d{4}-\d{2}-\d{2}$/.test(toText(filters.ate)) ? toText(filters.ate) : formatDate(end),
  }
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(/^https?:\/\//.test(path) ? path : `${baseUrl.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
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

function nextCursor(payload: JsonRecord, items: JsonRecord[], page: number, config: ReportResourceConfig) {
  const configured = config.getNextCursor?.(payload, items, page)
  if (configured) return configured
  const token = payload.nextPageToken ?? payload.next_page_token
  if (typeof token === 'string' && token) return { pageToken: token }
  if (items.length >= config.defaultPageSize) return { page: page + 1 }
  return undefined
}

async function requestProvider(input: {
  provider: Provider
  credentials: Credentials
  resource: AnalyticsResource
  config: ReportResourceConfig
  filters: JsonRecord
  page: number
  pageSize: number
  cursor?: JsonRecord
}) {
  const { dateStart, dateEnd } = dateWindow(input.filters)
  const method = input.config.method || 'GET'
  const buildInput = {
    page: input.page,
    pageSize: input.pageSize,
    cursor: input.cursor,
    credentials: input.credentials,
    dateStart,
    dateEnd,
  }
  const baseUrl = process.env[BASE_URL_ENV[input.provider]] || input.credentials.baseUrl || DEFAULT_BASE_URL[input.provider]
  const payload = await connectorJsonRequest<JsonRecord | JsonRecord[]>({
    provider: input.provider,
    resource: input.resource,
    url: buildUrl(baseUrl, input.config.buildPath?.(buildInput) || input.config.path, input.config.buildQuery?.(buildInput)),
    method,
    headers: {
      Authorization: `Bearer ${input.credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? input.config.buildBody?.(buildInput) : undefined,
    rateLimitMs: Number(process.env[`INTEGRATIONS_RATE_LIMIT_${input.provider.toUpperCase()}_MS`] || 300),
  })
  return payload.payload
}

function nestedText(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce<unknown>((current, part) => isRecord(current) ? current[part] : undefined, row)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function ga4Value(row: JsonRecord, section: 'dimensionValues' | 'metricValues', index: number) {
  const values = row[section]
  if (!Array.isArray(values)) return undefined
  const value = values[index]
  return isRecord(value) ? toText(value.value) || undefined : undefined
}

function providerId(provider: Provider, resource: AnalyticsResource, row: JsonRecord) {
  return nestedText(row, ['id', 'name', 'resourceName', 'siteUrl', 'reviewId', 'localPostId'])
    || ga4Value(row, 'dimensionValues', 0)
    || `${provider}:${resource}`
}

function fieldsFor(provider: Provider, resource: AnalyticsResource, row: JsonRecord) {
  if (provider === 'google_analytics_4') {
    if (resource === 'canais') {
      return {
        data_ref: ga4Value(row, 'dimensionValues', 0),
        usuarios_ativos: ga4Value(row, 'metricValues', 0),
        usuarios_totais: ga4Value(row, 'metricValues', 1),
        sessoes: ga4Value(row, 'metricValues', 2),
        pageviews: ga4Value(row, 'metricValues', 3),
        conversoes: ga4Value(row, 'metricValues', 4),
      }
    }
    if (resource === 'paginas' || resource === 'landing-pages') {
      return {
        data_ref: ga4Value(row, 'dimensionValues', 0),
        page_path: ga4Value(row, 'dimensionValues', 1),
        pageviews: ga4Value(row, 'metricValues', 0),
        usuarios_ativos: ga4Value(row, 'metricValues', 1),
        sessoes: ga4Value(row, 'metricValues', 2),
      }
    }
    if (resource === 'eventos' || resource === 'conversoes') {
      return {
        data_ref: ga4Value(row, 'dimensionValues', 0),
        evento_nome: ga4Value(row, 'dimensionValues', 1),
        eventos: ga4Value(row, 'metricValues', 0),
        usuarios_totais: ga4Value(row, 'metricValues', 1),
      }
    }
  }
  if (provider === 'google_search_console') {
    const keys = Array.isArray(row.keys) ? row.keys.map(String) : []
    return {
      data_ref: keys[0],
      page_url: resource === 'paginas' || resource === 'landing-pages' ? keys[1] : undefined,
      query: resource === 'consultas' ? keys[1] : undefined,
      clicks: nestedText(row, ['clicks']),
      impressions: nestedText(row, ['impressions']),
      ctr: nestedText(row, ['ctr']),
      position: nestedText(row, ['position']),
    }
  }
  return {
    nome: nestedText(row, ['title', 'accountName', 'displayName', 'locationName', 'name']),
    status: nestedText(row, ['state', 'status', 'verificationState']),
    rating: nestedText(row, ['starRating', 'averageRating']),
    comentario: nestedText(row, ['comment']),
    created_at: nestedText(row, ['createTime', 'updateTime']),
  }
}

function toRecord(provider: Provider, resource: AnalyticsResource, row: JsonRecord, includeProviderFields: boolean): ConnectedDomainRecord {
  const id = providerId(provider, resource, row)
  return {
    id: `${provider}:${resource}:${id}`,
    provider,
    provider_id: id,
    resource,
    fields: fieldsFor(provider, resource, row),
    ...(includeProviderFields ? { provider_fields: row } : {}),
  }
}

async function listLive(provider: Provider, input: ConnectedDomainAdapterInput<AnalyticsResource>): Promise<ConnectedDomainAdapterResult> {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider, filters: input.filters })
  const maxPages = Number(process.env.ANALYTICS_LIVE_MAX_SCAN_PAGES || 5)
  const pageSize = Math.min(input.limit, Number(config.defaultPageSize || 1000))
  const rows: ConnectedDomainRecord[] = []
  let cursor: JsonRecord | undefined
  for (let page = 1; page <= maxPages && rows.length < input.limit; page += 1) {
    const payload = await requestProvider({ provider, credentials, resource: input.resource, config, filters: input.filters, page, pageSize, cursor })
    const payloadRecord = isRecord(payload) ? payload : { data: payload }
    const rawItems = extractItems(payload, config.itemKeys)
    const items = config.transformItems ? config.transformItems(rawItems, payloadRecord) : rawItems
    rows.push(...items.map((row) => toRecord(provider, input.resource, row, input.includeProviderFields)))
    cursor = nextCursor(payloadRecord, items, page, config)
    if (!cursor) break
  }
  const limitedRows = rows.slice(0, input.limit)
  return { rows: limitedRows, columns: limitedRows.length ? Object.keys(limitedRows[0].fields) : [], count: limitedRows.length }
}

async function readLive(provider: Provider, input: ConnectedDomainAdapterReadInput<AnalyticsResource>): Promise<ConnectedDomainAdapterResult> {
  const result = await listLive(provider, { ...input, limit: 200 })
  const found = result.rows.find((row) => row.provider_id === input.id || row.id.endsWith(`:${input.id}`))
  return found
    ? { rows: [found], columns: Object.keys(found.fields), count: 1 }
    : { rows: [], columns: [], count: 0, warnings: [`Registro ${input.id} nao encontrado via ${provider}/${input.resource}.`] }
}

function createAnalyticsApiAdapter(provider: Provider): AnalyticsApiAdapter {
  return {
    provider,
    supportsLiveRead(resource) {
      return Boolean(configFor(provider, resource))
    },
    supportsAction() {
      return false
    },
    listLive(input) {
      return listLive(provider, input)
    },
    readLive(input) {
      return readLive(provider, input)
    },
    async executeAction(_input: ConnectedProviderActionInput<AnalyticsResource, never>) {
      return { ok: false, message: 'Analytics nao possui actions nesta versao.' }
    },
  }
}

export const googleAnalytics4ApiAdapter = createAnalyticsApiAdapter('google_analytics_4')
export const googleSearchConsoleApiAdapter = createAnalyticsApiAdapter('google_search_console')
export const googleMyBusinessApiAdapter = createAnalyticsApiAdapter('google_my_business')
