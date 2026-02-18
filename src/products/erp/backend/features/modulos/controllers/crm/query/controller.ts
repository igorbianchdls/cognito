import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure' | 'dimension' | string; dir?: 'asc' | 'desc' }

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

type Context = {
  from: string
  defaultDateField: string
  dimensions: Map<string, { expr: string; keyExpr?: string }>
  measures: Map<string, string>
  qualifyDimensionExpr: (expr: string) => string
}

function buildOpportunitiesContext(): Context {
  return {
    from: `FROM crm.oportunidades o
           LEFT JOIN crm.leads l ON l.id = o.lead_id
           LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
           LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
           LEFT JOIN crm.contas ct ON ct.id = o.conta_id AND ct.tenant_id = o.tenant_id
           LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id AND v.tenant_id = o.tenant_id
           LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id AND f.tenant_id = v.tenant_id`,
    defaultDateField: 'o.data_prevista',
    dimensions: new Map([
      ['vendedor', { expr: "COALESCE(f.nome,'—')", keyExpr: 'v.id' }],
      ['fase', { expr: "COALESCE(fp.nome,'—')", keyExpr: 'fp.id' }],
      ['origem', { expr: "COALESCE(ol.nome,'—')", keyExpr: 'ol.id' }],
      ['conta', { expr: "COALESCE(ct.nome,'—')", keyExpr: 'ct.id' }],
      ['status', { expr: "COALESCE(o.status,'—')", keyExpr: "COALESCE(o.status,'—')" }],
      ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', o.data_prevista), 'YYYY-MM')" }],
    ]),
    measures: new Map([
      ['sum(valor_estimado)', 'COALESCE(SUM(o.valor_estimado),0)::float'],
      ['sum(o.valor_estimado)', 'COALESCE(SUM(o.valor_estimado),0)::float'],
      ['count()', 'COUNT(DISTINCT o.id)::int'],
      ['count_distinct(id)', 'COUNT(DISTINCT o.id)::int'],
      ['count_distinct(o.id)', 'COUNT(DISTINCT o.id)::int'],
      ['avg(valor_estimado)', 'COALESCE(AVG(o.valor_estimado),0)::float'],
      ['avg(o.valor_estimado)', 'COALESCE(AVG(o.valor_estimado),0)::float'],
      ['avg(probabilidade)', 'COALESCE(AVG(o.probabilidade),0)::float'],
      ['avg(o.probabilidade)', 'COALESCE(AVG(o.probabilidade),0)::float'],
    ]),
    qualifyDimensionExpr: (expr: string) =>
      expr
        .replace(/\bdata_prevista\b/g, 'o.data_prevista')
        .replace(/\bvalor_estimado\b/g, 'o.valor_estimado')
        .replace(/\bprobabilidade\b/g, 'o.probabilidade'),
  }
}

function buildLeadsContext(): Context {
  return {
    from: `FROM crm.leads l
           LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
           LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id AND v.tenant_id = l.tenant_id
           LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id AND f.tenant_id = v.tenant_id`,
    defaultDateField: 'l.criado_em',
    dimensions: new Map([
      ['origem', { expr: "COALESCE(ol.nome,'—')", keyExpr: 'ol.id' }],
      ['responsavel', { expr: "COALESCE(f.nome,'—')", keyExpr: 'v.id' }],
      ['empresa', { expr: "COALESCE(l.empresa,'—')" }],
      ['status', { expr: "COALESCE(l.status,'—')", keyExpr: "COALESCE(l.status,'—')" }],
      ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', l.criado_em), 'YYYY-MM')" }],
    ]),
    measures: new Map([
      ['count()', 'COUNT(DISTINCT l.id)::int'],
      ['count_distinct(id)', 'COUNT(DISTINCT l.id)::int'],
      ['count_distinct(l.id)', 'COUNT(DISTINCT l.id)::int'],
    ]),
    qualifyDimensionExpr: (expr: string) =>
      expr
        .replace(/\bcriado_em\b/g, 'l.criado_em')
        .replace(/\bempresa\b/g, 'l.empresa'),
  }
}

function addInFilter(params: unknown[], whereParts: string[], column: string, value: unknown) {
  if (Array.isArray(value)) {
    const values = value.filter((entry) => entry !== null && entry !== undefined && entry !== '')
    if (!values.length) return
    const placeholders: string[] = []
    for (const entry of values) {
      placeholders.push(`$${params.length + 1}`)
      params.push(entry)
    }
    whereParts.push(`${column} IN (${placeholders.join(',')})`)
    return
  }

  if (typeof value === 'number' || typeof value === 'string') {
    whereParts.push(`${column} = $${params.length + 1}`)
    params.push(value)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const dq = body?.dataQuery as unknown
    if (!isObject(dq)) {
      return Response.json({ success: false, message: 'dataQuery inválido' }, { status: 400 })
    }

    const tenantId = resolveTenantId(req.headers)
    const rawModel = typeof dq.model === 'string' ? dq.model.trim() : ''
    const model = rawModel.toLowerCase().replace(/-/g, '_')
    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim().toLowerCase() : ''
    const dimensionExprOverride =
      typeof (dq as any).dimensionExpr === 'string' ? (dq as any).dimensionExpr.trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    const measureKey = measure.replace(/\s+/g, '').toLowerCase()
    const filters = isObject(dq.filters) ? dq.filters : {}
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 8))

    const context =
      model === 'crm.oportunidades'
        ? buildOpportunitiesContext()
        : model === 'crm.leads'
          ? buildLeadsContext()
          : null
    if (!context) {
      return Response.json({ success: false, message: `Model não suportado: ${rawModel}` }, { status: 400 })
    }

    const measureExpr = context.measures.get(measureKey)
    if (!measureExpr) {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    let dim: { expr: string; keyExpr?: string } | undefined
    if (dimensionExprOverride) {
      const expr = context.qualifyDimensionExpr(dimensionExprOverride)
      dim = { expr, keyExpr: expr }
    } else if (dimension) {
      dim = context.dimensions.get(dimension)
      if (!dim) {
        return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
      }
    }

    const params: unknown[] = []
    const whereParts: string[] = []
    const f = filters as Record<string, unknown>

    if (model === 'crm.oportunidades') {
      whereParts.push(`o.tenant_id = $${params.length + 1}`)
      params.push(tenantId)
      if (typeof f.de === 'string') {
        whereParts.push(`o.data_prevista >= $${params.length + 1}`)
        params.push(f.de)
      }
      if (typeof f.ate === 'string') {
        whereParts.push(`o.data_prevista <= $${params.length + 1}`)
        params.push(f.ate)
      }
      if (typeof f.status === 'string') {
        whereParts.push(`LOWER(o.status) = LOWER($${params.length + 1})`)
        params.push(f.status)
      } else if (Array.isArray(f.status) && f.status.length > 0) {
        const placeholders: string[] = []
        for (const value of f.status) {
          placeholders.push(`$${params.length + 1}`)
          params.push(String(value).toLowerCase())
        }
        whereParts.push(`LOWER(o.status) IN (${placeholders.join(',')})`)
      }
      addInFilter(params, whereParts, 'o.vendedor_id', f.vendedor_id)
      addInFilter(params, whereParts, 'o.fase_pipeline_id', f.fase_pipeline_id)
      addInFilter(params, whereParts, 'l.origem_id', f.origem_id)
      addInFilter(params, whereParts, 'o.conta_id', f.conta_id)
      if (typeof f.valor_min === 'number' && Number.isFinite(f.valor_min)) {
        whereParts.push(`o.valor_estimado >= $${params.length + 1}`)
        params.push(f.valor_min)
      }
      if (typeof f.valor_max === 'number' && Number.isFinite(f.valor_max)) {
        whereParts.push(`o.valor_estimado <= $${params.length + 1}`)
        params.push(f.valor_max)
      }
    } else {
      whereParts.push(`l.tenant_id = $${params.length + 1}`)
      params.push(tenantId)
      if (typeof f.de === 'string') {
        whereParts.push(`l.criado_em >= $${params.length + 1}`)
        params.push(f.de)
      }
      if (typeof f.ate === 'string') {
        whereParts.push(`l.criado_em <= $${params.length + 1}`)
        params.push(f.ate)
      }
      if (typeof f.status === 'string') {
        whereParts.push(`LOWER(l.status) = LOWER($${params.length + 1})`)
        params.push(f.status)
      } else if (Array.isArray(f.status) && f.status.length > 0) {
        const placeholders: string[] = []
        for (const value of f.status) {
          placeholders.push(`$${params.length + 1}`)
          params.push(String(value).toLowerCase())
        }
        whereParts.push(`LOWER(l.status) IN (${placeholders.join(',')})`)
      }
      addInFilter(params, whereParts, 'l.origem_id', f.origem_id)
      addInFilter(params, whereParts, 'l.responsavel_id', f.responsavel_id)
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    let sql = ''
    let execParams: unknown[] = []
    if (!dim) {
      sql = `SELECT ${measureExpr} AS value ${context.from} ${whereSql}`.replace(/\s+/g, ' ').trim()
      execParams = params
    } else {
      const dir = orderBy?.dir && orderBy.dir.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
      const orderField = orderBy?.field === 'dimension' ? '2' : '3'
      sql = `SELECT ${dim.keyExpr || dim.expr} AS key, ${dim.expr} AS label, ${measureExpr} AS value
             ${context.from}
             ${whereSql}
             GROUP BY 1, 2
             ORDER BY ${orderField} ${dir}
             LIMIT $${params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      execParams = [...params, limit]
    }

    const rows = await runQuery<Record<string, unknown>>(sql, execParams)
    return Response.json({
      success: true,
      rows,
      sql_query: sql,
      sql_params: execParams,
      model,
      default_date_field: context.defaultDateField,
    })
  } catch (error) {
    console.error('📈 API /api/modulos/crm/query error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}

