import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { GOOGLE_ADS_RESOURCES } from '@/products/integracoes/connectors/advertising/googleAds/googleAdsResources'
import { META_ADS_RESOURCES } from '@/products/integracoes/connectors/advertising/metaAds/metaAdsResources'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import type { ReportResourceConfig } from '@/products/integracoes/connectors/marketing/common/dateRangeReportConnector'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainRecord,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import type { ConnectedProviderActionInput } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'
import type {
  PaidMediaApiAdapter,
  PaidMediaResource,
} from '@/products/plugin/server/domain-adapters/paid-media/paidMediaTypes'

type JsonRecord = Record<string, unknown>
type Provider = 'meta_ads' | 'google_ads'

type Credentials = {
  accessToken: string
  baseUrl?: string
  accountId?: string
  customerId?: string
  developerToken?: string
  loginCustomerId?: string
}

const RESOURCE_ALIAS: Record<PaidMediaResource, string> = {
  contas: 'accounts',
  campanhas: 'campaigns',
  grupos: 'ad_groups',
  anuncios: 'ads',
  criativos: 'creatives',
  keywords: 'keywords',
  'desempenho-diario': 'insights_campaign_daily',
  conversoes: 'conversions',
}

const PROVIDER_RESOURCES: Record<Provider, ReportResourceConfig[]> = {
  meta_ads: META_ADS_RESOURCES,
  google_ads: GOOGLE_ADS_RESOURCES,
}

const DEFAULT_BASE_URL: Record<Provider, string> = {
  meta_ads: 'https://graph.facebook.com/v20.0',
  google_ads: 'https://googleads.googleapis.com/v18',
}

const BASE_URL_ENV: Record<Provider, string> = {
  meta_ads: 'META_ADS_API_BASE_URL',
  google_ads: 'GOOGLE_ADS_API_BASE_URL',
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
    accountId: toText(filters.account_id ?? filters.conta_id ?? filters.conta ?? credentials.accountId ?? credentials.account_id) || undefined,
    customerId: toText(filters.customer_id ?? filters.conta_id ?? filters.conta ?? credentials.customerId ?? credentials.customer_id) || undefined,
    developerToken: toText(credentials.developerToken ?? credentials.developer_token ?? process.env.GOOGLE_ADS_DEVELOPER_TOKEN) || undefined,
    loginCustomerId: toText(credentials.loginCustomerId ?? credentials.login_customer_id ?? process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) || undefined,
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

function configFor(provider: Provider, resource: PaidMediaResource) {
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
  const paging = isRecord(payload.paging) ? payload.paging : undefined
  const cursors = isRecord(paging?.cursors) ? paging.cursors : undefined
  const after = cursors?.after ?? payload.next_cursor
  if (typeof after === 'string' || typeof after === 'number') return { after }
  return undefined
}

async function requestProvider(input: {
  provider: Provider
  credentials: Credentials
  resource: PaidMediaResource
  config: ReportResourceConfig
  page: number
  pageSize: number
  filters: JsonRecord
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
      ...(input.config.headers?.(input.credentials) || {}),
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

function providerId(row: JsonRecord) {
  return nestedText(row, [
    'id',
    'resourceName',
    'resource_name',
    'value',
    'account_id',
    'campaign.id',
    'adGroup.id',
    'ad_group.id',
    'adGroupAd.ad.id',
    'ad_group_ad.ad.id',
    'asset.id',
    'adGroupCriterion.criterionId',
    'ad_group_criterion.criterion_id',
    'conversionAction.id',
    'conversion_action.id',
    'date_start',
    'segments.date',
  ]) || 'unknown'
}

function fieldsFor(resource: PaidMediaResource, row: JsonRecord) {
  if (resource === 'contas') {
    return {
      nome: nestedText(row, ['name', 'customer.descriptiveName', 'value']),
      account_id: nestedText(row, ['account_id', 'id', 'customer.id', 'value']),
      status: nestedText(row, ['account_status', 'customer.status']),
      currency: nestedText(row, ['currency', 'customer.currencyCode']),
    }
  }
  if (resource === 'desempenho-diario') {
    return {
      data_ref: nestedText(row, ['date_start', 'segments.date']),
      campaign_id: nestedText(row, ['campaign_id', 'campaign.id']),
      campaign_name: nestedText(row, ['campaign_name', 'campaign.name']),
      spend: nestedText(row, ['spend', 'metrics.costMicros', 'metrics.cost_micros']),
      impressions: nestedText(row, ['impressions', 'metrics.impressions']),
      clicks: nestedText(row, ['clicks', 'metrics.clicks']),
      conversions: nestedText(row, ['conversions', 'metrics.conversions']),
    }
  }
  if (resource === 'keywords') {
    return {
      keyword_id: nestedText(row, ['adGroupCriterion.criterionId', 'ad_group_criterion.criterion_id']),
      keyword_text: nestedText(row, ['adGroupCriterion.keyword.text', 'ad_group_criterion.keyword.text']),
      match_type: nestedText(row, ['adGroupCriterion.keyword.matchType', 'ad_group_criterion.keyword.match_type']),
      status: nestedText(row, ['adGroupCriterion.status', 'ad_group_criterion.status']),
    }
  }
  return {
    nome: nestedText(row, ['name', 'campaign.name', 'adGroup.name', 'ad_group.name', 'asset.name', 'conversionAction.name']),
    status: nestedText(row, ['status', 'effective_status', 'campaign.status', 'adGroup.status', 'ad_group.status', 'conversionAction.status']),
    campaign_id: nestedText(row, ['campaign_id', 'campaign.id']),
    ad_group_id: nestedText(row, ['adset_id', 'adGroup.id', 'ad_group.id']),
  }
}

function toRecord(provider: Provider, resource: PaidMediaResource, row: JsonRecord, includeProviderFields: boolean): ConnectedDomainRecord {
  const id = providerId(row)
  return {
    id: `${provider}:${resource}:${id}`,
    provider,
    provider_id: id,
    resource,
    fields: fieldsFor(resource, row),
    ...(includeProviderFields ? { provider_fields: row } : {}),
  }
}

async function listLive(provider: Provider, input: ConnectedDomainAdapterInput<PaidMediaResource>): Promise<ConnectedDomainAdapterResult> {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider, filters: input.filters })
  const maxPages = Number(process.env.PAID_MEDIA_LIVE_MAX_SCAN_PAGES || 5)
  const pageSize = Math.min(input.limit, Number(config.defaultPageSize || 100))
  const rows: ConnectedDomainRecord[] = []
  let cursor: JsonRecord | undefined
  for (let page = 1; page <= maxPages && rows.length < input.limit; page += 1) {
    const payload = await requestProvider({ provider, credentials, resource: input.resource, config, page, pageSize, filters: input.filters, cursor })
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

async function readLive(provider: Provider, input: ConnectedDomainAdapterReadInput<PaidMediaResource>): Promise<ConnectedDomainAdapterResult> {
  const result = await listLive(provider, { ...input, limit: 100 })
  const found = result.rows.find((row) => row.provider_id === input.id || row.id.endsWith(`:${input.id}`))
  return found
    ? { rows: [found], columns: Object.keys(found.fields), count: 1 }
    : { rows: [], columns: [], count: 0, warnings: [`Registro ${input.id} nao encontrado via ${provider}/${input.resource}.`] }
}

function createPaidMediaApiAdapter(provider: Provider): PaidMediaApiAdapter {
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
    executeAction(input: ConnectedProviderActionInput<PaidMediaResource, never>) {
      return Promise.resolve({
        ok: false,
        message: `${provider} nao possui acoes de paid media habilitadas neste adapter.`,
        id: input.id || null,
      })
    },
  }
}

export const metaAdsPaidMediaApiAdapter = createPaidMediaApiAdapter('meta_ads')
export const googleAdsPaidMediaApiAdapter = createPaidMediaApiAdapter('google_ads')
