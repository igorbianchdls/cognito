export type NormalizedTableName =
  | 'clientes'
  | 'fornecedores'
  | 'produtos'
  | 'servicos'
  | 'contas_receber'
  | 'contas_pagar'
  | 'vendas'
  | 'contratos'
  | 'itens_venda'
  | 'venda_detalhes'
  | 'notas_fiscais'
  | 'notas_fiscais_servico'
  | 'categorias'
  | 'centros_custo'
  | 'contas_financeiras'
  | 'transferencias'
  | 'estoque_atual'
  | 'compras'
  | 'parcelas_venda'
  | 'vendedores'
  | 'variacoes'
  | 'marcas'
  | 'notas_consumidor'
  | 'expedicoes'
  | 'separacoes'
  | 'estoque_movimentacoes'
  | 'listas_preco'
  | 'formas_envio'
  | 'formas_pagamento'
  | 'intermediadores'
  | 'empresa_conectada'
  | 'uso_api'
  | 'gatilhos'
  | 'contas'
  | 'contatos'
  | 'leads'
  | 'oportunidades'
  | 'atividades'
  | 'usuarios'
  | 'pipelines'
  | 'fases_pipeline'

export type NormalizationInput = {
  tenantId: number
  connectionId: string
  provider: string
  resource: string
  runId?: string | null
  sourceTable: string
  rows: Record<string, unknown>[]
}

export type NormalizedRow = {
  table: NormalizedTableName
  insertId: string
  data: Record<string, unknown>
}

export type NormalizationResult = {
  provider: string
  resource: string
  status: 'normalized' | 'skipped'
  tables?: NormalizedTableName[]
  rows: NormalizedRow[]
  skippedRows: number
  message?: string
}

export type Normalizer = {
  provider: string
  normalize: (input: NormalizationInput) => NormalizationResult
}
