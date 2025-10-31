import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  produtos: {
    id: 'p.id',
    nome: 'p.nome',
    descricao: 'p.descricao',
    categoria: 'c.nome',
    marca: 'm.nome',
    ativo: 'p.ativo',
  },
  variacoes: {
    id: 'v.id',
    produto_pai: 'p.nome',
    sku: 'v.sku',
    preco_base: 'v.preco_base',
    peso_kg: 'v.peso_kg',
    altura_cm: 'v.altura_cm',
    largura_cm: 'v.largura_cm',
    profundidade_cm: 'v.profundidade_cm',
    ativo: 'v.ativo',
  },
  'dados-fiscais': {
    produto: 'p.nome',
    sku: 'v.sku',
    ncm: 'pf.ncm',
    cest: 'pf.cest',
    cfop: 'pf.cfop',
    cst: 'pf.cst',
    origem: 'pf.origem',
    aliquota_icms: 'pf.aliquota_icms',
    aliquota_ipi: 'pf.aliquota_ipi',
    aliquota_pis: 'pf.aliquota_pis',
    aliquota_cofins: 'pf.aliquota_cofins',
    regime_tributario: 'pf.regime_tributario',
  },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get('pageSize') || 20)))
    const offset = (page - 1) * pageSize

    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'asc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam]
    const orderDir = orderDirParam === 'desc' ? 'DESC' : 'ASC'

    let selectSql = ''
    let baseSql = ''
    let orderClause = ''

    if (view === 'produtos') {
      selectSql = `SELECT
        p.id,
        p.nome,
        p.descricao,
        c.nome AS categoria,
        m.nome AS marca,
        p.ativo`
      baseSql = `FROM produtos.produtos p
        LEFT JOIN produtos.categorias c ON c.id = p.categoria_id
        LEFT JOIN produtos.marcas m ON m.id = p.marca_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY p.nome ASC'
    } else if (view === 'variacoes') {
      selectSql = `SELECT
        v.id,
        p.nome AS produto_pai,
        v.sku,
        v.preco_base,
        v.peso_kg,
        v.altura_cm,
        v.largura_cm,
        v.profundidade_cm,
        v.ativo`
      baseSql = `FROM produtos.produto_variacoes v
        JOIN produtos.produtos p ON p.id = v.produto_pai_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY p.nome ASC, v.id ASC'
    } else if (view === 'dados-fiscais') {
      selectSql = `SELECT
        p.nome AS produto,
        v.sku,
        pf.ncm,
        pf.cest,
        pf.cfop,
        pf.cst,
        pf.origem,
        pf.aliquota_icms,
        pf.aliquota_ipi,
        pf.aliquota_pis,
        pf.aliquota_cofins,
        pf.regime_tributario`
      baseSql = `FROM produtos.produtos_fiscal pf
        JOIN produtos.produto_variacoes v ON v.id = pf.variacao_id
        JOIN produtos.produtos p ON p.id = v.produto_pai_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY p.nome ASC, v.sku ASC'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim()
    const rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql}`
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
    console.error('📦 API /api/modulos/produtos error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

