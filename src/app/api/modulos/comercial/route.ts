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
    territorio_pai: 'tp.nome',
    ativo: 't.ativo',
    criado_em: 't.criado_em',
    atualizado_em: 't.atualizado_em',
  },
  vendedores: {
    vendedor: 'f.nome',
    email: 'f.email',
    telefone: 'f.telefone',
    territorio: 't.nome',
    comissao: 'v.comissao_padrao',
    vendedor_ativo: 'v.ativo',
    criado_em: 'v.criado_em',
    atualizado_em: 'v.atualizado_em',
  },
  meta_vendedores: {
    vendedor: 'f.nome',
    territorio: 't.nome',
    periodo: 'mv.periodo',
    meta: 'mv.valor_meta',
    criado_em: 'mv.criado_em',
    atualizado_em: 'mv.atualizado_em',
  },
  meta_territorios: {
    territorio: 't.nome',
    territorio_descricao: 't.descricao',
    periodo: 'mt.periodo',
    meta: 'mt.valor_meta',
    criado_em: 'mt.criado_em',
    atualizado_em: 'mt.atualizado_em',
  },
  regras_comissoes: {
    regra: 'rc.nome',
    descricao: 'rc.descricao',
    percentual_padrao: 'rc.percentual_default',
    percentual_minimo: 'rc.percentual_min',
    percentual_maximo: 'rc.percentual_max',
    regra_ativa: 'rc.ativo',
    criado_em: 'rc.criado_em',
    atualizado_em: 'rc.atualizado_em',
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
      selectSql = `SELECT
        t.nome AS territorio,
        t.descricao,
        tp.nome AS territorio_pai,
        t.ativo,
        t.criado_em,
        t.atualizado_em`
      baseSql = `FROM comercial.territorios t
        LEFT JOIN comercial.territorios tp ON tp.id = t.territorio_pai_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY t.nome ASC'
    } else if (view === 'vendedores') {
      selectSql = `SELECT
        f.nome AS vendedor,
        f.email AS email,
        f.telefone AS telefone,
        t.nome AS territorio,
        t.descricao AS territorio_descricao,
        v.comissao_padrao AS comissao,
        v.ativo AS vendedor_ativo,
        v.criado_em,
        v.atualizado_em`
      baseSql = `FROM comercial.vendedores v
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = v.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY f.nome ASC'
    } else if (view === 'meta_vendedores') {
      selectSql = `SELECT
        f.nome AS vendedor,
        t.nome AS territorio,
        mv.periodo AS periodo,
        mv.valor_meta AS meta,
        mv.criado_em,
        mv.atualizado_em`
      baseSql = `FROM comercial.metas_vendedores mv
        LEFT JOIN comercial.vendedores v ON v.id = mv.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = v.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY mv.periodo DESC, f.nome ASC'
    } else if (view === 'meta_territorios') {
      selectSql = `SELECT
        t.nome AS territorio,
        t.descricao AS territorio_descricao,
        mt.periodo AS periodo,
        mt.valor_meta AS meta,
        mt.criado_em,
        mt.atualizado_em`
      baseSql = `FROM comercial.metas_territorios mt
        LEFT JOIN comercial.territorios t ON t.id = mt.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY mt.periodo DESC, t.nome ASC'
    } else if (view === 'regras_comissoes') {
      selectSql = `SELECT
        rc.nome AS regra,
        rc.descricao AS descricao,
        rc.percentual_default AS percentual_padrao,
        rc.percentual_min AS percentual_minimo,
        rc.percentual_max AS percentual_maximo,
        rc.ativo AS regra_ativa,
        rc.criado_em,
        rc.atualizado_em`
      baseSql = `FROM comercial.regras_comissao rc`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY rc.nome ASC'
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
