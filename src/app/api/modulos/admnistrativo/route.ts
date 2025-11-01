import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'despesas': {
    id: 'd.id',
    descricao: 'd.descricao',
    valor_total: 'd.valor_total',
    data_vencimento: 'd.data_vencimento',
    status: 'd.status',
    fornecedor: 'f.nome',
    categoria: 'cf.nome',
    centro_custo: 'cc.nome',
    departamento: 'dp.nome',
    projeto: 'pj.nome',
    filial: 'fl.nome',
    criado_em: 'd.criado_em',
  },
  'contratos': {
    id: 'c.id',
    descricao: 'c.descricao',
    data_inicio: 'c.data_inicio',
    data_fim: 'c.data_fim',
    status: 'c.status',
    fornecedor: 'f.nome',
    categoria: 'cf.nome',
    centro_custo: 'cc.nome',
    departamento: 'dp.nome',
    projeto: 'pj.nome',
    filial: 'fl.nome',
    criado_em: 'c.criado_em',
  },
}

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })
    }

    // Filtros comuns
    const de = searchParams.get('de') || undefined // YYYY-MM-DD
    const ate = searchParams.get('ate') || undefined // YYYY-MM-DD

    // Paginação
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 1000) || 1000))
    const offset = (page - 1) * pageSize

    // Ordenação
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
    const orderWhitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = orderWhitelist[orderByParam] || undefined
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

    // Setup de SQL por view
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`)
      params.push(value)
      idx += 1
    }

    let baseSql = ''
    let selectSql = ''
    let whereDateCol = ''

    if (view === 'despesas') {
      baseSql = `FROM administrativo.despesas d
                 LEFT JOIN entidades.fornecedores f ON d.fornecedor_id = f.id
                 LEFT JOIN administrativo.categorias_financeiras cf ON d.categoria_id = cf.id
                 LEFT JOIN empresa.centros_custo cc ON d.centro_custo_id = cc.id
                 LEFT JOIN empresa.departamentos dp ON d.departamento_id = dp.id
                 LEFT JOIN administrativo.projetos pj ON d.projeto_id = pj.id
                 LEFT JOIN empresa.filiais fl ON d.filial_id = fl.id`
      selectSql = `SELECT
                    d.id,
                    d.descricao,
                    d.valor_total,
                    d.data_vencimento,
                    d.status,
                    f.nome AS fornecedor,
                    cf.nome AS categoria,
                    cc.nome AS centro_custo,
                    dp.nome AS departamento,
                    pj.nome AS projeto,
                    fl.nome AS filial,
                    d.criado_em`
      whereDateCol = 'd.data_vencimento'
    } else if (view === 'contratos') {
      baseSql = `FROM administrativo.contratos c
                 LEFT JOIN entidades.fornecedores f ON c.fornecedor_id = f.id
                 LEFT JOIN administrativo.categorias_financeiras cf ON c.categoria_id = cf.id
                 LEFT JOIN empresa.centros_custo cc ON c.centro_custo_id = cc.id
                 LEFT JOIN empresa.departamentos dp ON c.departamento_id = dp.id
                 LEFT JOIN administrativo.projetos pj ON c.projeto_id = pj.id
                 LEFT JOIN empresa.filiais fl ON c.filial_id = fl.id`
      selectSql = `SELECT
                    c.id,
                    c.descricao,
                    c.data_inicio,
                    c.data_fim,
                    c.status,
                    f.nome AS fornecedor,
                    cf.nome AS categoria,
                    cc.nome AS centro_custo,
                    dp.nome AS departamento,
                    pj.nome AS projeto,
                    fl.nome AS filial,
                    c.criado_em`
      whereDateCol = 'c.data_inicio'
    } else if (['reembolsos', 'obrigacoes-legais', 'documentos'].includes(view)) {
      // Enquanto não há SQL definido para essas views, retorna vazio de forma consistente
      return Response.json({ success: true, view, page, pageSize, total: 0, rows: [] }, { headers: { 'Cache-Control': 'no-store' } })
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de) push(`${whereDateCol} >=`, de)
    if (ate) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const defaultOrder = view === 'despesas'
      ? 'ORDER BY d.data_vencimento DESC'
      : 'ORDER BY c.data_inicio DESC'
    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : defaultOrder
    const limitOffsetClause = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffsetClause}`.replace(/\s+$/m, '').trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(totalSql, params)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify(paramsWithPage),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📊 API /api/modulos/admnistrativo error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
