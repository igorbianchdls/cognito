import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import type {
  EcommerceCredentials,
  EcommerceResourceConfig,
} from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { LOJA_INTEGRADA_RESOURCES } from '@/products/integracoes/connectors/ecommerce/lojaIntegrada/lojaIntegradaResources'
import { NUVEMSHOP_RESOURCES } from '@/products/integracoes/connectors/ecommerce/nuvemshop/nuvemshopResources'
import { SHOPIFY_RESOURCES } from '@/products/integracoes/connectors/ecommerce/shopify/shopifyResources'
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
  EcommerceConnectedApiAdapter,
  EcommerceConnectedProviderAction,
  EcommerceConnectedResource,
} from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'

type JsonRecord = Record<string, unknown>
type Provider = 'shopify' | 'nuvemshop' | 'loja_integrada'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const RESOURCE_ALIAS: Record<EcommerceConnectedResource, string> = {
  lojas: 'stores',
  pedidos: 'orders',
  'itens-pedido': 'order_items',
  produtos: 'products',
  variantes: 'variants',
  clientes: 'customers',
  pagamentos: 'payments',
  reembolsos: 'refunds',
  frete: 'shipping',
  estoque: 'inventory',
  categorias: 'categories',
  cupons: 'coupons',
  'carrinhos-abandonados': 'abandoned_checkouts',
}

const PROVIDER_RESOURCES: Record<Provider, EcommerceResourceConfig[]> = {
  shopify: SHOPIFY_RESOURCES,
  nuvemshop: NUVEMSHOP_RESOURCES,
  loja_integrada: LOJA_INTEGRADA_RESOURCES,
}

const DEFAULT_BASE_URL: Record<Provider, string> = {
  shopify: 'https://missing-shop.myshopify.com',
  nuvemshop: 'https://api.tiendanube.com/v1',
  loja_integrada: 'https://api.awsli.com.br',
}

const BASE_URL_ENV: Record<Provider, string> = {
  shopify: 'SHOPIFY_API_BASE_URL',
  nuvemshop: 'NUVEMSHOP_API_BASE_URL',
  loja_integrada: 'LOJA_INTEGRADA_API_BASE_URL',
}

const UNSUPPORTED_LIVE: Partial<Record<Provider, EcommerceConnectedResource[]>> = {
  loja_integrada: ['reembolsos', 'cupons', 'carrinhos-abandonados'],
}

const SUPPORTED_ACTIONS: Record<Provider, Partial<Record<EcommerceConnectedResource, EcommerceConnectedProviderAction[]>>> = {
  shopify: {
    produtos: ['criar', 'atualizar', 'deletar'],
    variantes: ['atualizar'],
    cupons: ['criar', 'atualizar', 'deletar'],
    pedidos: ['cancelar'],
  },
  nuvemshop: {
    produtos: ['criar', 'atualizar', 'deletar'],
    variantes: ['criar', 'atualizar', 'deletar'],
    cupons: ['criar', 'atualizar', 'deletar'],
  },
  loja_integrada: {},
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function parseCredentials(value: unknown): EcommerceCredentials {
  const record = typeof value === 'string' ? safeJson(value) : value
  if (!isRecord(record)) return {}
  return {
    accessToken: toText(record.accessToken ?? record.access_token ?? record.token) || undefined,
    apiKey: toText(record.apiKey ?? record.api_key ?? record.key) || undefined,
    apiSecret: toText(record.apiSecret ?? record.api_secret ?? record.secret) || undefined,
    consumerKey: toText(record.consumerKey ?? record.consumer_key) || undefined,
    consumerSecret: toText(record.consumerSecret ?? record.consumer_secret) || undefined,
    baseUrl: toText(record.baseUrl ?? record.base_url ?? record.url) || undefined,
    shop: toText(record.shop ?? record.shopDomain ?? record.shop_domain ?? record.domain) || undefined,
    storeId: toText(record.storeId ?? record.store_id) || undefined,
    appKey: toText(record.appKey ?? record.app_key ?? record.chave_aplicacao) || undefined,
    appToken: toText(record.appToken ?? record.app_token) || undefined,
    userAgent: toText(record.userAgent ?? record.user_agent) || undefined,
  }
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return {}
  }
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
  provider: Provider
}) {
  if (!input.connection.secretRef) {
    throw new Error(`Credencial ausente para ${input.provider}. Reautentique a conexao.`)
  }
  const raw = await readSecret(input.connection.secretRef)
  const credentials = parseCredentials(raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: input.provider,
    credentials,
  })
  return refreshed ? parseCredentials(refreshed) : credentials
}

function configFor(provider: Provider, resource: EcommerceConnectedResource) {
  const providerResource = RESOURCE_ALIAS[resource]
  return PROVIDER_RESOURCES[provider].find((config) => config.resource === providerResource)
}

function baseUrl(provider: Provider, credentials: EcommerceCredentials) {
  if (process.env[BASE_URL_ENV[provider]]) return process.env[BASE_URL_ENV[provider]] as string
  if (credentials.baseUrl) return credentials.baseUrl
  if (provider === 'shopify' && credentials.shop) return `https://${credentials.shop.replace(/^https?:\/\//, '')}`
  return DEFAULT_BASE_URL[provider]
}

function buildUrl(base: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${base.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function defaultHeaders(provider: Provider, credentials: EcommerceCredentials): Record<string, string> {
  if (provider === 'shopify') {
    const token = credentials.accessToken || credentials.apiKey || credentials.appToken
    return token ? { 'X-Shopify-Access-Token': token } : {}
  }
  if (provider === 'loja_integrada') return {}
  const token = credentials.accessToken || credentials.apiKey || credentials.appToken
  return token ? { Authorization: `Bearer ${token}` } : {}
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

function nextCursor(payload: JsonRecord, items: JsonRecord[], page: number, pageSize: number) {
  const total = Number(payload.total ?? payload.total_count ?? payload.totalCount ?? payload.count ?? 0)
  if (Number.isFinite(total) && total > page * pageSize) return { page: page + 1 }
  if (payload.has_more === true || payload.hasMore === true || items.length >= pageSize) return { page: page + 1 }
  return undefined
}

async function requestProvider(input: {
  provider: Provider
  credentials: EcommerceCredentials
  resource: EcommerceConnectedResource
  config: EcommerceResourceConfig
  page: number
  pageSize: number
  cursor?: JsonRecord
  method?: HttpMethod
  path?: string
  body?: JsonRecord
}) {
  const buildInput = {
    page: input.page,
    pageSize: input.pageSize,
    cursor: input.cursor,
    credentials: input.credentials,
  }
  const method = input.method || input.config.method || 'GET'
  const query = method === 'GET' ? input.config.buildQuery?.(buildInput) : undefined
  const payload = await connectorJsonRequest<JsonRecord | JsonRecord[]>({
    provider: input.provider,
    resource: input.resource,
    url: buildUrl(baseUrl(input.provider, input.credentials), input.path || input.config.buildPath?.(buildInput) || input.config.path, query),
    method,
    headers: {
      ...defaultHeaders(input.provider, input.credentials),
      ...(input.credentials.userAgent ? { 'User-Agent': input.credentials.userAgent } : {}),
      ...(input.config.headers?.(input.credentials) || {}),
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input.body,
    rateLimitMs: Number(process.env[`INTEGRATIONS_RATE_LIMIT_${input.provider.toUpperCase()}_MS`] || 300),
  })
  return payload.payload
}

function nestedText(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce<unknown>((current, part) => isRecord(current) ? current[part] : undefined, row)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (isRecord(value)) {
      const translated = value.pt ?? value.en ?? value.es ?? value.name ?? value.nome ?? value.value ?? value.id
      if (translated != null) return String(translated)
    }
  }
  return undefined
}

function providerId(row: JsonRecord) {
  return nestedText(row, ['id', 'admin_graphql_api_id', 'uuid', 'code', 'number', 'order_number', 'token', 'resource_uri']) || 'unknown'
}

function fieldsFor(resource: EcommerceConnectedResource, row: JsonRecord) {
  if (resource === 'pedidos') {
    return {
      numero: nestedText(row, ['number', 'order_number', 'name', 'numero']),
      cliente: nestedText(row, ['customer.name', 'cliente.nome']),
      status: nestedText(row, ['status', 'financial_status', 'estado']),
      valor_total: nestedText(row, ['total_price', 'total', 'valor_total']),
      data_pedido: nestedText(row, ['created_at', 'data_pedido']),
    }
  }
  if (resource === 'produtos' || resource === 'variantes') {
    return {
      nome: nestedText(row, ['title', 'name', 'nome']),
      sku: nestedText(row, ['sku']),
      preco: nestedText(row, ['price', 'preco']),
      estoque: nestedText(row, ['stock', 'inventory_quantity', 'estoque']),
      status: nestedText(row, ['status', 'published', 'ativo']),
    }
  }
  if (resource === 'clientes') {
    return {
      nome: nestedText(row, ['name', 'nome', 'first_name']),
      email: nestedText(row, ['email']),
      telefone: nestedText(row, ['phone', 'telefone']),
      status: nestedText(row, ['status', 'state']),
    }
  }
  return {
    nome: nestedText(row, ['name', 'nome', 'title', 'code', 'codigo']),
    status: nestedText(row, ['status', 'state', 'published', 'ativo']),
  }
}

function toRecord(provider: Provider, resource: EcommerceConnectedResource, row: JsonRecord, includeProviderFields: boolean): ConnectedDomainRecord {
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

async function listLive(provider: Provider, input: ConnectedDomainAdapterInput<EcommerceConnectedResource>): Promise<ConnectedDomainAdapterResult> {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const maxPages = Number(process.env.ECOMMERCE_LIVE_MAX_SCAN_PAGES || 5)
  const pageSize = Math.min(input.limit, Number(config.defaultPageSize || 100))
  const rows: ConnectedDomainRecord[] = []
  let cursor: JsonRecord | undefined
  for (let page = 1; page <= maxPages && rows.length < input.limit; page += 1) {
    const payload = await requestProvider({ provider, credentials, resource: input.resource, config, page, pageSize, cursor })
    const payloadRecord = isRecord(payload) ? payload : { data: payload }
    const rawItems = extractItems(payload, config.itemKeys)
    const items = config.transformItems ? config.transformItems(rawItems, payloadRecord) : rawItems
    rows.push(...items.map((row) => toRecord(provider, input.resource, row, input.includeProviderFields)))
    cursor = config.getNextCursor?.(payloadRecord, items, { page, pageSize, cursor }) || nextCursor(payloadRecord, items, page, pageSize)
    if (!cursor) break
  }
  const limitedRows = rows.slice(0, input.limit)
  return { rows: limitedRows, columns: limitedRows.length ? Object.keys(limitedRows[0].fields) : [], count: limitedRows.length }
}

async function readLive(provider: Provider, input: ConnectedDomainAdapterReadInput<EcommerceConnectedResource>): Promise<ConnectedDomainAdapterResult> {
  const result = await listLive(provider, { ...input, limit: 200 })
  const found = result.rows.find((row) => row.provider_id === input.id || row.id.endsWith(`:${input.id}`))
  return found
    ? { rows: [found], columns: Object.keys(found.fields), count: 1 }
    : { rows: [], columns: [], count: 0, warnings: [`Registro ${input.id} nao encontrado via ${provider}/${input.resource}.`] }
}

function explicitPayload(provider: Provider, payload: JsonRecord) {
  const explicit = payload.provider_payload ?? payload[`${provider}_payload`] ?? payload[`payload_${provider}`]
  return isRecord(explicit) ? explicit : payload
}

function shopifyPath(resource: EcommerceConnectedResource, action: EcommerceConnectedProviderAction, id?: string | null) {
  const version = process.env.SHOPIFY_API_VERSION || '2024-10'
  if (resource === 'pedidos' && action === 'cancelar') return `/admin/api/${version}/orders/${encodeURIComponent(id || '')}/cancel.json`
  if (resource === 'cupons') return id ? `/admin/api/${version}/price_rules/${encodeURIComponent(id)}.json` : `/admin/api/${version}/price_rules.json`
  const root = resource === 'variantes' ? 'variants' : 'products'
  return id ? `/admin/api/${version}/${root}/${encodeURIComponent(id)}.json` : `/admin/api/${version}/${root}.json`
}

function nuvemshopPath(resource: EcommerceConnectedResource, credentials: EcommerceCredentials, id?: string | null, payload?: JsonRecord) {
  const storeId = credentials.storeId || process.env.NUVEMSHOP_STORE_ID || 'missing_store_id'
  if (resource === 'variantes') {
    const productId = toText(payload?.product_id ?? payload?.produto_id ?? payload?.productId)
    if (!productId) throw new Error('product_id e obrigatorio para acoes em variantes na Nuvemshop.')
    return id
      ? `/${storeId}/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(id)}`
      : `/${storeId}/products/${encodeURIComponent(productId)}/variants`
  }
  const root = resource === 'cupons' ? 'coupons' : 'products'
  return id ? `/${storeId}/${root}/${encodeURIComponent(id)}` : `/${storeId}/${root}`
}

function actionMethod(provider: Provider, resource: EcommerceConnectedResource, action: EcommerceConnectedProviderAction): HttpMethod {
  if (provider === 'shopify' && resource === 'pedidos' && action === 'cancelar') return 'POST'
  if (action === 'criar') return 'POST'
  if (action === 'deletar' || action === 'cancelar') return 'DELETE'
  return 'PUT'
}

async function executeAction(provider: Provider, input: ConnectedProviderActionInput<EcommerceConnectedResource, EcommerceConnectedProviderAction>) {
  if (!SUPPORTED_ACTIONS[provider][input.resource]?.includes(input.action)) {
    return {
      ok: false,
      message: `${provider} nao suporta ${input.resource}/${input.action} neste adapter.`,
      id: input.id || null,
    }
  }
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao possui config para ${input.resource}.`)
  if (input.action !== 'criar' && !input.id) throw new Error(`id e obrigatorio para ${provider}/${input.resource}/${input.action}.`)
  const body = explicitPayload(provider, input.payload || {})
  const path = provider === 'shopify'
    ? shopifyPath(input.resource, input.action, input.id)
    : nuvemshopPath(input.resource, credentials, input.id, body)
  const payload = await requestProvider({
    provider,
    credentials,
    resource: input.resource,
    config,
    page: 1,
    pageSize: 1,
    method: actionMethod(provider, input.resource, input.action),
    path,
    body,
  })
  return {
    ok: true,
    message: `Acao ${input.action} executada em ${provider} para ${input.resource}.`,
    id: isRecord(payload) ? providerId(payload) : input.id || null,
    metadata: {
      provider_payload: payload,
      provider_request: body,
    },
  }
}

function createEcommerceApiAdapter(provider: Provider): EcommerceConnectedApiAdapter {
  return {
    provider,
    supportsLiveRead(resource) {
      return !UNSUPPORTED_LIVE[provider]?.includes(resource) && Boolean(configFor(provider, resource))
    },
    supportsAction(resource, action) {
      return Boolean(SUPPORTED_ACTIONS[provider][resource]?.includes(action))
    },
    listLive(input) {
      return listLive(provider, input)
    },
    readLive(input) {
      return readLive(provider, input)
    },
    executeAction(input) {
      return executeAction(provider, input)
    },
  }
}

export const shopifyEcommerceConnectedApiAdapter = createEcommerceApiAdapter('shopify')
export const nuvemshopEcommerceConnectedApiAdapter = createEcommerceApiAdapter('nuvemshop')
export const lojaIntegradaEcommerceConnectedApiAdapter = createEcommerceApiAdapter('loja_integrada')
