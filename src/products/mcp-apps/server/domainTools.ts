import { runQuery } from '@/lib/postgres'
import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/mcp-apps/server/appResources'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'
import type { McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'

type JsonRecord = Record<string, unknown>

type DomainToolDefinition = {
  name: string
  title: string
  description: string
  inputSchema: McpToolInputSchema
  outputSchema: McpToolInputSchema
  securitySchemes: readonly Record<string, unknown>[]
  annotations: Record<string, unknown>
  _meta: Record<string, unknown>
}

type ChartConfig = {
  xField: string
  valueField: string
  xLabel: string | null
  yLabel: string | null
}

type BuiltQuery = {
  sql: string
  params: unknown[]
  title: string
  chart: ChartConfig | null
}

type EcommerceAction =
  | 'kpis_resumo'
  | 'vendas_por_canal'
  | 'pedidos_por_status'
  | 'faturamento_por_mes'
  | 'top_produtos_receita'
  | 'frete_por_transportadora'

type MarketingAction =
  | 'kpis_resumo'
  | 'desempenho_diario'
  | 'gasto_por_campanha'
  | 'roas_por_campanha'
  | 'gasto_por_conta'
  | 'top_anuncios'

type CrudAction = 'listar' | 'ler'

type SqlExecutionAction = 'execute'

const READ_SECURITY_SCHEMES = [
  {
    type: 'oauth2',
    scopes: ['dashboards:read'],
  },
] as const

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} as const

const TOOL_META = {
  securitySchemes: READ_SECURITY_SCHEMES,
  ui: {
    resourceUri: DASHBOARD_WIDGET_RESOURCE_URI,
    visibility: ['model', 'app'],
  },
} as const

const ACTION_PARAMS_SCHEMA = {
  type: 'object',
  properties: {
    de: {
      type: 'string',
      description: 'Data inicial no formato YYYY-MM-DD.',
    },
    ate: {
      type: 'string',
      description: 'Data final no formato YYYY-MM-DD.',
    },
    limit: {
      type: 'integer',
      description: 'Limite de linhas. Maximo 200.',
    },
  },
  additionalProperties: true,
} as const

const ECOMMERCE_PARAMS_SCHEMA = {
  type: 'object',
  properties: {
    ...ACTION_PARAMS_SCHEMA.properties,
    plataforma: {
      type: 'string',
      enum: ['shopify', 'shopee', 'amazon', 'mercadolivre'],
      description:
        'Filtro por plataforma/canal de ecommerce. Use shopify, shopee, amazon ou mercadolivre quando a pergunta mencionar uma plataforma especifica.',
    },
    canal_conta_id: {
      type: 'string',
      description: 'ID interno da conta/canal conectado. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    loja_id: {
      type: 'string',
      description: 'ID interno da loja. Use somente quando o usuario informar ou quando ja tiver sido consultado antes.',
    },
    status: {
      type: 'string',
      description: 'Filtro pelo status do pedido.',
    },
    status_pagamento: {
      type: 'string',
      description: 'Filtro pelo status de pagamento do pedido.',
    },
    status_fulfillment: {
      type: 'string',
      description: 'Filtro pelo status logistico/fulfillment do pedido.',
    },
  },
  additionalProperties: true,
} as const

const METRICS_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    action: { type: 'string' },
    title: { type: 'string' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
    },
    count: { type: 'integer' },
    chart: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['success', 'tool', 'action', 'title', 'rows', 'columns', 'count'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ERP_RESOURCE_TABLES = {
  'financeiro/contas-financeiras': 'financeiro.contas_financeiras',
  'financeiro/categorias-despesa': 'financeiro.categorias_despesa',
  'financeiro/categorias-receita': 'financeiro.categorias_receita',
  'financeiro/clientes': 'entidades.clientes',
  'financeiro/centros-custo': 'empresa.centros_custo',
  'financeiro/centros-lucro': 'empresa.centros_lucro',
  'vendas/pedidos': 'vendas.pedidos',
  'compras/pedidos': 'compras.compras',
  'contas-a-pagar': 'financeiro.contas_pagar',
  'contas-a-receber': 'financeiro.contas_receber',
  'estoque/almoxarifados': 'estoque.almoxarifados',
  'estoque/movimentacoes': 'estoque.movimentacoes_estoque',
  'estoque/estoque-atual': 'estoque.estoques_atual',
  'estoque/tipos-movimentacao': 'estoque.tipos_movimentacao',
} as const

const CRM_RESOURCE_TABLES = {
  'crm/contas': 'crm.contas',
  'crm/contatos': 'crm.contatos',
  'crm/leads': 'crm.leads',
  'crm/oportunidades': 'crm.oportunidades',
  'crm/atividades': 'crm.atividades',
} as const

const CRUD_RESOURCE_TABLES = {
  ...ERP_RESOURCE_TABLES,
  ...CRM_RESOURCE_TABLES,
} as const

const ERP_ALLOWED_RESOURCES = Object.keys(ERP_RESOURCE_TABLES)
const CRM_ALLOWED_RESOURCES = Object.keys(CRM_RESOURCE_TABLES)

function createCrudSchema(allowedResources: string[], description: string) {
  return {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['listar', 'ler'],
        description: 'Use listar para consultar registros e ler para buscar um registro especifico por params.id.',
      },
      resource: {
        type: 'string',
        enum: allowedResources,
        description,
      },
      params: {
        type: 'object',
        description:
          'Filtros de leitura. Suporta id, q, limit, offset, de, ate, status, valor_min, valor_max e filtros *_id quando forem necessarios internamente. A resposta prioriza nomes e descricoes de negocio, nao IDs: cliente, fornecedor, vendedor, canal, fase, produto, almoxarifado, categoria e centro.',
        additionalProperties: true,
      },
    },
    required: ['action', 'resource'],
    additionalProperties: true,
  } as const satisfies McpToolInputSchema
}

const ERP_CRUD_SCHEMA = createCrudSchema(
  ERP_ALLOWED_RESOURCES,
  'Resource canonico do ERP. Exemplos comuns: contas-a-pagar, contas-a-receber, vendas/pedidos, compras/pedidos, financeiro/clientes, estoque/estoque-atual.',
)

const CRM_SCHEMA = createCrudSchema(
  CRM_ALLOWED_RESOURCES,
  'Resource canonico do CRM. Use crm/contas, crm/contatos, crm/leads, crm/oportunidades ou crm/atividades.',
)

const CRUD_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    tool: { type: 'string' },
    action: { type: 'string' },
    resource: { type: 'string' },
    title: { type: 'string' },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
    },
    count: { type: 'integer' },
  },
  required: ['success', 'tool', 'action', 'resource', 'title', 'rows', 'columns', 'count'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const SQL_EXECUTION_SCHEMA = {
  type: 'object',
  properties: {
    sql: {
      type: 'string',
      description:
        'SQL de leitura para analises ad-hoc. Aceita somente SELECT ou WITH, uma unica instrucao, sem comandos de escrita e sem placeholders $1/$2. Use {{tenant_id}} quando precisar filtrar por tenant.',
    },
    title: {
      type: 'string',
      description: 'Titulo opcional do resultado.',
    },
    chart: {
      type: 'object',
      description: 'Config opcional para renderizar grafico simples: xField, valueField, xLabel, yLabel.',
      properties: {
        xField: { type: 'string' },
        valueField: { type: 'string' },
        xLabel: { type: 'string' },
        yLabel: { type: 'string' },
      },
      additionalProperties: true,
    },
  },
  required: ['sql'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ECOMMERCE_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [
        'kpis_resumo',
        'vendas_por_canal',
        'pedidos_por_status',
        'faturamento_por_mes',
        'top_produtos_receita',
        'frete_por_transportadora',
      ],
      description:
        'Metrica canonica de ecommerce. Use kpis_resumo para visao geral; vendas_por_canal, pedidos_por_status, faturamento_por_mes, top_produtos_receita ou frete_por_transportadora para cortes analiticos.',
    },
    params: ECOMMERCE_PARAMS_SCHEMA,
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const MARKETING_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [
        'kpis_resumo',
        'desempenho_diario',
        'gasto_por_campanha',
        'roas_por_campanha',
        'gasto_por_conta',
        'top_anuncios',
      ],
      description:
        'Metrica canonica de marketing/trafego pago. Use kpis_resumo para visao geral; desempenho_diario, gasto_por_campanha, roas_por_campanha, gasto_por_conta ou top_anuncios para cortes analiticos.',
    },
    params: ACTION_PARAMS_SCHEMA,
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const MCP_APP_DOMAIN_TOOL_NAMES = {
  erp: 'erp',
  crm: 'crm',
  sql: 'sql',
  sqlExecution: 'sql_execution',
  ecommerce: 'ecommerce',
  marketing: 'marketing',
} as const

function isEnvEnabled(name: string) {
  const value = String(process.env[name] || '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

const ERP_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.erp,
  title: 'ERP',
  description:
    'Consulta registros operacionais do ERP em modo leitura. Use para financeiro, vendas, compras e estoque. Acoes suportadas: listar e ler. Recursos principais retornam colunas de negocio com nomes resolvidos por join, sem expor IDs internos na tabela: contas-a-pagar, contas-a-receber, vendas/pedidos, compras/pedidos, estoque/estoque-atual e estoque/movimentacoes.',
  inputSchema: ERP_CRUD_SCHEMA,
  outputSchema: CRUD_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const CRM_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.crm,
  title: 'CRM',
  description:
    'Consulta registros operacionais do CRM em modo leitura. Use para contas, contatos, leads, oportunidades e atividades. Acoes suportadas: listar e ler. Recursos principais retornam colunas de negocio com nomes resolvidos por join, sem expor IDs internos na tabela: crm/leads e crm/oportunidades.',
  inputSchema: CRM_SCHEMA,
  outputSchema: CRUD_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const ECOMMERCE_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.ecommerce,
  title: 'Ecommerce metrics',
  description:
    'Retorna metricas prontas de ecommerce sem SQL livre. Use para perguntas sobre pedidos, receita, ticket medio, canais, status, faturamento mensal, produtos e frete.',
  inputSchema: ECOMMERCE_SCHEMA,
  outputSchema: METRICS_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const SQL_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.sql,
  title: 'SQL',
  description:
    'Executa SQL analitico ad-hoc em modo leitura. Use quando erp/ecommerce/marketing nao cobrirem a pergunta. Aceita apenas SELECT ou WITH, uma unica instrucao, sem escrita; use {{tenant_id}} para bind automatico de tenant.',
  inputSchema: SQL_EXECUTION_SCHEMA,
  outputSchema: METRICS_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

const MARKETING_DOMAIN_TOOL_DEFINITION = {
  name: MCP_APP_DOMAIN_TOOL_NAMES.marketing,
  title: 'Marketing metrics',
  description:
    'Retorna metricas prontas de marketing/trafego pago sem SQL livre. Use para perguntas sobre gasto, receita atribuida, ROAS, cliques, impressoes, conversoes, campanhas, contas, anuncios e desempenho diario.',
  inputSchema: MARKETING_SCHEMA,
  outputSchema: METRICS_OUTPUT_SCHEMA,
  securitySchemes: READ_SECURITY_SCHEMES,
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: TOOL_META,
} as const satisfies DomainToolDefinition

export function listMcpAppDomainToolDefinitions() {
  return [
    ERP_DOMAIN_TOOL_DEFINITION,
    CRM_DOMAIN_TOOL_DEFINITION,
    ECOMMERCE_DOMAIN_TOOL_DEFINITION,
    SQL_DOMAIN_TOOL_DEFINITION,
    MARKETING_DOMAIN_TOOL_DEFINITION,
  ]
}

export const MCP_APP_DOMAIN_TOOL_DEFINITIONS = [
  ERP_DOMAIN_TOOL_DEFINITION,
  CRM_DOMAIN_TOOL_DEFINITION,
  ECOMMERCE_DOMAIN_TOOL_DEFINITION,
  MARKETING_DOMAIN_TOOL_DEFINITION,
] as const satisfies readonly DomainToolDefinition[]

const MCP_APP_DOMAIN_TOOL_NAME_SET = new Set<string>(
  Object.values(MCP_APP_DOMAIN_TOOL_NAMES),
)

function toObj(input: unknown): JsonRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonRecord
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(toText(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeDate(value: unknown): string | null {
  const out = toText(value)
  if (!out) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) {
    throw new Error(`Data invalida: ${out}. Use formato YYYY-MM-DD.`)
  }
  return out
}

function normalizeLimit(value: unknown, fallback: number) {
  return Math.min(toPositiveInt(value, fallback), 200)
}

function inferColumns(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function getTenantId(context: CognitoMcpServerContext) {
  return context.tenantId && context.tenantId > 0 ? context.tenantId : 1
}

function normalizeEcommerceAction(value: unknown): EcommerceAction {
  const out = toText(value).toLowerCase()
  if (
    out === 'kpis_resumo' ||
    out === 'vendas_por_canal' ||
    out === 'pedidos_por_status' ||
    out === 'faturamento_por_mes' ||
    out === 'top_produtos_receita' ||
    out === 'frete_por_transportadora'
  ) {
    return out
  }
  throw new Error('action invalida para ecommerce')
}

function normalizeMarketingAction(value: unknown): MarketingAction {
  const out = toText(value).toLowerCase()
  if (
    out === 'kpis_resumo' ||
    out === 'desempenho_diario' ||
    out === 'gasto_por_campanha' ||
    out === 'roas_por_campanha' ||
    out === 'gasto_por_conta' ||
    out === 'top_anuncios'
  ) {
    return out
  }
  throw new Error('action invalida para marketing')
}

function normalizeCrudAction(value: unknown): CrudAction {
  const out = toText(value).toLowerCase()
  if (out === 'listar' || out === 'list') return 'listar'
  if (out === 'ler' || out === 'read' || out === 'get') return 'ler'
  throw new Error('action invalida para crud. Use listar ou ler.')
}

function normalizeAndAssertSafeSelectQuery(sql: string) {
  const cleaned = sql.trim().replace(/;+\s*$/g, '')
  if (!cleaned) throw new Error('sql vazio')
  if (cleaned.includes(';')) throw new Error('apenas uma query e permitida')
  if (/\$\d+/.test(cleaned)) {
    throw new Error('placeholders posicionais ($1, $2, ...) nao sao permitidos; use SQL literal ou {{tenant_id}}')
  }
  if (!/^\s*(select|with)\b/i.test(cleaned)) throw new Error('somente SELECT/CTE (WITH) e permitido')

  const blocked =
    /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|vacuum|call|do|copy|merge|execute|prepare|deallocate)\b/i
  if (blocked.test(cleaned)) throw new Error('sql contem comando nao permitido')

  return cleaned
}

function bindTenantParam(sql: string, tenantId: number) {
  const params: unknown[] = []
  let tenantParamIndex = 0
  const compiled = sql.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, rawName: string) => {
    const name = String(rawName || '').trim().toLowerCase()
    if (name !== 'tenant_id') {
      throw new Error(`placeholder nao suportado: {{${rawName}}}. Use apenas {{tenant_id}} nesta tool`)
    }
    if (tenantParamIndex > 0) return `$${tenantParamIndex}`
    params.push(tenantId)
    tenantParamIndex = params.length
    return `$${tenantParamIndex}`
  })
  return { sql: compiled, params }
}

function parseChartConfig(rawChart: unknown): ChartConfig | null {
  if (rawChart == null) return null
  const raw = toObj(rawChart)
  const xField = toText(raw.xField)
  const valueField = toText(raw.valueField)
  if (!xField || !valueField) {
    throw new Error('chart invalido: informe chart.xField e chart.valueField')
  }
  return {
    xField,
    valueField,
    xLabel: toText(raw.xLabel) || null,
    yLabel: toText(raw.yLabel) || null,
  }
}

function assertChartColumns(chart: ChartConfig | null, columns: string[]) {
  if (!chart) return null
  if (!columns.length) return chart

  const missingFields: string[] = []
  if (!columns.includes(chart.xField)) missingFields.push(`xField=${chart.xField}`)
  if (!columns.includes(chart.valueField)) missingFields.push(`valueField=${chart.valueField}`)
  if (missingFields.length) {
    throw new Error(`chart invalido: colunas nao encontradas no resultado (${missingFields.join(', ')})`)
  }
  return chart
}

function buildCommonPedidosFilters(paramsIn: JsonRecord, tenantId: number, alias: string) {
  const params: unknown[] = [tenantId]
  const where: string[] = [`${alias}.tenant_id = $1::int`]

  const de = normalizeDate(paramsIn.de)
  if (de) {
    params.push(de)
    where.push(`${alias}.data_pedido::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate) {
    params.push(ate)
    where.push(`${alias}.data_pedido::date <= $${params.length}::date`)
  }

  for (const field of ['plataforma', 'canal_conta_id', 'loja_id', 'status', 'status_pagamento', 'status_fulfillment']) {
    const value = toText(paramsIn[field])
    if (value) {
      params.push(value)
      const cast = field.endsWith('_id') ? '::text' : ''
      where.push(`${alias}.${field}${cast} = $${params.length}::text`)
    }
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

function buildEcommerceQuery(action: EcommerceAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 12)

  if (action === 'kpis_resumo') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    return {
      sql: `
SELECT
  COUNT(DISTINCT p.id)::int AS pedidos,
  COALESCE(SUM(p.valor_total), 0)::float AS receita_bruta,
  CASE WHEN COUNT(DISTINCT p.id) = 0 THEN 0::float ELSE (COALESCE(SUM(p.valor_total), 0)::float / COUNT(DISTINCT p.id)::float) END AS ticket_medio,
  COUNT(DISTINCT p.cliente_id)::int AS clientes_unicos
FROM ecommerce.pedidos p
${base.whereClause}
      `.trim(),
      params: base.params,
      title: 'Ecommerce - KPIs Resumo',
      chart: null,
    }
  }

  if (action === 'vendas_por_canal') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT COALESCE(p.canal_conta_id::text, '-') AS key, COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text), '-') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
LEFT JOIN ecommerce.canais_contas cc ON cc.id = p.canal_conta_id
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Vendas por Canal',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Canal', yLabel: 'Vendas' },
    }
  }

  if (action === 'pedidos_por_status') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT COALESCE(p.status, '-') AS key, COALESCE(p.status, '-') AS label, COUNT(DISTINCT p.id)::int AS value
FROM ecommerce.pedidos p
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Pedidos por Status',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Status', yLabel: 'Pedidos' },
    }
  }

  if (action === 'faturamento_por_mes') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key, TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
${base.whereClause}
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Faturamento por Mes',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Mes', yLabel: 'Faturamento' },
    }
  }

  if (action === 'top_produtos_receita') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT COALESCE(pi.produto_id::text, '-') AS key, COALESCE(NULLIF(pi.titulo_item, ''), NULLIF(pi.sku, ''), '-') AS label, COALESCE(SUM(pi.valor_total), 0)::float AS value
FROM ecommerce.pedido_itens pi
JOIN ecommerce.pedidos p ON p.id = pi.pedido_id
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Top Produtos por Receita',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Produto', yLabel: 'Receita' },
    }
  }

  const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
  const params = [...base.params, limit]
  return {
    sql: `
SELECT COALESCE(e.transportadora, '-') AS key, COALESCE(e.transportadora, '-') AS label, COALESCE(SUM(e.frete_custo), 0)::float AS value
FROM ecommerce.envios e
JOIN ecommerce.pedidos p ON p.id = e.pedido_id
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
    `.trim(),
    params,
    title: 'Ecommerce - Frete por Transportadora',
    chart: { xField: 'label', valueField: 'value', xLabel: 'Transportadora', yLabel: 'Frete' },
  }
}

function buildMarketingFilters(paramsIn: JsonRecord, tenantId: number, alias: string) {
  const params: unknown[] = [tenantId]
  const where: string[] = [`${alias}.tenant_id = $1::int`]

  const de = normalizeDate(paramsIn.de)
  if (de) {
    params.push(de)
    where.push(`${alias}.data_ref::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate) {
    params.push(ate)
    where.push(`${alias}.data_ref::date <= $${params.length}::date`)
  }

  for (const field of ['plataforma', 'nivel', 'conta_id', 'campanha_id', 'grupo_id', 'anuncio_id']) {
    const value = toText(paramsIn[field])
    if (value) {
      params.push(value)
      const cast = field.endsWith('_id') ? '::text' : ''
      where.push(`${alias}.${field}${cast} = $${params.length}::text`)
    }
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

function buildMarketingQuery(action: MarketingAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 12)
  const base = buildMarketingFilters(paramsIn, tenantId, 'dd')

  if (action === 'kpis_resumo') {
    return {
      sql: `
SELECT
  COALESCE(SUM(dd.gasto), 0)::float AS gasto,
  COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita_atribuida,
  CASE WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0::float ELSE (COALESCE(SUM(dd.receita_atribuida), 0)::float / COALESCE(SUM(dd.gasto), 0)::float) END AS roas,
  COALESCE(SUM(dd.cliques), 0)::int AS cliques,
  COALESCE(SUM(dd.impressoes), 0)::int AS impressoes,
  COALESCE(SUM(dd.conversoes), 0)::int AS conversoes
FROM trafegopago.desempenho_diario dd
${base.whereClause}
      `.trim(),
      params: base.params,
      title: 'Marketing - KPIs Resumo',
      chart: null,
    }
  }

  if (action === 'desempenho_diario') {
    const params = [...base.params, limit]
    return {
      sql: `
SELECT TO_CHAR(dd.data_ref::date, 'YYYY-MM-DD') AS key, TO_CHAR(dd.data_ref::date, 'YYYY-MM-DD') AS label, COALESCE(SUM(dd.gasto), 0)::float AS value, COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita_atribuida
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Marketing - Desempenho Diario',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Dia', yLabel: 'Gasto' },
    }
  }

  const grouping = action === 'gasto_por_conta'
    ? 'conta_id'
    : action === 'top_anuncios'
      ? 'anuncio_id'
      : 'campanha_id'
  const metric = action === 'roas_por_campanha'
    ? "CASE WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0::float ELSE (COALESCE(SUM(dd.receita_atribuida), 0)::float / COALESCE(SUM(dd.gasto), 0)::float) END"
    : 'COALESCE(SUM(dd.gasto), 0)::float'
  const params = [...base.params, limit]
  return {
    sql: `
SELECT COALESCE(dd.${grouping}::text, '-') AS key, COALESCE(dd.${grouping}::text, '-') AS label, ${metric} AS value
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
    `.trim(),
    params,
    title: action === 'roas_por_campanha'
      ? 'Marketing - ROAS por Campanha'
      : action === 'gasto_por_conta'
        ? 'Marketing - Gasto por Conta'
        : action === 'top_anuncios'
          ? 'Marketing - Top Anuncios por Gasto'
          : 'Marketing - Gasto por Campanha',
    chart: { xField: 'label', valueField: 'value', xLabel: grouping, yLabel: action === 'roas_por_campanha' ? 'ROAS' : 'Gasto' },
  }
}

async function executeBuiltQuery(tool: 'ecommerce' | 'marketing', action: string, built: BuiltQuery) {
  const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
  const columns = inferColumns(rows)
  const structuredContent = {
    success: true,
    tool,
    action,
    title: built.title,
    rows,
    columns,
    count: rows.length,
    chart: built.chart,
    sql_query: built.sql,
    sql_params: built.params,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

function getCrudTable(resource: string) {
  const table = CRUD_RESOURCE_TABLES[resource as keyof typeof CRUD_RESOURCE_TABLES]
  if (!table) throw new Error(`resource invalido para crud: ${resource}`)
  return table
}

function assertCrudResourceForTool(resource: string, toolName: string, allowedResources: string[]) {
  if (!allowedResources.includes(resource)) {
    throw new Error(`resource invalido para ${toolName}: ${resource}`)
  }
}

function buildFinancialAccountsWhere(
  action: CrudAction,
  paramsIn: JsonRecord,
  tenantId: number,
  alias: string,
  searchExpression: string,
  entityIdField: 'cliente_id' | 'fornecedor_id',
) {
  const limit = normalizeLimit(paramsIn.limit, 50)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = [tenantId]
  const where = [`${alias}.tenant_id = $1::int`]

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`${alias}.id::text = $${params.length}::text`)
  }

  const de = normalizeDate(paramsIn.de)
  if (de) {
    params.push(de)
    where.push(`${alias}.data_vencimento::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate) {
    params.push(ate)
    where.push(`${alias}.data_vencimento::date <= $${params.length}::date`)
  }

  const status = toText(paramsIn.status)
  if (status) {
    params.push(status)
    where.push(`${alias}.status = $${params.length}::text`)
  }

  const entityId = toText(paramsIn[entityIdField])
  if (entityId) {
    params.push(entityId)
    where.push(`${alias}.${entityIdField}::text = $${params.length}::text`)
  }

  const valorMin = toText(paramsIn.valor_min)
  if (valorMin) {
    const parsed = Number(valorMin)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_min invalido')
    params.push(parsed)
    where.push(`${alias}.valor_liquido >= $${params.length}::numeric`)
  }

  const valorMax = toText(paramsIn.valor_max)
  if (valorMax) {
    const parsed = Number(valorMax)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_max invalido')
    params.push(parsed)
    where.push(`${alias}.valor_liquido <= $${params.length}::numeric`)
  }

  const q = toText(paramsIn.q)
  if (q) {
    params.push(`%${q}%`)
    where.push(`(${alias}.numero_documento ILIKE $${params.length}::text OR ${searchExpression} ILIKE $${params.length}::text OR ${alias}.status ILIKE $${params.length}::text)`)
  }

  params.push(limit, offset)
  return {
    params,
    whereClause: `WHERE ${where.join(' AND ')}`,
    limitParam: params.length - 1,
    offsetParam: params.length,
  }
}

function buildFinancialAccountsPayableQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const fornecedorExpr = "COALESCE(NULLIF(f.nome_fantasia, ''), NULLIF(cp.nome_fornecedor_snapshot, ''), CONCAT('Fornecedor #', cp.fornecedor_id::text), '-')"
  const base = buildFinancialAccountsWhere(action, paramsIn, tenantId, 'cp', fornecedorExpr, 'fornecedor_id')

  return {
    sql: `
SELECT
  cp.numero_documento,
  ${fornecedorExpr} AS fornecedor,
  cp.data_documento::date AS data_documento,
  cp.data_vencimento::date AS data_vencimento,
  COALESCE(cp.valor_liquido, 0)::float AS valor_liquido,
  cp.status,
  COALESCE(NULLIF(cp.tipo_documento, ''), '-') AS tipo_documento,
  COALESCE(NULLIF(cp.observacao, ''), '-') AS observacao
FROM financeiro.contas_pagar cp
LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
${base.whereClause}
ORDER BY cp.data_vencimento ASC, cp.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas a pagar',
    chart: null,
  }
}

function buildFinancialAccountsReceivableQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const clienteExpr = "COALESCE(NULLIF(c.nome_fantasia, ''), NULLIF(cr.nome_cliente_snapshot, ''), CONCAT('Cliente #', cr.cliente_id::text), '-')"
  const base = buildFinancialAccountsWhere(action, paramsIn, tenantId, 'cr', clienteExpr, 'cliente_id')

  return {
    sql: `
SELECT
  cr.numero_documento,
  ${clienteExpr} AS cliente,
  cr.data_documento::date AS data_documento,
  cr.data_vencimento::date AS data_vencimento,
  COALESCE(cr.valor_liquido, 0)::float AS valor_liquido,
  cr.status,
  COALESCE(NULLIF(cr.tipo_documento, ''), '-') AS tipo_documento,
  COALESCE(NULLIF(cr.observacao, ''), '-') AS observacao
FROM financeiro.contas_receber cr
LEFT JOIN entidades.clientes c ON c.id = cr.cliente_id AND c.tenant_id = cr.tenant_id
${base.whereClause}
ORDER BY cr.data_vencimento ASC, cr.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas a receber',
    chart: null,
  }
}

type SemanticWhereConfig = {
  alias: string
  tenantScoped?: boolean
  dateField?: string
  statusField?: string
  idFields?: string[]
  valueField?: string
  searchExpressions?: string[]
  activeField?: string
  defaultActive?: boolean
  defaultLimit?: number
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  const out = toText(value).toLowerCase()
  if (!out) return null
  if (out === 'true' || out === '1' || out === 'sim' || out === 'ativo') return true
  if (out === 'false' || out === '0' || out === 'nao' || out === 'inativo') return false
  throw new Error(`boolean invalido: ${out}`)
}

function buildSemanticWhere(
  action: CrudAction,
  paramsIn: JsonRecord,
  tenantId: number,
  config: SemanticWhereConfig,
) {
  const limit = normalizeLimit(paramsIn.limit, config.defaultLimit ?? 50)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = []
  const where: string[] = []

  if (config.tenantScoped !== false) {
    params.push(tenantId)
    where.push(`${config.alias}.tenant_id = $${params.length}::int`)
  }

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`${config.alias}.id::text = $${params.length}::text`)
  }

  const de = normalizeDate(paramsIn.de)
  if (de && config.dateField) {
    params.push(de)
    where.push(`${config.alias}.${config.dateField}::date >= $${params.length}::date`)
  }

  const ate = normalizeDate(paramsIn.ate)
  if (ate && config.dateField) {
    params.push(ate)
    where.push(`${config.alias}.${config.dateField}::date <= $${params.length}::date`)
  }

  const status = toText(paramsIn.status)
  if (status && config.statusField) {
    params.push(status)
    where.push(`LOWER(COALESCE(${config.alias}.${config.statusField}, '')) = LOWER($${params.length}::text)`)
  }

  const ativo = toOptionalBoolean(paramsIn.ativo)
  const activeFilter = ativo ?? config.defaultActive
  if (typeof activeFilter === 'boolean' && config.activeField) {
    params.push(activeFilter)
    where.push(`COALESCE(${config.alias}.${config.activeField}, true) = $${params.length}::boolean`)
  }

  for (const field of config.idFields || []) {
    const value = toText(paramsIn[field])
    if (value) {
      params.push(value)
      where.push(`${config.alias}.${field}::text = $${params.length}::text`)
    }
  }

  const valorMin = toText(paramsIn.valor_min)
  if (valorMin && config.valueField) {
    const parsed = Number(valorMin)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_min invalido')
    params.push(parsed)
    where.push(`${config.alias}.${config.valueField} >= $${params.length}::numeric`)
  }

  const valorMax = toText(paramsIn.valor_max)
  if (valorMax && config.valueField) {
    const parsed = Number(valorMax)
    if (!Number.isFinite(parsed)) throw new Error('params.valor_max invalido')
    params.push(parsed)
    where.push(`${config.alias}.${config.valueField} <= $${params.length}::numeric`)
  }

  const q = toText(paramsIn.q)
  if (q && config.searchExpressions?.length) {
    params.push(`%${q}%`)
    const qParam = `$${params.length}::text`
    where.push(`(${config.searchExpressions.map((expression) => `${expression} ILIKE ${qParam}`).join(' OR ')})`)
  }

  params.push(limit, offset)
  return {
    params,
    whereClause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    limitParam: params.length - 1,
    offsetParam: params.length,
  }
}

function buildSalesOrdersQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const clienteExpr = "COALESCE(NULLIF(c.nome_fantasia, ''), CONCAT('Cliente #', p.cliente_id::text), '-')"
  const vendedorExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const canalExpr = "COALESCE(NULLIF(cv.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'p',
    dateField: 'data_pedido',
    statusField: 'status',
    idFields: ['cliente_id', 'vendedor_id', 'canal_venda_id', 'filial_id', 'centro_lucro_id'],
    valueField: 'valor_total',
    searchExpressions: ['p.id::text', clienteExpr, vendedorExpr, canalExpr, 'p.status'],
  })

  return {
    sql: `
SELECT
  p.id::text AS pedido,
  ${clienteExpr} AS cliente,
  p.data_pedido::date AS data_pedido,
  ${canalExpr} AS canal,
  ${vendedorExpr} AS vendedor,
  COALESCE(fil.nome, '-') AS filial,
  COALESCE(cl.nome, '-') AS centro_lucro,
  COALESCE(p.valor_total, 0)::float AS valor_total,
  COALESCE(p.status, '-') AS status
FROM vendas.pedidos p
LEFT JOIN entidades.clientes c ON c.id = p.cliente_id AND c.tenant_id = p.tenant_id
LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
LEFT JOIN empresa.centros_lucro cl ON cl.id = p.centro_lucro_id
${base.whereClause}
ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Pedidos de venda',
    chart: null,
  }
}

function buildPurchaseOrdersQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const fornecedorExpr = "COALESCE(NULLIF(f.nome_fantasia, ''), CONCAT('Fornecedor #', c.fornecedor_id::text), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'c',
    dateField: 'data_pedido',
    statusField: 'status',
    idFields: ['fornecedor_id', 'filial_id', 'centro_custo_id', 'categoria_despesa_id'],
    valueField: 'valor_total',
    searchExpressions: ['c.numero_oc', fornecedorExpr, 'c.status', 'c.observacoes'],
  })

  return {
    sql: `
SELECT
  COALESCE(NULLIF(c.numero_oc, ''), c.id::text) AS numero_pedido,
  ${fornecedorExpr} AS fornecedor,
  c.data_pedido::date AS data_pedido,
  c.data_entrega_prevista::date AS data_entrega_prevista,
  COALESCE(c.valor_total, 0)::float AS valor_total,
  COALESCE(c.status, '-') AS status,
  COALESCE(fil.nome, '-') AS filial,
  COALESCE(cc.nome, '-') AS centro_custo,
  COALESCE(cd.nome, '-') AS categoria_despesa
FROM compras.compras c
LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id
${base.whereClause}
ORDER BY c.data_pedido DESC NULLS LAST, c.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Pedidos de compra',
    chart: null,
  }
}

function buildCrmAccountsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'c',
    dateField: 'criado_em',
    idFields: ['responsavel_id'],
    searchExpressions: ['c.nome', 'c.setor', 'c.site', 'c.telefone', responsavelExpr],
  })

  return {
    sql: `
SELECT
  c.nome AS conta,
  COALESCE(NULLIF(c.setor, ''), '-') AS setor,
  COALESCE(NULLIF(c.site, ''), '-') AS site,
  COALESCE(NULLIF(c.telefone, ''), '-') AS telefone,
  ${responsavelExpr} AS responsavel,
  COALESCE(NULLIF(c.endereco_cobranca, ''), '-') AS endereco_cobranca,
  c.criado_em::date AS criado_em
FROM crm.contas c
LEFT JOIN comercial.vendedores v ON v.id = c.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY c.criado_em DESC NULLS LAST, c.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas CRM',
    chart: null,
  }
}

function buildCrmContactsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'ct',
    dateField: 'criado_em',
    idFields: ['conta_id', 'responsavel_id'],
    searchExpressions: ['ct.nome', contaExpr, 'ct.cargo', 'ct.email', 'ct.telefone', responsavelExpr],
  })

  return {
    sql: `
SELECT
  ct.nome AS contato,
  ${contaExpr} AS conta,
  COALESCE(NULLIF(ct.cargo, ''), '-') AS cargo,
  COALESCE(NULLIF(ct.email, ''), '-') AS email,
  COALESCE(NULLIF(ct.telefone, ''), '-') AS telefone,
  ${responsavelExpr} AS responsavel,
  ct.criado_em::date AS criado_em
FROM crm.contatos ct
LEFT JOIN crm.contas c ON c.id = ct.conta_id AND c.tenant_id = ct.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = ct.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY ct.criado_em DESC NULLS LAST, ct.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contatos CRM',
    chart: null,
  }
}

function buildCrmLeadsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const origemExpr = "COALESCE(NULLIF(ol.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'l',
    dateField: 'criado_em',
    statusField: 'status',
    idFields: ['origem_id', 'responsavel_id'],
    searchExpressions: ['l.nome', 'l.empresa', 'l.email', 'l.telefone', origemExpr, responsavelExpr, 'l.status'],
  })

  return {
    sql: `
SELECT
  l.nome,
  COALESCE(NULLIF(l.empresa, ''), '-') AS empresa,
  COALESCE(NULLIF(l.email, ''), '-') AS email,
  COALESCE(NULLIF(l.telefone, ''), '-') AS telefone,
  ${origemExpr} AS origem,
  COALESCE(l.status, '-') AS status,
  ${responsavelExpr} AS responsavel,
  l.criado_em::date AS criado_em
FROM crm.leads l
LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id AND ol.tenant_id = l.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY l.criado_em DESC NULLS LAST, l.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Leads',
    chart: null,
  }
}

function buildCrmOpportunitiesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), NULLIF(l.empresa, ''), NULLIF(l.nome, ''), '-')"
  const faseExpr = "COALESCE(NULLIF(fp.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'o',
    dateField: 'data_prevista',
    statusField: 'status',
    idFields: ['conta_id', 'lead_id', 'vendedor_id', 'fase_pipeline_id'],
    valueField: 'valor_estimado',
    searchExpressions: ['o.nome', contaExpr, faseExpr, responsavelExpr, 'o.status'],
  })

  return {
    sql: `
SELECT
  o.nome AS oportunidade,
  ${contaExpr} AS conta,
  ${faseExpr} AS fase,
  ${responsavelExpr} AS responsavel,
  COALESCE(o.valor_estimado, 0)::float AS valor_estimado,
  COALESCE(o.probabilidade, 0)::float AS probabilidade,
  o.data_prevista::date AS previsao_fechamento,
  COALESCE(o.status, '-') AS status
FROM crm.oportunidades o
LEFT JOIN crm.contas c ON c.id = o.conta_id AND c.tenant_id = o.tenant_id
LEFT JOIN crm.leads l ON l.id = o.lead_id AND l.tenant_id = o.tenant_id
LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id AND fp.tenant_id = o.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY o.data_prevista ASC NULLS LAST, o.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Oportunidades',
    chart: null,
  }
}

function buildCrmActivitiesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const contaExpr = "COALESCE(NULLIF(c.nome, ''), '-')"
  const contatoExpr = "COALESCE(NULLIF(ct.nome, ''), '-')"
  const leadExpr = "COALESCE(NULLIF(l.nome, ''), '-')"
  const oportunidadeExpr = "COALESCE(NULLIF(o.nome, ''), '-')"
  const responsavelExpr = "COALESCE(NULLIF(f.nome, ''), '-')"
  const assuntoExpr = "COALESCE(NULLIF(a.assunto, ''), NULLIF(a.descricao, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'a',
    dateField: 'data_prevista',
    statusField: 'status',
    idFields: ['conta_id', 'contato_id', 'lead_id', 'oportunidade_id', 'responsavel_id'],
    searchExpressions: [
      assuntoExpr,
      'a.tipo',
      'a.descricao',
      'a.anotacoes',
      contaExpr,
      contatoExpr,
      leadExpr,
      oportunidadeExpr,
      responsavelExpr,
      'a.status',
    ],
  })

  return {
    sql: `
SELECT
  a.data_prevista::date AS data_prevista,
  COALESCE(NULLIF(a.tipo, ''), '-') AS tipo,
  ${assuntoExpr} AS assunto,
  ${contaExpr} AS conta,
  ${contatoExpr} AS contato,
  ${leadExpr} AS lead,
  ${oportunidadeExpr} AS oportunidade,
  COALESCE(a.status, '-') AS status,
  ${responsavelExpr} AS responsavel,
  a.data_conclusao::date AS data_conclusao,
  COALESCE(NULLIF(a.anotacoes, ''), '-') AS anotacoes
FROM crm.atividades a
LEFT JOIN crm.contas c ON c.id = a.conta_id AND c.tenant_id = a.tenant_id
LEFT JOIN crm.contatos ct ON ct.id = a.contato_id AND ct.tenant_id = a.tenant_id
LEFT JOIN crm.leads l ON l.id = a.lead_id AND l.tenant_id = a.tenant_id
LEFT JOIN crm.oportunidades o ON o.id = a.oportunidade_id AND o.tenant_id = a.tenant_id
LEFT JOIN comercial.vendedores v ON v.id = a.responsavel_id
LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
${base.whereClause}
ORDER BY a.data_prevista ASC NULLS LAST, a.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Atividades CRM',
    chart: null,
  }
}

function buildStockCurrentQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const produtoExpr = "COALESCE(NULLIF(p.nome, ''), CONCAT('Produto #', ea.produto_id::text), '-')"
  const almoxarifadoExpr = "COALESCE(NULLIF(a.nome, ''), CONCAT('Almoxarifado #', ea.almoxarifado_id::text), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'ea',
    tenantScoped: false,
    idFields: ['produto_id', 'almoxarifado_id'],
    searchExpressions: [produtoExpr, almoxarifadoExpr],
  })

  return {
    sql: `
SELECT
  ${produtoExpr} AS produto,
  ${almoxarifadoExpr} AS almoxarifado,
  COALESCE(ea.quantidade, 0)::float AS quantidade,
  COALESCE(ea.custo_medio, 0)::float AS custo_medio,
  ROUND(COALESCE(ea.quantidade, 0)::numeric * COALESCE(ea.custo_medio, 0)::numeric, 2)::float AS valor_total,
  ea.atualizado_em
FROM estoque.estoques_atual ea
LEFT JOIN produtos.produto p ON p.id = ea.produto_id
LEFT JOIN estoque.almoxarifados a ON a.id = ea.almoxarifado_id
${base.whereClause}
ORDER BY a.nome ASC NULLS LAST, p.nome ASC NULLS LAST
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Estoque atual',
    chart: null,
  }
}

function buildStockMovementsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const produtoExpr = "COALESCE(NULLIF(p.nome, ''), CONCAT('Produto #', m.produto_id::text), '-')"
  const almoxarifadoExpr = "COALESCE(NULLIF(a.nome, ''), CONCAT('Almoxarifado #', m.almoxarifado_id::text), '-')"
  const tipoExpr = "COALESCE(NULLIF(tm.descricao, ''), NULLIF(m.tipo_movimento, ''), NULLIF(m.tipo_codigo, ''), '-')"
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'm',
    tenantScoped: false,
    dateField: 'data_movimento',
    statusField: 'tipo_movimento',
    idFields: ['produto_id', 'almoxarifado_id'],
    valueField: 'valor_total',
    searchExpressions: [produtoExpr, almoxarifadoExpr, tipoExpr, 'm.origem', 'm.observacoes'],
  })

  return {
    sql: `
SELECT
  m.data_movimento::date AS data,
  ${produtoExpr} AS produto,
  ${almoxarifadoExpr} AS almoxarifado,
  ${tipoExpr} AS tipo,
  COALESCE(m.quantidade, 0)::float AS quantidade,
  COALESCE(m.valor_total, 0)::float AS valor_total,
  COALESCE(NULLIF(m.origem, ''), '-') AS origem,
  COALESCE(NULLIF(m.observacoes, ''), '-') AS observacoes
FROM estoque.movimentacoes_estoque m
LEFT JOIN estoque.tipos_movimentacao tm ON tm.codigo = m.tipo_codigo
LEFT JOIN estoque.almoxarifados a ON a.id = m.almoxarifado_id
LEFT JOIN produtos.produto p ON p.id = m.produto_id
${base.whereClause}
ORDER BY m.data_movimento DESC NULLS LAST, m.id DESC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Movimentacoes de estoque',
    chart: null,
  }
}

function buildFinanceClientsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'c',
    searchExpressions: ['c.nome_fantasia', 'c.cnpj_cpf'],
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  COALESCE(NULLIF(c.nome_fantasia, ''), '-') AS cliente,
  COALESCE(NULLIF(c.cnpj_cpf, ''), '-') AS documento
FROM entidades.clientes c
${base.whereClause}
ORDER BY c.nome_fantasia ASC NULLS LAST, c.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Clientes',
    chart: null,
  }
}

function buildFinancialBankAccountsQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'cf',
    dateField: 'data_abertura',
    idFields: ['tipo_conta'],
    searchExpressions: ['cf.nome_conta', 'cf.tipo_conta', 'cf.numero_conta', 'cf.agencia', 'cf.pix_chave'],
    activeField: 'ativo',
    defaultActive: true,
  })

  return {
    sql: `
SELECT
  cf.nome_conta,
  COALESCE(NULLIF(cf.tipo_conta, ''), '-') AS tipo_conta,
  COALESCE(NULLIF(cf.agencia, ''), '-') AS agencia,
  COALESCE(NULLIF(cf.numero_conta, ''), '-') AS numero_conta,
  COALESCE(cf.saldo_atual, 0)::float AS saldo_atual,
  CASE WHEN COALESCE(cf.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM financeiro.contas_financeiras cf
${base.whereClause}
ORDER BY cf.nome_conta ASC NULLS LAST, cf.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Contas financeiras',
    chart: null,
  }
}

function buildNamedBusinessResourceQuery(
  action: CrudAction,
  paramsIn: JsonRecord,
  tenantId: number,
  table: string,
  alias: string,
  title: string,
): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias,
    searchExpressions: [`${alias}.codigo`, `${alias}.nome`, `${alias}.descricao`],
    activeField: 'ativo',
    defaultActive: true,
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  COALESCE(NULLIF(${alias}.codigo, ''), '-') AS codigo,
  ${alias}.nome,
  COALESCE(NULLIF(${alias}.descricao, ''), '-') AS descricao,
  CASE WHEN COALESCE(${alias}.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM ${table} ${alias}
${base.whereClause}
ORDER BY ${alias}.nome ASC NULLS LAST, ${alias}.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title,
    chart: null,
  }
}

function buildStockWarehousesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'a',
    searchExpressions: ['a.nome', 'a.tipo', 'a.endereco', 'a.responsavel'],
    activeField: 'ativo',
    defaultActive: true,
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  a.nome AS almoxarifado,
  COALESCE(NULLIF(a.tipo, ''), '-') AS tipo,
  COALESCE(NULLIF(a.endereco, ''), '-') AS endereco,
  COALESCE(NULLIF(a.responsavel, ''), '-') AS responsavel,
  CASE WHEN COALESCE(a.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM estoque.almoxarifados a
${base.whereClause}
ORDER BY a.nome ASC NULLS LAST, a.id ASC
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Almoxarifados',
    chart: null,
  }
}

function buildStockMovementTypesQuery(action: CrudAction, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  const base = buildSemanticWhere(action, paramsIn, tenantId, {
    alias: 'tm',
    tenantScoped: false,
    searchExpressions: ['tm.codigo', 'tm.descricao', 'tm.natureza'],
    activeField: 'ativo',
    defaultActive: true,
    defaultLimit: 100,
  })

  return {
    sql: `
SELECT
  tm.codigo,
  tm.descricao,
  COALESCE(NULLIF(tm.natureza, ''), '-') AS natureza,
  CASE WHEN COALESCE(tm.gera_financeiro, false) THEN 'Sim' ELSE 'Nao' END AS gera_financeiro,
  CASE WHEN COALESCE(tm.ativo, true) THEN 'Ativo' ELSE 'Inativo' END AS status
FROM estoque.tipos_movimentacao tm
${base.whereClause}
ORDER BY tm.natureza ASC NULLS LAST, tm.descricao ASC NULLS LAST
LIMIT $${base.limitParam}::int
OFFSET $${base.offsetParam}::int
    `.trim(),
    params: base.params,
    title: 'Tipos de movimentacao',
    chart: null,
  }
}

function buildCrudQuery(action: CrudAction, resource: string, paramsIn: JsonRecord, tenantId: number): BuiltQuery {
  if (resource === 'contas-a-pagar') {
    return buildFinancialAccountsPayableQuery(action, paramsIn, tenantId)
  }

  if (resource === 'contas-a-receber') {
    return buildFinancialAccountsReceivableQuery(action, paramsIn, tenantId)
  }

  if (resource === 'vendas/pedidos') {
    return buildSalesOrdersQuery(action, paramsIn, tenantId)
  }

  if (resource === 'compras/pedidos') {
    return buildPurchaseOrdersQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/contas') {
    return buildCrmAccountsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/contatos') {
    return buildCrmContactsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/leads') {
    return buildCrmLeadsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/oportunidades') {
    return buildCrmOpportunitiesQuery(action, paramsIn, tenantId)
  }

  if (resource === 'crm/atividades') {
    return buildCrmActivitiesQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/estoque-atual') {
    return buildStockCurrentQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/movimentacoes') {
    return buildStockMovementsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/clientes') {
    return buildFinanceClientsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/contas-financeiras') {
    return buildFinancialBankAccountsQuery(action, paramsIn, tenantId)
  }

  if (resource === 'financeiro/categorias-despesa') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'financeiro.categorias_despesa', 'cd', 'Categorias de despesa')
  }

  if (resource === 'financeiro/categorias-receita') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'financeiro.categorias_receita', 'cr', 'Categorias de receita')
  }

  if (resource === 'financeiro/centros-custo') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'empresa.centros_custo', 'cc', 'Centros de custo')
  }

  if (resource === 'financeiro/centros-lucro') {
    return buildNamedBusinessResourceQuery(action, paramsIn, tenantId, 'empresa.centros_lucro', 'cl', 'Centros de lucro')
  }

  if (resource === 'estoque/almoxarifados') {
    return buildStockWarehousesQuery(action, paramsIn, tenantId)
  }

  if (resource === 'estoque/tipos-movimentacao') {
    return buildStockMovementTypesQuery(action, paramsIn, tenantId)
  }

  const table = getCrudTable(resource)
  const limit = normalizeLimit(paramsIn.limit, 50)
  const offset = Math.max(0, Number.parseInt(toText(paramsIn.offset), 10) || 0)
  const params: unknown[] = [tenantId]
  const where = ['tenant_id = $1::int']

  const id = toText(paramsIn.id)
  if (action === 'ler' || id) {
    if (!id) throw new Error('params.id e obrigatorio para crud action ler')
    params.push(id)
    where.push(`id::text = $${params.length}::text`)
  }

  const q = toText(paramsIn.q)
  if (q) {
    params.push(`%${q}%`)
    where.push(`to_jsonb(t)::text ILIKE $${params.length}::text`)
  }

  params.push(limit, offset)
  return {
    sql: `
SELECT *
FROM ${table} AS t
WHERE ${where.join(' AND ')}
ORDER BY 1 DESC
LIMIT $${params.length - 1}::int
OFFSET $${params.length}::int
    `.trim(),
    params,
    title: `ERP - ${resource}`,
    chart: null,
  }
}

async function callCrud(
  args: unknown,
  context: CognitoMcpServerContext,
  toolName: string,
  allowedResources: string[],
) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeCrudAction(input.action || 'listar')
  const resource = toText(input.resource)
  if (!resource) throw new Error(`resource e obrigatorio para ${toolName}`)
  assertCrudResourceForTool(resource, toolName, allowedResources)

  const built = buildCrudQuery(action, resource, paramsIn, getTenantId(context))
  const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
  const columns = inferColumns(rows)
  const structuredContent = {
    success: true,
    tool: toolName,
    action,
    resource,
    title: built.title,
    rows,
    columns,
    count: rows.length,
    sql_query: built.sql,
    sql_params: built.params,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

async function callEcommerce(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeEcommerceAction(input.action)
  return executeBuiltQuery('ecommerce', action, buildEcommerceQuery(action, paramsIn, getTenantId(context)))
}

async function callMarketing(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeMarketingAction(input.action)
  return executeBuiltQuery('marketing', action, buildMarketingQuery(action, paramsIn, getTenantId(context)))
}

async function callSqlExecution(
  args: unknown,
  context: CognitoMcpServerContext,
  toolName: string = MCP_APP_DOMAIN_TOOL_NAMES.sql,
) {
  const input = toObj(args)
  const sqlRaw = toText(input.sql)
  const title = toText(input.title) || 'Resultado da Consulta'
  const chartRaw = parseChartConfig(input.chart)

  if (!sqlRaw) throw new Error('sql e obrigatorio')

  const safeSql = normalizeAndAssertSafeSelectQuery(sqlRaw)
  const { sql: boundSql, params } = bindTenantParam(safeSql, getTenantId(context))
  const maxRows = 1000
  const finalSql = `SELECT * FROM (${boundSql}) AS q LIMIT $${params.length + 1}::int`
  const finalParams = [...params, maxRows]

  const rows = await runQuery<Record<string, unknown>>(finalSql, finalParams)
  const columns = inferColumns(rows)
  const chart = assertChartColumns(chartRaw, columns)
  const structuredContent = {
    success: true,
    tool: toolName,
    action: 'execute' satisfies SqlExecutionAction,
    title,
    rows,
    columns,
    count: rows.length,
    chart,
    sql_query: finalSql,
    sql_params: finalParams,
    max_rows: maxRows,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: false,
  }
}

export function isMcpAppDomainTool(name: string) {
  return MCP_APP_DOMAIN_TOOL_NAME_SET.has(name)
}

export async function callMcpAppDomainTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  switch (name) {
    case MCP_APP_DOMAIN_TOOL_NAMES.erp:
      return callCrud(args, context, MCP_APP_DOMAIN_TOOL_NAMES.erp, ERP_ALLOWED_RESOURCES)
    case MCP_APP_DOMAIN_TOOL_NAMES.crm:
      return callCrud(args, context, MCP_APP_DOMAIN_TOOL_NAMES.crm, CRM_ALLOWED_RESOURCES)
    case MCP_APP_DOMAIN_TOOL_NAMES.ecommerce:
      return callEcommerce(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.sql:
      return callSqlExecution(args, context, MCP_APP_DOMAIN_TOOL_NAMES.sql)
    case MCP_APP_DOMAIN_TOOL_NAMES.sqlExecution:
      return callSqlExecution(args, context, MCP_APP_DOMAIN_TOOL_NAMES.sqlExecution)
    case MCP_APP_DOMAIN_TOOL_NAMES.marketing:
      return callMarketing(args, context)
    default:
      throw new Error(`Tool de dominio desconhecida: ${name}`)
  }
}
