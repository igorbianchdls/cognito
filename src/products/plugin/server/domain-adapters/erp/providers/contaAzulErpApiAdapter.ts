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
type ContaAzulActionResource =
  | 'clientes'
  | 'fornecedores'
  | 'contas-a-pagar'
  | 'contas-a-receber'
  | 'pedidos-venda'
  | 'centros-custo'
  | 'produtos'
  | 'servicos'
  | 'contratos'
type ContaAzulFinancialResource = 'contas-a-pagar' | 'contas-a-receber'
type ContaAzulPersonResource = 'clientes' | 'fornecedores'

const SUPPORTED_ACTIONS: Partial<Record<ConnectedErpResource, ConnectedErpProviderAction[]>> = {
  clientes: ['criar', 'atualizar'],
  fornecedores: ['criar', 'atualizar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar'],
  'centros-custo': ['criar'],
  produtos: ['criar', 'atualizar', 'deletar'],
  servicos: ['criar', 'atualizar'],
  contratos: ['criar', 'deletar'],
}

const RESOURCE_PATH_PART: Record<ContaAzulFinancialResource, string> = {
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

function envPath(resource: ContaAzulActionResource, action: ConnectedErpProviderAction) {
  const envKey = `CONTA_AZUL_ACTION_${resource.replace(/-/g, '_').toUpperCase()}_${action.toUpperCase()}_PATH`
  const configured = process.env[envKey]?.trim()
  if (configured) return configured

  if (resource === 'pedidos-venda') {
    if (action === 'criar') return '/v1/venda'
    if (action === 'atualizar') return '/v1/venda/{id}'
    if (action === 'cancelar') return '/v1/venda/exclusao-lote'
    return '/v1/venda'
  }
  if (resource === 'clientes' || resource === 'fornecedores') {
    if (action === 'atualizar') return '/v1/pessoas/{id}'
    return '/v1/pessoas'
  }
  if (resource === 'centros-custo') return '/v1/centro-de-custo'
  if (resource === 'produtos') return action === 'criar' ? '/v1/produtos' : '/v1/produtos/{id}'
  if (resource === 'servicos') return action === 'criar' ? '/v1/servicos' : '/v1/servicos/{id}'
  if (resource === 'contratos') return action === 'criar' ? '/v1/contratos' : '/v1/contratos/{id}'

  const base = `/v1/financeiro/eventos-financeiros/${RESOURCE_PATH_PART[resource]}`
  if (action === 'criar') return base
  if (action === 'atualizar') return '/v1/financeiro/eventos-financeiros/parcelas/{id}'
  if (action === 'baixar') return '/v1/financeiro/eventos-financeiros/parcelas/{id}/baixa'
  return base
}

function pathFor(resource: ContaAzulActionResource, action: ConnectedErpProviderAction, id?: string | null) {
  const path = envPath(resource, action)
  if (path.includes('{id}')) {
    if (!id) throw new Error(`id e obrigatorio para ${resource}/${action}.`)
    return path.replaceAll('{id}', encodeURIComponent(id))
  }
  return path
}

function methodFor(resource: ContaAzulActionResource, action: ConnectedErpProviderAction) {
  if (action === 'deletar') return 'DELETE' as const
  if (resource === 'pedidos-venda' && action === 'atualizar') return 'PUT' as const
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

function firstInteger(payload: JsonRecord, keys: string[]) {
  const value = firstNumber(payload, keys)
  if (value === undefined) return undefined
  return Math.trunc(value)
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

function requireNonEmptyPayload(resource: string, action: string, payload: JsonRecord) {
  if (Object.keys(payload).length === 0) {
    throw new Error(`Payload Conta Azul incompleto. Informe ao menos um campo para ${resource}/${action}.`)
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

function buildCreatePayload(resource: ContaAzulFinancialResource, payload: JsonRecord) {
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

function buildSettlementPayload(payload: JsonRecord) {
  const explicit = optionalRecord(payload.baixa)
    || optionalRecord(payload.liquidacao)
    || optionalRecord(payload.pagamento)
    || optionalRecord(payload.recebimento)
  if (explicit) return explicit

  const valor = firstNumber(payload, ['valor', 'total', 'valor_total', 'valor_pago', 'valor_recebido'])
  const dataPagamento = firstText(payload, [
    'data_pagamento',
    'data_recebimento',
    'data_baixa',
    'pagamento_em',
    'recebimento_em',
    'payment_date',
  ]) || todayIsoDate()
  const idContaFinanceira = firstText(payload, [
    'id_conta_financeira',
    'conta_financeira_id',
    'conta_financeira',
    'financial_account_id',
  ])
  const metodoPagamento = firstText(payload, ['metodo_pagamento', 'forma_pagamento', 'payment_method'])
  const nsu = firstText(payload, ['nsu'])
  const observacao = firstText(payload, ['observacao', 'nota', 'note'])
  const composicaoValor = financialValueComposition(payload, valor)

  requireFields({
    data_pagamento: dataPagamento,
    ...(valor === undefined ? {} : { composicao_valor: composicaoValor }),
  })

  return {
    data_pagamento: dataPagamento,
    ...(valor !== undefined ? { valor } : {}),
    ...(composicaoValor !== undefined ? { composicao_valor: composicaoValor } : {}),
    ...(idContaFinanceira !== undefined ? { id_conta_financeira: idContaFinanceira } : {}),
    ...(metodoPagamento !== undefined ? { metodo_pagamento: metodoPagamento } : {}),
    ...(nsu !== undefined ? { nsu } : {}),
    ...(observacao !== undefined ? { observacao } : {}),
  }
}

function normalizeFinancialPayload(
  resource: ContaAzulFinancialResource,
  action: ConnectedErpProviderAction,
  payload: JsonRecord,
) {
  if (action === 'criar') return buildCreatePayload(resource, payload)
  if (action === 'atualizar') return buildUpdatePayload(payload)
  if (action === 'baixar') return buildSettlementPayload(payload)
  throw new Error(`Conta Azul nao suporta ${resource}/${action} neste adapter.`)
}

function saleItems(payload: JsonRecord) {
  const items = Array.isArray(payload.itens)
    ? payload.itens
    : Array.isArray(payload.items)
      ? payload.items
      : []

  return items
    .filter(isRecord)
    .map((item) => {
      const id = firstText(item, ['id', 'item_id', 'produto_id', 'servico_id', 'product_id', 'service_id'])
      const quantidade = firstNumber(item, ['quantidade', 'quantity', 'qtd']) ?? 1
      const valor = firstNumber(item, ['valor', 'preco', 'price', 'unit_price'])
      const descricao = firstText(item, ['descricao', 'description'])
      const valorCusto = firstNumber(item, ['valor_custo', 'cost'])

      return {
        ...(descricao ? { descricao } : {}),
        quantidade,
        valor,
        id,
        ...(valorCusto === undefined ? {} : { valor_custo: valorCusto }),
        ...(Array.isArray(item.itens_kit) ? { itens_kit: item.itens_kit } : {}),
      }
    })
}

function saleTotal(payload: JsonRecord, items: JsonRecord[]) {
  const explicit = firstNumber(payload, ['valor', 'total', 'valor_total'])
  if (explicit !== undefined) return explicit
  const total = items.reduce((sum, item) => {
    const quantity = Number(item.quantidade)
    const value = Number(item.valor)
    return Number.isFinite(quantity) && Number.isFinite(value) ? sum + quantity * value : sum
  }, 0)
  return total > 0 ? total : undefined
}

function salePaymentCondition(payload: JsonRecord, total?: number, dueDate?: string) {
  const explicit = optionalRecord(payload.condicao_pagamento)
  if (explicit) return explicit
  if (total === undefined) return undefined

  const paymentOption = firstText(payload, ['opcao_condicao_pagamento', 'payment_terms']) || 'À vista'
  const paymentType = firstText(payload, ['tipo_pagamento', 'payment_method'])
  const financialAccountId = firstText(payload, [
    'id_conta_financeira',
    'conta_financeira_id',
    'conta_financeira',
    'financial_account_id',
  ])
  const nsu = firstText(payload, ['nsu'])

  return {
    ...(paymentType ? { tipo_pagamento: paymentType } : {}),
    ...(financialAccountId ? { id_conta_financeira: financialAccountId } : {}),
    opcao_condicao_pagamento: paymentOption,
    ...(nsu ? { nsu } : {}),
    parcelas: [
      {
        data_vencimento: dueDate || todayIsoDate(),
        valor: total,
        ...(firstText(payload, ['descricao_parcela', 'installment_description'])
          ? { descricao: firstText(payload, ['descricao_parcela', 'installment_description']) }
          : {}),
      },
    ],
  }
}

function buildSalePayload(payload: JsonRecord, numero: number | undefined, update: boolean) {
  const idCliente = firstText(payload, ['id_cliente', 'cliente_id', 'customer_id'])
  const items = saleItems(payload)
  const total = saleTotal(payload, items)
  const dataVenda = firstText(payload, ['data_venda', 'data', 'sale_date']) || todayIsoDate()
  const dataVencimento = firstText(payload, ['data_vencimento', 'vencimento', 'due_date']) || dataVenda
  const condicaoPagamento = salePaymentCondition(payload, total, dataVencimento)
  const saleNumber = firstInteger(payload, ['numero', 'number']) ?? numero
  const situacao = firstText(payload, ['situacao', 'status']) || 'EM_ANDAMENTO'
  const versao = firstInteger(payload, ['versao', 'version'])

  requireFields({
    ...(update ? { versao } : {}),
    id_cliente: idCliente,
    numero: saleNumber,
    situacao,
    data_venda: dataVenda,
    itens: items,
    condicao_pagamento: condicaoPagamento,
  })
  for (let index = 0; index < items.length; index += 1) {
    requireFields({
      [`itens[${index}].id`]: items[index].id,
      [`itens[${index}].quantidade`]: items[index].quantidade,
      [`itens[${index}].valor`]: items[index].valor,
    })
  }

  return {
    ...(update ? { versao } : {}),
    id_cliente: idCliente,
    numero: saleNumber,
    situacao,
    data_venda: dataVenda,
    ...(firstText(payload, ['id_categoria', 'categoria_id', 'category_id'])
      ? { id_categoria: firstText(payload, ['id_categoria', 'categoria_id', 'category_id']) }
      : {}),
    ...(firstText(payload, ['id_centro_custo', 'centro_custo_id', 'cost_center_id'])
      ? { id_centro_custo: firstText(payload, ['id_centro_custo', 'centro_custo_id', 'cost_center_id']) }
      : {}),
    ...(firstText(payload, ['id_vendedor', 'vendedor_id', 'seller_id'])
      ? { id_vendedor: firstText(payload, ['id_vendedor', 'vendedor_id', 'seller_id']) }
      : {}),
    ...(firstText(payload, ['observacoes', 'observacao', 'notes'])
      ? { observacoes: firstText(payload, ['observacoes', 'observacao', 'notes']) }
      : {}),
    ...(firstText(payload, ['observacoes_pagamento', 'payment_notes'])
      ? { observacoes_pagamento: firstText(payload, ['observacoes_pagamento', 'payment_notes']) }
      : {}),
    ...(firstText(payload, ['id_natureza_operacao', 'natureza_operacao_id'])
      ? { id_natureza_operacao: firstText(payload, ['id_natureza_operacao', 'natureza_operacao_id']) }
      : {}),
    itens: items,
    ...(optionalRecord(payload.composicao_de_valor) ? { composicao_de_valor: payload.composicao_de_valor } : {}),
    condicao_pagamento: condicaoPagamento,
  }
}

function buildCancelSalePayload(id: string | null | undefined, payload: JsonRecord) {
  const ids = Array.isArray(payload.ids) ? payload.ids : id ? [id] : []
  const normalizedIds = ids.map((value) => String(value).trim()).filter(Boolean)
  requireFields({ ids: normalizedIds })
  return { ids: normalizedIds.slice(0, 10) }
}

function extractSaleNextNumber(payload: unknown) {
  const direct = Number(payload)
  if (Number.isFinite(direct) && direct > 0) return Math.trunc(direct)
  if (!isRecord(payload)) return undefined
  return firstInteger(payload, ['numero', 'next_number', 'proximo_numero', 'proximoNumero'])
    ?? firstInteger(isRecord(payload.data) ? payload.data : {}, ['numero', 'next_number', 'proximo_numero', 'proximoNumero'])
}

function buildCostCenterPayload(payload: JsonRecord) {
  const nome = firstText(payload, ['nome', 'name'])
  const codigo = firstText(payload, ['codigo', 'code'])
  requireFields({ nome })
  return {
    ...(codigo ? { codigo } : {}),
    nome,
  }
}

function buildProductPayload(payload: JsonRecord, update = false) {
  const nome = firstText(payload, update ? ['nome', 'name'] : ['nome', 'name', 'descricao'])
  const codigo = firstText(payload, ['codigo', 'code', 'sku'])
  const descricao = firstText(payload, ['descricao', 'description'])
  const valorVenda = firstNumber(payload, ['valor_venda', 'preco_venda', 'preco', 'valor', 'price'])
  const custoMedio = firstNumber(payload, ['custo_medio', 'custo', 'cost'])
  const unidadeMedida = firstText(payload, ['unidade_medida', 'unidade', 'unit'])
  const categoriaId = firstText(payload, ['id_categoria', 'categoria_id', 'category_id'])
  const ativo = firstBoolean(payload, ['ativo', 'active'])
  const status = firstText(payload, ['status', 'situacao'])

  if (!update) requireFields({ nome })

  const body = {
    ...(nome ? { nome } : {}),
    ...(codigo ? { codigo } : {}),
    ...(descricao ? { descricao } : {}),
    ...(valorVenda === undefined ? {} : { valor_venda: valorVenda }),
    ...(custoMedio === undefined ? {} : { custo_medio: custoMedio }),
    ...(unidadeMedida ? { unidade_medida: unidadeMedida } : {}),
    ...(categoriaId ? { id_categoria: categoriaId } : {}),
    ...(status ? { status } : {}),
    ...(firstText(payload, ['ean']) ? { ean: firstText(payload, ['ean']) } : {}),
    ...(firstText(payload, ['ncm']) ? { ncm: firstText(payload, ['ncm']) } : {}),
    ...(firstText(payload, ['cest']) ? { cest: firstText(payload, ['cest']) } : {}),
    ...(ativo === undefined ? {} : { ativo }),
    ...(optionalRecord(payload.estoque) ? { estoque: payload.estoque } : {}),
    ...(optionalRecord(payload.impostos) ? { impostos: payload.impostos } : {}),
  }
  if (update) requireNonEmptyPayload('produtos', 'atualizar', body)
  return body
}

function buildServicePayload(payload: JsonRecord, update = false) {
  const nome = firstText(payload, ['nome', 'name'])
  const codigo = firstText(payload, ['codigo', 'code'])
  const descricao = firstText(payload, update ? ['descricao', 'description', 'nome', 'name'] : ['descricao', 'description'])
  const valor = firstNumber(payload, ['valor', 'valor_venda', 'preco', 'price'])
  const custo = firstNumber(payload, ['custo', 'cost'])
  const categoriaId = firstText(payload, ['id_categoria', 'categoria_id', 'category_id'])
  const ativo = firstBoolean(payload, ['ativo', 'active'])
  const status = firstText(payload, ['status', 'situacao'])
  const tipoServico = firstText(payload, ['tipo_servico', 'tipo', 'service_type'])

  if (!update) requireFields({ nome, valor })

  const body = {
    ...(nome ? { nome } : {}),
    ...(valor === undefined ? {} : { valor, preco: valor }),
    ...(codigo ? { codigo } : {}),
    ...(descricao ? { descricao } : {}),
    ...(custo === undefined ? {} : { custo }),
    ...(categoriaId ? { id_categoria: categoriaId } : {}),
    ...(status ? { status } : {}),
    ...(tipoServico ? { tipo_servico: tipoServico } : {}),
    ...(firstText(payload, ['codigo_servico_municipal', 'service_code'])
      ? { codigo_servico_municipal: firstText(payload, ['codigo_servico_municipal', 'service_code']) }
      : {}),
    ...(ativo === undefined ? {} : { ativo }),
    ...(optionalRecord(payload.impostos) ? { impostos: payload.impostos } : {}),
  }
  if (update) requireNonEmptyPayload('servicos', 'atualizar', body)
  return body
}

function contractTerms(payload: JsonRecord, numero: number | undefined) {
  const explicit = optionalRecord(payload.termos)
  if (explicit) return explicit

  const tipoFrequencia = firstText(payload, ['tipo_frequencia', 'frequencia', 'frequency'])
  const tipoExpiracao = firstText(payload, ['tipo_expiracao', 'expiracao', 'expiration_type'])
  const dataInicio = firstText(payload, ['data_inicio', 'inicio', 'start_date'])
  const dataFim = firstText(payload, ['data_fim', 'fim', 'end_date'])
  const numeroContrato = firstInteger(payload, ['numero', 'number']) ?? numero

  requireFields({
    tipo_frequencia: tipoFrequencia,
    tipo_expiracao: tipoExpiracao,
    data_inicio: dataInicio,
    data_fim: dataFim,
    numero: numeroContrato,
  })

  return {
    tipo_frequencia: tipoFrequencia,
    tipo_expiracao: tipoExpiracao,
    data_inicio: dataInicio,
    data_fim: dataFim,
    numero: numeroContrato,
  }
}

function contractPaymentCondition(payload: JsonRecord) {
  const explicit = optionalRecord(payload.condicao_pagamento)
  if (explicit) return explicit

  const diaVencimento = firstInteger(payload, ['dia_vencimento', 'due_day'])
  const primeiraDataVencimento = firstText(payload, [
    'primeira_data_vencimento',
    'primeiro_vencimento',
    'data_primeiro_vencimento',
    'first_due_date',
  ])

  requireFields({
    dia_vencimento: diaVencimento,
    primeira_data_vencimento: primeiraDataVencimento,
  })

  return {
    dia_vencimento: diaVencimento,
    primeira_data_vencimento: primeiraDataVencimento,
  }
}

function buildContractPayload(payload: JsonRecord, numero: number | undefined) {
  const idCliente = firstText(payload, ['id_cliente', 'cliente_id', 'customer_id'])
  const items = saleItems(payload)
  const termos = contractTerms(payload, numero)
  const condicaoPagamento = contractPaymentCondition(payload)

  requireFields({
    id_cliente: idCliente,
    itens: items,
    termos,
    condicao_pagamento: condicaoPagamento,
  })
  for (let index = 0; index < items.length; index += 1) {
    requireFields({
      [`itens[${index}].id`]: items[index].id,
      [`itens[${index}].quantidade`]: items[index].quantidade,
      [`itens[${index}].valor`]: items[index].valor,
    })
  }

  return {
    id_cliente: idCliente,
    itens: items,
    condicao_pagamento: condicaoPagamento,
    termos,
    ...(firstText(payload, ['observacoes', 'observacao', 'notes'])
      ? { observacoes: firstText(payload, ['observacoes', 'observacao', 'notes']) }
      : {}),
  }
}

function personProfileFor(resource: ContaAzulPersonResource) {
  return resource === 'clientes' ? 'Cliente' : 'Fornecedor'
}

function buildPersonPayload(resource: ContaAzulPersonResource, payload: JsonRecord) {
  const nome = firstText(payload, ['nome', 'name', 'razao_social'])
  const tipoPessoa = firstText(payload, ['tipo_pessoa', 'tipoPessoa', 'tipo']) || 'Física'
  const perfil = firstText(payload, ['tipo_perfil', 'perfil', 'profile']) || personProfileFor(resource)
  const email = firstText(payload, ['email'])
  const telefone = firstText(payload, ['telefone', 'phone'])
  const documento = firstText(payload, ['documento', 'cpf_cnpj', 'cpfCnpj', 'tax_id'])
  const ativo = firstBoolean(payload, ['ativo', 'active'])
  const estrangeiro = firstBoolean(payload, ['estrangeiro', 'foreign'])

  requireFields({ nome, tipo_pessoa: tipoPessoa })

  return {
    nome,
    tipo_pessoa: tipoPessoa,
    perfis: Array.isArray(payload.perfis) ? payload.perfis : [{ tipo_perfil: perfil }],
    ...(email ? { email } : {}),
    ...(telefone ? { telefone } : {}),
    ...(documento ? { documento } : {}),
    ...(ativo === undefined ? {} : { ativo }),
    ...(estrangeiro === undefined ? {} : { estrangeiro }),
  }
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

async function executeContaAzulAction(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
): Promise<ConnectedProviderActionResult> {
  const resource = input.resource as ContaAzulActionResource
  const credentials = await loadCredentials({
    tenantId: input.tenantId,
    connection: input.connection,
  })
  const client = createContaAzulClient(credentials)
  let payload: JsonRecord = {}

  if (input.action === 'deletar') {
    payload = {}
  } else if (resource === 'pedidos-venda') {
    if (input.action === 'cancelar') {
      payload = buildCancelSalePayload(input.id, input.payload || {})
    } else {
      const nextNumber = firstInteger(input.payload || {}, ['numero', 'number']) === undefined && input.action === 'criar'
        ? extractSaleNextNumber(await client.requestPath({
          resource,
          path: '/v1/venda/proximo-numero',
          method: 'GET',
        }))
        : undefined
      payload = buildSalePayload(input.payload || {}, nextNumber, input.action === 'atualizar')
    }
  } else if (resource === 'clientes' || resource === 'fornecedores') {
    payload = buildPersonPayload(resource, input.payload || {})
  } else if (resource === 'centros-custo') {
    payload = buildCostCenterPayload(input.payload || {})
  } else if (resource === 'produtos') {
    payload = buildProductPayload(input.payload || {}, input.action === 'atualizar')
  } else if (resource === 'servicos') {
    payload = buildServicePayload(input.payload || {}, input.action === 'atualizar')
  } else if (resource === 'contratos') {
    const nextNumber = firstInteger(input.payload || {}, ['numero', 'number']) === undefined
      ? extractSaleNextNumber(await client.requestPath({
        resource,
        path: '/v1/contratos/proximo-numero',
        method: 'GET',
      }))
      : undefined
    payload = buildContractPayload(input.payload || {}, nextNumber)
  } else {
    payload = normalizeFinancialPayload(resource, input.action, input.payload || {})
  }

  const response = await client.requestPath({
    resource,
    path: pathFor(resource, input.action, input.id),
    method: methodFor(resource, input.action),
    body: input.action === 'deletar' ? undefined : payload,
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
    return executeContaAzulAction(input)
  },
}
