import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { createOmieClient } from '@/products/integracoes/connectors/erp/omie/omieClient'
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
type OmieActionResource =
  | 'clientes'
  | 'fornecedores'
  | 'contas-a-pagar'
  | 'contas-a-receber'
  | 'pedidos-venda'
  | 'centros-custo'
  | 'produtos'
  | 'servicos'
  | 'contratos'
type OmieFinancialResource = 'contas-a-pagar' | 'contas-a-receber'
type OmiePersonResource = 'clientes' | 'fornecedores'

const SUPPORTED_ACTIONS: Partial<Record<ConnectedErpResource, ConnectedErpProviderAction[]>> = {
  clientes: ['criar', 'atualizar'],
  fornecedores: ['criar', 'atualizar'],
  'contas-a-pagar': ['criar', 'atualizar', 'baixar'],
  'contas-a-receber': ['criar', 'atualizar', 'baixar'],
  'pedidos-venda': ['criar', 'atualizar', 'cancelar'],
  'centros-custo': ['criar'],
  produtos: ['criar', 'atualizar', 'deletar'],
  servicos: ['criar', 'atualizar'],
  contratos: ['criar', 'atualizar'],
}

const RESOURCE_ENDPOINTS: Record<OmieActionResource, string> = {
  clientes: '/geral/clientes/',
  fornecedores: '/geral/clientes/',
  'contas-a-pagar': '/financas/contapagar/',
  'contas-a-receber': '/financas/contareceber/',
  'pedidos-venda': '/produtos/pedido/',
  'centros-custo': '/geral/departamentos/',
  produtos: '/geral/produtos/',
  servicos: '/servicos/servico/',
  contratos: '/servicos/contrato/',
}

const RESOURCE_CALLS: Record<OmieActionResource, Partial<Record<ConnectedErpProviderAction, string>>> = {
  clientes: {
    criar: 'IncluirCliente',
    atualizar: 'AlterarCliente',
  },
  fornecedores: {
    criar: 'IncluirCliente',
    atualizar: 'AlterarCliente',
  },
  'contas-a-pagar': {
    criar: 'IncluirContaPagar',
    atualizar: 'AlterarContaPagar',
    baixar: 'LancarPagamento',
  },
  'contas-a-receber': {
    criar: 'IncluirContaReceber',
    atualizar: 'AlterarContaReceber',
    baixar: 'LancarRecebimento',
  },
  'pedidos-venda': {
    criar: 'IncluirPedido',
    atualizar: 'AlterarPedidoVenda',
    cancelar: 'ExcluirPedido',
  },
  'centros-custo': {
    criar: 'IncluirDepartamento',
  },
  produtos: {
    criar: 'IncluirProduto',
    atualizar: 'AlterarProduto',
    deletar: 'ExcluirProduto',
  },
  servicos: {
    criar: 'IncluirCadastroServico',
    atualizar: 'AlterarCadastroServico',
  },
  contratos: {
    criar: 'IncluirContrato',
    atualizar: 'AlterarContrato',
  },
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parseCredentials(value: string | null): JsonRecord {
  if (!value) throw new Error('Credencial Omie ausente.')
  const parsed = JSON.parse(value) as unknown
  if (!isRecord(parsed)) throw new Error('Credencial Omie invalida.')
  return parsed
}

async function loadCredentials(input: {
  connection: IntegrationConnection
}) {
  if (!input.connection.secretRef) {
    throw new Error('Credencial ausente para omie. Informe app_key e app_secret na conexao.')
  }
  return parseCredentials(await readSecret(input.connection.secretRef))
}

function optionalRecord(value: unknown) {
  return isRecord(value) ? value : undefined
}

function explicitProviderPayload(payload: JsonRecord) {
  return optionalRecord(payload.omie_payload)
    || optionalRecord(payload.provider_payload)
    || optionalRecord(payload.payload_omie)
}

function firstText(payload: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
    if (isRecord(value)) {
      const id = value.id ?? value.codigo ?? value.codigo_omie ?? value.codigo_integracao
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

function todayOmieDate() {
  return formatOmieDate(new Date().toISOString().slice(0, 10))
}

function formatOmieDate(value?: string) {
  if (!value) return undefined
  const trimmed = value.trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return trimmed
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
    throw new Error(`Payload Omie incompleto. Campos obrigatorios ausentes: ${missing.join(', ')}.`)
  }
}

function requireNonEmptyPayload(resource: string, action: string, payload: JsonRecord) {
  if (Object.keys(payload).length === 0) {
    throw new Error(`Payload Omie incompleto. Informe ao menos um campo para ${resource}/${action}.`)
  }
}

function idAsNumber(value: string | undefined | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined
}

function integrationId(input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>) {
  return input.idempotencyKey
    || firstText(input.payload || {}, ['codigo_integracao', 'external_id', 'externalId', 'codigo_externo'])
    || input.id
    || undefined
}

function buildPersonPayload(
  resource: OmiePersonResource,
  action: ConnectedErpProviderAction,
  id: string | null | undefined,
  payload: JsonRecord,
) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  const codigoOmie = firstInteger(payload, ['codigo_cliente_omie', 'codigo_omie', 'codigo']) ?? idAsNumber(id)
  const codigoIntegracao = firstText(payload, ['codigo_cliente_integracao', 'codigo_integracao', 'external_id', 'externalId'])
    || (!codigoOmie ? id || undefined : undefined)
  const razaoSocial = firstText(payload, ['razao_social', 'nome', 'name'])
  const nomeFantasia = firstText(payload, ['nome_fantasia', 'fantasia', 'display_name']) || razaoSocial
  const cnpjCpf = firstText(payload, ['cnpj_cpf', 'cpf_cnpj', 'documento', 'tax_id'])
  const email = firstText(payload, ['email'])
  const telefone = firstText(payload, ['telefone', 'phone', 'telefone1_numero'])
  const ddd = firstText(payload, ['telefone_ddd', 'ddd', 'telefone1_ddd'])
  const inativo = firstText(payload, ['inativo', 'ativo'])

  requireFields({
    ...(action === 'atualizar' ? { codigo_cliente_omie: codigoOmie ?? codigoIntegracao } : {}),
    razao_social: razaoSocial,
  })

  return {
    ...(codigoOmie !== undefined ? { codigo_cliente_omie: codigoOmie } : {}),
    ...(codigoIntegracao ? { codigo_cliente_integracao: codigoIntegracao } : {}),
    razao_social: razaoSocial,
    ...(nomeFantasia ? { nome_fantasia: nomeFantasia } : {}),
    ...(cnpjCpf ? { cnpj_cpf: cnpjCpf } : {}),
    ...(email ? { email } : {}),
    ...(telefone ? { telefone1_numero: telefone } : {}),
    ...(ddd ? { telefone1_ddd: ddd } : {}),
    ...(firstText(payload, ['endereco']) ? { endereco: firstText(payload, ['endereco']) } : {}),
    ...(firstText(payload, ['endereco_numero', 'numero']) ? { endereco_numero: firstText(payload, ['endereco_numero', 'numero']) } : {}),
    ...(firstText(payload, ['bairro']) ? { bairro: firstText(payload, ['bairro']) } : {}),
    ...(firstText(payload, ['cidade']) ? { cidade: firstText(payload, ['cidade']) } : {}),
    ...(firstText(payload, ['estado', 'uf']) ? { estado: firstText(payload, ['estado', 'uf']) } : {}),
    ...(firstText(payload, ['cep']) ? { cep: firstText(payload, ['cep']) } : {}),
    ...(inativo === undefined ? {} : { inativo: inativo === 'false' || inativo === 'S' ? 'S' : 'N' }),
    ...(Array.isArray(payload.tags) ? { tags: payload.tags } : {}),
    ...(resource === 'fornecedores' && Array.isArray(payload.recomendacoes) ? { recomendacoes: payload.recomendacoes } : {}),
  }
}

function buildFinancialPayload(
  resource: OmieFinancialResource,
  action: ConnectedErpProviderAction,
  id: string | null | undefined,
  payload: JsonRecord,
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  const codigoLancamento = firstInteger(payload, [
    'codigo_lancamento_omie',
    'codigo_lancamento',
    'codigo',
  ]) ?? idAsNumber(id)
  const codigoLancamentoIntegracao = firstText(payload, [
    'codigo_lancamento_integracao',
    'codigo_integracao',
    'external_id',
    'externalId',
  ]) || (!codigoLancamento ? integrationId(input) : undefined)

  if (action === 'baixar') {
    const data = formatOmieDate(firstText(payload, ['data', 'data_baixa', 'data_pagamento', 'data_recebimento', 'payment_date']))
      || todayOmieDate()
    const body = {
      ...(codigoLancamento !== undefined ? { codigo_lancamento: codigoLancamento } : {}),
      ...(codigoLancamentoIntegracao ? { codigo_lancamento_integracao: codigoLancamentoIntegracao } : {}),
      ...(firstInteger(payload, ['codigo_baixa']) !== undefined ? { codigo_baixa: firstInteger(payload, ['codigo_baixa']) } : {}),
      ...(firstText(payload, ['codigo_baixa_integracao', 'baixa_integracao']) ? { codigo_baixa_integracao: firstText(payload, ['codigo_baixa_integracao', 'baixa_integracao']) } : {}),
      ...(firstInteger(payload, ['codigo_conta_corrente', 'conta_corrente_id', 'conta_financeira_id']) !== undefined
        ? { codigo_conta_corrente: firstInteger(payload, ['codigo_conta_corrente', 'conta_corrente_id', 'conta_financeira_id']) }
        : {}),
      ...(firstNumber(payload, ['valor', 'valor_pago', 'valor_recebido', 'total']) !== undefined
        ? { valor: firstNumber(payload, ['valor', 'valor_pago', 'valor_recebido', 'total']) }
        : {}),
      ...(firstNumber(payload, ['desconto']) !== undefined ? { desconto: firstNumber(payload, ['desconto']) } : {}),
      ...(firstNumber(payload, ['juros']) !== undefined ? { juros: firstNumber(payload, ['juros']) } : {}),
      ...(firstNumber(payload, ['multa']) !== undefined ? { multa: firstNumber(payload, ['multa']) } : {}),
      data,
      ...(firstText(payload, ['observacao', 'nota', 'note']) ? { observacao: firstText(payload, ['observacao', 'nota', 'note']) } : {}),
      conciliar_documento: firstText(payload, ['conciliar_documento', 'conciliar']) || 'N',
      ...(resource === 'contas-a-receber' && firstText(payload, ['nsu']) ? { nsu: firstText(payload, ['nsu']) } : {}),
    }
    requireFields({ codigo_lancamento: codigoLancamento ?? codigoLancamentoIntegracao, data })
    return body
  }

  const contato = firstInteger(payload, [
    'codigo_cliente_fornecedor',
    'codigo_cliente_omie',
    resource === 'contas-a-pagar' ? 'fornecedor_id' : 'cliente_id',
    'contato_id',
    'pessoa_id',
  ])
  const valor = firstNumber(payload, ['valor_documento', 'valor', 'total', 'valor_total'])
  const dataVencimento = formatOmieDate(firstText(payload, ['data_vencimento', 'vencimento', 'due_date'])) || todayOmieDate()
  const dataEmissao = formatOmieDate(firstText(payload, ['data_emissao', 'emissao', 'issue_date'])) || dataVencimento
  const codigoCategoria = firstText(payload, ['codigo_categoria', 'categoria_id', 'id_categoria', 'category_id'])

  const body = {
    ...(codigoLancamento !== undefined ? { codigo_lancamento_omie: codigoLancamento } : {}),
    ...(codigoLancamentoIntegracao ? { codigo_lancamento_integracao: codigoLancamentoIntegracao } : {}),
    ...(contato !== undefined ? { codigo_cliente_fornecedor: contato } : {}),
    ...(valor !== undefined ? { valor_documento: valor } : {}),
    data_vencimento: dataVencimento,
    data_previsao: formatOmieDate(firstText(payload, ['data_previsao', 'forecast_date'])) || dataVencimento,
    data_emissao: dataEmissao,
    ...(codigoCategoria ? { codigo_categoria: codigoCategoria } : {}),
    ...(firstText(payload, ['numero_documento', 'documento']) ? { numero_documento: firstText(payload, ['numero_documento', 'documento']) } : {}),
    ...(firstText(payload, ['numero_documento_fiscal', 'documento_fiscal']) ? { numero_documento_fiscal: firstText(payload, ['numero_documento_fiscal', 'documento_fiscal']) } : {}),
    ...(firstText(payload, ['codigo_tipo_documento', 'tipo_documento']) ? { codigo_tipo_documento: firstText(payload, ['codigo_tipo_documento', 'tipo_documento']) } : {}),
    ...(firstText(payload, ['observacao', 'descricao', 'note']) ? { observacao: firstText(payload, ['observacao', 'descricao', 'note']) } : {}),
    ...(firstInteger(payload, ['codigo_projeto', 'projeto_id']) !== undefined ? { codigo_projeto: firstInteger(payload, ['codigo_projeto', 'projeto_id']) } : {}),
    ...(Array.isArray(payload.departamentos) ? { departamentos: payload.departamentos } : {}),
  }

  if (action === 'criar') {
    requireFields({
      codigo_lancamento_integracao: codigoLancamentoIntegracao,
      codigo_cliente_fornecedor: contato,
      valor_documento: valor,
      data_vencimento: dataVencimento,
      codigo_categoria: codigoCategoria,
    })
  } else {
    requireFields({ codigo_lancamento_omie: codigoLancamento ?? codigoLancamentoIntegracao })
    requireNonEmptyPayload(resource, action, body)
  }
  return body
}

function buildProductPayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  const codigoProduto = firstInteger(payload, ['codigo_produto', 'codigo_omie', 'codigo']) ?? idAsNumber(id)
  const codigoIntegracao = firstText(payload, ['codigo_produto_integracao', 'codigo_integracao', 'external_id', 'externalId'])
    || (!codigoProduto ? id || undefined : undefined)

  if (action === 'deletar') {
    const body = {
      ...(codigoProduto !== undefined ? { codigo_produto: codigoProduto } : {}),
      ...(codigoIntegracao ? { codigo_produto_integracao: codigoIntegracao } : {}),
    }
    requireFields({ codigo_produto: codigoProduto ?? codigoIntegracao })
    return body
  }

  const descricao = firstText(payload, ['descricao', 'nome', 'name'])
  const unidade = firstText(payload, ['unidade', 'unidade_medida', 'unit']) || 'UN'
  const valorUnitario = firstNumber(payload, ['valor_unitario', 'valor_venda', 'preco', 'valor', 'price'])

  const body = {
    ...(codigoProduto !== undefined ? { codigo_produto: codigoProduto } : {}),
    ...(codigoIntegracao ? { codigo_produto_integracao: codigoIntegracao } : {}),
    ...(firstText(payload, ['codigo', 'sku']) ? { codigo: firstText(payload, ['codigo', 'sku']) } : {}),
    descricao,
    unidade,
    ...(valorUnitario !== undefined ? { valor_unitario: valorUnitario } : {}),
    ...(firstText(payload, ['codigo_categoria', 'categoria_id']) ? { codigo_categoria: firstText(payload, ['codigo_categoria', 'categoria_id']) } : {}),
    ...(firstText(payload, ['ncm']) ? { ncm: firstText(payload, ['ncm']) } : {}),
    ...(firstText(payload, ['ean']) ? { ean: firstText(payload, ['ean']) } : {}),
    ...(firstText(payload, ['codigo_familia', 'familia_id']) ? { codigo_familia: firstText(payload, ['codigo_familia', 'familia_id']) } : {}),
  }
  requireFields({
    ...(action === 'atualizar' ? { codigo_produto: codigoProduto ?? codigoIntegracao } : {}),
    descricao,
    unidade,
  })
  return body
}

function saleItems(payload: JsonRecord) {
  const items = Array.isArray(payload.det)
    ? payload.det
    : Array.isArray(payload.itens)
      ? payload.itens
      : Array.isArray(payload.items)
        ? payload.items
        : []

  return items.filter(isRecord).map((item, index) => {
    if (isRecord(item.produto)) return item
    const codigoProduto = firstInteger(item, ['codigo_produto', 'produto_id', 'id'])
    const quantidade = firstNumber(item, ['quantidade', 'quantity', 'qtd']) ?? 1
    const valorUnitario = firstNumber(item, ['valor_unitario', 'valor', 'preco', 'price'])
    const descricao = firstText(item, ['descricao', 'description'])
    requireFields({
      [`itens[${index}].codigo_produto`]: codigoProduto,
      [`itens[${index}].quantidade`]: quantidade,
      [`itens[${index}].valor_unitario`]: valorUnitario,
    })
    return {
      ide: {
        codigo_item_integracao: firstText(item, ['codigo_item_integracao', 'external_id']) || String(index + 1),
      },
      produto: {
        codigo_produto: codigoProduto,
        quantidade,
        valor_unitario: valorUnitario,
        ...(descricao ? { descricao } : {}),
        ...(firstText(item, ['unidade', 'unit']) ? { unidade: firstText(item, ['unidade', 'unit']) } : {}),
        ...(firstText(item, ['ncm']) ? { ncm: firstText(item, ['ncm']) } : {}),
      },
    }
  })
}

function buildSalePayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord, input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  const codigoPedido = firstInteger(payload, ['codigo_pedido', 'codigo_omie', 'codigo']) ?? idAsNumber(id)
  const codigoIntegracao = firstText(payload, ['codigo_pedido_integracao', 'codigo_integracao', 'external_id', 'externalId'])
    || (!codigoPedido ? integrationId(input) : undefined)

  if (action === 'cancelar') {
    const body = {
      ...(codigoPedido !== undefined ? { codigo_pedido: codigoPedido } : {}),
      ...(codigoIntegracao ? { codigo_pedido_integracao: codigoIntegracao } : {}),
    }
    requireFields({ codigo_pedido: codigoPedido ?? codigoIntegracao })
    return body
  }

  const codigoCliente = firstInteger(payload, ['codigo_cliente', 'cliente_id', 'id_cliente', 'customer_id'])
  const items = saleItems(payload)
  const dataPrevisao = formatOmieDate(firstText(payload, ['data_previsao', 'data_venda', 'data', 'sale_date'])) || todayOmieDate()

  const body = {
    cabecalho: {
      ...(codigoPedido !== undefined ? { codigo_pedido: codigoPedido } : {}),
      ...(codigoCliente !== undefined ? { codigo_cliente: codigoCliente } : {}),
      ...(codigoIntegracao ? { codigo_pedido_integracao: codigoIntegracao } : {}),
      data_previsao: dataPrevisao,
      etapa: firstText(payload, ['etapa', 'status']) || '10',
      ...(firstText(payload, ['numero_pedido', 'numero']) ? { numero_pedido: firstText(payload, ['numero_pedido', 'numero']) } : {}),
      ...(firstText(payload, ['codigo_parcela', 'parcela']) ? { codigo_parcela: firstText(payload, ['codigo_parcela', 'parcela']) } : {}),
      quantidade_itens: items.length,
    },
    det: items,
    ...(optionalRecord(payload.frete) ? { frete: payload.frete } : { frete: { modalidade: '9' } }),
    informacoes_adicionais: optionalRecord(payload.informacoes_adicionais) || {
      ...(firstText(payload, ['codigo_categoria', 'categoria_id']) ? { codigo_categoria: firstText(payload, ['codigo_categoria', 'categoria_id']) } : {}),
      ...(firstInteger(payload, ['codigo_conta_corrente', 'conta_corrente_id']) !== undefined ? { codigo_conta_corrente: firstInteger(payload, ['codigo_conta_corrente', 'conta_corrente_id']) } : {}),
      consumidor_final: firstText(payload, ['consumidor_final']) || 'S',
    },
    ...(optionalRecord(payload.observacoes) ? { observacoes: payload.observacoes } : {}),
  }
  requireFields({
    ...(action === 'atualizar' ? { codigo_pedido: codigoPedido ?? codigoIntegracao } : {}),
    codigo_cliente: codigoCliente,
    det: items,
  })
  return body
}

function buildDepartmentPayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit
  const codigo = firstText(payload, ['codigo', 'code']) || id || undefined
  const descricao = firstText(payload, ['descricao', 'nome', 'name'])
  requireFields({
    ...(action === 'atualizar' ? { codigo } : {}),
    descricao,
  })
  return {
    ...(codigo ? { codigo } : {}),
    descricao,
  }
}

function buildServicePayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord, input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit

  const codigoServico = firstInteger(payload, ['nCodServ', 'codigo_servico', 'codigo_omie']) ?? idAsNumber(id)
  const codigoIntegracao = firstText(payload, ['cCodIntServ', 'codigo_integracao', 'external_id', 'externalId'])
    || (!codigoServico ? integrationId(input) : undefined)
  const descricao = firstText(payload, ['descricao', 'nome', 'name'])
  const valor = firstNumber(payload, ['valor', 'preco', 'valor_unitario', 'price'])

  const body = {
    [action === 'atualizar' ? 'intEditar' : 'intIncluir']: {
      ...(codigoServico !== undefined ? { nCodServ: codigoServico } : {}),
      ...(codigoIntegracao ? { cCodIntServ: codigoIntegracao } : {}),
    },
    descricao: {
      cDescrCompleta: firstText(payload, ['descricao_completa', 'description']) || descricao,
    },
    cabecalho: {
      cDescricao: descricao,
      ...(firstText(payload, ['codigo', 'code']) ? { cCodigo: firstText(payload, ['codigo', 'code']) } : {}),
      ...(firstText(payload, ['codigo_servico_municipal', 'service_code']) ? { cCodServMun: firstText(payload, ['codigo_servico_municipal', 'service_code']) } : {}),
      ...(firstText(payload, ['codigo_lc116', 'lc116']) ? { cCodLC116: firstText(payload, ['codigo_lc116', 'lc116']) } : {}),
      ...(firstText(payload, ['id_tributacao', 'tributacao_id']) ? { cIdTrib: firstText(payload, ['id_tributacao', 'tributacao_id']) } : {}),
      ...(firstText(payload, ['codigo_categoria', 'categoria_id']) ? { cCodCateg: firstText(payload, ['codigo_categoria', 'categoria_id']) } : {}),
      ...(valor !== undefined ? { nPrecoUnit: valor } : {}),
    },
    impostos: optionalRecord(payload.impostos) || {},
  }
  requireFields({
    ...(action === 'atualizar' ? { codigo_servico: codigoServico ?? codigoIntegracao } : {}),
    descricao,
    valor,
  })
  return body
}

function buildContractPayload(action: ConnectedErpProviderAction, id: string | null | undefined, payload: JsonRecord, input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>) {
  const explicit = explicitProviderPayload(payload)
  if (explicit) return explicit
  if (isRecord(payload.cabecalho)) return payload

  const codigoContrato = firstInteger(payload, ['nCodCtr', 'codigo_contrato', 'codigo_omie']) ?? idAsNumber(id)
  const codigoIntegracao = firstText(payload, ['cCodIntCtr', 'codigo_integracao', 'external_id', 'externalId'])
    || (!codigoContrato ? integrationId(input) : undefined)
  const codigoCliente = firstInteger(payload, ['nCodCli', 'codigo_cliente', 'cliente_id', 'id_cliente'])
  const valorMensal = firstNumber(payload, ['nValTotMes', 'valor_mensal', 'valor', 'total'])
  const dataInicio = formatOmieDate(firstText(payload, ['dVigInicial', 'data_inicio', 'inicio', 'start_date']))
  const dataFim = formatOmieDate(firstText(payload, ['dVigFinal', 'data_fim', 'fim', 'end_date']))
  const itens = Array.isArray(payload.itensContrato)
    ? payload.itensContrato
    : saleItems(payload).map((item, index) => ({
      itemCabecalho: {
        codIntItem: String(index + 1),
        codServico: isRecord(item.produto) ? item.produto.codigo_produto : 0,
        quant: isRecord(item.produto) ? item.produto.quantidade : 1,
        valorUnit: isRecord(item.produto) ? item.produto.valor_unitario : valorMensal,
        valorTotal: isRecord(item.produto) ? item.produto.valor_unitario : valorMensal,
        natOperacao: firstText(payload, ['nat_operacao', 'natureza_operacao']) || '01',
      },
      itemDescrServ: {
        descrCompleta: firstText(payload, ['descricao_item', 'descricao', 'description']) || 'Servico contratado',
      },
    }))

  requireFields({
    ...(action === 'atualizar' ? { codigo_contrato: codigoContrato ?? codigoIntegracao } : {}),
    codigo_cliente: codigoCliente,
    valor_mensal: valorMensal,
    data_inicio: dataInicio,
    data_fim: dataFim,
    itensContrato: itens,
  })

  return {
    cabecalho: {
      ...(codigoContrato !== undefined ? { nCodCtr: codigoContrato } : {}),
      ...(codigoIntegracao ? { cCodIntCtr: codigoIntegracao } : {}),
      cCodSit: firstText(payload, ['cCodSit', 'situacao', 'status']) || '10',
      ...(firstText(payload, ['cNumCtr', 'numero', 'number']) ? { cNumCtr: firstText(payload, ['cNumCtr', 'numero', 'number']) } : {}),
      cTipoFat: firstText(payload, ['cTipoFat', 'tipo_faturamento']) || '01',
      dVigInicial: dataInicio,
      dVigFinal: dataFim,
      nCodCli: codigoCliente,
      nDiaFat: firstInteger(payload, ['nDiaFat', 'dia_faturamento']) ?? 1,
      nValTotMes: valorMensal,
    },
    departamentos: Array.isArray(payload.departamentos) ? payload.departamentos : [],
    infAdic: optionalRecord(payload.infAdic) || {
      ...(firstText(payload, ['codigo_categoria', 'categoria_id']) ? { cCodCateg: firstText(payload, ['codigo_categoria', 'categoria_id']) } : {}),
      ...(firstInteger(payload, ['codigo_conta_corrente', 'conta_corrente_id']) !== undefined ? { nCodCC: firstInteger(payload, ['codigo_conta_corrente', 'conta_corrente_id']) } : {}),
    },
    itensContrato: itens,
    ...(optionalRecord(payload.observacoes) ? { observacoes: payload.observacoes } : {}),
    ...(optionalRecord(payload.vencTextos) ? { vencTextos: payload.vencTextos } : {}),
  }
}

function normalizePayload(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
) {
  const resource = input.resource as OmieActionResource
  const payload = input.payload || {}
  if (resource === 'clientes' || resource === 'fornecedores') return buildPersonPayload(resource, input.action, input.id, payload)
  if (resource === 'contas-a-pagar' || resource === 'contas-a-receber') return buildFinancialPayload(resource, input.action, input.id, payload, input)
  if (resource === 'pedidos-venda') return buildSalePayload(input.action, input.id, payload, input)
  if (resource === 'centros-custo') return buildDepartmentPayload(input.action, input.id, payload)
  if (resource === 'produtos') return buildProductPayload(input.action, input.id, payload)
  if (resource === 'servicos') return buildServicePayload(input.action, input.id, payload, input)
  if (resource === 'contratos') return buildContractPayload(input.action, input.id, payload, input)
  throw new Error(`Omie nao suporta ${resource}/${input.action} neste adapter.`)
}

function extractId(payload: unknown) {
  if (!isRecord(payload)) return null
  const candidates = [
    payload.codigo_cliente_omie,
    payload.codigo_cliente_integracao,
    payload.codigo_produto,
    payload.codigo_produto_integracao,
    payload.codigo_lancamento_omie,
    payload.codigo_lancamento,
    payload.codigo_baixa,
    payload.codigo_pedido,
    payload.codigo_pedido_integracao,
    payload.nCodServ,
    payload.cCodIntServ,
    payload.nCodCtr,
    payload.cCodIntCtr,
    payload.codigo,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

function extractStatus(payload: unknown) {
  if (!isRecord(payload)) return null
  const candidates = [
    payload.codigo_status,
    payload.descricao_status,
    payload.cCodStatus,
    payload.cDesStatus,
    payload.cCodigoStatus,
    payload.cDescricaoStatus,
    payload.status,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return null
}

function extractMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback
  const candidates = [
    payload.descricao_status,
    payload.cDesStatus,
    payload.cDescricaoStatus,
    payload.message,
    payload.faultstring,
  ]
  for (const candidate of candidates) {
    if (candidate != null && String(candidate).trim()) return String(candidate)
  }
  return fallback
}

function hasFailureStatus(payload: unknown) {
  if (!isRecord(payload)) return false
  const code = payload.codigo_status ?? payload.cCodStatus ?? payload.cCodigoStatus
  if (code == null || String(code).trim() === '') return false
  return String(code).trim() !== '0'
}

async function executeOmieAction(
  input: ConnectedProviderActionInput<ConnectedErpResource, ConnectedErpProviderAction>,
): Promise<ConnectedProviderActionResult> {
  const resource = input.resource as OmieActionResource
  const call = RESOURCE_CALLS[resource]?.[input.action]
  if (!call) {
    return {
      ok: false,
      message: `Omie nao suporta ${resource}/${input.action} neste adapter.`,
      id: input.id || null,
    }
  }

  const client = createOmieClient(await loadCredentials({
    connection: input.connection,
  }))
  const requestPayload = normalizePayload(input)
  const response = await client.requestCall({
    resource,
    endpoint: RESOURCE_ENDPOINTS[resource],
    call,
    params: requestPayload,
  })
  const failed = hasFailureStatus(response)

  return {
    ok: !failed,
    message: extractMessage(response, `Acao ${input.action} executada no Omie para ${resource}.`),
    id: extractId(response) || input.id || null,
    status: extractStatus(response),
    metadata: {
      provider_payload: response,
      provider_request: {
        call,
        param: requestPayload,
      },
    },
  }
}

export const omieErpApiAdapter: ErpApiAdapter = {
  provider: 'omie',
  supportsLiveRead() {
    return false
  },
  supportsAction(resource, action) {
    return Boolean(SUPPORTED_ACTIONS[resource]?.includes(action))
  },
  async listLive() {
    throw new Error('Leitura live Omie ainda nao implementada neste adapter.')
  },
  async readLive() {
    throw new Error('Leitura live Omie ainda nao implementada neste adapter.')
  },
  async executeAction(input) {
    if (!this.supportsAction(input.resource, input.action)) {
      return {
        ok: false,
        message: `Omie nao suporta ${input.resource}/${input.action} neste adapter.`,
        id: input.id || null,
      }
    }
    return executeOmieAction(input)
  },
}
