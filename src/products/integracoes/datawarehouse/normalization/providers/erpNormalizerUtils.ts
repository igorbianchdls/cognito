import type {
  NormalizationInput,
  NormalizationResult,
  NormalizedRow,
  NormalizedTableName,
} from '@/products/integracoes/datawarehouse/normalization/contracts'

type JsonRecord = Record<string, unknown>

export type ProviderResourceMap = Partial<Record<string, NormalizedTableName>>

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function unwrapPayload(row: JsonRecord): JsonRecord {
  const raw = row.raw ?? row.raw_payload ?? row.rawPayload ?? row.payload
  return isRecord(raw) ? raw : row
}

function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (Array.isArray(current)) {
      const index = Number(key)
      return Number.isInteger(index) ? current[index] : undefined
    }
    if (!isRecord(current)) return undefined
    return current[key]
  }, value)
}

function firstValue(row: JsonRecord, paths: string[]): unknown {
  for (const path of paths) {
    const value = getPath(row, path)
    if (value !== undefined && value !== null && value !== '') return value
  }
  return null
}

function text(row: JsonRecord, paths: string[]) {
  const value = firstValue(row, paths)
  if (value == null) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return null
}

function numberValue(row: JsonRecord, paths: string[]) {
  const value = firstValue(row, paths)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, '')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function dateValue(row: JsonRecord, paths: string[]) {
  const value = firstValue(row, paths)
  if (value == null) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  const raw = String(value).trim()
  if (!raw) return null
  const brDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brDate) return `${brDate[3]}-${brDate[2]}-${brDate[1]}`
  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return raw.slice(0, 10)
}

function normalizeStatus(value: string | null) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return null
  if (['true', 'ativo', 'ativa', 'a', 'sim', 's'].includes(normalized)) return 'ativo'
  if (['false', 'inativo', 'inativa', 'i', 'nao', 'n'].includes(normalized)) return 'inativo'
  if (['pago', 'paga', 'quitado', 'quitada', 'recebido', 'recebida'].includes(normalized)) return 'pago'
  if (['aberto', 'aberta', 'pendente', 'previsto', 'prevista'].includes(normalized)) return 'aberto'
  if (['cancelado', 'cancelada', 'cancelled'].includes(normalized)) return 'cancelado'
  return normalized.replace(/\s+/g, '_')
}

function externalId(row: JsonRecord, payload: JsonRecord) {
  return text(row, ['external_id', 'externalId', 'id'])
    || text(payload, [
      'external_id',
      'id',
      'uuid',
      'codigo',
      'numero',
      'codigo_cliente_omie',
      'codigo_produto',
      'codigo_lancamento_omie',
      'nCodTitulo',
      'detalhes.nCodTitulo',
      'codigo_pedido',
      'nCodPed',
    ])
}

function base(input: NormalizationInput, table: NormalizedTableName, row: JsonRecord, payload: JsonRecord, index: number) {
  const id = externalId(row, payload)
  return {
    tenant_id: input.tenantId,
    connection_id: input.connectionId,
    provider: input.provider,
    resource: input.resource,
    external_id: id,
    source_run_id: input.runId || null,
    source_table: input.sourceTable,
    synced_at: new Date().toISOString(),
    normalized_at: new Date().toISOString(),
    source_payload: payload,
    _insert_id: `${input.connectionId}:${table}:${input.runId || 'run'}:${id || `row_${index + 1}`}`,
  }
}

function contactFields(payload: JsonRecord) {
  return {
    nome: text(payload, ['nome', 'name', 'razao_social', 'razaoSocial', 'nome_fantasia', 'nomeFantasia', 'contato.nome', 'cliente.nome']),
    documento: text(payload, ['documento', 'cpf_cnpj', 'cnpj_cpf', 'cnpj', 'cpf', 'numeroDocumento', 'contato.numeroDocumento']),
    tipo_pessoa: text(payload, ['tipo_pessoa', 'tipoPessoa', 'tipo', 'pessoa.tipo']),
    email: text(payload, ['email', 'email_principal', 'emailPrincipal', 'contato.email', 'emails.0.email']),
    telefone: text(payload, ['telefone', 'phone', 'celular', 'fone', 'contato.telefone', 'telefones.0.numero']),
    cidade: text(payload, ['cidade', 'endereco.cidade', 'endereco.municipio', 'municipio', 'cidade_nome']),
    uf: text(payload, ['uf', 'estado', 'endereco.uf', 'endereco.estado']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'ativo', 'inativo'])),
  }
}

function productFields(payload: JsonRecord) {
  return {
    nome: text(payload, ['nome', 'name', 'descricao', 'description', 'descricaoProduto']),
    codigo: text(payload, ['codigo', 'code', 'codigo_produto', 'codigoProduto', 'cCodigo']),
    sku: text(payload, ['sku', 'referencia', 'reference', 'codigo_sku']),
    descricao: text(payload, ['descricao', 'description', 'detalhes.descricao']),
    unidade: text(payload, ['unidade', 'unit', 'unidadeMedida', 'cUnidade']),
    preco: numberValue(payload, ['preco', 'preco_venda', 'precoVenda', 'valor', 'valor_unitario', 'nValorUnitario']),
    custo: numberValue(payload, ['custo', 'preco_custo', 'precoCusto', 'valor_custo', 'nValorCusto']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'ativo'])),
  }
}

function financialFields(payload: JsonRecord) {
  return {
    pessoa_id: text(payload, ['cliente.id', 'fornecedor.id', 'pessoa.id', 'codigo_cliente_omie', 'codigo_cliente_fornecedor', 'idPessoa']),
    pessoa_nome: text(payload, ['cliente.nome', 'fornecedor.nome', 'pessoa.nome', 'nome_cliente', 'nome_fornecedor', 'razao_social']),
    documento: text(payload, ['documento', 'cliente.documento', 'fornecedor.documento', 'cnpj_cpf']),
    valor: numberValue(payload, ['valor', 'total', 'valor_documento', 'valor_total', 'nValorTitulo', 'detalhes.nValorTitulo']),
    valor_pago: numberValue(payload, ['valor_pago', 'valorPago', 'pago', 'valor_recebido', 'valorRecebido', 'nValorPago']),
    data_emissao: dateValue(payload, ['data_emissao', 'dataEmissao', 'emissao', 'dDtEmissao']),
    data_vencimento: dateValue(payload, ['data_vencimento', 'dataVencimento', 'vencimento', 'dDtVenc', 'detalhes.dDtVenc']),
    data_pagamento: dateValue(payload, ['data_pagamento', 'dataPagamento', 'pagamento', 'recebimento', 'dDtPagamento']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'situacao_titulo', 'cStatus', 'detalhes.cStatus'])),
    categoria: text(payload, ['categoria', 'categoria.nome', 'codigo_categoria', 'cCodCateg']),
    descricao: text(payload, ['descricao', 'description', 'historico', 'observacao', 'detalhes.cObs']),
  }
}

function saleFields(payload: JsonRecord) {
  return {
    cliente_id: text(payload, ['cliente.id', 'cliente.codigo', 'codigo_cliente', 'codigo_cliente_omie', 'contato.id']),
    cliente_nome: text(payload, ['cliente.nome', 'nome_cliente', 'contato.nome', 'razao_social']),
    numero: text(payload, ['numero', 'numero_pedido', 'numeroPedido', 'cNumero', 'codigo_pedido']),
    valor_total: numberValue(payload, ['valor_total', 'valorTotal', 'total', 'nValorTotal', 'totalProdutos']),
    data_emissao: dateValue(payload, ['data_emissao', 'dataEmissao', 'emissao', 'dDtEmissao']),
    data_pedido: dateValue(payload, ['data_pedido', 'dataPedido', 'data', 'dDtPrevisao']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'etapa', 'cStatus'])),
  }
}

function saleItemFields(payload: JsonRecord) {
  const quantidade = numberValue(payload, ['quantidade', 'qtd', 'quantity'])
  const valorUnitario = numberValue(payload, ['valor_unitario', 'valor', 'preco', 'preco_venda', 'unit_price'])
  return {
    venda_id: text(payload, ['parent_id', 'venda_id', 'id_venda', 'venda.id']),
    item_id: text(payload, ['id', 'uuid', 'id_item', 'item.id']),
    produto_id: text(payload, ['produto.id', 'id_produto', 'produto_id', 'id_item', 'item.id']),
    nome: text(payload, ['nome', 'produto.nome', 'item.nome', 'descricao']),
    descricao: text(payload, ['descricao', 'description', 'produto.descricao', 'item.descricao']),
    tipo: text(payload, ['tipo', 'produto.tipo', 'item.tipo']),
    quantidade,
    valor_unitario: valorUnitario,
    custo: numberValue(payload, ['custo', 'valor_custo', 'preco_custo']),
    valor_total: numberValue(payload, ['valor_total', 'total']) ?? (
      quantidade != null && valorUnitario != null ? quantidade * valorUnitario : null
    ),
  }
}

function saleDetailFields(payload: JsonRecord) {
  return {
    ...saleFields(payload),
    vendedor_id: text(payload, ['vendedor.id', 'id_vendedor', 'vendedor_id']),
    vendedor_nome: text(payload, ['vendedor.nome', 'nome_vendedor', 'vendedor.name']),
    categoria_id: text(payload, ['categoria.id', 'id_categoria', 'categoria_id']),
    centro_custo_id: text(payload, ['centro_custo.id', 'id_centro_custo', 'centro_custo_id']),
    observacoes: text(payload, ['observacoes', 'observacao', 'descricao', 'comentarios']),
  }
}

function invoiceFields(payload: JsonRecord) {
  return {
    chave_acesso: text(payload, ['chave_acesso', 'chave', 'access_key']),
    numero_nota: text(payload, ['numero_nota', 'numero', 'numero_nf', 'numero_nfse']),
    destinatario_nome: text(payload, ['nome_destinatario', 'destinatario.nome', 'cliente.nome', 'nome_cliente']),
    data_emissao: dateValue(payload, ['data_emissao', 'emissao', 'created_at']),
    status: normalizeStatus(text(payload, ['status', 'situacao'])),
    valor_total: numberValue(payload, ['valor_total', 'valor_total_nota', 'valor', 'total']),
  }
}

function serviceInvoiceFields(payload: JsonRecord) {
  return {
    id: text(payload, ['id', 'uuid']),
    id_venda: text(payload, ['id_venda', 'venda.id']),
    id_contrato: text(payload, ['id_contrato', 'contrato.id']),
    numero_nfse: text(payload, ['numero_nfse']),
    numero_rps: text(payload, ['numero_rps']),
    cliente_nome: text(payload, ['nome_cliente', 'cliente.nome', 'razao_social']),
    data_competencia: dateValue(payload, ['data_competencia', 'competencia']),
    status: normalizeStatus(text(payload, ['status', 'situacao'])),
    valor_total: numberValue(payload, ['valor_total_nfse', 'valor_total', 'valor', 'total']),
  }
}

function categoryFields(payload: JsonRecord) {
  return {
    nome: text(payload, ['nome', 'descricao', 'name']),
    codigo: text(payload, ['codigo', 'code', 'id_legado']),
    tipo: text(payload, ['tipo', 'type']),
    categoria_pai_id: text(payload, ['categoria_pai.id', 'categoriaPai.id', 'id_categoria_pai', 'parent_id']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'ativo'])),
  }
}

function costCenterFields(payload: JsonRecord) {
  return {
    nome: text(payload, ['nome', 'descricao', 'name']),
    codigo: text(payload, ['codigo', 'code', 'id_legado']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'ativo'])),
  }
}

function financialAccountFields(payload: JsonRecord) {
  return {
    nome: text(payload, ['nome', 'name', 'descricao']),
    tipo: text(payload, ['tipo', 'type']),
    banco: text(payload, ['banco', 'banco.nome', 'bank', 'bank_name']),
    agencia: text(payload, ['agencia', 'agency']),
    conta: text(payload, ['conta', 'numero_conta', 'account', 'account_number']),
    status: normalizeStatus(text(payload, ['status', 'situacao', 'ativo'])),
  }
}

function transferFields(payload: JsonRecord) {
  return {
    conta_origem_id: text(payload, ['conta_origem.id', 'id_conta_origem', 'origem.id', 'conta_financeira_origem.id']),
    conta_destino_id: text(payload, ['conta_destino.id', 'id_conta_destino', 'destino.id', 'conta_financeira_destino.id']),
    valor: numberValue(payload, ['valor', 'valor_transferencia', 'amount']),
    data_transferencia: dateValue(payload, ['data_transferencia', 'data', 'data_lancamento']),
    descricao: text(payload, ['descricao', 'description', 'observacao']),
    status: normalizeStatus(text(payload, ['status', 'situacao'])),
  }
}

function stockFields(payload: JsonRecord) {
  return {
    produto_id: text(payload, ['produto.id', 'id_produto', 'codigo_produto', 'nCodProd', 'idProd']),
    produto_nome: text(payload, ['produto.nome', 'nome_produto', 'descricao', 'cDescricao']),
    codigo: text(payload, ['codigo', 'codigo_produto', 'cCodigo', 'produto.codigo']),
    sku: text(payload, ['sku', 'referencia', 'produto.sku']),
    quantidade: numberValue(payload, ['quantidade', 'saldo', 'saldo_estoque', 'nSaldo', 'nQtdSaldo', 'estoque']),
    unidade: text(payload, ['unidade', 'produto.unidade', 'cUnidade']),
    local: text(payload, ['local', 'deposito.nome', 'local_estoque', 'codigo_local_estoque']),
    updated_at: dateValue(payload, ['updated_at', 'alterado_em', 'data', 'dDataPosicao']),
  }
}

function fieldsFor(table: NormalizedTableName, payload: JsonRecord) {
  if (table === 'clientes' || table === 'fornecedores') return contactFields(payload)
  if (table === 'produtos') return productFields(payload)
  if (table === 'contas_receber' || table === 'contas_pagar') return financialFields(payload)
  if (table === 'vendas') return saleFields(payload)
  if (table === 'itens_venda') return saleItemFields(payload)
  if (table === 'venda_detalhes') return saleDetailFields(payload)
  if (table === 'notas_fiscais') return invoiceFields(payload)
  if (table === 'notas_fiscais_servico') return serviceInvoiceFields(payload)
  if (table === 'categorias') return categoryFields(payload)
  if (table === 'centros_custo') return costCenterFields(payload)
  if (table === 'contas_financeiras') return financialAccountFields(payload)
  if (table === 'transferencias') return transferFields(payload)
  return stockFields(payload)
}

export function normalizeErpRows(input: NormalizationInput, resourceMap: ProviderResourceMap): NormalizationResult {
  const table = resourceMap[input.resource]
  if (!table) {
    return {
      provider: input.provider,
      resource: input.resource,
      status: 'skipped',
      rows: [],
      skippedRows: input.rows.length,
      message: `Recurso ${input.resource} nao possui tabela normalized v1.`,
    }
  }

  const rows: NormalizedRow[] = input.rows.map((row, index) => {
    const payload = unwrapPayload(row)
    const next = {
      ...base(input, table, row, payload, index),
      ...fieldsFor(table, payload),
    }
    const { _insert_id, ...data } = next
    return { table, insertId: String(_insert_id), data }
  })

  return {
    provider: input.provider,
    resource: input.resource,
    status: 'normalized',
    tables: [table],
    rows,
    skippedRows: 0,
  }
}
