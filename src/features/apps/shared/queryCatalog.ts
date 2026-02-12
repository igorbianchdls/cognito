export type AppsTableName =
  | 'vendas.pedidos'
  | 'compras.compras'
  | 'compras.recebimentos'
  | 'financeiro.contas_pagar'
  | 'financeiro.contas_receber'
export type AppsModule = 'vendas' | 'compras' | 'financeiro'

export type AppsMetricFormat = 'currency' | 'number' | 'percent'
export type AppsDimensionKind = 'attribute' | 'time'
export type AppsFilterType = 'id' | 'string' | 'enum' | 'number' | 'date'
export type AppsFilterOperator = 'eq' | 'in' | 'contains' | 'gte' | 'lte' | 'between'
export type AppsTimeGrain = 'day' | 'week' | 'month' | 'quarter' | 'year'

export type AppsMetricDefinition = {
  id: string
  label: string
  description?: string
  format?: AppsMetricFormat
  legacyMeasures: string[]
}

export type AppsDimensionDefinition = {
  id: string
  label: string
  kind: AppsDimensionKind
  description?: string
  legacyDimension?: string
  legacyDimensionExprByGrain?: Partial<Record<AppsTimeGrain, string>>
}

export type AppsFilterDefinition = {
  field: string
  label: string
  type: AppsFilterType
  operators: AppsFilterOperator[]
}

export type AppsTableCatalog = {
  table: AppsTableName
  module: AppsModule
  description: string
  aliases?: string[]
  metrics: AppsMetricDefinition[]
  dimensions: AppsDimensionDefinition[]
  defaultTimeField?: string
  filters: AppsFilterDefinition[]
}

const MONTH_EXPR_PEDIDO = "TO_CHAR(DATE_TRUNC('month', data_pedido), 'YYYY-MM')"
const MONTH_EXPR_EMISSAO_ALIAS = "TO_CHAR(DATE_TRUNC('month', data_emissao), 'YYYY-MM')"
const MONTH_EXPR_VENCIMENTO = "TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM')"
const MONTH_EXPR_RECEBIMENTO = "TO_CHAR(DATE_TRUNC('month', data_recebimento), 'YYYY-MM')"

export const APPS_QUERY_CATALOG: Record<AppsTableName, AppsTableCatalog> = {
  'vendas.pedidos': {
    table: 'vendas.pedidos',
    module: 'vendas',
    description: 'Pedidos de venda (cabecalho + itens).',
    aliases: ['vendas-pedidos', 'vendas_pedidos'],
    metrics: [
      {
        id: 'faturamento',
        label: 'Faturamento',
        format: 'currency',
        description: 'Soma de subtotal dos itens (mais seguro para analises por dimensao).',
        legacyMeasures: ['SUM(itens.subtotal)', 'SUM(pi.subtotal)', 'SUM(subtotal)'],
      },
      {
        id: 'faturamento_pedido',
        label: 'Faturamento Pedido',
        format: 'currency',
        description: 'Soma de valor_total do pedido (usar preferencialmente em KPI sem dimensao).',
        legacyMeasures: ['SUM(p.valor_total)', 'SUM(valor_total)'],
      },
      {
        id: 'pedidos',
        label: 'Pedidos',
        format: 'number',
        legacyMeasures: ['COUNT()'],
      },
      {
        id: 'ticket_medio',
        label: 'Ticket Medio',
        format: 'currency',
        legacyMeasures: ['AVG(p.valor_total)', 'AVG(valor_total)'],
      },
    ],
    dimensions: [
      { id: 'cliente', label: 'Cliente', kind: 'attribute', legacyDimension: 'cliente' },
      { id: 'canal_venda', label: 'Canal de Venda', kind: 'attribute', legacyDimension: 'canal_venda' },
      { id: 'vendedor', label: 'Vendedor', kind: 'attribute', legacyDimension: 'vendedor' },
      { id: 'filial', label: 'Filial', kind: 'attribute', legacyDimension: 'filial' },
      { id: 'unidade_negocio', label: 'Unidade de Negocio', kind: 'attribute', legacyDimension: 'unidade_negocio' },
      { id: 'categoria_receita', label: 'Categoria de Receita', kind: 'attribute', legacyDimension: 'categoria_receita' },
      { id: 'territorio', label: 'Territorio', kind: 'attribute', legacyDimension: 'territorio' },
      {
        id: 'periodo',
        label: 'Periodo',
        kind: 'time',
        legacyDimension: 'periodo',
        legacyDimensionExprByGrain: {
          month: MONTH_EXPR_PEDIDO,
        },
      },
    ],
    defaultTimeField: 'data_pedido',
    filters: [
      { field: 'tenant_id', label: 'Tenant', type: 'id', operators: ['eq'] },
      { field: 'de', label: 'Data Inicial', type: 'date', operators: ['gte'] },
      { field: 'ate', label: 'Data Final', type: 'date', operators: ['lte'] },
      { field: 'status', label: 'Status', type: 'enum', operators: ['eq', 'in'] },
      { field: 'valor_min', label: 'Valor Minimo', type: 'number', operators: ['gte'] },
      { field: 'valor_max', label: 'Valor Maximo', type: 'number', operators: ['lte'] },
      { field: 'cliente_id', label: 'Cliente', type: 'id', operators: ['eq', 'in'] },
      { field: 'vendedor_id', label: 'Vendedor', type: 'id', operators: ['eq', 'in'] },
      { field: 'canal_venda_id', label: 'Canal de Venda', type: 'id', operators: ['eq', 'in'] },
      { field: 'filial_id', label: 'Filial', type: 'id', operators: ['eq', 'in'] },
      { field: 'unidade_negocio_id', label: 'Unidade de Negocio', type: 'id', operators: ['eq', 'in'] },
      { field: 'territorio_id', label: 'Territorio', type: 'id', operators: ['eq', 'in'] },
      { field: 'categoria_receita_id', label: 'Categoria de Receita', type: 'id', operators: ['eq', 'in'] },
      { field: 'centro_lucro_id', label: 'Centro de Lucro', type: 'id', operators: ['eq', 'in'] },
    ],
  },
  'compras.compras': {
    table: 'compras.compras',
    module: 'compras',
    description: 'Pedidos de compra.',
    aliases: ['compras-compras', 'compras_compras'],
    metrics: [
      {
        id: 'gasto_total',
        label: 'Gasto Total',
        format: 'currency',
        legacyMeasures: ['SUM(c.valor_total)', 'SUM(valor_total)'],
      },
      {
        id: 'ticket_medio',
        label: 'Ticket Medio',
        format: 'currency',
        legacyMeasures: ['AVG(c.valor_total)', 'AVG(valor_total)'],
      },
      {
        id: 'pedidos',
        label: 'Pedidos',
        format: 'number',
        legacyMeasures: ['COUNT()', 'COUNT_DISTINCT(c.id)', 'COUNT_DISTINCT(id)'],
      },
      {
        id: 'fornecedores_unicos',
        label: 'Fornecedores Unicos',
        format: 'number',
        legacyMeasures: ['COUNT_DISTINCT(c.fornecedor_id)', 'COUNT_DISTINCT(fornecedor_id)'],
      },
    ],
    dimensions: [
      { id: 'fornecedor', label: 'Fornecedor', kind: 'attribute', legacyDimension: 'fornecedor' },
      { id: 'centro_custo', label: 'Centro de Custo', kind: 'attribute', legacyDimension: 'centro_custo' },
      { id: 'filial', label: 'Filial', kind: 'attribute', legacyDimension: 'filial' },
      { id: 'projeto', label: 'Projeto', kind: 'attribute', legacyDimension: 'projeto' },
      { id: 'categoria_despesa', label: 'Categoria de Despesa', kind: 'attribute', legacyDimension: 'categoria_despesa' },
      { id: 'status', label: 'Status', kind: 'attribute', legacyDimension: 'status' },
      {
        id: 'periodo',
        label: 'Periodo',
        kind: 'time',
        legacyDimension: 'periodo',
        legacyDimensionExprByGrain: {
          month: MONTH_EXPR_PEDIDO,
        },
      },
    ],
    defaultTimeField: 'data_pedido',
    filters: [
      { field: 'tenant_id', label: 'Tenant', type: 'id', operators: ['eq'] },
      { field: 'de', label: 'Data Inicial', type: 'date', operators: ['gte'] },
      { field: 'ate', label: 'Data Final', type: 'date', operators: ['lte'] },
      { field: 'status', label: 'Status', type: 'enum', operators: ['eq', 'in'] },
      { field: 'fornecedor_id', label: 'Fornecedor', type: 'id', operators: ['eq', 'in'] },
      { field: 'filial_id', label: 'Filial', type: 'id', operators: ['eq', 'in'] },
      { field: 'centro_custo_id', label: 'Centro de Custo', type: 'id', operators: ['eq', 'in'] },
      { field: 'categoria_despesa_id', label: 'Categoria de Despesa', type: 'id', operators: ['eq', 'in'] },
      { field: 'valor_min', label: 'Valor Minimo', type: 'number', operators: ['gte'] },
      { field: 'valor_max', label: 'Valor Maximo', type: 'number', operators: ['lte'] },
    ],
  },
  'compras.recebimentos': {
    table: 'compras.recebimentos',
    module: 'compras',
    description: 'Recebimentos de compras.',
    aliases: ['compras-recebimentos', 'compras_recebimentos'],
    metrics: [
      {
        id: 'transacoes',
        label: 'Transacoes',
        format: 'number',
        legacyMeasures: ['COUNT()'],
      },
    ],
    dimensions: [
      { id: 'status', label: 'Status', kind: 'attribute', legacyDimension: 'status' },
      {
        id: 'periodo',
        label: 'Periodo',
        kind: 'time',
        legacyDimension: 'periodo',
        legacyDimensionExprByGrain: {
          month: MONTH_EXPR_RECEBIMENTO,
        },
      },
    ],
    defaultTimeField: 'data_recebimento',
    filters: [
      { field: 'tenant_id', label: 'Tenant', type: 'id', operators: ['eq'] },
      { field: 'de', label: 'Data Inicial', type: 'date', operators: ['gte'] },
      { field: 'ate', label: 'Data Final', type: 'date', operators: ['lte'] },
      { field: 'status', label: 'Status', type: 'enum', operators: ['eq', 'in'] },
    ],
  },
  'financeiro.contas_pagar': {
    table: 'financeiro.contas_pagar',
    module: 'financeiro',
    description: 'Titulos de contas a pagar.',
    aliases: ['financeiro-contas-pagar', 'financeiro_contas_pagar', 'financeiro.contas-a-pagar'],
    metrics: [
      {
        id: 'valor_total',
        label: 'Valor Total',
        format: 'currency',
        legacyMeasures: ['SUM(valor_liquido)', 'SUM(valor)'],
      },
      {
        id: 'titulos',
        label: 'Titulos',
        format: 'number',
        legacyMeasures: ['COUNT()'],
      },
    ],
    dimensions: [
      { id: 'fornecedor', label: 'Fornecedor', kind: 'attribute', legacyDimension: 'fornecedor' },
      { id: 'centro_custo', label: 'Centro de Custo', kind: 'attribute', legacyDimension: 'centro_custo' },
      { id: 'departamento', label: 'Departamento', kind: 'attribute', legacyDimension: 'departamento' },
      { id: 'unidade_negocio', label: 'Unidade de Negocio', kind: 'attribute', legacyDimension: 'unidade_negocio' },
      { id: 'filial', label: 'Filial', kind: 'attribute', legacyDimension: 'filial' },
      { id: 'projeto', label: 'Projeto', kind: 'attribute', legacyDimension: 'projeto' },
      { id: 'categoria_despesa', label: 'Categoria de Despesa', kind: 'attribute', legacyDimension: 'categoria_despesa' },
      { id: 'categoria', label: 'Categoria', kind: 'attribute', legacyDimension: 'categoria' },
      { id: 'status', label: 'Status', kind: 'attribute', legacyDimension: 'status' },
      { id: 'titulo', label: 'Titulo', kind: 'attribute', legacyDimension: 'titulo' },
      {
        id: 'periodo',
        label: 'Periodo',
        kind: 'time',
        legacyDimension: 'periodo',
        legacyDimensionExprByGrain: {
          month: MONTH_EXPR_VENCIMENTO,
        },
      },
    ],
    defaultTimeField: 'data_vencimento',
    filters: [
      { field: 'tenant_id', label: 'Tenant', type: 'id', operators: ['eq'] },
      { field: 'de', label: 'Data Inicial', type: 'date', operators: ['gte'] },
      { field: 'ate', label: 'Data Final', type: 'date', operators: ['lte'] },
      { field: 'status', label: 'Status', type: 'enum', operators: ['eq', 'in'] },
      { field: 'fornecedor_id', label: 'Fornecedor', type: 'id', operators: ['eq', 'in'] },
      { field: 'categoria_despesa_id', label: 'Categoria de Despesa', type: 'id', operators: ['eq', 'in'] },
      { field: 'centro_custo_id', label: 'Centro de Custo', type: 'id', operators: ['eq', 'in'] },
      { field: 'departamento_id', label: 'Departamento', type: 'id', operators: ['eq', 'in'] },
      { field: 'unidade_negocio_id', label: 'Unidade de Negocio', type: 'id', operators: ['eq', 'in'] },
      { field: 'filial_id', label: 'Filial', type: 'id', operators: ['eq', 'in'] },
      { field: 'projeto_id', label: 'Projeto', type: 'id', operators: ['eq', 'in'] },
      { field: 'numero_documento', label: 'Numero Documento', type: 'string', operators: ['contains'] },
      { field: 'valor_min', label: 'Valor Minimo', type: 'number', operators: ['gte'] },
      { field: 'valor_max', label: 'Valor Maximo', type: 'number', operators: ['lte'] },
    ],
  },
  'financeiro.contas_receber': {
    table: 'financeiro.contas_receber',
    module: 'financeiro',
    description: 'Titulos de contas a receber.',
    aliases: ['financeiro-contas-receber', 'financeiro_contas_receber', 'financeiro.contas-a-receber'],
    metrics: [
      {
        id: 'valor_total',
        label: 'Valor Total',
        format: 'currency',
        legacyMeasures: ['SUM(valor_liquido)', 'SUM(valor)'],
      },
      {
        id: 'titulos',
        label: 'Titulos',
        format: 'number',
        legacyMeasures: ['COUNT()'],
      },
    ],
    dimensions: [
      { id: 'cliente', label: 'Cliente', kind: 'attribute', legacyDimension: 'cliente' },
      { id: 'centro_lucro', label: 'Centro de Lucro', kind: 'attribute', legacyDimension: 'centro_lucro' },
      { id: 'departamento', label: 'Departamento', kind: 'attribute', legacyDimension: 'departamento' },
      { id: 'unidade_negocio', label: 'Unidade de Negocio', kind: 'attribute', legacyDimension: 'unidade_negocio' },
      { id: 'filial', label: 'Filial', kind: 'attribute', legacyDimension: 'filial' },
      { id: 'projeto', label: 'Projeto', kind: 'attribute', legacyDimension: 'projeto' },
      { id: 'categoria_receita', label: 'Categoria de Receita', kind: 'attribute', legacyDimension: 'categoria_receita' },
      { id: 'categoria', label: 'Categoria', kind: 'attribute', legacyDimension: 'categoria' },
      { id: 'status', label: 'Status', kind: 'attribute', legacyDimension: 'status' },
      { id: 'titulo', label: 'Titulo', kind: 'attribute', legacyDimension: 'titulo' },
      {
        id: 'periodo',
        label: 'Periodo',
        kind: 'time',
        legacyDimension: 'periodo',
        legacyDimensionExprByGrain: {
          month: MONTH_EXPR_VENCIMENTO,
        },
      },
    ],
    defaultTimeField: 'data_vencimento',
    filters: [
      { field: 'tenant_id', label: 'Tenant', type: 'id', operators: ['eq'] },
      { field: 'de', label: 'Data Inicial', type: 'date', operators: ['gte'] },
      { field: 'ate', label: 'Data Final', type: 'date', operators: ['lte'] },
      { field: 'status', label: 'Status', type: 'enum', operators: ['eq', 'in'] },
      { field: 'cliente_id', label: 'Cliente', type: 'id', operators: ['eq', 'in'] },
      { field: 'categoria_receita_id', label: 'Categoria de Receita', type: 'id', operators: ['eq', 'in'] },
      { field: 'centro_lucro_id', label: 'Centro de Lucro', type: 'id', operators: ['eq', 'in'] },
      { field: 'departamento_id', label: 'Departamento', type: 'id', operators: ['eq', 'in'] },
      { field: 'unidade_negocio_id', label: 'Unidade de Negocio', type: 'id', operators: ['eq', 'in'] },
      { field: 'filial_id', label: 'Filial', type: 'id', operators: ['eq', 'in'] },
      { field: 'projeto_id', label: 'Projeto', type: 'id', operators: ['eq', 'in'] },
      { field: 'numero_documento', label: 'Numero Documento', type: 'string', operators: ['contains'] },
      { field: 'valor_min', label: 'Valor Minimo', type: 'number', operators: ['gte'] },
      { field: 'valor_max', label: 'Valor Maximo', type: 'number', operators: ['lte'] },
    ],
  },
}

export const APPS_QUERY_TABLES = Object.keys(APPS_QUERY_CATALOG) as AppsTableName[]

const APPS_TABLE_ALIAS_TO_CANONICAL: Record<string, AppsTableName> = (() => {
  const out: Record<string, AppsTableName> = {}
  for (const table of APPS_QUERY_TABLES) {
    out[table] = table
    out[table.replace(/\./g, '_')] = table
    out[table.replace(/\./g, '-')] = table
    const aliases = APPS_QUERY_CATALOG[table].aliases || []
    for (const alias of aliases) {
      out[alias] = table
    }
  }
  return out
})()

function normalizeTableLikeInput(input?: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\//g, '.')
}

export function normalizeAppsTableName(input?: string): AppsTableName | null {
  const raw = normalizeTableLikeInput(input)
  if (!raw) return null
  const normalized = raw.replace(/-/g, '_')
  if (normalized in APPS_QUERY_CATALOG) {
    return normalized as AppsTableName
  }
  const aliasMatch = APPS_TABLE_ALIAS_TO_CANONICAL[raw] || APPS_TABLE_ALIAS_TO_CANONICAL[normalized]
  if (aliasMatch) {
    return aliasMatch
  }
  return null
}

export function getAppsTableCatalog(tableOrModel?: string): AppsTableCatalog | null {
  const key = normalizeAppsTableName(tableOrModel)
  if (!key) return null
  return APPS_QUERY_CATALOG[key]
}

export function listAppsMetrics(tableOrModel?: string): AppsMetricDefinition[] {
  return getAppsTableCatalog(tableOrModel)?.metrics || []
}

export function listAppsDimensions(tableOrModel?: string): AppsDimensionDefinition[] {
  return getAppsTableCatalog(tableOrModel)?.dimensions || []
}

export function listAppsFilters(tableOrModel?: string): AppsFilterDefinition[] {
  return getAppsTableCatalog(tableOrModel)?.filters || []
}

export function listAppsTableCatalogs(module?: AppsModule): AppsTableCatalog[] {
  if (!module) return APPS_QUERY_TABLES.map((table) => APPS_QUERY_CATALOG[table])
  return APPS_QUERY_TABLES.map((table) => APPS_QUERY_CATALOG[table]).filter((entry) => entry.module === module)
}

export function toLegacyModel(table: AppsTableName): string {
  return table.replace(/_/g, '-')
}

export const APPS_QUERY_COMPAT_HINTS = {
  comprasPeriodoExpr: [MONTH_EXPR_PEDIDO, MONTH_EXPR_EMISSAO_ALIAS],
}
