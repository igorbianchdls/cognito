import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure' | 'dimension' | string; dir?: 'asc' | 'desc' }

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

type Context = {
  from: string
  dateField: string
  dimensions: Map<string, { expr: string; keyExpr?: string }>
  measures: Map<string, string>
  qualifyDimensionExpr: (expr: string) => string
}

function buildEstoqueAtualContext(): Context {
  return {
    from: `FROM estoque.estoques_atual ea
           LEFT JOIN estoque.almoxarifados a ON a.id = ea.almoxarifado_id
           LEFT JOIN produtos.produto p ON p.id = ea.produto_id`,
    dateField: 'ea.atualizado_em',
    dimensions: new Map([
      ['produto', { expr: "COALESCE(p.nome, ea.produto_id::text)", keyExpr: 'ea.produto_id' }],
      ['almoxarifado', { expr: "COALESCE(a.nome, ea.almoxarifado_id::text)", keyExpr: 'ea.almoxarifado_id' }],
      ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', ea.atualizado_em), 'YYYY-MM')" }],
    ]),
    measures: new Map([
      ['sum(quantidade)', 'COALESCE(SUM(ea.quantidade),0)::float'],
      ['sum(ea.quantidade)', 'COALESCE(SUM(ea.quantidade),0)::float'],
      ['sum(valor_total)', 'COALESCE(SUM(ea.quantidade * ea.custo_medio),0)::float'],
      ['sum(ea.quantidade*ea.custo_medio)', 'COALESCE(SUM(ea.quantidade * ea.custo_medio),0)::float'],
      ['count()', 'COUNT(*)::int'],
      ['count_distinct(produto_id)', 'COUNT(DISTINCT ea.produto_id)::int'],
      ['count_distinct(ea.produto_id)', 'COUNT(DISTINCT ea.produto_id)::int'],
    ]),
    qualifyDimensionExpr: (expr: string) =>
      expr
        .replace(/\batualizado_em\b/g, 'ea.atualizado_em')
        .replace(/\bquantidade\b/g, 'ea.quantidade')
        .replace(/\bcusto_medio\b/g, 'ea.custo_medio'),
  }
}

function buildMovimentacoesContext(): Context {
  return {
    from: `FROM estoque.movimentacoes_estoque m
           LEFT JOIN estoque.almoxarifados a ON a.id = m.almoxarifado_id
           LEFT JOIN produtos.produto p ON p.id = m.produto_id
           LEFT JOIN estoque.tipos_movimentacao tm ON tm.codigo = m.tipo_codigo`,
    dateField: 'm.data_movimento',
    dimensions: new Map([
      ['produto', { expr: "COALESCE(p.nome, m.produto_id::text)", keyExpr: 'm.produto_id' }],
      ['almoxarifado', { expr: "COALESCE(a.nome, m.almoxarifado_id::text)", keyExpr: 'm.almoxarifado_id' }],
      ['tipo_movimento', { expr: "COALESCE(tm.descricao, m.tipo_movimento, '—')", keyExpr: "COALESCE(tm.codigo, m.tipo_movimento, '—')" }],
      ['natureza', { expr: "COALESCE(tm.natureza, '—')", keyExpr: "COALESCE(tm.natureza, '—')" }],
      ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', m.data_movimento), 'YYYY-MM')" }],
    ]),
    measures: new Map([
      ['sum(quantidade)', 'COALESCE(SUM(m.quantidade),0)::float'],
      ['sum(m.quantidade)', 'COALESCE(SUM(m.quantidade),0)::float'],
      ['sum(valor_total)', 'COALESCE(SUM(m.valor_total),0)::float'],
      ['sum(m.valor_total)', 'COALESCE(SUM(m.valor_total),0)::float'],
      ['count()', 'COUNT(*)::int'],
      ['count_distinct(id)', 'COUNT(DISTINCT m.id)::int'],
      ['count_distinct(m.id)', 'COUNT(DISTINCT m.id)::int'],
    ]),
    qualifyDimensionExpr: (expr: string) =>
      expr
        .replace(/\bdata_movimento\b/g, 'm.data_movimento')
        .replace(/\bquantidade\b/g, 'm.quantidade')
        .replace(/\bvalor_total\b/g, 'm.valor_total'),
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

    const rawModel = typeof dq.model === 'string' ? dq.model.trim() : ''
    const normalizedModel = rawModel.toLowerCase().replace(/-/g, '_')
    const model =
      normalizedModel === 'estoque.movimentacoes_estoque' ? 'estoque.movimentacoes' : normalizedModel
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
      model === 'estoque.estoques_atual'
        ? buildEstoqueAtualContext()
        : model === 'estoque.movimentacoes'
          ? buildMovimentacoesContext()
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
    const alias = model === 'estoque.estoques_atual' ? 'ea' : 'm'

    if (typeof f.de === 'string') {
      whereParts.push(`${context.dateField} >= $${params.length + 1}`)
      params.push(f.de)
    }
    if (typeof f.ate === 'string') {
      whereParts.push(`${context.dateField} <= $${params.length + 1}`)
      params.push(f.ate)
    }

    addInFilter(params, whereParts, `${alias}.produto_id`, f.produto_id)
    addInFilter(params, whereParts, `${alias}.almoxarifado_id`, f.almoxarifado_id)

    if (model === 'estoque.movimentacoes') {
      if (typeof f.tipo_movimento === 'string') {
        whereParts.push(`LOWER(m.tipo_movimento) = LOWER($${params.length + 1})`)
        params.push(f.tipo_movimento)
      } else if (Array.isArray(f.tipo_movimento) && f.tipo_movimento.length > 0) {
        const placeholders: string[] = []
        for (const value of f.tipo_movimento) {
          placeholders.push(`$${params.length + 1}`)
          params.push(String(value).toLowerCase())
        }
        whereParts.push(`LOWER(m.tipo_movimento) IN (${placeholders.join(',')})`)
      }
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
    })
  } catch (error) {
    console.error('📦 API /api/modulos/estoque/query error:', error)
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

