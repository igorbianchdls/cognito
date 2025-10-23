import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'almoxarifados': {
    id: 'a.id',
    almoxarifado: 'a.nome',
    tipo: 'a.tipo',
    responsavel: 'a.responsavel',
    status: 'a.ativo',
    criado_em: 'a.criado_em',
  },
  'estoque-atual': {
    id: 'ea.id',
    produto: 'p.nome',
    almoxarifado: 'a.nome',
    quantidade_atual: 'ea.quantidade',
    custo_medio: 'ea.custo_medio',
    atualizado_em: 'ea.atualizado_em',
  },
  'movimentacoes': {
    id: 'm.id',
    produto: 'p.nome',
    almoxarifado: 'a.nome',
    tipo_movimento: 'm.tipo_movimento',
    data_movimento: 'm.data_movimento',
    valor_total: 'm.valor_total',
  },
  'transferencias': {
    id: 't.id',
    origem: 'ao.nome',
    destino: 'ad.nome',
    status: 't.status',
    data: 't.data_transferencia',
  },
  'inventarios': {
    id: 'i.id',
    almoxarifado: 'a.nome',
    status: 'i.status',
    inicio: 'i.data_inicio',
    fim: 'i.data_fim',
  },
  'custos-estoque': {
    id: 'c.id',
    produto: 'p.nome',
    metodo: 'c.metodo',
    fonte: 'c.fonte',
    custo: 'c.custo',
    data_referencia: 'c.data_referencia',
  },
  'tipos-movimentacao': {
    codigo: 'tm.codigo',
    descricao: 'tm.descricao',
    natureza: 'tm.natureza',
    status: 'tm.ativo',
  },
}

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    // Filtros comuns
    const de = searchParams.get('de') || undefined // YYYY-MM-DD
    const ate = searchParams.get('ate') || undefined // YYYY-MM-DD
    const q = searchParams.get('q') || undefined

    // Filtros específicos (opcionais)
    const almoxarifado_id = searchParams.get('almoxarifado_id') || undefined
    const produto_id = searchParams.get('produto_id') || undefined
    const status = searchParams.get('status') || undefined

    // Paginação
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20))
    const offset = (page - 1) * pageSize

    // Ordenação
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam] || undefined
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    let selectSql = ''
    let baseSql = ''
    let whereDateCol = ''

    if (view === 'almoxarifados') {
      selectSql = `SELECT a.id AS id,
                          a.nome AS almoxarifado,
                          a.tipo AS tipo,
                          a.endereco AS endereco,
                          a.responsavel AS responsavel,
                          CASE WHEN a.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                          a.criado_em AS criado_em`
      baseSql = `FROM estoque.almoxarifados a`
      whereDateCol = 'a.criado_em'
      if (status) push(`LOWER(CASE WHEN a.ativo THEN 'ativo' ELSE 'inativo' END) =`, status.toLowerCase())
      if (q) { conditions.push(`(a.nome ILIKE '%' || $${i} || '%' OR a.responsavel ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else if (view === 'estoque-atual') {
      selectSql = `SELECT ea.id AS id,
                          p.nome AS produto,
                          a.nome AS almoxarifado,
                          ea.quantidade AS quantidade_atual,
                          ea.custo_medio AS custo_medio,
                          ROUND(ea.quantidade * ea.custo_medio, 2) AS valor_total,
                          ea.atualizado_em AS atualizado_em`
      baseSql = `FROM estoque.estoques_atual ea
                 LEFT JOIN estoque.almoxarifados a ON ea.almoxarifado_id = a.id
                 LEFT JOIN produtos.produtos p ON ea.produto_id = p.id`
      whereDateCol = 'ea.atualizado_em'
      if (almoxarifado_id) push('ea.almoxarifado_id =', almoxarifado_id)
      if (produto_id) push('ea.produto_id =', produto_id)
      if (q) { conditions.push(`(p.nome ILIKE '%' || $${i} || '%' OR a.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else if (view === 'movimentacoes') {
      selectSql = `SELECT m.id AS id,
                          p.nome AS produto,
                          a.nome AS almoxarifado,
                          m.tipo_movimento AS tipo_movimento,
                          tm.descricao AS descricao_movimento,
                          tm.natureza AS natureza,
                          m.quantidade AS quantidade,
                          m.valor_unitario AS valor_unitario,
                          m.valor_total AS valor_total,
                          m.data_movimento AS data_movimento,
                          m.origem AS origem,
                          m.observacoes AS observacoes`
      baseSql = `FROM estoque.movimentacoes_estoque m
                 LEFT JOIN estoque.tipos_movimentacao tm ON m.tipo_codigo = tm.codigo
                 LEFT JOIN estoque.almoxarifados a ON m.almoxarifado_id = a.id
                 LEFT JOIN produtos.produtos p ON m.produto_id = p.id`
      whereDateCol = 'm.data_movimento'
      if (almoxarifado_id) push('m.almoxarifado_id =', almoxarifado_id)
      if (produto_id) push('m.produto_id =', produto_id)
      if (status) push('LOWER(m.tipo_movimento) =', status.toLowerCase()) // permite filtrar por tipo_movimento
      if (q) { conditions.push(`(p.nome ILIKE '%' || $${i} || '%' OR tm.descricao ILIKE '%' || $${i} || '%' OR COALESCE(m.observacoes,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else if (view === 'transferencias') {
      selectSql = `SELECT t.id AS id,
                          ao.nome AS origem,
                          ad.nome AS destino,
                          t.responsavel AS responsavel,
                          t.status AS status,
                          t.data_transferencia AS data,
                          p.nome AS produto,
                          ti.quantidade AS quantidade,
                          ti.observacoes AS observacoes`
      baseSql = `FROM estoque.transferencias_estoque t
                 LEFT JOIN estoque.transferencias_itens ti ON ti.transferencia_id = t.id
                 LEFT JOIN estoque.almoxarifados ao ON t.origem_id = ao.id
                 LEFT JOIN estoque.almoxarifados ad ON t.destino_id = ad.id
                 LEFT JOIN produtos.produtos p ON ti.produto_id = p.id`
      whereDateCol = 't.data_transferencia'
      if (status) push('LOWER(t.status) =', status.toLowerCase())
      if (almoxarifado_id) { conditions.push(`(t.origem_id = $${i} OR t.destino_id = $${i})`); params.push(almoxarifado_id); i += 1 }
      if (produto_id) push('ti.produto_id =', produto_id)
      if (q) { conditions.push(`(p.nome ILIKE '%' || $${i} || '%' OR COALESCE(ti.observacoes,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else if (view === 'inventarios') {
      selectSql = `SELECT i.id AS id,
                          a.nome AS almoxarifado,
                          i.responsavel AS responsavel,
                          i.status AS status,
                          i.data_inicio AS inicio,
                          i.data_fim AS fim,
                          p.nome AS produto,
                          ii.quantidade_sistema AS qtde_sistema,
                          ii.quantidade_contada AS qtde_contada,
                          ii.diferenca AS diferenca,
                          CASE WHEN ii.ajuste_gerado THEN 'Sim' ELSE 'Não' END AS ajuste_gerado`
      baseSql = `FROM estoque.inventarios i
                 LEFT JOIN estoque.inventarios_itens ii ON ii.inventario_id = i.id
                 LEFT JOIN estoque.almoxarifados a ON i.almoxarifado_id = a.id
                 LEFT JOIN produtos.produtos p ON ii.produto_id = p.id`
      whereDateCol = 'i.data_inicio'
      if (status) push('LOWER(i.status) =', status.toLowerCase())
      if (almoxarifado_id) push('i.almoxarifado_id =', almoxarifado_id)
      if (produto_id) push('ii.produto_id =', produto_id)
      if (q) { conditions.push(`(p.nome ILIKE '%' || $${i} || '%' OR i.responsavel ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else if (view === 'custos-estoque') {
      selectSql = `SELECT c.id AS id,
                          p.nome AS produto,
                          c.metodo AS metodo,
                          c.fonte AS fonte,
                          c.custo AS custo,
                          c.data_referencia AS data_referencia,
                          c.criado_em AS registrado_em`
      baseSql = `FROM estoque.custos_estoque c
                 LEFT JOIN produtos.produtos p ON c.produto_id = p.id`
      whereDateCol = 'c.data_referencia'
      if (produto_id) push('c.produto_id =', produto_id)
      if (q) { conditions.push(`(p.nome ILIKE '%' || $${i} || '%' OR c.metodo ILIKE '%' || $${i} || '%' OR c.fonte ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else if (view === 'tipos-movimentacao') {
      selectSql = `SELECT tm.codigo AS codigo,
                          tm.descricao AS descricao,
                          tm.natureza AS natureza,
                          CASE WHEN tm.gera_financeiro THEN 'Sim' ELSE 'Não' END AS gera_financeiro,
                          CASE WHEN tm.ativo THEN 'Ativo' ELSE 'Inativo' END AS status`
      baseSql = `FROM estoque.tipos_movimentacao tm`
      if (status) push(`LOWER(CASE WHEN tm.ativo THEN 'ativo' ELSE 'inativo' END) =`, status.toLowerCase())
      if (q) { conditions.push(`(tm.descricao ILIKE '%' || $${i} || '%' OR tm.natureza ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de && whereDateCol) { push(`${whereDateCol} >=`, de) }
    if (ate && whereDateCol) { push(`${whereDateCol} <=`, ate) }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    // Ordenação default quando não informado
    let orderClause = ''
    if (Object.keys(ORDER_BY_WHITELIST[view] || {}).length) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`
      else {
        if (view === 'almoxarifados') orderClause = 'ORDER BY a.nome ASC'
        else if (view === 'estoque-atual') orderClause = 'ORDER BY a.nome ASC, p.nome ASC'
        else if (view === 'movimentacoes') orderClause = 'ORDER BY m.data_movimento DESC'
        else if (view === 'transferencias') orderClause = 'ORDER BY t.data_transferencia DESC'
        else if (view === 'inventarios') orderClause = 'ORDER BY i.data_inicio DESC, p.nome ASC'
        else if (view === 'custos-estoque') orderClause = 'ORDER BY c.data_referencia DESC'
        else if (view === 'tipos-movimentacao') orderClause = 'ORDER BY tm.natureza ASC, tm.descricao ASC'
      }
    }

    // Paginação (sem GROUP BY explícito nas queries atuais)
    const limitOffset = `LIMIT $${i}::int OFFSET $${i + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    // total
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
    console.error('📦 API /api/modulos/estoque error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

