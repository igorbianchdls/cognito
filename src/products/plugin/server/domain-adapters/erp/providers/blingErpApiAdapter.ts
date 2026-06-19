import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { createBlingClient } from '@/products/integracoes/connectors/erp/bling/blingClient'
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
type BlingActionResource =
  | 'clientes'
  | 'fornecedores'
  | 'contas-a-pagar'
  | 'contas-a-receber'
  | 'pedidos-venda'
  | 'produtos'
  | 'servicos'
type BlingFinancialResource = 'contas-a-pagar' | 'contas-a-receber'
type BlingPersonResource = 'clientes' | 'fornecedores'

const SUPPORTED_ACTIONS: Partial<Record<ConnectedErpResource, ConnectedErpProviderAction[]>> = {
  clientes: ['criar', 'atualizar'],
  fornecedores: ['criar', 'atualizar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar'],
  produtos: ['criar', 'atualizar', 'deletar'],
  servicos: ['criar', 'atualizar'],
}

const RESOURCE_BASE_PATHS: Record<BlingActionResource, string> = {
  clientes: '/contatos',
  fornecedores: '/contatos',
  'contas-a-pagar': '/contas/pagar',
  'contas-a-receber': '/contas/receber',
  'pedidos-venda': '/pedidos/vendas',
  produtos: '/produtos',
  servicos: '/servicos',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseCredentials(value: string | null): JsonRecord {
  if (!value) throw new Error('Credencial OAuth Bling ausente.')
  const parsed = JSON.parse(value) as unknown
  if (!isRecord(parsed)) throw new Error('Credencial OAuth Bling invalida.')
  return parsed
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
}) {
  if (!input.connection.secretRef) {
    throw new Error('Credencial ausente para bling. Reautentique a conexao OAuth.')
  }
  const raw = await readSecret(input.connection.secretRef)
  const credentials = parseCredentials(raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: 'bling',
    credentials,
  })
  return refreshed || credentials
}

function optionalRecord(value: unknown) {
  return isRecord(value) ? value : undefined
}

function explicitProviderPayload(payload: JsonRecord) {
  return optionalRecord(payload.bling_payload)
    || optionalRecord(payload.provider_payload)
    || optionalRecord(payload.payload_bling)
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
    throw new Error(`Payload Bling incompleto. Campos obrigatorios ausentes: ${missing.join(', ')}.`)
  }
}

function requireNonEmptyPayload(resource: string, action: string, payload: JsonRecord) {
  if (Object.keys(payload).length === 0) {
    throw new Error(`Payload Bling incompleto. Informe ao menos um campo para ${resource}/${action}.`)
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

function envPath(resource: BlingActionResource, action: ConnectedErpProviderAction) {
  const envKey = `BLING_ACTION_${resource.replace(/-/g, '_').toUpperCase()}_${action.toUpperCase()}_PATH`
  const configured = process.env[envKey]?.trim()
  if (configured) return configured

  const base = RESOURCE_BASE_PATHS[resource]
  if (action === 'criar') return base
  if (action === 'baixar') return `${base}/{id}/baixar`
  return `${base}/{id}`
}

function pathFor(resource: BlingActionResource, action: ConnectedErpProviderAction, id?: string | null) {
  const path = envPath(resource, action)
  if (path.includes('{id}')) {
    if (!id) throw new Error(`id e obrigatorio para ${resource}/${action}.`)
    return path.replaceAll('{id}', encodeURIComponent(id))
  }
  return path
}

function methodFor(action: ConnectedErpProviderAction) {
  if (action === 'deletar' || action === 'cancelar') return 'DELETE' as const
  if (action === 'atualizar') return 'PUT' as const
  return 'POST' as const
}

function contactType(resource: BlingPersonResource) {
  return resource === 'clientes' ? 'Cliente' : 'Fornecedor'
}

function buildPersonPayload(
  resource: BlingPersonResource,
  action: ConnectedErpProviderAction,
  id: string | null | undefined,
  payload: JsonRecord,
) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  const nome = firstText(payload, ['nome', 'name', 'razao_social'])
  const tipo = firstText(payload, ['tipo', 'tipo_contato']) || contactType(resource)
  const body = {
    ...(idAsInteger(id) !== undefined ? { id: idAsInteger(id) } : {}),
    nome,
    tipo,
    ...(firstText(payload, ['codigo', 'codigo_integracao', 'external_id']) ? { codigo: firstText(payload, ['codigo', 'codigo_integracao', 'external_id']) } : {}),
    ...(firstText(payload, ['situacao', 'status']) ? { situacao: firstText(payload, ['situacao', 'status']) } : {}),
    ...(firstText(payload, ['numero_documento', 'documento', 'cpf_cnpj', 'cnpj_cpf']) ? { numeroDocumento: firstText(payload, ['numero_documento', 'documento', 'cpf_cnpj', 'cnpj_cpf']) } : {}),
    ...(firstText(payload, ['telefone', 'phone']) ? { telefone: firstText(payload, ['telefone', 'phone']) } : {}),
    ...(firstText(payload, ['celular', 'mobile']) ? { celular: firstText(payload, ['celular', 'mobile']) } : {}),
    ...(firstText(payload, ['email']) ? { email: firstText(payload, ['email']) } : {}),
    ...(optionalRecord(payload.endereco) ? { endereco: payload.endereco } : {}),
  }
  requireFields({
    ...(action === 'atualizar' ? { id } : {}),
    nome,
    tipo,
  })
  return body
}

function buildFinancialPayload(
  resource: BlingFinancialResource,
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
      ...(firstText(payload, ['observacao', 'descricao', 'note']) ? { observacao: firstText(payload, ['observacao', 'descricao', 'note']) } : {}),
      ...(firstInteger(payload, ['id_conta_contabil', 'conta_contabil_id']) !== undefined ? { idContaContabil: firstInteger(payload, ['id_conta_contabil', 'conta_contabil_id']) } : {}),
      ...(firstInteger(payload, ['id_forma_pagamento', 'forma_pagamento_id']) !== undefined ? { idFormaPagamento: firstInteger(payload, ['id_forma_pagamento', 'forma_pagamento_id']) } : {}),
    }
    requireFields({ id })
    return body
  }

  const contatoId = firstInteger(payload, [
    'contato_id',
    'cliente_id',
    'fornecedor_id',
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
    requireNonEmptyPayload(resource, action, body)
  }
  return body
}

function buildProductPayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit
  if (action === 'deletar') return {}

  const nome = firstText(payload, ['nome', 'name', 'descricao'])
  const preco = firstNumber(payload, ['preco', 'preco_venda', 'valor', 'valor_unitario', 'price'])
  const body = {
    ...(idAsInteger(id) !== undefined ? { id: idAsInteger(id) } : {}),
    nome,
    ...(firstText(payload, ['codigo', 'sku']) ? { codigo: firstText(payload, ['codigo', 'sku']) } : {}),
    ...(preco !== undefined ? { preco } : {}),
    ...(firstText(payload, ['tipo']) ? { tipo: firstText(payload, ['tipo']) } : {}),
    ...(firstText(payload, ['situacao', 'status']) ? { situacao: firstText(payload, ['situacao', 'status']) } : {}),
    ...(firstText(payload, ['unidade', 'unidade_medida', 'unit']) ? { unidade: firstText(payload, ['unidade', 'unidade_medida', 'unit']) } : {}),
    ...(firstInteger(payload, ['categoria_id', 'id_categoria']) !== undefined ? { categoria: { id: firstInteger(payload, ['categoria_id', 'id_categoria']) } } : {}),
    ...(optionalRecord(payload.estoque) ? { estoque: payload.estoque } : {}),
  }
  requireFields({
    ...(action === 'atualizar' ? { id } : {}),
    nome,
  })
  return body
}

function saleItems(payload: JsonRecord) {
  const items = Array.isArray(payload.itens)
    ? payload.itens
    : Array.isArray(payload.items)
      ? payload.items
      : []

  return items.filter(isRecord).map((item, index) => {
    if (isRecord(item.produto)) return item
    const productId = firstInteger(item, ['produto_id', 'id_produto', 'id'])
    const quantidade = firstNumber(item, ['quantidade', 'quantity', 'qtd']) ?? 1
    const valor = firstNumber(item, ['valor', 'preco', 'valor_unitario', 'unit_price'])
    requireFields({
      [`itens[${index}].produto_id`]: productId,
      [`itens[${index}].valor`]: valor,
    })
    return {
      produto: { id: productId },
      quantidade,
      valor,
      ...(firstText(item, ['descricao', 'description']) ? { descricao: firstText(item, ['descricao', 'description']) } : {}),
    }
  })
}

function buildSalePayload(
  action: ConnectedErpProviderAction,
  id: string | null | undefined,
  payload: JsonRecord,
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit
  if (action === 'cancelar') return {}

  const contatoId = firstInteger(payload, ['contato_id', 'cliente_id', 'id_cliente', 'customer_id'])
  const items = saleItems(payload)
  const body = {
    ...(idAsInteger(id) !== undefined ? { id: idAsInteger(id) } : {}),
    ...(firstText(payload, ['numero', 'numero_pedido', 'number']) ? { numero: firstText(payload, ['numero', 'numero_pedido', 'number']) } : {}),
    ...(firstText(payload, ['codigo_integracao', 'external_id', 'externalId']) || integrationId(input)
      ? { codigo: firstText(payload, ['codigo_integracao', 'external_id', 'externalId']) || integrationId(input) }
      : {}),
    ...(contatoId !== undefined ? { contato: { id: contatoId } } : {}),
    data: firstText(payload, ['data', 'data_pedido', 'data_venda', 'sale_date']) || todayIsoDate(),
    ...(firstText(payload, ['situacao', 'status']) ? { situacao: firstText(payload, ['situacao', 'status']) } : {}),
    itens: items,
    ...(firstInteger(payload, ['loja_id', 'id_loja']) !== undefined ? { loja: { id: firstInteger(payload, ['loja_id', 'id_loja']) } } : {}),
    ...(firstInteger(payload, ['vendedor_id', 'id_vendedor']) !== undefined ? { vendedor: { id: firstInteger(payload, ['vendedor_id', 'id_vendedor']) } } : {}),
    ...(optionalRecord(payload.transporte) ? { transporte: payload.transporte } : {}),
    ...(optionalRecord(payload.parcelas) || Array.isArray(payload.parcelas) ? { parcelas: payload.parcelas } : {}),
  }
  requireFields({
    ...(action === 'atualizar' ? { id } : {}),
    contato: contatoId,
    itens: items,
  })
  return body
}

function buildServicePayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit
  const nome = firstText(payload, ['nome', 'name', 'descricao'])
  const preco = firstNumber(payload, ['preco', 'valor', 'valor_unitario', 'price'])
  const body = {
    ...(idAsInteger(id) !== undefined ? { id: idAsInteger(id) } : {}),
    nome,
    ...(firstText(payload, ['codigo', 'code']) ? { codigo: firstText(payload, ['codigo', 'code']) } : {}),
    ...(preco !== undefined ? { preco } : {}),
    ...(firstText(payload, ['situacao', 'status']) ? { situacao: firstText(payload, ['situacao', 'status']) } : {}),
    ...(firstInteger(payload, ['categoria_id', 'id_categoria']) !== undefined ? { categoria: { id: firstInteger(payload, ['categoria_id', 'id_categoria']) } } : {}),
  }
  requireFields({
    ...(action === 'atualizar' ? { id } : {}),
    nome,
  })
  return body
}

function normalizePayload(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
) {
  const resource = input.resource as BlingActionResource
  const payload = input.payload || {}
  if (resource === 'clientes' || resource === 'fornecedores') return buildPersonPayload(resource, input.action, input.id, payload)
  if (resource === 'contas-a-pagar' || resource === 'contas-a-receber') return buildFinancialPayload(resource, input.action, input.id, payload, input)
  if (resource === 'pedidos-venda') return buildSalePayload(input.action, input.id, payload, input)
  if (resource === 'produtos') return buildProductPayload(input.action, input.id, payload)
  if (resource === 'servicos') return buildServicePayload(input.action, input.id, payload)
  throw new Error(`Bling nao suporta ${resource}/${input.action} neste adapter.`)
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
    isRecord(envelope.pedido) ? envelope.pedido.id : null,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

function extractStatus(payload: unknown) {
  const envelope = extractEnvelope(payload)
  const candidates = [
    envelope.situacao,
    envelope.status,
    envelope.descricao,
    envelope.mensagem,
  ]
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

async function executeBlingAction(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
): Promise<ConnectedProviderActionResult> {
  const resource = input.resource as BlingActionResource
  const credentials = await loadCredentials({
    tenantId: input.tenantId,
    connection: input.connection,
  })
  const client = createBlingClient(credentials)
  const requestPayload = normalizePayload(input)
  const response = await client.requestPath({
    resource,
    path: pathFor(resource, input.action, input.id),
    method: methodFor(input.action),
    body: input.action === 'deletar' || input.action === 'cancelar' ? undefined : requestPayload,
  })

  return {
    ok: true,
    message: extractMessage(response, `Acao ${input.action} executada no Bling para ${resource}.`),
    id: extractId(response) || input.id || null,
    status: extractStatus(response),
    metadata: {
      provider_payload: response,
      provider_request: {
        path: pathFor(resource, input.action, input.id),
        method: methodFor(input.action),
        payload: requestPayload,
      },
    },
  }
}

export const blingErpApiAdapter: ErpApiAdapter = {
  provider: 'bling',
  supportsLiveRead() {
    return false
  },
  supportsAction(resource, action) {
    return Boolean(SUPPORTED_ACTIONS[resource]?.includes(action))
  },
  async listLive() {
    throw new Error('Leitura live Bling ainda nao implementada neste adapter.')
  },
  async readLive() {
    throw new Error('Leitura live Bling ainda nao implementada neste adapter.')
  },
  async executeAction(input) {
    if (!this.supportsAction(input.resource, input.action)) {
      return {
        ok: false,
        message: `Bling nao suporta ${input.resource}/${input.action} neste adapter.`,
        id: input.id || null,
      }
    }
    return executeBlingAction(input)
  },
}
