import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type JsonMap = Record<string, unknown>

type MarketingAction =
  | 'kpis_resumo'
  | 'desempenho_diario'
  | 'gasto_por_campanha'
  | 'roas_por_campanha'
  | 'gasto_por_conta'
  | 'top_anuncios'

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

function normalizeAction(value: unknown): MarketingAction | null {
  const out = toText(value).toLowerCase()
  if (out === 'kpis_resumo') return out
  if (out === 'desempenho_diario') return out
  if (out === 'gasto_por_campanha') return out
  if (out === 'roas_por_campanha') return out
  if (out === 'gasto_por_conta') return out
  if (out === 'top_anuncios') return out
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
      meta: { tool: 'marketing', action, status },
      result: { success: false, error, code },
    },
    { status },
  )
}

function toolSuccessJson(action: MarketingAction, result: Record<string, unknown>) {
  return Response.json({
    ok: true,
    success: true,
    data: result,
    meta: { tool: 'marketing', action, status: 200 },
    result,
  })
}

function buildCommonFilters(paramsIn: JsonMap, tenantId: number, alias: string) {
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

  const plataforma = toText(paramsIn.plataforma)
  if (plataforma) {
    params.push(plataforma)
    where.push(`${alias}.plataforma = $${params.length}::text`)
  }

  const nivel = toText(paramsIn.nivel)
  if (nivel) {
    params.push(nivel)
    where.push(`${alias}.nivel = $${params.length}::text`)
  }

  const contaId = toText(paramsIn.conta_id)
  if (contaId) {
    params.push(contaId)
    where.push(`${alias}.conta_id::text = $${params.length}::text`)
  }

  const campanhaId = toText(paramsIn.campanha_id)
  if (campanhaId) {
    params.push(campanhaId)
    where.push(`${alias}.campanha_id::text = $${params.length}::text`)
  }

  const grupoId = toText(paramsIn.grupo_id)
  if (grupoId) {
    params.push(grupoId)
    where.push(`${alias}.grupo_id::text = $${params.length}::text`)
  }

  const anuncioId = toText(paramsIn.anuncio_id)
  if (anuncioId) {
    params.push(anuncioId)
    where.push(`${alias}.anuncio_id::text = $${params.length}::text`)
  }

  return { params, whereClause: `WHERE ${where.join(' AND ')}` }
}

function buildQuery(action: MarketingAction, paramsIn: JsonMap, tenantId: number): BuiltQuery {
  const limit = normalizeLimit(paramsIn.limit, 12)
  const base = buildCommonFilters(paramsIn, tenantId, 'dd')

  if (action === 'kpis_resumo') {
    return {
      sql: `
SELECT
  COALESCE(SUM(dd.gasto), 0)::float AS gasto,
  COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita_atribuida,
  CASE
    WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0::float
    ELSE (COALESCE(SUM(dd.receita_atribuida), 0)::float / COALESCE(SUM(dd.gasto), 0)::float)
  END AS roas,
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
SELECT
  TO_CHAR(dd.data_ref::date, 'YYYY-MM-DD') AS key,
  TO_CHAR(dd.data_ref::date, 'YYYY-MM-DD') AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS value,
  COALESCE(SUM(dd.receita_atribuida), 0)::float AS receita_atribuida
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 2 ASC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Marketing - Desempenho Diário',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Dia', yLabel: 'Gasto' },
    }
  }

  if (action === 'gasto_por_campanha') {
    const params = [...base.params, limit]
    return {
      sql: `
SELECT
  COALESCE(dd.campanha_id::text, '-') AS key,
  COALESCE(dd.campanha_id::text, '-') AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Marketing - Gasto por Campanha',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Campanha', yLabel: 'Gasto' },
    }
  }

  if (action === 'roas_por_campanha') {
    const params = [...base.params, limit]
    return {
      sql: `
SELECT
  COALESCE(dd.campanha_id::text, '-') AS key,
  COALESCE(dd.campanha_id::text, '-') AS label,
  CASE
    WHEN COALESCE(SUM(dd.gasto), 0) = 0 THEN 0::float
    ELSE (COALESCE(SUM(dd.receita_atribuida), 0)::float / COALESCE(SUM(dd.gasto), 0)::float)
  END AS value
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Marketing - ROAS por Campanha',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Campanha', yLabel: 'ROAS' },
    }
  }

  if (action === 'gasto_por_conta') {
    const params = [...base.params, limit]
    return {
      sql: `
SELECT
  COALESCE(dd.conta_id::text, '-') AS key,
  COALESCE(dd.conta_id::text, '-') AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS value
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
      `.trim(),
      params,
      title: 'Marketing - Gasto por Conta',
      chart: { xField: 'label', valueField: 'value', xLabel: 'Conta', yLabel: 'Gasto' },
    }
  }

  const params = [...base.params, limit]
  return {
    sql: `
SELECT
  COALESCE(dd.anuncio_id::text, '-') AS key,
  COALESCE(dd.anuncio_id::text, '-') AS label,
  COALESCE(SUM(dd.gasto), 0)::float AS value,
  COALESCE(SUM(dd.cliques), 0)::int AS cliques,
  COALESCE(SUM(dd.conversoes), 0)::int AS conversoes
FROM trafegopago.desempenho_diario dd
${base.whereClause}
GROUP BY 1, 2
ORDER BY 3 DESC
LIMIT $${params.length}::int
    `.trim(),
    params,
    title: 'Marketing - Top Anúncios por Gasto',
    chart: { xField: 'label', valueField: 'value', xLabel: 'Anúncio', yLabel: 'Gasto' },
  }
}

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) {
      return toolErrorJson(401, 'unauthorized', 'Token inválido para marketing')
    }

    const payload = toObj(await req.json().catch(() => ({})))
    const action = normalizeAction(payload.action)
    if (!action) {
      return toolErrorJson(
        400,
        'invalid_action',
        'action inválida. Use: kpis_resumo, desempenho_diario, gasto_por_campanha, roas_por_campanha, gasto_por_conta, top_anuncios',
      )
    }

    const paramsIn = toObj(payload.params)
    const tenantId = resolveTenantId(req.headers)
    const built = buildQuery(action, paramsIn, tenantId)
    const rows = await runQuery<Record<string, unknown>>(built.sql, built.params)
    const columns = inferColumns(rows)

    return toolSuccessJson(action, {
      success: true,
      tool: 'marketing',
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
    const message = error instanceof Error ? error.message : 'Erro interno na tool marketing'
    return toolErrorJson(400, 'marketing_error', message)
  }
}
