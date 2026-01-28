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

    // Only support compras.compras for this endpoint (POC)
    if (model !== 'compras.compras') {
      return Response.json({ success: false, message: `Model não suportado: ${model}` }, { status: 400 })
    }

    // Dimension mapping (whitelist)
    // Suportadas: fornecedor, centro_custo, filial, projeto, categoria_despesa, status
    let dimExpr = ''
    let dimAlias = ''
    if (dimension === 'fornecedor') { dimExpr = "COALESCE(f.nome_fantasia, f.nome, '—')"; dimAlias = 'fornecedor' }
    else if (dimension === 'centro_custo') { dimExpr = "COALESCE(cc.nome,'—')"; dimAlias = 'centro_custo' }
    else if (dimension === 'filial') { dimExpr = "COALESCE(fil.nome,'—')"; dimAlias = 'filial' }
    else if (dimension === 'projeto') { dimExpr = "COALESCE(pr.nome,'—')"; dimAlias = 'projeto' }
    else if (dimension === 'categoria_despesa') { dimExpr = "COALESCE(cd.nome,'—')"; dimAlias = 'categoria_despesa' }
    else if (dimension === 'status') { dimExpr = "COALESCE(c.status,'—')"; dimAlias = 'status' }
    else {
      return Response.json({ success: false, message: `Dimensão não suportada: ${dimension}` }, { status: 400 })
    }

    // Measure mapping (whitelist)
    const m = measure.replace(/\s+/g, '').toLowerCase()
    let measExpr = ''
    let measAlias = ''
    if (m === 'sum(c.valor_total)' || m === 'sum(valor_total)') {
      measExpr = 'COALESCE(SUM(c.valor_total),0)::float'
      measAlias = 'gasto_total'
    } else if (m === 'count()') {
      measExpr = 'COUNT(*)::int'
      measAlias = 'count'
    } else {
      return Response.json({ success: false, message: `Medida não suportada: ${measure}` }, { status: 400 })
    }

    // Base FROM with joins
    const fromSql = `FROM compras.compras c
                     LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
                     LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
                     LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
                     LEFT JOIN financeiro.projetos pr ON pr.id = c.projeto_id
                     LEFT JOIN financeiro.categorias_despesa cd ON cd.id = c.categoria_despesa_id`

    // Filters (whitelist)
    const params: unknown[] = []
    const whereParts: string[] = []
    if (typeof (filters as any).tenant_id === 'number') { whereParts.push(`c.tenant_id = $${params.length + 1}`); params.push((filters as any).tenant_id) }
    if (typeof (filters as any).de === 'string') { whereParts.push(`c.data_emissao >= $${params.length + 1}`); params.push((filters as any).de) }
    if (typeof (filters as any).ate === 'string') { whereParts.push(`c.data_emissao <= $${params.length + 1}`); params.push((filters as any).ate) }
    if (typeof (filters as any).status === 'string') { whereParts.push(`LOWER(c.status) = LOWER($${params.length + 1})`); params.push((filters as any).status) }
    const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''

    // Order by
    const dir = (orderBy?.dir && orderBy.dir.toLowerCase() === 'asc') ? 'ASC' : 'DESC'
    const obField = (orderBy?.field === 'dimension') ? '1' : '2' // 1: dimension expr, 2: measure expr
    const orderSql = `ORDER BY ${obField} ${dir}`

    // Build SQL
    const sql = `SELECT ${dimExpr} AS ${dimAlias}, ${measExpr} AS ${measAlias}
                 ${fromSql}
                 ${whereSql}
                 GROUP BY 1
                 ${orderSql}
                 LIMIT $${params.length + 1}::int`.replace(/\s+/g, ' ').trim()

    const rows = await runQuery<Record<string, unknown>>(sql, [...params, limit])
    return Response.json({ success: true, rows, sql_query: sql, sql_params: [...params, limit] })
  } catch (error) {
    console.error('📦 API /api/modulos/compras/query error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

