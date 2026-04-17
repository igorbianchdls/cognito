import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type JsonMap = Record<string, unknown>

type EcommerceAction =
  | 'kpis_resumo'
  | 'vendas_por_canal'
  | 'pedidos_por_status'
  | 'faturamento_por_mes'
  | 'top_produtos_receita'
  | 'frete_por_transportadora'

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

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(toText(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function normalizeAction(value: unknown): EcommerceAction | null {
  const out = toText(value).toLowerCase()
  if (out === 'kpis_resumo') return out
  if (out === 'vendas_por_canal') return out
  if (out === 'pedidos_por_status') return out
  if (out === 'faturamento_por_mes') return out
  if (out === 'top_produtos_receita') return out
  if (out === 'frete_por_transportadora') return out
  return null
}

function normalizeDate(value: unknown): string | null {
  const out = toText(value)
  if (!out) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) {
    throw new Error(`Data inválida: ${out}. Use formato YYYY-MM-DD.`)
  }
  return out
}

function normalizeLimit(value: unknown, fallback: number): number {
  const parsed = toPositiveInt(value, fallback)
  return Math.min(parsed, 200)
}

function inferColumns(rows: Array<Record<string, unknown>>): string[] {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function unauthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

function toolErrorJson(status: number, code: string, error: string, action = 'unknown') {
  return Response.json(
    {
      ok: false,
      success: false,
      data: null,
      error,
      code,
      meta: { tool: 'ecommerce', action, status },
      result: { success: false, error, code },
    },
    { status },
  )
}

function toolSuccessJson(action: EcommerceAction, result: Record<string, unknown>) {
  return Response.json({
    ok: true,
    success: true,
    data: result,
    meta: { tool: 'ecommerce', action, status: 200 },
    result,
  })
}

function buildCommonPedidosFilters(paramsIn: JsonMap, tenantId: number, alias: string) {
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

  const plataforma = toText(paramsIn.plataforma)
  if (plataforma) {
    params.push(plataforma)
    where.push(`${alias}.plataforma = $${params.length}::text`)
  }

  const canalContaId = toText(paramsIn.canal_conta_id)
  if (canalContaId) {
    params.push(canalContaId)
    where.push(`${alias}.canal_conta_id::text = $${params.length}::text`)
  }

  const lojaId = toText(paramsIn.loja_id)
  if (lojaId) {
    params.push(lojaId)
    where.push(`${alias}.loja_id::text = $${params.length}::text`)
  }

  const status = toText(paramsIn.status)
  if (status) {
    params.push(status)
    where.push(`${alias}.status = $${params.length}::text`)
  }

  const statusPagamento = toText(paramsIn.status_pagamento)
  if (statusPagamento) {
    params.push(statusPagamento)
    where.push(`${alias}.status_pagamento = $${params.length}::text`)
  }

  const statusFulfillment = toText(paramsIn.status_fulfillment)
  if (statusFulfillment) {
    params.push(statusFulfillment)
    where.push(`${alias}.status_fulfillment = $${params.length}::text`)
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

function buildQuery(action: EcommerceAction, paramsIn: JsonMap, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 12)

  if (action === 'kpis_resumo') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    return {
      sql: `
SELECT
  COUNT(DISTINCT p.id)::int AS pedidos,
  COALESCE(SUM(p.valor_total), 0)::float AS receita_bruta,
  CASE
    WHEN COUNT(DISTINCT p.id) = 0 THEN 0::float
    ELSE (COALESCE(SUM(p.valor_total), 0)::float / COUNT(DISTINCT p.id)::float)
  END AS ticket_medio,
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
SELECT
  COALESCE(p.canal_conta_id::text, '-') AS key,
  COALESCE(cc.nome_conta, CONCAT('Conta #', p.canal_conta_id::text), '-') AS label,
  COALESCE(SUM(p.valor_total), 0)::float AS value
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
SELECT
  COALESCE(p.status, '-') AS key,
  COALESCE(p.status, '-') AS label,
  COUNT(DISTINCT p.id)::int AS value
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
SELECT
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS key,
  TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM') AS label,
  COALESCE(SUM(p.valor_total), 0)::float AS value
FROM ecommerce.pedidos p
${base.whereClause}
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Ecommerce - Faturamento por Mês',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Mês', yLabel: 'Faturamento' },
    }
  }

  if (action === 'top_produtos_receita') {
    const base = buildCommonPedidosFilters(paramsIn, tenantId, 'p')
    const params = [...base.params, limit]
    return {
      sql: `
SELECT
  COALESCE(pi.produto_id::text, '-') AS key,
  COALESCE(NULLIF(pi.titulo_item, ''), NULLIF(pi.sku, ''), '-') AS label,
  COALESCE(SUM(pi.valor_total), 0)::float AS value
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
SELECT
  COALESCE(e.transportadora, '-') AS key,
  COALESCE(e.transportadora, '-') AS label,
  COALESCE(SUM(e.frete_custo), 0)::float AS value
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

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) {
      return toolErrorJson(401, 'unauthorized', 'Token inválido para ecommerce')
    }

    const payload = toObj(await req.json().catch(() => ({})))
    const action = normalizeAction(payload.action)
    if (!action) {
      return toolErrorJson(
        400,
        'invalid_action',
        'action inválida. Use: kpis_resumo, vendas_por_canal, pedidos_por_status, faturamento_por_mes, top_produtos_receita, frete_por_transportadora',
      )
    }

    const paramsIn = toObj(payload.params)
    const tenantId = resolveTenantId(req.headers)
    const built = buildQuery(action, paramsIn, tenantId)
    const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
    const columns = inferColumns(rows)

    return toolSuccessJson(action, {
      success: true,
      tool: 'ecommerce',
      action,
      title: built.title,
      rows,
      columns,
      count: rows.length,
      chart: built.chart,
      sql_query: built.sql,
      sql_params: built.params,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno na tool ecommerce'
    return toolErrorJson(400, 'ecommerce_error', message)
  }
}
