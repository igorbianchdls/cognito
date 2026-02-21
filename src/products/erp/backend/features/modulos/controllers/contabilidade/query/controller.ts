import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure' | 'dimension' | string; dir?: 'asc' | 'desc' }

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

function addInFilter(whereParts: string[], params: unknown[], col: string, value: unknown) {
  if (Array.isArray(value)) {
    const values = value.filter((item) => item !== undefined && item !== null && item !== '')
    if (!values.length) return
    const placeholders: string[] = []
    for (const item of values) {
      placeholders.push(`$${params.length + 1}`)
      params.push(item)
    }
    whereParts.push(`${col} IN (${placeholders.join(',')})`)
    return
  }

  if (value !== undefined && value !== null && value !== '') {
    whereParts.push(`${col} = $${params.length + 1}`)
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
    const model = rawModel.replace(/-/g, '_')
    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim().toLowerCase() : ''
    const dimensionExprOverride = typeof dq.dimensionExpr === 'string' ? dq.dimensionExpr.trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    const filters = isObject(dq.filters) ? dq.filters : {}
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 10))

    let ctx:
      | {
          from: string
          defaultDate: string
          dimMap: Map<string, { expr: string; keyExpr?: string; alias: string }>
          measureMap: Map<string, { expr: string; alias: string }>
          qualifyDimensionExpr: (expr: string) => string
        }
      | null = null

    if (model === 'contabilidade.lancamentos_contabeis_linhas') {
      ctx = {
        from: `FROM contabilidade.lancamentos_contabeis_linhas lcl
               JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
               LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id`,
        defaultDate: 'lc.data_lancamento',
        dimMap: new Map([
          ['conta', { expr: "COALESCE(pc.nome, 'Sem conta')", keyExpr: 'pc.id', alias: 'conta' }],
          ['codigo_conta', { expr: "COALESCE(pc.codigo, 'Sem codigo')", keyExpr: 'pc.codigo', alias: 'codigo_conta' }],
          ['tipo_conta', { expr: "COALESCE(pc.tipo_conta, 'Sem tipo')", keyExpr: 'pc.tipo_conta', alias: 'tipo_conta' }],
          ['origem', { expr: "COALESCE(NULLIF(TRIM(lc.origem_tabela), ''), 'manual')", keyExpr: "COALESCE(NULLIF(TRIM(lc.origem_tabela), ''), 'manual')", alias: 'origem' }],
          ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', lc.data_lancamento), 'YYYY-MM')", keyExpr: "TO_CHAR(DATE_TRUNC('month', lc.data_lancamento), 'YYYY-MM')", alias: 'periodo' }],
        ]),
        measureMap: new Map([
          ['sum(debito)', { expr: 'COALESCE(SUM(lcl.debito),0)::float', alias: 'total_debito' }],
          ['sum(credito)', { expr: 'COALESCE(SUM(lcl.credito),0)::float', alias: 'total_credito' }],
          ['sum(debito-credito)', { expr: 'COALESCE(SUM(lcl.debito - lcl.credito),0)::float', alias: 'saldo' }],
          ['sum(debito - credito)', { expr: 'COALESCE(SUM(lcl.debito - lcl.credito),0)::float', alias: 'saldo' }],
          ['sum(credito-debito)', { expr: 'COALESCE(SUM(lcl.credito - lcl.debito),0)::float', alias: 'saldo' }],
          ['sum(credito - debito)', { expr: 'COALESCE(SUM(lcl.credito - lcl.debito),0)::float', alias: 'saldo' }],
          ['count()', { expr: 'COUNT(*)::int', alias: 'count' }],
          ['count_distinct(lancamento_id)', { expr: 'COUNT(DISTINCT lcl.lancamento_id)::int', alias: 'count' }],
          ['count_distinct(conta_id)', { expr: 'COUNT(DISTINCT lcl.conta_id)::int', alias: 'count' }],
        ]),
        qualifyDimensionExpr: (expr: string) => {
          let result = expr
          result = result.replace(/\bdata_lancamento\b/g, 'lc.data_lancamento')
          result = result.replace(/\bdebito\b/g, 'lcl.debito')
          result = result.replace(/\bcredito\b/g, 'lcl.credito')
          result = result.replace(/\bconta_id\b/g, 'lcl.conta_id')
          return result
        },
      }
    } else if (model === 'contabilidade.lancamentos_contabeis') {
      ctx = {
        from: `FROM contabilidade.lancamentos_contabeis lc`,
        defaultDate: 'lc.data_lancamento',
        dimMap: new Map([
          ['origem', { expr: "COALESCE(NULLIF(TRIM(lc.origem_tabela), ''), 'manual')", keyExpr: "COALESCE(NULLIF(TRIM(lc.origem_tabela), ''), 'manual')", alias: 'origem' }],
          ['numero_documento', { expr: "COALESCE(NULLIF(TRIM(lc.numero_documento), ''), CONCAT('LC-', lc.id::text))", keyExpr: 'lc.id', alias: 'numero_documento' }],
          ['historico', { expr: "COALESCE(NULLIF(TRIM(lc.historico), ''), 'Sem historico')", keyExpr: 'lc.id', alias: 'historico' }],
          ['periodo', { expr: "TO_CHAR(DATE_TRUNC('month', lc.data_lancamento), 'YYYY-MM')", keyExpr: "TO_CHAR(DATE_TRUNC('month', lc.data_lancamento), 'YYYY-MM')", alias: 'periodo' }],
        ]),
        measureMap: new Map([
          ['sum(total_debitos)', { expr: 'COALESCE(SUM(lc.total_debitos),0)::float', alias: 'total_debito' }],
          ['sum(total_creditos)', { expr: 'COALESCE(SUM(lc.total_creditos),0)::float', alias: 'total_credito' }],
          ['sum(total_debitos-total_creditos)', { expr: 'COALESCE(SUM(lc.total_debitos - lc.total_creditos),0)::float', alias: 'saldo' }],
          ['sum(total_debitos - total_creditos)', { expr: 'COALESCE(SUM(lc.total_debitos - lc.total_creditos),0)::float', alias: 'saldo' }],
          ['count()', { expr: 'COUNT(*)::int', alias: 'count' }],
          ['count_distinct(id)', { expr: 'COUNT(DISTINCT lc.id)::int', alias: 'count' }],
        ]),
        qualifyDimensionExpr: (expr: string) => {
          let result = expr
          result = result.replace(/\bdata_lancamento\b/g, 'lc.data_lancamento')
          result = result.replace(/\btotal_debitos\b/g, 'lc.total_debitos')
          result = result.replace(/\btotal_creditos\b/g, 'lc.total_creditos')
          return result
        },
      }
    }

    if (!ctx) {
      return Response.json({ success: false, message: `Model não suportado: ${rawModel}` }, { status: 400 })
    }

    let dim = dimension ? ctx.dimMap.get(dimension) : undefined
    if (dimensionExprOverride) {
      const qualified = ctx.qualifyDimensionExpr(dimensionExprOverride)
      dim = { expr: qualified, keyExpr: qualified, alias: dimension || 'dimension' }
    } else if (dimension && !dim) {
      return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
    }

    const measureKey = measure.replace(/\s+/g, '').toLowerCase()
    const normalizedMeasureKey = measure.toLowerCase()
    const meas =
      ctx.measureMap.get(measureKey) ||
      ctx.measureMap.get(normalizedMeasureKey)

    if (!meas) {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    const params: unknown[] = []
    const whereParts: string[] = []

    if (typeof filters.tenant_id === 'number') {
      whereParts.push(`lc.tenant_id = $${params.length + 1}`)
      params.push(filters.tenant_id)
    }

    if (typeof filters.de === 'string') {
      whereParts.push(`${ctx.defaultDate} >= $${params.length + 1}`)
      params.push(filters.de)
    }

    if (typeof filters.ate === 'string') {
      whereParts.push(`${ctx.defaultDate} <= $${params.length + 1}`)
      params.push(filters.ate)
    }

    addInFilter(whereParts, params, "COALESCE(NULLIF(TRIM(lc.origem_tabela), ''), 'manual')", filters.origem)

    if (model === 'contabilidade.lancamentos_contabeis_linhas') {
      addInFilter(whereParts, params, 'lcl.conta_id', filters.conta_id)
      addInFilter(whereParts, params, 'pc.tipo_conta', filters.tipo_conta)
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    let sql = ''
    let execParams: unknown[] = []

    if (!dim) {
      sql = `SELECT ${meas.expr} AS value ${ctx.from} ${whereSql}`.replace(/\s+/g, ' ').trim()
      execParams = params
    } else {
      const dir = orderBy?.dir && String(orderBy.dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC'
      const orderField = orderBy?.field === 'dimension' ? '2' : '3'
      sql = `SELECT ${dim.keyExpr || dim.expr} AS key, ${dim.expr} AS label, ${meas.expr} AS value
             ${ctx.from}
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
    })
  } catch (error) {
    console.error('📘 API /api/modulos/contabilidade/query error:', error)
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
