import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderBy = { field?: 'measure'|'dimension'|string; dir?: 'asc'|'desc' }

type DataQuery = {
  model: string
  dimension: string
  measure: string
  filters?: Record<string, unknown>
  orderBy?: OrderBy
  limit?: number
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const dq = body?.dataQuery as unknown
    if (!isObject(dq)) {
      return Response.json({ success: false, message: 'dataQuery inválido' }, { status: 400 })
    }

    const rawModel = typeof dq.model === 'string' ? dq.model.trim() : ''
    const model = rawModel.replace(/-/g, '_')
    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim() : ''
    const dimensionExprOverride = typeof (dq as any).dimensionExpr === 'string' ? (dq as any).dimensionExpr.trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    const filters = isObject(dq.filters) ? dq.filters : {}
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 5))

    // Support compras.compras and compras.recebimentos
    if (model !== 'compras.compras' && model !== 'compras.recebimentos') {
      return Response.json({ success: false, message: `Model não suportado: ${rawModel}` }, { status: 400 })
    }

    // Dimension mapping (whitelist) with optional override via dimensionExpr
    let dimExpr = ''
    let dimAlias = ''
    if (dimensionExprOverride) {
      // Qualify known columns for compras when unqualified
      const qualifyDimExpr = (expr: string) => {
        let e = expr
        e = e.replace(/\bdata_emissao\b/g, 'c.data_pedido')
        e = e.replace(/\bdata_pedido\b/g, 'c.data_pedido')
        e = e.replace(/\bvalor_total\b/g, 'c.valor_total')
        return e
      }
      dimExpr = qualifyDimExpr(dimensionExprOverride)
      dimAlias = dimension || 'dimension'
    } else {
      // Suportadas: fornecedor, centro_custo, filial, projeto, categoria_despesa, status, periodo (recebimentos: status, periodo)
      if (dimension === 'fornecedor' && model === 'compras.compras') { dimExpr = "COALESCE(f.nome_fantasia,'—')"; dimAlias = 'fornecedor' }
      else if (dimension === 'centro_custo' && model === 'compras.compras') { dimExpr = "COALESCE(cc.nome,'—')"; dimAlias = 'centro_custo' }
      else if (dimension === 'filial' && model === 'compras.compras') { dimExpr = "COALESCE(fil.nome,'—')"; dimAlias = 'filial' }
      else if (dimension === 'projeto' && model === 'compras.compras') { dimExpr = "COALESCE(pr.nome,'—')"; dimAlias = 'projeto' }
      else if (dimension === 'categoria_despesa' && model === 'compras.compras') { dimExpr = "COALESCE(cd.nome,'—')"; dimAlias = 'categoria_despesa' }
      else if (dimension === 'status' && model === 'compras.compras') { dimExpr = "COALESCE(c.status,'—')"; dimAlias = 'status' }
      else if (dimension === 'periodo' && model === 'compras.compras') { dimExpr = "TO_CHAR(DATE_TRUNC('month', c.data_pedido), 'YYYY-MM')"; dimAlias = 'periodo' }
      else if (dimension === 'status' && model === 'compras.recebimentos') { dimExpr = "COALESCE(r.status,'—')"; dimAlias = 'status' }
      else if (dimension === 'periodo' && model === 'compras.recebimentos') { dimExpr = "TO_CHAR(DATE_TRUNC('month', r.data_recebimento), 'YYYY-MM')"; dimAlias = 'periodo' }
      else if (dimension) {
        return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
      }
    }

    // Measure mapping (whitelist)
    const m = measure.replace(/\s+/g, '').toLowerCase()
    let measExpr = ''
    let measAlias = ''
    if (model === 'compras.compras') {
      if (m === 'sum(c.valor_total)' || m === 'sum(valor_total)') {
        measExpr = 'COALESCE(SUM(c.valor_total),0)::float'
        measAlias = 'gasto_total'
      } else if (m === 'avg(c.valor_total)' || m === 'avg(valor_total)') {
        measExpr = 'COALESCE(AVG(c.valor_total),0)::float'
        measAlias = 'ticket_medio'
      } else if (m === 'count()') {
        measExpr = 'COUNT(*)::int'
        measAlias = 'count'
      } else if (m === 'count_distinct(c.id)' || m === 'count_distinct(id)') {
        measExpr = 'COUNT(DISTINCT c.id)::int'
        measAlias = 'count'
      } else if (m === 'count_distinct(c.fornecedor_id)' || m === 'count_distinct(fornecedor_id)') {
        measExpr = 'COUNT(DISTINCT c.fornecedor_id)::int'
        measAlias = 'count'
      } else {
        return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
      }
    } else {
      if (m === 'count()') { measExpr = 'COUNT(*)::int'; measAlias = 'count' }
      else { return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 }) }
    }

    // Base FROM with joins
    const fromSql = model === 'compras.compras'
      ? `FROM compras.compras c
         LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
         LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
         LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
         LEFT JOIN financeiro.projetos pr ON pr.id = c.projeto_id
         LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id`
      : `FROM compras.recebimentos r`

    // Filters (whitelist)
    const params: unknown[] = []
    const whereParts: string[] = []
    if (typeof (filters as any).tenant_id === 'number') { whereParts.push(`${model==='compras.compras'?'c':'r'}.tenant_id = $${params.length + 1}`); params.push((filters as any).tenant_id) }
    if (typeof (filters as any).de === 'string') { whereParts.push(`${model==='compras.compras'?'c.data_pedido':'r.data_recebimento'} >= $${params.length + 1}`); params.push((filters as any).de) }
    if (typeof (filters as any).ate === 'string') { whereParts.push(`${model==='compras.compras'?'c.data_pedido':'r.data_recebimento'} <= $${params.length + 1}`); params.push((filters as any).ate) }
    if (typeof (filters as any).status === 'string') { const al = model==='compras.compras'?'c':'r'; whereParts.push(`LOWER(${al}.status) = LOWER($${params.length + 1})`); params.push((filters as any).status) }
    // id filters and numeric range (only for compras.compras)
    const addInFilter = (col: string, val: unknown) => {
      if (Array.isArray(val)) {
        const arr = val as unknown[];
        if (!arr.length) return;
        const ph: string[] = [];
        for (const v of arr) { ph.push(`$${params.length + 1}`); params.push(v as any); }
        whereParts.push(`${col} IN (${ph.join(',')})`);
      } else if (typeof val === 'number' || typeof val === 'string') {
        whereParts.push(`${col} = $${params.length + 1}`);
        params.push(val);
      }
    };
    if (model === 'compras.compras') {
      addInFilter('c.fornecedor_id', (filters as any).fornecedor_id);
      addInFilter('c.filial_id', (filters as any).filial_id);
      addInFilter('c.centro_custo_id', (filters as any).centro_custo_id);
      addInFilter('c.categoria_despesa_id', (filters as any).categoria_despesa_id);
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v));
      if (num((filters as any).valor_min)) { whereParts.push(`c.valor_total >= $${params.length + 1}`); params.push((filters as any).valor_min as number) }
      if (num((filters as any).valor_max)) { whereParts.push(`c.valor_total <= $${params.length + 1}`); params.push((filters as any).valor_max as number) }
    }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Order by
    let sql: string
    let execParams: unknown[]
    if (!dimension && !dimensionExprOverride) {
      // KPI (no dimension): single aggregate
      sql = `SELECT ${measExpr} AS value ${fromSql} ${whereSql}`.replace(/\s+/g, ' ').trim()
      execParams = params
    } else {
      const dir = (orderBy?.dir && orderBy.dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
      const obField = (orderBy?.field === 'dimension') ? '1' : '2' // 1: dimension expr, 2: measure expr
      const orderSql = `ORDER BY ${obField} ${dir}`
      sql = `SELECT ${dimExpr} AS label, ${measExpr} AS value
             ${fromSql}
             ${whereSql}
             GROUP BY 1
             ${orderSql}
             LIMIT $${params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      execParams = [...params, limit]
    }

    const rows = await runQuery<Record<string, unknown>>(sql, execParams)
    return Response.json({ success: true, rows, sql_query: sql, sql_params: [...params, limit] })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/query error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
