import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { createTinyClient } from '@/products/integracoes/connectors/erp/tiny/tinyClient'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { ErpApiAdapter } from '@/products/plugin/server/domain-adapters/erp/erpApiAdapterRegistry'
import type {
  ConnectedErpProviderAction,
  ConnectedErpResource,
} from '@/products/plugin/server/domain-adapters/erp/erpTypes'
import type {
  ConnectedProviderActionInput,
  ConnectedProviderActionResult,
} from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

type JsonRecord = Record<string, unknown>
type OlistFinancialResource = 'contas-a-pagar' | 'contas-a-receber'

const SUPPORTED_ACTIONS: Partial<Record<ConnectedErpResource, ConnectedErpProviderAction[]>> = {
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
}

const RESOURCE_BASE_PATHS: Record<OlistFinancialResource, string> = {
  'contas-a-pagar': '/contas-pagar',
  'contas-a-receber': '/contas-receber',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseCredentials(value: string | null): JsonRecord {
  if (!value) throw new Error('Credencial OAuth Olist ERP ausente.')
  const parsed = JSON.parse(value) as unknown
  if (!isRecord(parsed)) throw new Error('Credencial OAuth Olist ERP invalida.')
  return parsed
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
}) {
  if (!input.connection.secretRef) {
    throw new Error('Credencial ausente para olist_erp. Reautentique a conexao OAuth.')
  }
  const raw = await readSecret(input.connection.secretRef)
  const credentials = parseCredentials(raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: 'olist_erp',
    credentials,
  })
  return refreshed || credentials
}

function optionalRecord(value: unknown) {
  return isRecord(value) ? value : undefined
}

function explicitProviderPayload(payload: JsonRecord) {
  return optionalRecord(payload.olist_erp_payload)
    || optionalRecord(payload.tiny_payload)
    || optionalRecord(payload.provider_payload)
    || optionalRecord(payload.payload_olist_erp)
    || optionalRecord(payload.payload_tiny)
}

function firstText(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (isRecord(value)) {
      const id = value.id ?? value.codigo ?? value.numero
      if (typeof id === 'string' && id.trim()) return id.trim()
      if (typeof id === 'number' && Number.isFinite(id)) return String(id)
    }
  }
  return undefined
}

function firstNumber(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function firstInteger(payload: JsonRecord, keys: string[]) {
  const value = firstNumber(payload, keys)
  if (value === undefined) return undefined
  return Math.trunc(value)
}

function isMissingRequiredField(value: unknown) {
  return value === undefined
    || value === null
    || value === ''
    || (Array.isArray(value) && value.length === 0)
}

function requireFields(fields: Record<string, unknown>) {
  const missing = Object.entries(fields)
    .filter(([, value]) => isMissingRequiredField(value))
    .map(([field]) => field)
  if (missing.length > 0) {
    throw new Error(`Payload Olist ERP incompleto. Campos obrigatorios ausentes: ${missing.join(', ')}.`)
  }
}

function idAsInteger(value: string | undefined | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function integrationId(input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>) {
  return input.idempotencyKey
    || firstText(input.payload || {}, ['codigo_integracao', 'external_id', 'externalId', 'codigo_externo'])
    || input.id
    || undefined
}

function envPath(resource: OlistFinancialResource, action: ConnectedErpProviderAction) {
  const envKey = `OLIST_ERP_ACTION_${resource.replace(/-/g, '_').toUpperCase()}_${action.toUpperCase()}_PATH`
  const configured = process.env[envKey]?.trim()
  if (configured) return configured

  const base = RESOURCE_BASE_PATHS[resource]
  if (action === 'criar') return base
  if (action === 'baixar') return `${base}/{id}/baixar`
  return `${base}/{id}`
}

function pathFor(resource: OlistFinancialResource, action: ConnectedErpProviderAction, id?: string | null) {
  const path = envPath(resource, action)
  if (path.includes('{id}')) {
    if (!id) throw new Error(`id e obrigatorio para ${resource}/${action}.`)
    return path.replaceAll('{id}', encodeURIComponent(id))
  }
  return path
}

function methodFor(action: ConnectedErpProviderAction) {
  if (action === 'atualizar') return 'PUT' as const
  return 'POST' as const
}

function buildFinancialPayload(
  resource: OlistFinancialResource,
  action: ConnectedErpProviderAction,
  id: string | null | undefined,
  payload: JsonRecord,
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  if (action === 'baixar') {
    const valor = firstNumber(payload, ['valor', 'valor_pago', 'valor_recebido', 'total'])
    const body = {
      ...(valor !== undefined ? { valor } : {}),
      data: firstText(payload, ['data', 'data_baixa', 'data_pagamento', 'data_recebimento']) || todayIsoDate(),
      ...(firstText(payload, ['observacao', 'descricao', 'historico']) ? { observacao: firstText(payload, ['observacao', 'descricao', 'historico']) } : {}),
      ...(firstInteger(payload, ['conta_financeira_id', 'id_conta', 'id_conta_financeira']) !== undefined ? { conta: { id: firstInteger(payload, ['conta_financeira_id', 'id_conta', 'id_conta_financeira']) } } : {}),
      ...(firstInteger(payload, ['forma_pagamento_id', 'id_forma_pagamento']) !== undefined ? { formaPagamento: { id: firstInteger(payload, ['forma_pagamento_id', 'id_forma_pagamento']) } } : {}),
    }
    requireFields({ id })
    return body
  }

  const contatoId = firstInteger(payload, [
    resource === 'contas-a-pagar' ? 'fornecedor_id' : 'cliente_id',
    'contato_id',
    'pessoa_id',
  ])
  const valor = firstNumber(payload, ['valor', 'valor_documento', 'total', 'valor_total'])
  const vencimento = firstText(payload, ['data_vencimento', 'vencimento', 'due_date']) || todayIsoDate()
  const body = {
    ...(idAsInteger(id) !== undefined ? { id: idAsInteger(id) } : {}),
    ...(firstText(payload, ['numero_documento', 'documento']) ? { numeroDocumento: firstText(payload, ['numero_documento', 'documento']) } : {}),
    ...(firstText(payload, ['codigo_integracao', 'external_id', 'externalId']) || integrationId(input)
      ? { codigo: firstText(payload, ['codigo_integracao', 'external_id', 'externalId']) || integrationId(input) }
      : {}),
    ...(contatoId !== undefined ? { contato: { id: contatoId } } : {}),
    ...(valor !== undefined ? { valor } : {}),
    vencimento,
    ...(firstText(payload, ['emissao', 'data_emissao', 'issue_date']) ? { emissao: firstText(payload, ['emissao', 'data_emissao', 'issue_date']) } : {}),
    ...(firstText(payload, ['historico', 'descricao', 'observacao']) ? { historico: firstText(payload, ['historico', 'descricao', 'observacao']) } : {}),
    ...(firstInteger(payload, ['categoria_id', 'id_categoria']) !== undefined ? { categoria: { id: firstInteger(payload, ['categoria_id', 'id_categoria']) } } : {}),
    ...(firstText(payload, ['situacao', 'status']) ? { situacao: firstText(payload, ['situacao', 'status']) } : {}),
  }

  if (action === 'criar') {
    requireFields({ contato: contatoId, valor, vencimento })
  } else {
    requireFields({ id })
  }
  return body
}

function extractEnvelope(payload: unknown) {
  if (!isRecord(payload)) return {}
  return optionalRecord(payload.data) || payload
}

function extractId(payload: unknown) {
  const envelope = extractEnvelope(payload)
  const candidates = [
    envelope.id,
    envelope.codigo,
    envelope.numero,
    isRecord(envelope.conta) ? envelope.conta.id : null,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

function extractStatus(payload: unknown) {
  const envelope = extractEnvelope(payload)
  const candidates = [envelope.situacao, envelope.status, envelope.descricao, envelope.mensagem]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

function extractMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback
  const envelope = extractEnvelope(payload)
  const candidates = [
    envelope.mensagem,
    envelope.message,
    envelope.descricao,
    isRecord(payload.error) ? payload.error.message : null,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return fallback
}

async function executeOlistErpAction(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
): Promise<ConnectedProviderActionResult> {
  const resource = input.resource as OlistFinancialResource
  const credentials = await loadCredentials({
    tenantId: input.tenantId,
    connection: input.connection,
  })
  const client = createTinyClient(credentials)
  const requestPayload = buildFinancialPayload(resource, input.action, input.id, input.payload || {}, input)
  const path = pathFor(resource, input.action, input.id)
  const method = methodFor(input.action)
  const response = await client.requestPath({
    resource,
    path,
    method,
    body: requestPayload,
  })

  return {
    ok: true,
    message: extractMessage(response, `Acao ${input.action} executada no Olist ERP para ${resource}.`),
    id: extractId(response) || input.id || null,
    status: extractStatus(response),
    metadata: {
      provider_payload: response,
      provider_request: {
        path,
        method,
        payload: requestPayload,
      },
    },
  }
}

export const olistErpApiAdapter: ErpApiAdapter = {
  provider: 'olist_erp',
  supportsLiveRead() {
    return false
  },
  supportsAction(resource, action) {
    return Boolean(SUPPORTED_ACTIONS[resource]?.includes(action))
  },
  async listLive() {
    throw new Error('Leitura live Olist ERP ainda nao implementada neste adapter.')
  },
  async readLive() {
    throw new Error('Leitura live Olist ERP ainda nao implementada neste adapter.')
  },
  async executeAction(input) {
    if (!this.supportsAction(input.resource, input.action)) {
      return {
        ok: false,
        message: `Olist ERP nao suporta ${input.resource}/${input.action} neste adapter.`,
        id: input.id || null,
      }
    }
    return executeOlistErpAction(input)
  },
}

export const tinyErpApiAdapter: ErpApiAdapter = {
  ...olistErpApiAdapter,
  provider: 'tiny',
}
