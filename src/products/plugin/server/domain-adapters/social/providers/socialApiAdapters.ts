import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import {
  normalizeSocialCredentials,
  type SocialCredentials,
  type SocialResourceConfig,
} from '@/products/integracoes/connectors/social/common/socialConnector'
import { INSTAGRAM_RESOURCES } from '@/products/integracoes/connectors/social/instagram/instagramResources'
import { LINKEDIN_RESOURCES } from '@/products/integracoes/connectors/social/linkedin/linkedinResources'
import { TIKTOK_RESOURCES } from '@/products/integracoes/connectors/social/tiktok/tiktokResources'
import { YOUTUBE_RESOURCES } from '@/products/integracoes/connectors/social/youtube/youtubeResources'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type {
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
  ConnectedDomainRecord,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import type { ConnectedProviderActionInput } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'
import type {
  SocialApiAdapter,
  SocialResource,
} from '@/products/plugin/server/domain-adapters/social/socialTypes'

type JsonRecord = Record<string, unknown>
type Provider = 'instagram' | 'youtube' | 'linkedin' | 'tiktok'

const RESOURCE_ALIAS: Record<SocialResource, string> = {
  perfis: 'profiles',
  posts: 'posts',
  videos: 'videos',
  comentarios: 'comments',
  audiencia: 'audience_daily',
  'desempenho-diario': 'performance_daily',
  engajamento: 'engagement_daily',
}

const PROVIDER_RESOURCES: Record<Provider, SocialResourceConfig[]> = {
  instagram: INSTAGRAM_RESOURCES,
  youtube: YOUTUBE_RESOURCES,
  linkedin: LINKEDIN_RESOURCES,
  tiktok: TIKTOK_RESOURCES,
}

const DEFAULT_BASE_URL: Record<Provider, string> = {
  instagram: 'https://graph.facebook.com/v19.0',
  youtube: 'https://youtube.googleapis.com',
  linkedin: 'https://api.linkedin.com',
  tiktok: 'https://open.tiktokapis.com',
}

const BASE_URL_ENV: Record<Provider, string> = {
  instagram: 'INSTAGRAM_API_BASE_URL',
  youtube: 'YOUTUBE_API_BASE_URL',
  linkedin: 'LINKEDIN_API_BASE_URL',
  tiktok: 'TIKTOK_API_BASE_URL',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
  provider: Provider
}) {
  if (!input.connection.secretRef) {
    throw new Error(`Credencial ausente para ${input.provider}. Reautentique a conexao OAuth.`)
  }
  const raw = await readSecret(input.connection.secretRef)
  const credentials = normalizeSocialCredentials(input.provider, raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: input.provider,
    credentials,
  })
  return refreshed ? normalizeSocialCredentials(input.provider, refreshed) : credentials
}

function configFor(provider: Provider, resource: SocialResource) {
  const providerResource = RESOURCE_ALIAS[resource]
  return PROVIDER_RESOURCES[provider].find((config) => config.resource === providerResource)
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

function nextCursor(payload: JsonRecord, items: JsonRecord[], page: number, pageSize: number) {
  const paging = isRecord(payload.paging) ? payload.paging : undefined
  const next = isRecord(paging?.next) ? paging.next : undefined
  const cursors = isRecord(paging?.cursors) ? paging.cursors : undefined
  const after = next?.after ?? cursors?.after ?? payload.next_cursor ?? payload.nextCursor
  if (typeof after === 'string' || typeof after === 'number') return { after }
  const pageToken = payload.nextPageToken ?? payload.next_page_token
  if (typeof pageToken === 'string' && pageToken) return { pageToken }
  const cursor = payload.cursor
  if (typeof cursor === 'string' && cursor) return { cursor }
  if (payload.has_more === true || payload.hasMore === true || items.length >= pageSize) return { page: page + 1 }
  return undefined
}

async function requestProvider(input: {
  provider: Provider
  credentials: SocialCredentials
  resource: SocialResource
  config: SocialResourceConfig
  page: number
  pageSize: number
  cursor?: JsonRecord
}) {
  const method = input.config.method || 'GET'
  const fullInput = {
    page: input.page,
    pageSize: input.pageSize,
    cursor: input.cursor,
    credentials: input.credentials,
  }
  const baseUrl = process.env[BASE_URL_ENV[input.provider]] || input.credentials.baseUrl || DEFAULT_BASE_URL[input.provider]
  const payload = await connectorJsonRequest<JsonRecord | JsonRecord[]>({
    provider: input.provider,
    resource: input.resource,
    url: buildUrl(baseUrl, input.config.buildPath?.(fullInput) || input.config.path, input.config.buildQuery?.(fullInput)),
    method,
    headers: {
      Authorization: `Bearer ${input.credentials.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? input.config.buildBody?.(fullInput) : undefined,
    rateLimitMs: Number(process.env[`INTEGRATIONS_RATE_LIMIT_${input.provider.toUpperCase()}_MS`] || 300),
  })
  return payload.payload
}

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce<unknown>((current, part) => isRecord(current) ? current[part] : undefined, row)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function providerId(row: JsonRecord) {
  return text(row, ['id', 'ID', 'urn', 'video_id', 'comment_id', 'date', 'day']) || 'unknown'
}

function fieldsFor(resource: SocialResource, row: JsonRecord) {
  if (resource === 'perfis') {
    return {
      nome: text(row, ['name', 'display_name', 'localizedName', 'snippet.title']),
      username: text(row, ['username', 'vanityName']),
      followers: text(row, ['followers_count', 'follower_count', 'statistics.subscriberCount']),
    }
  }
  if (resource === 'comentarios') {
    return {
      texto: text(row, ['text', 'message', 'snippet.topLevelComment.snippet.textDisplay']),
      author_name: text(row, ['username', 'from.name', 'snippet.topLevelComment.snippet.authorDisplayName']),
      created_at: text(row, ['timestamp', 'created_at', 'snippet.topLevelComment.snippet.publishedAt']),
    }
  }
  if (resource === 'audiencia' || resource === 'desempenho-diario' || resource === 'engajamento') {
    return {
      data_ref: text(row, ['date', 'day', 'end_time']),
      metric: text(row, ['name', 'metric']),
      value: text(row, ['value', 'values.0.value']),
    }
  }
  return {
    titulo: text(row, ['title', 'snippet.title']),
    texto: text(row, ['caption', 'description', 'video_description', 'snippet.description']),
    url: text(row, ['permalink', 'share_url', 'media_url', 'embed_link']),
    published_at: text(row, ['published_at', 'timestamp', 'create_time', 'snippet.publishedAt']),
  }
}

function toRecord(provider: Provider, resource: SocialResource, row: JsonRecord, includeProviderFields: boolean): ConnectedDomainRecord {
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

async function listLive(provider: Provider, input: ConnectedDomainAdapterInput<SocialResource>): Promise<ConnectedDomainAdapterResult> {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const payload = await requestProvider({ provider, credentials, resource: input.resource, config, page: 1, pageSize: input.limit })
  const payloadRecord = isRecord(payload) ? payload : { data: payload }
  const rawItems = extractItems(payload, config.itemKeys)
  const items = config.transformItems ? config.transformItems(rawItems, payloadRecord) : rawItems
  const rows = items.slice(0, input.limit).map((row) => toRecord(provider, input.resource, row, input.includeProviderFields))
  return { rows, columns: rows.length ? Object.keys(rows[0].fields) : [], count: rows.length }
}

async function readLive(provider: Provider, input: ConnectedDomainAdapterReadInput<SocialResource>): Promise<ConnectedDomainAdapterResult> {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const maxPages = Number(process.env.SOCIAL_LIVE_READ_MAX_SCAN_PAGES || 10)
  let cursor: JsonRecord | undefined
  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await requestProvider({ provider, credentials, resource: input.resource, config, page, pageSize: 100, cursor })
    const payloadRecord = isRecord(payload) ? payload : { data: payload }
    const rawItems = extractItems(payload, config.itemKeys)
    const items = config.transformItems ? config.transformItems(rawItems, payloadRecord) : rawItems
    const found = items.find((row) => providerId(row) === input.id)
    if (found) {
      const row = toRecord(provider, input.resource, found, input.includeProviderFields)
      return { rows: [row], columns: Object.keys(row.fields), count: 1 }
    }
    cursor = nextCursor(payloadRecord, items, page, 100)
    if (!cursor) break
  }
  return { rows: [], columns: [], count: 0, warnings: [`Registro ${input.id} nao encontrado via ${provider}/${input.resource}.`] }
}

function createSocialApiAdapter(provider: Provider): SocialApiAdapter {
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
    executeAction(input: ConnectedProviderActionInput<SocialResource, never>) {
      return Promise.resolve({
        ok: false,
        message: `${provider} nao possui acoes sociais habilitadas neste adapter.`,
        id: input.id || null,
      })
    },
  }
}

export const instagramSocialApiAdapter = createSocialApiAdapter('instagram')
export const youtubeSocialApiAdapter = createSocialApiAdapter('youtube')
export const linkedinSocialApiAdapter = createSocialApiAdapter('linkedin')
export const tiktokSocialApiAdapter = createSocialApiAdapter('tiktok')
