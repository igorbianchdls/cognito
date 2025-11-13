import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  pedidos: {
    pedido: 'p.id',
    cliente: 'c.nome_fantasia',
    vendedor: 'f.nome',
    territorio: 't.nome',
    canal_venda: 'cv.nome',
    data_pedido: 'p.data_pedido',
    status: 'p.status',
    subtotal: 'p.subtotal',
    desconto_total: 'p.desconto_total',
    valor_total: 'p.valor_total',
    criado_em: 'p.criado_em',
    atualizado_em: 'p.atualizado_em',
  },
  devolucoes: {
    devolucao: 'd.id',
    pedido: 'p.id',
    cliente: 'c.nome_fantasia',
    motivo: 'd.motivo',
    data_devolucao: 'd.data_devolucao',
    valor_total: 'd.valor_total',
    criado_em: 'd.criado_em',
    atualizado_em: 'd.atualizado_em',
  },
  cupons: {
    cupom: 'c.codigo',
    tipo_desconto: 'c.tipo',
    valor_desconto: 'c.valor',
    valor_minimo: 'c.valor_minimo',
    limite_uso_total: 'c.limite_uso_total',
    limite_uso_por_cliente: 'c.limite_uso_por_cliente',
    data_inicio: 'c.data_inicio',
    data_fim: 'c.data_fim',
    ativo: 'c.ativo',
    criado_em: 'c.criado_em',
    atualizado_em: 'c.atualizado_em',
  },
  canais: {
    canal: 'cv.nome',
    descricao: 'cv.descricao',
    ativo: 'cv.ativo',
    criado_em: 'cv.criado_em',
    atualizado_em: 'cv.atualizado_em',
  },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    // Paginação
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

    if (view === 'pedidos') {
      selectSql = `SELECT
        p.id AS pedido,
        c.nome_fantasia AS cliente,
        f.nome AS vendedor,
        t.nome AS territorio,
        cv.nome AS canal_venda,
        p.data_pedido,
        p.status,
        p.subtotal AS pedido_subtotal,
        p.desconto_total,
        p.valor_total,
        pr.nome AS produto,
        pi.quantidade,
        pi.preco_unitario,
        pi.desconto AS desconto_item,
        pi.subtotal AS subtotal_item,
        pi.id AS item_id,
        p.criado_em,
        p.atualizado_em`
      baseSql = `FROM vendas.pedidos p
        LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
        LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
        LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
        LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
        LEFT JOIN produtos.produtos pr ON pr.id = pi.produto_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}, pi.id ASC` : 'ORDER BY p.id ASC, pi.id ASC'
    } else if (view === 'devolucoes') {
      selectSql = `SELECT
        d.id AS devolucao,
        p.id AS pedido,
        c.nome_fantasia AS cliente,
        d.motivo,
        d.data_devolucao,
        d.valor_total,
        d.criado_em,
        d.atualizado_em`
      baseSql = `FROM vendas.devolucoes d
        LEFT JOIN vendas.pedidos p ON p.id = d.pedido_id
        LEFT JOIN entidades.clientes c ON c.id = p.cliente_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY d.id ASC'
    } else if (view === 'cupons') {
      selectSql = `SELECT
        c.codigo AS cupom,
        c.tipo AS tipo_desconto,
        c.valor AS valor_desconto,
        c.valor_minimo,
        c.limite_uso_total,
        c.limite_uso_por_cliente,
        c.data_inicio,
        c.data_fim,
        c.ativo,
        c.criado_em,
        c.atualizado_em`
      baseSql = `FROM vendas.cupons c`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY c.codigo ASC'
    } else if (view === 'canais') {
      selectSql = `SELECT
        cv.nome AS canal,
        cv.descricao,
        cv.ativo,
        cv.criado_em,
        cv.atualizado_em`
      baseSql = `FROM vendas.canais_venda cv`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY cv.nome ASC'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim()
    let rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Para pedidos, agrupar itens
    if (view === 'pedidos') {
      const pedidosMap = new Map<number, any>()

      for (const row of rows) {
        const pedidoId = Number(row.pedido)

        if (!pedidosMap.has(pedidoId)) {
          // Primeira vez vendo este pedido
          pedidosMap.set(pedidoId, {
            pedido: row.pedido,
            cliente: row.cliente,
            vendedor: row.vendedor,
            territorio: row.territorio,
            canal_venda: row.canal_venda,
            data_pedido: row.data_pedido,
            status: row.status,
            pedido_subtotal: row.pedido_subtotal,
            desconto_total: row.desconto_total,
            valor_total: row.valor_total,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
            itens: []
          })
        }

        // Adicionar item se existir
        if (row.item_id) {
          pedidosMap.get(pedidoId)!.itens.push({
            produto: row.produto,
            quantidade: row.quantidade,
            preco_unitario: row.preco_unitario,
            desconto_item: row.desconto_item,
            subtotal_item: row.subtotal_item,
          })
        }
      }

      rows = Array.from(pedidosMap.values())
    }

    // Total - para pedidos, contar apenas pedidos distintos
    const totalSql = view === 'pedidos'
      ? `SELECT COUNT(DISTINCT p.id)::int AS total FROM vendas.pedidos p`
      : `SELECT COUNT(*)::int AS total ${baseSql}`
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
    console.error('🛒 API /api/modulos/vendas error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
