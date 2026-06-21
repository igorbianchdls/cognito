import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { HUBSPOT_RESOURCES } from '@/products/integracoes/connectors/crm/hubspot/hubspotResources'
import { RD_STATION_RESOURCES } from '@/products/integracoes/connectors/crm/rdStation/rdStationResources'
import type { CrmResourceConfig } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { CrmApiAdapter } from '@/products/plugin/server/domain-adapters/crm/crmApiAdapterRegistry'
import type {
  ConnectedCrmProviderAction,
  ConnectedCrmResource,
} from '@/products/plugin/server/domain-adapters/crm/crmTypes'
import type { ConnectedDomainRecord } from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import type {
  ConnectedProviderActionInput,
  ConnectedProviderActionResult,
} from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

type JsonRecord = Record<string, unknown>
type Provider = 'hubspot' | 'rd_station_crm'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type Credentials = {
  accessToken: string
  baseUrl?: string
}

const RESOURCES: Record<Provider, CrmResourceConfig[]> = {
  hubspot: HUBSPOT_RESOURCES,
  rd_station_crm: RD_STATION_RESOURCES,
}

const DEFAULT_BASE_URL: Record<Provider, string> = {
  hubspot: 'https://api.hubapi.com',
  rd_station_crm: 'https://crm.rdstation.com',
}

const HUBSPOT_OBJECTS: Partial<Record<ConnectedCrmResource, string>> = {
  contas: 'companies',
  contatos: 'contacts',
  leads: '0-136',
  oportunidades: 'deals',
  atividades: 'tasks',
}

const ACTION_RESOURCES = new Set<ConnectedCrmResource>([
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])

const SUPPORTED_ACTIONS: Record<Provider, Partial<Record<ConnectedCrmResource, ConnectedCrmProviderAction[]>>> = {
  hubspot: {
    contas: ['criar', 'atualizar', 'arquivar'],
    contatos: ['criar', 'atualizar', 'arquivar'],
    leads: ['criar', 'atualizar', 'arquivar'],
    oportunidades: ['criar', 'atualizar', 'mover_estagio', 'ganhar', 'perder', 'arquivar'],
    atividades: ['criar', 'atualizar', 'concluir', 'cancelar', 'reabrir'],
  },
  rd_station_crm: {
    contas: ['criar', 'atualizar', 'arquivar'],
    contatos: ['criar', 'atualizar', 'arquivar'],
    leads: ['criar', 'atualizar', 'arquivar'],
    oportunidades: ['criar', 'atualizar', 'mover_estagio', 'ganhar', 'perder', 'arquivar'],
    atividades: ['criar', 'atualizar', 'concluir', 'cancelar', 'reabrir'],
  },
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseCredentials(provider: Provider, value: string | null): Credentials {
  if (!value) throw new Error(`Credencial OAuth ${provider} ausente.`)
  const parsed = JSON.parse(value) as unknown
  if (!isRecord(parsed)) throw new Error(`Credencial OAuth ${provider} invalida.`)
  const accessToken = parsed.accessToken ?? parsed.access_token ?? parsed.token
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error(`Credencial OAuth ${provider} invalida: accessToken ausente.`)
  }
  const baseUrl = parsed.baseUrl ?? parsed.base_url
  return {
    accessToken: accessToken.trim(),
    ...(typeof baseUrl === 'string' && baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
  }
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
  const credentials = parseCredentials(input.provider, raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: input.provider,
    credentials,
  })
  return refreshed ? parseCredentials(input.provider, JSON.stringify(refreshed)) : credentials
}

function baseUrl(provider: Provider, credentials: Credentials) {
  const envKey = provider === 'hubspot' ? 'HUBSPOT_API_BASE_URL' : 'RD_STATION_CRM_API_BASE_URL'
  return (process.env[envKey] || credentials.baseUrl || DEFAULT_BASE_URL[provider]).replace(/\/+$/, '')
}

function buildUrl(base: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function requestProvider(input: {
  provider: Provider
  credentials: Credentials
  resource: ConnectedCrmResource
  path: string
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined>
  body?: JsonRecord
}) {
  const response = await connectorJsonRequest<JsonRecord | JsonRecord[]>({
    provider: input.provider,
    resource: input.resource,
    url: buildUrl(baseUrl(input.provider, input.credentials), input.path, input.query),
    method: input.method || 'GET',
    headers: {
      Authorization: `Bearer ${input.credentials.accessToken}`,
      ...(input.provider === 'hubspot' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input.body,
    rateLimitMs: Number(process.env[`INTEGRATIONS_RATE_LIMIT_${input.provider.toUpperCase()}_MS`] || 300),
  })
  return response.payload
}

function nestedValue(row: JsonRecord, path: string): unknown {
  return path.split('.').reduce<unknown>((current, part) => {
    if (!isRecord(current)) return undefined
    return current[part]
  }, row)
}

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = nestedValue(row, key)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (isRecord(value)) {
      const nested = value.name ?? value.label ?? value.value ?? value.id
      if (nested != null) return String(nested)
    }
  }
  return undefined
}

function numberValue(row: JsonRecord, keys: string[]) {
  const value = text(row, keys)
  if (value === undefined) return undefined
  const parsed = Number(String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function extractItems(payload: unknown, itemKeys: string[]) {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (!isRecord(payload)) return []
  for (const key of itemKeys) {
    const value = nestedValue(payload, key)
    if (Array.isArray(value)) return value.filter(isRecord)
  }
  const arrays = Object.values(payload).filter(Array.isArray) as unknown[][]
  if (arrays.length === 1) return arrays[0].filter(isRecord)
  return []
}

function providerId(row: JsonRecord) {
  return text(row, ['id', 'uuid', '_id', 'key']) || 'unknown'
}

function fieldsFor(resource: ConnectedCrmResource, row: JsonRecord) {
  const props = isRecord(row.properties) ? row.properties : row
  if (resource === 'contas') {
    return {
      nome: text(props, ['name', 'nome']),
      telefone: text(props, ['phone', 'telefone']),
      cidade: text(props, ['city', 'cidade']),
      status: text(props, ['status']),
    }
  }
  if (resource === 'contatos') {
    const firstName = text(props, ['firstname', 'first_name', 'name'])
    const lastName = text(props, ['lastname', 'last_name'])
    return {
      nome: text(props, ['nome']) || [firstName, lastName].filter(Boolean).join(' ') || null,
      email: text(props, ['email']),
      telefone: text(props, ['phone', 'telefone']),
      conta_id: text(props, ['company_id', 'organization_id', 'org_id']),
    }
  }
  if (resource === 'oportunidades' || resource === 'leads') {
    return {
      nome: text(props, ['dealname', 'name', 'title', 'hs_lead_name', 'nome']),
      valor: numberValue(props, ['amount', 'value', 'valor']),
      status: text(props, ['dealstage', 'status', 'stage_id']),
      fase_id: text(props, ['dealstage', 'stage_id', 'fase_id']),
    }
  }
  if (resource === 'atividades') {
    return {
      titulo: text(props, ['hs_task_subject', 'subject', 'title', 'titulo']),
      status: text(props, ['hs_task_status', 'status', 'done']),
      due_at: text(props, ['hs_timestamp', 'due_date', 'deadline']),
    }
  }
  return {
    nome: text(props, ['name', 'nome', 'label', 'email']),
    status: text(props, ['status', 'active', 'archived']),
  }
}

function toDomainRecord(input: {
  provider: Provider
  resource: ConnectedCrmResource
  row: JsonRecord
  includeProviderFields: boolean
}): ConnectedDomainRecord {
  const id = providerId(input.row)
  return {
    id: `${input.provider}:${input.resource}:${id}`,
    provider: input.provider,
    provider_id: id,
    resource: input.resource,
    fields: fieldsFor(input.resource, input.row),
    ...(input.includeProviderFields ? { provider_fields: input.row } : {}),
  }
}

function configFor(provider: Provider, resource: ConnectedCrmResource) {
  return RESOURCES[provider].find((config) => config.resource === resource)
}

async function listLive(provider: Provider, input: Parameters<CrmApiAdapter['listLive']>[0]) {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const payload = await requestProvider({
    provider,
    credentials,
    resource: input.resource,
    path: config.path,
    query: config.buildQuery?.({ page: 1, pageSize: input.limit, cursor: undefined }),
    method: config.method || 'GET',
    body: config.method === 'POST' ? config.buildBody?.({ page: 1, pageSize: input.limit, cursor: undefined }) : undefined,
  })
  const payloadRecord = isRecord(payload) ? payload : { data: payload }
  const rawItems = extractItems(payload, config.itemKeys)
  const items = config.transformItems ? config.transformItems(rawItems, payloadRecord) : rawItems
  const rows = items.slice(0, input.limit).map((row) => toDomainRecord({
    provider,
    resource: input.resource,
    row,
    includeProviderFields: input.includeProviderFields,
  }))
  return { rows, columns: rows.length ? Object.keys(rows[0].fields) : [], count: rows.length }
}

async function readLive(provider: Provider, input: Parameters<CrmApiAdapter['readLive']>[0]) {
  const config = configFor(provider, input.resource)
  if (!config) throw new Error(`${provider} nao suporta leitura live de ${input.resource}.`)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })

  if (provider === 'hubspot' && input.resource === 'fases_pipeline') {
    const listed = await listLive(provider, { ...input, resource: 'fases_pipeline', limit: 200 })
    const rows = listed.rows.filter((row) => row.provider_id === input.id)
    return { ...listed, rows, count: rows.length }
  }

  const payload = await requestProvider({
    provider,
    credentials,
    resource: input.resource,
    path: `${config.path.replace(/\/+$/, '')}/${encodeURIComponent(input.id)}`,
    query: provider === 'hubspot' && input.resource !== 'usuarios' && input.resource !== 'pipelines'
      ? config.buildQuery?.({ page: 1, pageSize: 1, cursor: undefined })
      : undefined,
  })
  const row = isRecord(payload) && isRecord(payload.data) ? payload.data : payload
  const rows = isRecord(row)
    ? [toDomainRecord({ provider, resource: input.resource, row, includeProviderFields: input.includeProviderFields })]
    : []
  return { rows, columns: rows.length ? Object.keys(rows[0].fields) : [], count: rows.length }
}

function clean(record: JsonRecord) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function explicitPayload(provider: Provider, payload: JsonRecord) {
  const explicit = payload.provider_payload ?? payload[`${provider}_payload`] ?? payload[`payload_${provider}`]
  return isRecord(explicit) ? explicit : undefined
}

function hubspotProperties(resource: ConnectedCrmResource, action: ConnectedCrmProviderAction, payload: JsonRecord) {
  const explicit = explicitPayload('hubspot', payload)
  if (explicit) return explicit
  if (resource === 'contas') return clean({ name: text(payload, ['nome', 'name']), domain: text(payload, ['domain']), phone: text(payload, ['telefone', 'phone']) })
  if (resource === 'contatos') return clean({ firstname: text(payload, ['first_name', 'firstname']), lastname: text(payload, ['last_name', 'lastname']), email: text(payload, ['email']), phone: text(payload, ['telefone', 'phone']) })
  if (resource === 'leads') return clean({ hs_lead_name: text(payload, ['nome', 'name', 'title']), hs_pipeline_stage: text(payload, ['fase_id', 'stage_id']), hs_pipeline: text(payload, ['pipeline_id']) })
  if (resource === 'oportunidades') return clean({
    dealname: text(payload, ['nome', 'name', 'title']),
    amount: numberValue(payload, ['valor', 'amount', 'value']),
    pipeline: text(payload, ['pipeline_id']),
    dealstage: text(payload, ['stage_id', 'fase_id']) || (action === 'ganhar' || action === 'perder' ? text(payload, ['dealstage']) : undefined),
    closedate: text(payload, ['data_fechamento', 'closedate']),
  })
  return clean({
    hs_task_subject: text(payload, ['titulo', 'subject', 'name']),
    hs_task_status: action === 'concluir' ? 'COMPLETED' : action === 'reabrir' ? 'NOT_STARTED' : text(payload, ['status']),
    hs_timestamp: text(payload, ['due_at', 'due_date', 'deadline']),
    hs_task_body: text(payload, ['descricao', 'description']),
  })
}

function rdPayload(resource: ConnectedCrmResource, action: ConnectedCrmProviderAction, payload: JsonRecord) {
  const explicit = explicitPayload('rd_station_crm', payload)
  if (explicit) return explicit
  const base = clean({
    name: text(payload, ['nome', 'name', 'title']),
    title: text(payload, ['titulo', 'title', 'nome']),
    email: text(payload, ['email']),
    phone: text(payload, ['telefone', 'phone']),
    value: numberValue(payload, ['valor', 'amount', 'value']),
    deal_stage_id: text(payload, ['stage_id', 'fase_id']),
    deal_pipeline_id: text(payload, ['pipeline_id']),
    done: action === 'concluir' ? true : action === 'reabrir' ? false : undefined,
    status: action === 'ganhar' ? 'won' : action === 'perder' ? 'lost' : text(payload, ['status']),
  })
  if (resource === 'oportunidades') return { deal: base }
  if (resource === 'contas') return { organization: base }
  if (resource === 'contatos') return { contact: base }
  if (resource === 'leads') return { lead: base }
  return { activity: base }
}

async function executeHubSpotAction(input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>) {
  const objectType = HUBSPOT_OBJECTS[input.resource]
  if (!objectType || !ACTION_RESOURCES.has(input.resource)) {
    return unsupported('hubspot', input)
  }
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider: 'hubspot' })
  const isCreate = input.action === 'criar'
  const method: HttpMethod = input.action === 'arquivar' || input.action === 'cancelar' ? 'DELETE' : isCreate ? 'POST' : 'PATCH'
  const path = isCreate
    ? `/crm/v3/objects/${objectType}`
    : `/crm/v3/objects/${objectType}/${encodeURIComponent(input.id || '')}`
  if (!isCreate && !input.id) throw new Error(`id e obrigatorio para hubspot/${input.resource}/${input.action}.`)
  const requestPayload = method === 'DELETE' ? undefined : { properties: hubspotProperties(input.resource, input.action, input.payload || {}) }
  const payload = await requestProvider({
    provider: 'hubspot',
    credentials,
    resource: input.resource,
    path,
    method,
    body: requestPayload,
  })
  return actionResult('hubspot', input, payload, requestPayload || {})
}

async function executeRdAction(input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>) {
  const config = configFor('rd_station_crm', input.resource)
  if (!config || !ACTION_RESOURCES.has(input.resource)) return unsupported('rd_station_crm', input)
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider: 'rd_station_crm' })
  const isCreate = input.action === 'criar'
  const method: HttpMethod = input.action === 'arquivar' || input.action === 'cancelar' ? 'DELETE' : isCreate ? 'POST' : 'PUT'
  const path = isCreate ? config.path : `${config.path.replace(/\/+$/, '')}/${encodeURIComponent(input.id || '')}`
  if (!isCreate && !input.id) throw new Error(`id e obrigatorio para rd_station_crm/${input.resource}/${input.action}.`)
  const requestPayload = method === 'DELETE' ? undefined : rdPayload(input.resource, input.action, input.payload || {})
  const payload = await requestProvider({
    provider: 'rd_station_crm',
    credentials,
    resource: input.resource,
    path,
    method,
    body: requestPayload,
  })
  return actionResult('rd_station_crm', input, payload, requestPayload || {})
}

function unsupported(provider: Provider, input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>): ConnectedProviderActionResult {
  return {
    ok: false,
    message: `${provider} nao suporta ${input.resource}/${input.action} neste adapter.`,
    id: input.id || null,
  }
}

function actionResult(
  provider: Provider,
  input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>,
  payload: unknown,
  requestPayload: JsonRecord,
): ConnectedProviderActionResult {
  const envelope = isRecord(payload) && isRecord(payload.data) ? payload.data : payload
  const id = isRecord(envelope) ? providerId(envelope) : input.id || null
  const status = isRecord(envelope) ? text(envelope, ['status', 'properties.hs_task_status', 'properties.dealstage']) || null : null
  return {
    ok: true,
    message: `Acao ${input.action} executada em ${provider} para ${input.resource}.`,
    id: id === 'unknown' ? input.id || null : id,
    status,
    metadata: {
      provider_payload: payload,
      provider_request: requestPayload,
    },
  }
}

export function createHubSpotRdCrmApiAdapter(provider: Provider): CrmApiAdapter {
  return {
    provider,
    supportsLiveRead(resource) {
      return Boolean(configFor(provider, resource))
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
      if (!this.supportsAction(input.resource, input.action)) return Promise.resolve(unsupported(provider, input))
      return provider === 'hubspot' ? executeHubSpotAction(input) : executeRdAction(input)
    },
  }
}

export const hubspotCrmApiAdapter = createHubSpotRdCrmApiAdapter('hubspot')
export const rdStationCrmApiAdapter = createHubSpotRdCrmApiAdapter('rd_station_crm')
