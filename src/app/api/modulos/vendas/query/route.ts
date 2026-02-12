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
    const model = typeof dq.model === 'string' ? dq.model.trim() : ''
    const dimension = typeof dq.dimension === 'string' ? dq.dimension.trim() : ''
    const dimensionExprOverride = typeof (dq as any).dimensionExpr === 'string' ? (dq as any).dimensionExpr.trim() : ''
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    const filters = isObject(dq.filters) ? dq.filters : {}
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 5))

    // Only support vendas.pedidos for this POC
    if (model !== 'vendas.pedidos') {
      return Response.json({ success: false, message: `Model não suportado: ${model}` }, { status: 400 })
    }

    // Dimension mapping (whitelist) or override via dimensionExpr
    let dimExpr = ''
    let dimKeyExpr = ''
    let dimAlias = ''
    if (!dimension && !dimensionExprOverride) {
      // KPI mode: no dimension -> single aggregate
      // Measure mapping (reuse below logic)
      const m = measure.replace(/\s+/g, '').toLowerCase()
      let measExpr = ''
      let overrideFromForPOnly = false
      if (m === 'sum(pi.subtotal)' || m === 'sum(itens.subtotal)' || m === 'sum(subtotal)') {
        measExpr = 'COALESCE(SUM(pi.subtotal),0)::float'
      } else if (m === 'count()') {
        measExpr = 'COUNT(DISTINCT p.id)::int'
      } else if (m === 'avg(p.valor_total)' || m === 'avg(valor_total)') {
        measExpr = 'COALESCE(AVG(p.valor_total),0)::float'
        overrideFromForPOnly = true
      } else if (m === 'sum(p.valor_total)' || m === 'sum(valor_total)') {
        measExpr = 'COALESCE(SUM(p.valor_total),0)::float'
        overrideFromForPOnly = true
      } else {
        return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
      }
      let fromSql = `FROM vendas.pedidos p
                     JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id`
      if (overrideFromForPOnly) {
        fromSql = `FROM vendas.pedidos p`
      }
      // Filters (same whitelist)
      const params: unknown[] = []
      const whereParts: string[] = []
      if (typeof filters.tenant_id === 'number') { whereParts.push(`p.tenant_id = $${params.length + 1}`); params.push(filters.tenant_id) }
      if (typeof filters.de === 'string') { whereParts.push(`p.data_pedido >= $${params.length + 1}`); params.push(filters.de) }
      if (typeof filters.ate === 'string') { whereParts.push(`p.data_pedido <= $${params.length + 1}`); params.push(filters.ate) }
      if (typeof (filters as any).status === 'string') { whereParts.push(`LOWER(p.status) = LOWER($${params.length + 1})`); params.push((filters as any).status) }
      // numeric range (pedido total) for KPI mode as well
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v))
      if (num((filters as any).valor_min)) { whereParts.push(`p.valor_total >= $${params.length + 1}`); params.push((filters as any).valor_min as number) }
      if (num((filters as any).valor_max)) { whereParts.push(`p.valor_total <= $${params.length + 1}`); params.push((filters as any).valor_max as number) }
      if (Array.isArray((filters as any).status) && (filters as any).status.length) {
        const vals = (filters as any).status as unknown[];
        const ph: string[] = [];
        for (const v of vals) { ph.push(`$${params.length + 1}`); params.push(typeof v === 'string' ? v.toLowerCase() : String(v).toLowerCase()); }
        whereParts.push(`LOWER(p.status) IN (${ph.join(',')})`);
      }
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
      addInFilter('p.cliente_id', (filters as any).cliente_id);
      addInFilter('p.vendedor_id', (filters as any).vendedor_id);
      addInFilter('p.canal_venda_id', (filters as any).canal_venda_id);
      addInFilter('p.filial_id', (filters as any).filial_id);
      addInFilter('p.unidade_negocio_id', (filters as any).unidade_negocio_id);
      addInFilter('p.territorio_id', (filters as any).territorio_id);
      addInFilter('p.categoria_receita_id', (filters as any).categoria_receita_id);
      addInFilter('p.centro_lucro_id', (filters as any).centro_lucro_id);
      const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
      const sql = `SELECT ${measExpr} AS value ${fromSql} ${whereSql}`.replace(/\s+/g, ' ').trim()
      const rows = await runQuery<Record<string, unknown>>(sql, params)
      return Response.json({ success: true, rows, sql_query: sql, sql_params: params })
    } else if (dimensionExprOverride) {
      // Qualify known columns when no table prefix is provided
      const qualifyDimExpr = (expr: string) => {
        let e = expr
        e = e.replace(/\bdata_pedido\b/g, 'p.data_pedido')
        e = e.replace(/\bvalor_total\b/g, 'p.valor_total')
        return e
      }
      dimExpr = qualifyDimExpr(dimensionExprOverride)
      dimKeyExpr = dimExpr
      dimAlias = dimension || 'dimension'
    } else {
      // Suportadas: cliente, canal_venda, vendedor, filial, unidade_negocio, categoria_receita, territorio, periodo
      if (dimension === 'cliente') { dimExpr = 'c.nome_fantasia'; dimKeyExpr = 'c.id'; dimAlias = 'cliente' }
      else if (dimension === 'canal_venda') { dimExpr = 'COALESCE(cv.nome,\'—\')'; dimKeyExpr = 'cv.id'; dimAlias = 'canal_venda' }
      else if (dimension === 'vendedor') { dimExpr = 'COALESCE(f.nome,\'—\')'; dimKeyExpr = 'v.id'; dimAlias = 'vendedor' }
      else if (dimension === 'filial') { dimExpr = 'COALESCE(fil.nome,\'—\')'; dimKeyExpr = 'fil.id'; dimAlias = 'filial' }
      else if (dimension === 'unidade_negocio') { dimExpr = 'COALESCE(un.nome,\'—\')'; dimKeyExpr = 'un.id'; dimAlias = 'unidade_negocio' }
      else if (dimension === 'categoria_receita') { dimExpr = 'COALESCE(cr.nome,\'—\')'; dimKeyExpr = 'cr.id'; dimAlias = 'categoria_receita' }
      else if (dimension === 'periodo') { dimExpr = "TO_CHAR(DATE_TRUNC('month', p.data_pedido), 'YYYY-MM')"; dimKeyExpr = dimExpr; dimAlias = 'periodo' }
      else if (dimension === 'territorio') { dimExpr = 'COALESCE(t.nome,\'—\')'; dimKeyExpr = 't.id'; dimAlias = 'territorio' }
      else {
        return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
      }
    }

    // Measure mapping (whitelist)
    // Accept SUM(pi.subtotal) or SUM(itens.subtotal)
    const m = measure.replace(/\s+/g, '').toLowerCase()
    let measExpr = ''
    let measAlias = ''
    let overrideFromForPOnly = false
    if (m === 'sum(pi.subtotal)' || m === 'sum(itens.subtotal)' || m === 'sum(subtotal)') {
      measExpr = 'COALESCE(SUM(pi.subtotal),0)::float'
      measAlias = 'faturamento_total'
    } else if (m === 'count()') {
      // Contar pedidos, não itens
      measExpr = 'COUNT(DISTINCT p.id)::int'
      measAlias = 'count'
    } else if (m === 'avg(p.valor_total)' || m === 'avg(valor_total)') {
      measExpr = 'COALESCE(AVG(p.valor_total),0)::float'
      measAlias = 'ticket_medio'
      overrideFromForPOnly = true
    } else if (m === 'sum(p.valor_total)' || m === 'sum(valor_total)') {
      measExpr = 'COALESCE(SUM(p.valor_total),0)::float'
      measAlias = 'faturamento_total'
      overrideFromForPOnly = true
    } else {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    // Base SQL
    let fromSql = `FROM vendas.pedidos p
                   JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                   JOIN entidades.clientes c ON c.id = p.cliente_id
                   LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
                   LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
                   LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
                   LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                   LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
                   LEFT JOIN empresa.centros_lucro cl ON cl.id = p.centro_lucro_id
                   LEFT JOIN empresa.filiais fil ON fil.id = p.filial_id
                   LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id`
    if (overrideFromForPOnly && dimensionExprOverride) {
      // Para medidas baseadas em p.* e dimensão declarada por expressão de p.*, simplifica FROM para evitar duplicação
      fromSql = `FROM vendas.pedidos p`
    }

    // Filters (whitelist)
    const params: unknown[] = []
    let whereParts: string[] = []
    if (typeof filters.tenant_id === 'number') { whereParts.push(`p.tenant_id = $${params.length + 1}`); params.push(filters.tenant_id) }
    if (typeof filters.de === 'string') { whereParts.push(`p.data_pedido >= $${params.length + 1}`); params.push(filters.de) }
    if (typeof filters.ate === 'string') { whereParts.push(`p.data_pedido <= $${params.length + 1}`); params.push(filters.ate) }
    if (typeof filters.status === 'string') { whereParts.push(`LOWER(p.status) = LOWER($${params.length + 1})`); params.push(filters.status) }
    // numeric range on pedido total
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v))
    if (num((filters as any).valor_min)) { whereParts.push(`p.valor_total >= $${params.length + 1}`); params.push((filters as any).valor_min as number) }
    if (num((filters as any).valor_max)) { whereParts.push(`p.valor_total <= $${params.length + 1}`); params.push((filters as any).valor_max as number) }
    if (Array.isArray((filters as any).status) && (filters as any).status.length) {
      const vals = (filters as any).status as unknown[];
      const ph: string[] = [];
      for (const v of vals) { ph.push(`$${params.length + 1}`); params.push(typeof v === 'string' ? v.toLowerCase() : String(v).toLowerCase()); }
      whereParts.push(`LOWER(p.status) IN (${ph.join(',')})`);
    }

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
    addInFilter('p.cliente_id', (filters as any).cliente_id);
    addInFilter('p.vendedor_id', (filters as any).vendedor_id);
    addInFilter('p.canal_venda_id', (filters as any).canal_venda_id);
    addInFilter('p.filial_id', (filters as any).filial_id);
    addInFilter('p.unidade_negocio_id', (filters as any).unidade_negocio_id);
    addInFilter('p.territorio_id', (filters as any).territorio_id);
    addInFilter('p.categoria_receita_id', (filters as any).categoria_receita_id);
    addInFilter('p.centro_lucro_id', (filters as any).centro_lucro_id);
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Order by
    const dir = (orderBy?.dir && orderBy.dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
    const obField = (orderBy?.field === 'dimension') ? '2' : '3' // 2: label, 3: measure
    const orderSql = `ORDER BY ${obField} ${dir}`

    // Build
    const sql = `SELECT ${dimKeyExpr || dimExpr} AS key, ${dimExpr} AS label, ${measExpr} AS value
                 ${fromSql}
                 ${whereSql}
                 GROUP BY 1, 2
                 ${orderSql}
                 LIMIT $${params.length + 1}::int`.replace(/\s+/g, ' ').trim()
    const rows = await runQuery<Record<string, unknown>>(sql, [...params, limit])
    return Response.json({ success: true, rows, sql_query: sql, sql_params: [...params, limit] })
  } catch (error) {
    console.error('🛍️ API /api/modulos/vendas/query error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
