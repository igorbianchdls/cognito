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
    const measure = typeof dq.measure === 'string' ? dq.measure.trim() : ''
    const filters = isObject(dq.filters) ? dq.filters : {}
    const orderBy = (isObject(dq.orderBy) ? dq.orderBy : {}) as OrderBy
    const limitRaw = typeof dq.limit === 'number' ? dq.limit : undefined
    const limit = Math.max(1, Math.min(1000, limitRaw ?? 5))

    // Only support vendas.pedidos for this POC
    if (model !== 'vendas.pedidos') {
      return Response.json({ success: false, message: `Model não suportado: ${model}` }, { status: 400 })
    }

    // Dimension mapping (whitelist)
    // Suportadas: cliente, canal_venda, vendedor, filial, unidade_negocio, categoria_receita, territorio
    let dimExpr = ''
    let dimAlias = ''
    if (dimension === 'cliente') { dimExpr = 'c.nome_fantasia'; dimAlias = 'cliente' }
    else if (dimension === 'canal_venda') { dimExpr = 'COALESCE(cv.nome,\'—\')'; dimAlias = 'canal_venda' }
    else if (dimension === 'vendedor') { dimExpr = 'COALESCE(f.nome,\'—\')'; dimAlias = 'vendedor' }
    else if (dimension === 'filial') { dimExpr = 'COALESCE(fil.nome,\'—\')'; dimAlias = 'filial' }
    else if (dimension === 'unidade_negocio') { dimExpr = 'COALESCE(un.nome,\'—\')'; dimAlias = 'unidade_negocio' }
    else if (dimension === 'categoria_receita') { dimExpr = 'COALESCE(cr.nome,\'—\')'; dimAlias = 'categoria_receita' }
    else if (dimension === 'territorio') { dimExpr = 'COALESCE(t.nome,\'—\')'; dimAlias = 'territorio' }
    else {
      return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
    }

    // Measure mapping (whitelist)
    // Accept SUM(pi.subtotal) or SUM(itens.subtotal)
    const m = measure.replace(/\s+/g, '').toLowerCase()
    let measExpr = ''
    let measAlias = ''
    if (m === 'sum(pi.subtotal)' || m === 'sum(itens.subtotal)' || m === 'sum(subtotal)') {
      measExpr = 'COALESCE(SUM(pi.subtotal),0)::float'
      measAlias = 'faturamento_total'
    } else if (m === 'count()') {
      measExpr = 'COUNT(*)::int'
      measAlias = 'count'
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

    // Filters (whitelist)
    const params: unknown[] = []
    let whereParts: string[] = []
    if (typeof filters.tenant_id === 'number') { whereParts.push(`p.tenant_id = $${params.length + 1}`); params.push(filters.tenant_id) }
    if (typeof filters.de === 'string') { whereParts.push(`p.data_pedido >= $${params.length + 1}`); params.push(filters.de) }
    if (typeof filters.ate === 'string') { whereParts.push(`p.data_pedido <= $${params.length + 1}`); params.push(filters.ate) }
    if (typeof filters.status === 'string') { whereParts.push(`LOWER(p.status) = LOWER($${params.length + 1})`); params.push(filters.status) }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Order by
    const dir = (orderBy?.dir && orderBy.dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
    const obField = (orderBy?.field === 'dimension') ? '1' : '2' // 1: dimension expr, 2: measure expr
    const orderSql = `ORDER BY ${obField} ${dir}`

    // Build
    const sql = `SELECT ${dimExpr} AS ${dimAlias}, ${measExpr} AS ${measAlias}
                 ${fromSql}
                 ${whereSql}
                 GROUP BY 1
                 ${orderSql}
                 LIMIT $${params.length + 1}::int`.replace(/\s+/g, ' ').trim()
    const rows = await runQuery<Record<string, unknown>>(sql, [...params, limit])
    return Response.json({ success: true, rows, sql_query: sql, sql_params: [...params, limit] })
  } catch (error) {
    console.error('🛍️ API /api/modulos/vendas/query error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
