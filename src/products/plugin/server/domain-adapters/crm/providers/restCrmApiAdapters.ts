import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { connectorJsonRequest } from '@/products/integracoes/connectors/runtime/connectorHttp'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
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
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type CrmProvider = 'bitrix24' | 'pipedrive'

type CrmCredentials = {
  accessToken: string
  baseUrl?: string
  portalUrl?: string
  domain?: string
}

const READ_RESOURCES = new Set<ConnectedCrmResource>([
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
])

const SUPPORTED_ACTIONS: Partial<Record<ConnectedCrmResource, ConnectedCrmProviderAction[]>> = {
  contas: ['criar', 'atualizar', 'arquivar', 'reativar'],
  contatos: ['criar', 'atualizar', 'arquivar', 'reativar'],
  leads: ['criar', 'atualizar', 'arquivar', 'reativar'],
  oportunidades: ['criar', 'atualizar', 'mover_estagio', 'ganhar', 'perder', 'reabrir', 'arquivar'],
  atividades: ['criar', 'atualizar', 'concluir', 'cancelar', 'reabrir'],
}

const BITRIX_ENTITY: Partial<Record<ConnectedCrmResource, string>> = {
  contas: 'crm.company',
  contatos: 'crm.contact',
  leads: 'crm.lead',
  oportunidades: 'crm.deal',
  atividades: 'crm.activity',
}

const PIPEDRIVE_PATHS: Record<ConnectedCrmResource, string> = {
  contas: '/v1/organizations',
  contatos: '/v1/persons',
  leads: '/v1/leads',
  oportunidades: '/v1/deals',
  atividades: '/v1/activities',
  usuarios: '/v1/users',
  pipelines: '/v1/pipelines',
  fases_pipeline: '/v1/stages',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseCredentials(provider: string, value: string | null): CrmCredentials {
  if (!value) throw new Error(`Credencial OAuth ${provider} ausente.`)
  const parsed = JSON.parse(value) as unknown
  if (!isRecord(parsed)) throw new Error(`Credencial OAuth ${provider} invalida.`)
  const accessToken = parsed.accessToken ?? parsed.access_token ?? parsed.token
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error(`Credencial OAuth ${provider} invalida: accessToken ausente.`)
  }
  return {
    accessToken: accessToken.trim(),
    baseUrl: text(parsed, ['baseUrl', 'base_url']),
    portalUrl: text(parsed, ['portalUrl', 'portal_url']),
    domain: text(parsed, ['domain']),
  }
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
  provider: CrmProvider
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

function text(row: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce<unknown>((current, part) => {
      if (!isRecord(current)) return undefined
      return current[part]
    }, row)
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

function optionalRecord(value: unknown) {
  return isRecord(value) ? value : undefined
}

function explicitPayload(provider: CrmProvider, payload: JsonRecord) {
  return optionalRecord(payload.provider_payload)
    || optionalRecord(payload[`${provider}_payload`])
    || optionalRecord(payload[`payload_${provider}`])
}

function baseUrl(provider: CrmProvider, credentials: CrmCredentials) {
  if (provider === 'pipedrive') {
    return (process.env.PIPEDRIVE_API_BASE_URL || credentials.baseUrl || 'https://api.pipedrive.com').replace(/\/+$/, '')
  }
  const value = process.env.BITRIX24_API_BASE_URL
    || credentials.baseUrl
    || credentials.portalUrl
    || (credentials.domain ? `https://${credentials.domain}` : '')
  if (!value) {
    throw new Error('Bitrix24 requer BITRIX24_API_BASE_URL, baseUrl, portalUrl ou domain na credencial OAuth.')
  }
  return value.replace(/\/+$/, '')
}

function buildUrl(base: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(`${base}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

function extractItems(provider: CrmProvider, payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (!isRecord(payload)) return []
  const value = provider === 'bitrix24' ? payload.result : payload.data
  if (Array.isArray(value)) return value.filter(isRecord)
  if (isRecord(value)) return [value]
  return []
}

function extractEnvelope(provider: CrmProvider, payload: unknown) {
  if (!isRecord(payload)) return {}
  const value = provider === 'bitrix24' ? payload.result : payload.data
  return isRecord(value) ? value : payload
}

function providerId(row: JsonRecord) {
  return text(row, ['id', 'ID', 'uuid']) || 'unknown'
}

function fieldsFor(resource: ConnectedCrmResource, row: JsonRecord) {
  const props = isRecord(row.properties) ? row.properties : row
  if (resource === 'contas') {
    return {
      nome: text(props, ['name', 'NAME', 'TITLE']),
      telefone: text(props, ['phone', 'PHONE.0.VALUE']),
      cidade: text(props, ['city', 'ADDRESS_CITY']),
      status: text(props, ['status', 'OPENED']),
    }
  }
  if (resource === 'contatos') {
    const firstName = text(props, ['firstname', 'first_name', 'NAME'])
    const lastName = text(props, ['lastname', 'last_name', 'LAST_NAME'])
    return {
      nome: text(props, ['name', 'TITLE']) || [firstName, lastName].filter(Boolean).join(' ') || null,
      email: text(props, ['email', 'EMAIL.0.VALUE']),
      telefone: text(props, ['phone', 'PHONE.0.VALUE']),
      conta_id: text(props, ['org_id', 'company_id', 'COMPANY_ID']),
    }
  }
  if (resource === 'leads') {
    return {
      nome: text(props, ['title', 'TITLE', 'hs_lead_name']),
      email: text(props, ['email', 'EMAIL.0.VALUE']),
      telefone: text(props, ['phone', 'PHONE.0.VALUE']),
      status: text(props, ['status', 'STATUS_ID']),
    }
  }
  if (resource === 'oportunidades') {
    return {
      nome: text(props, ['title', 'TITLE', 'dealname']),
      valor: numberValue(props, ['value', 'amount', 'OPPORTUNITY']),
      status: text(props, ['status', 'STAGE_ID', 'dealstage']),
      fase_id: text(props, ['stage_id', 'STAGE_ID', 'dealstage']),
    }
  }
  return {
    titulo: text(props, ['subject', 'SUBJECT', 'hs_task_subject']),
    status: text(props, ['status', 'STATUS', 'done']),
    due_at: text(props, ['due_date', 'DEADLINE', 'hs_timestamp']),
  }
}

function toDomainRecord(input: {
  provider: CrmProvider
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

async function requestProvider(input: {
  provider: CrmProvider
  credentials: CrmCredentials
  resource: ConnectedCrmResource
  path: string
  method?: HttpMethod
  query?: Record<string, string | number | boolean | undefined>
  body?: JsonRecord
}) {
  const query = { ...(input.query || {}) }
  if (input.provider === 'bitrix24') query.auth = input.credentials.accessToken
  const response = await connectorJsonRequest<JsonRecord | JsonRecord[]>({
    provider: input.provider,
    resource: input.resource,
    url: buildUrl(baseUrl(input.provider, input.credentials), input.path, query),
    method: input.method || 'GET',
    headers: input.provider === 'bitrix24' ? undefined : {
      Authorization: `Bearer ${input.credentials.accessToken}`,
    },
    body: input.body,
    rateLimitMs: Number(process.env[`INTEGRATIONS_RATE_LIMIT_${input.provider.toUpperCase()}_MS`] || 300),
  })
  return response.payload
}

function bitrixPath(resource: ConnectedCrmResource, action: 'list' | 'get' | 'add' | 'update' | 'delete') {
  const entity = BITRIX_ENTITY[resource]
  if (!entity) throw new Error(`Bitrix24 nao suporta leitura live de ${resource} neste adapter.`)
  return `/rest/${entity}.${action}.json`
}

async function listLive(provider: CrmProvider, input: Parameters<CrmApiAdapter['listLive']>[0]) {
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const payload = provider === 'bitrix24'
    ? await requestProvider({
      provider,
      credentials,
      resource: input.resource,
      path: bitrixPath(input.resource, 'list'),
      query: { start: 0, limit: input.limit },
    })
    : await requestProvider({
      provider,
      credentials,
      resource: input.resource,
      path: PIPEDRIVE_PATHS[input.resource],
      query: { start: 0, limit: input.limit },
    })
  const rows = extractItems(provider, payload)
    .slice(0, input.limit)
    .map((row) => toDomainRecord({ provider, resource: input.resource, row, includeProviderFields: input.includeProviderFields }))
  return { rows, columns: rows.length ? Object.keys(rows[0].fields) : [], count: rows.length }
}

async function readLive(provider: CrmProvider, input: Parameters<CrmApiAdapter['readLive']>[0]) {
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider })
  const payload = provider === 'bitrix24'
    ? await requestProvider({
      provider,
      credentials,
      resource: input.resource,
      path: bitrixPath(input.resource, 'get'),
      query: { id: input.id },
    })
    : await requestProvider({
      provider,
      credentials,
      resource: input.resource,
      path: `${PIPEDRIVE_PATHS[input.resource]}/${encodeURIComponent(input.id)}`,
    })
  const row = extractEnvelope(provider, payload)
  const rows = Object.keys(row).length
    ? [toDomainRecord({ provider, resource: input.resource, row, includeProviderFields: input.includeProviderFields })]
    : []
  return { rows, columns: rows.length ? Object.keys(rows[0].fields) : [], count: rows.length }
}

function bitrixFields(resource: ConnectedCrmResource, action: ConnectedCrmProviderAction, payload: JsonRecord) {
  const explicit = explicitPayload('bitrix24', payload)
  if (explicit) return explicit
  if (resource === 'contas') {
    return {
      TITLE: text(payload, ['nome', 'name', 'titulo']) || text(payload, ['razao_social']),
      ASSIGNED_BY_ID: text(payload, ['responsavel_id', 'owner_id']),
      OPENED: action === 'reativar' ? 'Y' : undefined,
    }
  }
  if (resource === 'contatos') {
    const nome = text(payload, ['nome', 'name'])
    return {
      NAME: text(payload, ['first_name', 'firstname']) || nome,
      LAST_NAME: text(payload, ['last_name', 'lastname']),
      POST: text(payload, ['cargo', 'jobtitle']),
      COMPANY_ID: text(payload, ['conta_id', 'company_id']),
      ASSIGNED_BY_ID: text(payload, ['responsavel_id', 'owner_id']),
      OPENED: action === 'reativar' ? 'Y' : undefined,
    }
  }
  if (resource === 'leads') {
    return {
      TITLE: text(payload, ['nome', 'title', 'titulo']),
      NAME: text(payload, ['first_name', 'firstname']),
      LAST_NAME: text(payload, ['last_name', 'lastname']),
      COMPANY_TITLE: text(payload, ['empresa', 'company']),
      SOURCE_ID: text(payload, ['origem', 'source']),
      STATUS_ID: text(payload, ['status', 'fase_id', 'stage_id']),
      ASSIGNED_BY_ID: text(payload, ['responsavel_id', 'owner_id']),
      OPENED: action === 'reativar' ? 'Y' : undefined,
    }
  }
  if (resource === 'oportunidades') {
    const stage = text(payload, ['stage_id', 'fase_id', 'STAGE_ID'])
    if (['mover_estagio', 'ganhar', 'perder', 'reabrir'].includes(action) && !stage) {
      throw new Error(`payload.stage_id e obrigatorio para bitrix24/${resource}/${action}.`)
    }
    return {
      TITLE: text(payload, ['nome', 'title', 'titulo']),
      COMPANY_ID: text(payload, ['conta_id', 'company_id']),
      CONTACT_ID: text(payload, ['contato_id', 'person_id']),
      CATEGORY_ID: text(payload, ['pipeline_id', 'category_id']),
      STAGE_ID: stage,
      OPPORTUNITY: numberValue(payload, ['valor', 'value', 'amount']),
      CURRENCY_ID: text(payload, ['moeda', 'currency']),
      ASSIGNED_BY_ID: text(payload, ['responsavel_id', 'owner_id']),
    }
  }
  return {
    SUBJECT: text(payload, ['titulo', 'subject', 'nome']),
    DESCRIPTION: text(payload, ['descricao', 'description']),
    TYPE_ID: text(payload, ['tipo', 'type']),
    DEADLINE: text(payload, ['due_at', 'due_date', 'deadline']),
    COMPLETED: action === 'concluir' ? 'Y' : action === 'reabrir' ? 'N' : undefined,
    RESPONSIBLE_ID: text(payload, ['responsavel_id', 'owner_id']),
  }
}

function cleanRecord(record: JsonRecord) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

function pipedrivePayload(resource: ConnectedCrmResource, action: ConnectedCrmProviderAction, payload: JsonRecord) {
  const explicit = explicitPayload('pipedrive', payload)
  if (explicit) return explicit
  if (resource === 'contas') {
    return cleanRecord({
      name: text(payload, ['nome', 'name']),
      owner_id: text(payload, ['responsavel_id', 'owner_id']),
      active_flag: action === 'reativar' ? true : undefined,
    })
  }
  if (resource === 'contatos') {
    return cleanRecord({
      name: text(payload, ['nome', 'name']),
      first_name: text(payload, ['first_name', 'firstname']),
      last_name: text(payload, ['last_name', 'lastname']),
      email: text(payload, ['email']),
      phone: text(payload, ['telefone', 'phone']),
      org_id: text(payload, ['conta_id', 'org_id', 'company_id']),
      owner_id: text(payload, ['responsavel_id', 'owner_id']),
      active_flag: action === 'reativar' ? true : undefined,
    })
  }
  if (resource === 'leads') {
    return cleanRecord({
      title: text(payload, ['nome', 'title']),
      person_id: text(payload, ['contato_id', 'person_id']),
      organization_id: text(payload, ['conta_id', 'organization_id', 'org_id']),
      owner_id: text(payload, ['responsavel_id', 'owner_id']),
      value: numberValue(payload, ['valor', 'value']),
      expected_close_date: text(payload, ['data_fechamento', 'expected_close_date']),
      archived: action === 'reativar' ? false : undefined,
    })
  }
  if (resource === 'oportunidades') {
    return cleanRecord({
      title: text(payload, ['nome', 'title']),
      value: numberValue(payload, ['valor', 'value', 'amount']),
      currency: text(payload, ['moeda', 'currency']),
      person_id: text(payload, ['contato_id', 'person_id']),
      org_id: text(payload, ['conta_id', 'org_id']),
      pipeline_id: text(payload, ['pipeline_id']),
      stage_id: text(payload, ['stage_id', 'fase_id']),
      user_id: text(payload, ['responsavel_id', 'owner_id', 'user_id']),
      expected_close_date: text(payload, ['data_fechamento', 'expected_close_date']),
      status: action === 'ganhar' ? 'won' : action === 'perder' ? 'lost' : action === 'reabrir' ? 'open' : text(payload, ['status']),
    })
  }
  return cleanRecord({
    subject: text(payload, ['titulo', 'subject', 'nome']),
    type: text(payload, ['tipo', 'type']),
    due_date: text(payload, ['data', 'due_date']),
    due_time: text(payload, ['hora', 'due_time']),
    deal_id: text(payload, ['oportunidade_id', 'deal_id']),
    person_id: text(payload, ['contato_id', 'person_id']),
    org_id: text(payload, ['conta_id', 'org_id']),
    user_id: text(payload, ['responsavel_id', 'owner_id', 'user_id']),
    done: action === 'concluir' ? 1 : action === 'reabrir' ? 0 : undefined,
  })
}

function actionMethod(provider: CrmProvider, resource: ConnectedCrmResource, action: ConnectedCrmProviderAction): HttpMethod {
  if (action === 'arquivar' || action === 'cancelar') return 'DELETE'
  if (provider === 'pipedrive' && resource === 'leads' && action === 'atualizar') return 'PATCH'
  if (action === 'criar') return 'POST'
  return 'PUT'
}

async function executeBitrixAction(input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>) {
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider: 'bitrix24' })
  const methodAction = input.action === 'criar'
    ? 'add'
    : (input.action === 'arquivar' || input.action === 'cancelar') ? 'delete' : 'update'
  const fields = bitrixFields(input.resource, input.action, input.payload || {})
  const body = methodAction === 'delete'
    ? { id: input.id }
    : methodAction === 'add'
      ? { fields: cleanRecord(fields) }
      : { id: input.id, fields: cleanRecord(fields) }
  const payload = await requestProvider({
    provider: 'bitrix24',
    credentials,
    resource: input.resource,
    path: bitrixPath(input.resource, methodAction),
    method: 'POST',
    body,
  })
  return actionResult('bitrix24', input, payload, body)
}

async function executePipedriveAction(input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>) {
  const credentials = await loadCredentials({ tenantId: input.tenantId, connection: input.connection, provider: 'pipedrive' })
  const method = actionMethod('pipedrive', input.resource, input.action)
  const path = input.action === 'criar'
    ? PIPEDRIVE_PATHS[input.resource]
    : `${PIPEDRIVE_PATHS[input.resource]}/${encodeURIComponent(input.id || '')}`
  const body = method === 'DELETE' ? undefined : pipedrivePayload(input.resource, input.action, input.payload || {})
  const payload = await requestProvider({
    provider: 'pipedrive',
    credentials,
    resource: input.resource,
    path,
    method,
    body,
  })
  return actionResult('pipedrive', input, payload, body || {})
}

function actionResult(
  provider: CrmProvider,
  input: ConnectedProviderActionInput<ConnectedCrmResource, ConnectedCrmProviderAction>,
  payload: unknown,
  requestPayload: JsonRecord,
): ConnectedProviderActionResult {
  const envelope = extractEnvelope(provider, payload)
  const id = providerId(envelope) !== 'unknown' ? providerId(envelope) : input.id || null
  const status = text(envelope, ['status', 'STATUS', 'STAGE_ID', 'done']) || null
  return {
    ok: true,
    message: `Acao ${input.action} executada em ${provider} para ${input.resource}.`,
    id,
    status,
    metadata: {
      provider_payload: payload,
      provider_request: requestPayload,
    },
  }
}

export function createRestCrmApiAdapter(provider: CrmProvider): CrmApiAdapter {
  return {
    provider,
    supportsLiveRead(resource) {
      if (provider === 'pipedrive') return Boolean(PIPEDRIVE_PATHS[resource])
      return READ_RESOURCES.has(resource)
    },
    supportsAction(resource, action) {
      return Boolean(SUPPORTED_ACTIONS[resource]?.includes(action))
    },
    listLive(input) {
      return listLive(provider, input)
    },
    readLive(input) {
      return readLive(provider, input)
    },
    executeAction(input) {
      if (!this.supportsAction(input.resource, input.action)) {
        return Promise.resolve({
          ok: false,
          message: `${provider} nao suporta ${input.resource}/${input.action} neste adapter.`,
          id: input.id || null,
        })
      }
      return provider === 'bitrix24' ? executeBitrixAction(input) : executePipedriveAction(input)
    },
  }
}

export const bitrix24CrmApiAdapter = createRestCrmApiAdapter('bitrix24')
export const pipedriveCrmApiAdapter = createRestCrmApiAdapter('pipedrive')
