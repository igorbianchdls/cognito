import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import { createContaAzulClient } from '@/products/integracoes/connectors/erp/contaAzul/contaAzulClient'
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

const SUPPORTED_ACTIONS: Partial<Record<ConnectedErpResource, ConnectedErpProviderAction[]>> = {
  'contas-a-pagar': ['criar', 'atualizar'],
  'contas-a-receber': ['criar', 'atualizar'],
}

const RESOURCE_PATH_PART: Record<'contas-a-pagar' | 'contas-a-receber', string> = {
  'contas-a-pagar': 'contas-a-pagar',
  'contas-a-receber': 'contas-a-receber',
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseCredentials(value: string | null): JsonRecord {
  if (!value) throw new Error('Credencial OAuth Conta Azul ausente.')
  const parsed = JSON.parse(value) as unknown
  if (!isRecord(parsed)) throw new Error('Credencial OAuth Conta Azul invalida.')
  return parsed
}

async function loadCredentials(input: {
  tenantId: number
  connection: IntegrationConnection
}) {
  if (!input.connection.secretRef) {
    throw new Error('Credencial ausente para conta_azul. Reautentique a conexao OAuth.')
  }
  const raw = await readSecret(input.connection.secretRef)
  const credentials = parseCredentials(raw)
  const refreshed = await refreshOAuthCredentialsIfNeeded({
    tenantId: input.tenantId,
    connectionId: input.connection.id,
    provider: 'conta_azul',
    credentials,
  })
  return refreshed || credentials
}

function envPath(resource: 'contas-a-pagar' | 'contas-a-receber', action: ConnectedErpProviderAction) {
  const envKey = `CONTA_AZUL_ACTION_${resource.replace(/-/g, '_').toUpperCase()}_${action.toUpperCase()}_PATH`
  const configured = process.env[envKey]?.trim()
  if (configured) return configured

  const base = `/v1/financeiro/eventos-financeiros/${RESOURCE_PATH_PART[resource]}`
  if (action === 'criar') return base
  if (action === 'atualizar') return '/v1/financeiro/eventos-financeiros/parcelas/{id}'
  return base
}

function pathFor(resource: 'contas-a-pagar' | 'contas-a-receber', action: ConnectedErpProviderAction, id?: string | null) {
  const path = envPath(resource, action)
  if (path.includes('{id}')) {
    if (!id) throw new Error(`id e obrigatorio para ${resource}/${action}.`)
    return path.replaceAll('{id}', encodeURIComponent(id))
  }
  return path
}

function methodFor(action: ConnectedErpProviderAction) {
  if (action === 'atualizar') return 'PATCH' as const
  return 'POST' as const
}

function firstText(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (isRecord(value)) {
      const id = value.id ?? value.uuid
      if (typeof id === 'string' && id.trim()) return id.trim()
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

function firstBoolean(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'boolean') return value
  }
  return undefined
}

function optionalRecord(value: unknown) {
  return isRecord(value) ? value : undefined
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
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
    throw new Error(`Payload Conta Azul incompleto. Campos obrigatorios ausentes: ${missing.join(', ')}.`)
  }
}

function financialValueComposition(payload: JsonRecord, valor?: number) {
  const explicit = optionalRecord(payload.detalhe_valor) || optionalRecord(payload.composicao_valor)
  if (explicit) return explicit
  if (valor === undefined) return undefined

  const multa = firstNumber(payload, ['multa', 'valor_multa']) ?? 0
  const juros = firstNumber(payload, ['juros', 'valor_juros']) ?? 0
  const desconto = firstNumber(payload, ['desconto', 'valor_desconto']) ?? 0
  const taxa = firstNumber(payload, ['taxa', 'valor_taxa']) ?? 0
  const valorLiquido = firstNumber(payload, ['valor_liquido', 'liquido']) ?? valor + multa + juros + taxa - desconto

  return {
    multa,
    juros,
    valor_bruto: valor,
    valor_liquido: valorLiquido,
    desconto,
    taxa,
  }
}

function buildRateio(payload: JsonRecord, valor: number) {
  if (Array.isArray(payload.rateio)) return payload.rateio
  if (Array.isArray(payload.categorias) && payload.categorias.length > 0) {
    return payload.categorias
      .filter(isRecord)
      .map((categoria) => {
        const categoriaId = firstText(categoria, ['id_categoria', 'categoria_id', 'id', 'uuid'])
        const categoriaValor = firstNumber(categoria, ['valor', 'total', 'valor_total']) ?? valor
        return categoriaId ? { id_categoria: categoriaId, valor: categoriaValor } : null
      })
      .filter((categoria): categoria is { id_categoria: string; valor: number } => Boolean(categoria))
  }

  const categoriaId = firstText(payload, ['categoria_id', 'id_categoria', 'category_id'])
  if (!categoriaId) return undefined

  const centroCustoId = firstText(payload, ['centro_custo_id', 'id_centro_custo', 'cost_center_id'])
  return [
    {
      id_categoria: categoriaId,
      valor,
      ...(centroCustoId
        ? {
          rateio_centro_custo: [
            {
              id_centro_custo: centroCustoId,
              valor,
            },
          ],
        }
        : {}),
    },
  ]
}

function buildCreatePayload(resource: 'contas-a-pagar' | 'contas-a-receber', payload: JsonRecord) {
  const valor = firstNumber(payload, ['valor', 'total', 'valor_total'])
  const dataVencimento = firstText(payload, ['data_vencimento', 'vencimento', 'due_date']) || todayIsoDate()
  const dataCompetencia = firstText(payload, ['data_competencia', 'competencia', 'accrual_date']) || dataVencimento
  const descricao = firstText(payload, ['descricao', 'description']) || 'Lancamento financeiro'
  const observacao = firstText(payload, ['observacao', 'nota', 'note']) || ''
  const contato = firstText(payload, [
    'contato',
    'contato_id',
    resource === 'contas-a-pagar' ? 'fornecedor' : 'cliente',
    resource === 'contas-a-pagar' ? 'fornecedor_id' : 'cliente_id',
    'pessoa_id',
    'person_id',
  ])
  const contaFinanceira = firstText(payload, [
    'conta_financeira',
    'conta_financeira_id',
    'id_conta_financeira',
    'financial_account_id',
  ])
  const detalheValor = financialValueComposition(payload, valor)
  const rateio = valor === undefined ? undefined : buildRateio(payload, valor)

  requireFields({
    valor,
    contato,
    conta_financeira: contaFinanceira,
    rateio,
    detalhe_valor: detalheValor,
  })

  const metodoPagamento = firstText(payload, ['metodo_pagamento', 'payment_method'])
  const parcela = {
    descricao,
    data_vencimento: dataVencimento,
    nota: observacao,
    conta_financeira: contaFinanceira,
    detalhe_valor: detalheValor,
    ...(metodoPagamento ? { metodo_pagamento: metodoPagamento } : {}),
  }

  return {
    data_competencia: dataCompetencia,
    valor,
    observacao,
    descricao,
    contato,
    conta_financeira: contaFinanceira,
    rateio,
    condicao_pagamento: optionalRecord(payload.condicao_pagamento) || {
      parcelas: [parcela],
    },
  }
}

function buildUpdatePayload(payload: JsonRecord) {
  const versao = firstNumber(payload, ['versao', 'version'])
  const valor = firstNumber(payload, ['valor', 'total', 'valor_total', 'valor_bruto'])
  const composicaoValor = financialValueComposition(payload, valor)
  const vencimento = firstText(payload, ['vencimento', 'data_vencimento', 'due_date'])
  const descricao = firstText(payload, ['descricao', 'description'])
  const nota = firstText(payload, ['nota', 'observacao', 'note'])
  const dataPagamentoEsperado = firstText(payload, ['data_pagamento_esperado', 'expected_payment_date'])
  const metodoPagamento = firstText(payload, ['metodo_pagamento', 'payment_method'])
  const idContaFinanceira = firstText(payload, [
    'id_conta_financeira',
    'conta_financeira_id',
    'conta_financeira',
    'financial_account_id',
  ])
  const nsu = firstText(payload, ['nsu'])
  const pagamentoAgendado = firstBoolean(payload, ['pagamento_agendado', 'scheduled_payment'])

  requireFields({ versao })

  return {
    versao,
    ...(nota !== undefined ? { nota } : {}),
    ...(descricao !== undefined ? { descricao } : {}),
    ...(vencimento !== undefined ? { vencimento } : {}),
    ...(composicaoValor !== undefined ? { composicao_valor: composicaoValor } : {}),
    ...(dataPagamentoEsperado !== undefined ? { data_pagamento_esperado: dataPagamentoEsperado } : {}),
    ...(metodoPagamento !== undefined ? { metodo_pagamento: metodoPagamento } : {}),
    ...(optionalRecord(payload.perda) ? { perda: payload.perda } : {}),
    ...(nsu !== undefined ? { nsu } : {}),
    ...(pagamentoAgendado !== undefined ? { pagamento_agendado: pagamentoAgendado } : {}),
    ...(idContaFinanceira !== undefined ? { id_conta_financeira: idContaFinanceira } : {}),
  }
}

function normalizeFinancialPayload(
  resource: 'contas-a-pagar' | 'contas-a-receber',
  action: ConnectedErpProviderAction,
  payload: JsonRecord,
) {
  if (action === 'criar') return buildCreatePayload(resource, payload)
  if (action === 'atualizar') return buildUpdatePayload(payload)
  throw new Error(`Conta Azul nao suporta ${resource}/${action} neste adapter.`)
}

function extractId(payload: unknown) {
  if (!isRecord(payload)) return null
  const candidates = [
    payload.id,
    payload.uuid,
    payload.external_id,
    payload.protocolId,
    payload.protocol_id,
    payload.id_evento_financeiro,
    isRecord(payload.evento) ? payload.evento.id : null,
    isRecord(payload.data) ? payload.data.id : null,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

function extractStatus(payload: unknown) {
  if (!isRecord(payload)) return null
  const candidates = [
    payload.status,
    payload.situacao,
    payload.status_traduzido,
    isRecord(payload.evento) ? payload.evento.status : null,
    isRecord(payload.data) ? payload.data.status : null,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

async function executeFinancialAction(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
): Promise<ConnectedProviderActionResult> {
  const resource = input.resource as 'contas-a-pagar' | 'contas-a-receber'
  const credentials = await loadCredentials({
    tenantId: input.tenantId,
    connection: input.connection,
  })
  const client = createContaAzulClient(credentials)
  const payload = normalizeFinancialPayload(resource, input.action, input.payload || {})
  const response = await client.requestPath({
    resource,
    path: pathFor(resource, input.action, input.id),
    method: methodFor(input.action),
    body: payload,
  })

  return {
    ok: true,
    message: `Acao ${input.action} executada no Conta Azul para ${resource}.`,
    id: extractId(response) || input.id || null,
    status: extractStatus(response),
    metadata: {
      provider_payload: response,
    },
  }
}

export const contaAzulErpApiAdapter: ErpApiAdapter = {
  provider: 'conta_azul',
  supportsLiveRead() {
    return false
  },
  supportsAction(resource, action) {
    return Boolean(SUPPORTED_ACTIONS[resource]?.includes(action))
  },
  async listLive() {
    throw new Error('Leitura live Conta Azul ainda nao implementada neste adapter.')
  },
  async readLive() {
    throw new Error('Leitura live Conta Azul ainda nao implementada neste adapter.')
  },
  async executeAction(input) {
    if (!this.supportsAction(input.resource, input.action)) {
      return {
        ok: false,
        message: `Conta Azul nao suporta ${input.resource}/${input.action} neste adapter.`,
        id: input.id || null,
      }
    }
    return executeFinancialAction(input)
  },
}
