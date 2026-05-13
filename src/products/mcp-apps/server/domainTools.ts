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

const CRUD_RESOURCE_TABLES = {
  'financeiro/contas-financeiras': 'financeiro.contas_financeiras',
  'financeiro/categorias-despesa': 'financeiro.categorias_despesa',
  'financeiro/categorias-receita': 'financeiro.categorias_receita',
  'financeiro/clientes': 'financeiro.clientes',
  'financeiro/centros-custo': 'financeiro.centros_custo',
  'financeiro/centros-lucro': 'financeiro.centros_lucro',
  'vendas/pedidos': 'vendas.pedidos',
  'compras/pedidos': 'compras.pedidos',
  'contas-a-pagar': 'financeiro.contas_a_pagar',
  'contas-a-receber': 'financeiro.contas_a_receber',
  'crm/contas': 'crm.contas',
  'crm/contatos': 'crm.contatos',
  'crm/leads': 'crm.leads',
  'crm/oportunidades': 'crm.oportunidades',
  'crm/atividades': 'crm.atividades',
  'estoque/almoxarifados': 'estoque.almoxarifados',
  'estoque/movimentacoes': 'estoque.movimentacoes',
  'estoque/estoque-atual': 'estoque.estoque_atual',
  'estoque/tipos-movimentacao': 'estoque.tipos_movimentacao',
} as const

const CRUD_ALLOWED_RESOURCES = Object.keys(CRUD_RESOURCE_TABLES)

const CRUD_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['listar', 'ler'],
      description: 'Acao ERP segura. Nesta versao do MCP App App, use listar ou ler.',
    },
    resource: {
      type: 'string',
      enum: CRUD_ALLOWED_RESOURCES,
      description: 'Resource canonico de negocio.',
    },
    params: {
      type: 'object',
      description: 'Filtros de leitura. Suporta id, q, limit e offset.',
      additionalProperties: true,
    },
  },
  required: ['action', 'resource'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

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
        'SQL de leitura. Aceita somente SELECT/CTE, uma unica instrucao, sem placeholders $1/$2. Use {{tenant_id}} para tenant.',
    },
    title: {
      type: 'string',
      description: 'Titulo opcional do resultado.',
    },
    chart: {
      type: 'object',
      description: 'Config opcional de grafico: xField, valueField, xLabel, yLabel.',
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
      description: 'Acao canonica de ecommerce.',
    },
    params: ACTION_PARAMS_SCHEMA,
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
      description: 'Acao canonica de marketing/trafego pago.',
    },
    params: ACTION_PARAMS_SCHEMA,
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

export const MCP_APP_DOMAIN_TOOL_NAMES = {
  erp: 'erp',
  sqlExecution: 'sql_execution',
  ecommerce: 'ecommerce',
  marketing: 'marketing',
} as const

export const MCP_APP_DOMAIN_TOOL_DEFINITIONS = [
  {
    name: MCP_APP_DOMAIN_TOOL_NAMES.erp,
    title: 'ERP',
    description:
      'Consulta segura de recursos transacionais ERP. Nesta versao, use apenas action listar ou ler.',
    inputSchema: CRUD_SCHEMA,
    outputSchema: CRUD_OUTPUT_SCHEMA,
    securitySchemes: READ_SECURITY_SCHEMES,
    annotations: READ_ONLY_ANNOTATIONS,
    _meta: TOOL_META,
  },
  {
    name: MCP_APP_DOMAIN_TOOL_NAMES.ecommerce,
    title: 'Ecommerce metrics',
    description:
      'Executa metricas canonicas de ecommerce sem SQL livre. Use para pedidos, vendas, canais, status, faturamento, produtos e frete.',
    inputSchema: ECOMMERCE_SCHEMA,
    outputSchema: METRICS_OUTPUT_SCHEMA,
    securitySchemes: READ_SECURITY_SCHEMES,
    annotations: READ_ONLY_ANNOTATIONS,
    _meta: TOOL_META,
  },
  {
    name: MCP_APP_DOMAIN_TOOL_NAMES.sqlExecution,
    title: 'SQL execution',
    description:
      'Executa SQL analitico ad-hoc com seguranca. Aceita apenas SELECT/CTE, uma unica instrucao, sem placeholders posicionais; use somente {{tenant_id}} para bind automatico.',
    inputSchema: SQL_EXECUTION_SCHEMA,
    outputSchema: METRICS_OUTPUT_SCHEMA,
    securitySchemes: READ_SECURITY_SCHEMES,
    annotations: READ_ONLY_ANNOTATIONS,
    _meta: TOOL_META,
  },
  {
    name: MCP_APP_DOMAIN_TOOL_NAMES.marketing,
    title: 'Marketing metrics',
    description:
      'Executa metricas canonicas de trafego pago sem SQL livre. Use para gasto, ROAS, campanhas, contas, anuncios e desempenho diario.',
    inputSchema: MARKETING_SCHEMA,
    outputSchema: METRICS_OUTPUT_SCHEMA,
    securitySchemes: READ_SECURITY_SCHEMES,
    annotations: READ_ONLY_ANNOTATIONS,
    _meta: TOOL_META,
  },
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

function buildCrudQuery(action: CrudAction, resource: string, paramsIn: JsonRecord, tenantId: number) {
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
  }
}

async function callCrud(args: unknown, context: CognitoMcpServerContext) {
  const input = toObj(args)
  const paramsIn = toObj(input.params)
  const action = normalizeCrudAction(input.action || 'listar')
  const resource = toText(input.resource)
  if (!resource) throw new Error('resource e obrigatorio para erp')

  const built = buildCrudQuery(action, resource, paramsIn, getTenantId(context))
  const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
  const columns = inferColumns(rows)
  const structuredContent = {
    success: true,
    tool: 'erp',
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

async function callSqlExecution(args: unknown, context: CognitoMcpServerContext) {
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
    tool: 'sql_execution',
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
      return callCrud(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.ecommerce:
      return callEcommerce(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.sqlExecution:
      return callSqlExecution(args, context)
    case MCP_APP_DOMAIN_TOOL_NAMES.marketing:
      return callMarketing(args, context)
    default:
      throw new Error(`Tool de dominio desconhecida: ${name}`)
  }
}
