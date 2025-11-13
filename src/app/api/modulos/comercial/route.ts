import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  territorios: {
    territorio: 't.nome',
    descricao: 't.descricao',
    ativo: 't.ativo',
    criado_em: 't.criado_em',
  },
  vendedores: {
    vendedor: 'v.nome',
    email: 'v.email',
    telefone: 'v.telefone',
    territorio: 't.nome',
    comissao: 'v.comissao',
    ativo: 'v.ativo',
    criado_em: 'v.criado_em',
  },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    // Paginação simples (opcional)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get('pageSize') || 20)))
    const offset = (page - 1) * pageSize

    // Ordenação segura
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'asc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam]
    const orderDir = orderDirParam === 'desc' ? 'DESC' : 'ASC'

    let selectSql = ''
    let baseSql = ''
    let orderClause = ''

    if (view === 'territorios') {
      // Query será fornecida pelo usuário - por enquanto retorna vazio
      selectSql = `SELECT NULL AS territorio LIMIT 0`
      baseSql = ''
      orderClause = ''
    } else if (view === 'vendedores') {
      // Query será fornecida pelo usuário - por enquanto retorna vazio
      selectSql = `SELECT NULL AS vendedor LIMIT 0`
      baseSql = ''
      orderClause = ''
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = orderClause ? `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim() : `${selectSql} LIMIT $1::int OFFSET $2::int`.trim()
    const rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Total simples (sem filtros)
    const totalSql = baseSql ? `SELECT COUNT(*)::int AS total ${baseSql}` : `SELECT 0::int AS total`
    const totalRows = await runQuery<{ total: number }>(totalSql)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify([pageSize, offset]),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('🏢 API /api/modulos/comercial error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
