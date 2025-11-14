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
    cupom: 'cup.codigo',
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
  tabelas_preco: {
    tabela_preco: 'tp.id',
    nome_tabela: 'tp.nome',
    descricao: 'tp.descricao',
    ativo: 'tp.ativo',
    criado_em: 'tp.criado_em',
    atualizado_em: 'tp.atualizado_em',
  },
  promocoes: {
    promocao: 'pr.id',
    nome_promocao: 'pr.nome',
    tipo_desconto: 'pr.tipo',
    valor_desconto: 'pr.valor',
    valor_minimo: 'pr.valor_minimo',
    data_inicio: 'pr.data_inicio',
    data_fim: 'pr.data_fim',
    ativo: 'pr.ativo',
    criado_em: 'pr.criado_em',
    atualizado_em: 'pr.atualizado_em',
  },
  regras_desconto: {
    regra: 'rd.id',
    nome_regra: 'rd.nome',
    tipo_regra: 'rd.tipo',
    quantidade_minima: 'rd.quantidade_minima',
    valor_minimo: 'rd.valor_minimo',
    tipo_desconto: 'rd.tipo_desconto',
    valor_desconto: 'rd.valor_desconto',
    ativo: 'rd.ativo',
    referencia: 'cv.nome', // ordering by joined coalesce is complex; fallback to cv.nome
    criado_em: 'rd.criado_em',
    atualizado_em: 'rd.atualizado_em',
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
        cup.codigo AS cupom,
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
        LEFT JOIN vendas.cupons cup ON cup.id = p.cupom_id
        LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
        LEFT JOIN produtos.produto pr ON pr.id = pi.produto_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}, pi.id ASC` : 'ORDER BY p.id ASC, pi.id ASC'
    } else if (view === 'devolucoes') {
      selectSql = `SELECT
        d.id AS devolucao,
        p.id AS pedido,
        c.nome_fantasia AS cliente,
        d.motivo,
        d.data_devolucao,
        d.valor_total,
        pr.nome AS produto,
        di.quantidade,
        di.valor_unitario,
        di.subtotal,
        di.id AS item_id,
        d.criado_em,
        d.atualizado_em`
      baseSql = `FROM vendas.devolucoes d
        LEFT JOIN vendas.pedidos p ON p.id = d.pedido_id
        LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
        LEFT JOIN vendas.devolucoes_itens di ON di.devolucao_id = d.id
        LEFT JOIN produtos.produto pr ON pr.id = di.produto_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}, di.id ASC` : 'ORDER BY d.id ASC, di.id ASC'
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
    } else if (view === 'tabelas_preco') {
      selectSql = `SELECT
        tp.id AS tabela_preco,
        tp.nome AS nome_tabela,
        tp.descricao,
        tp.ativo,
        tp.criado_em,
        tp.atualizado_em,
        p.nome AS produto,
        tpi.preco AS preco_produto,
        tpi.id AS item_id`
      baseSql = `FROM vendas.tabelas_preco tp
        LEFT JOIN vendas.tabelas_preco_itens tpi ON tpi.tabela_preco_id = tp.id
        LEFT JOIN produtos.produto p ON p.id = tpi.produto_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}, p.nome ASC` : 'ORDER BY tp.id ASC, p.nome ASC'
    } else if (view === 'promocoes') {
      selectSql = `SELECT
        pr.id AS promocao,
        pr.nome AS nome_promocao,
        pr.tipo AS tipo_desconto,
        pr.valor AS valor_desconto,
        pr.valor_minimo,
        pr.data_inicio,
        pr.data_fim,
        pr.ativo,
        pr.criado_em,
        pr.atualizado_em,
        p.nome AS produto,
        pp.id AS item_id`
      baseSql = `FROM vendas.promocoes pr
        LEFT JOIN vendas.promocoes_produtos pp ON pp.promocao_id = pr.id
        LEFT JOIN produtos.produto p ON p.id = pp.produto_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}, p.nome ASC` : 'ORDER BY pr.id ASC, p.nome ASC'
    } else if (view === 'regras_desconto') {
      selectSql = `SELECT
        rd.id AS regra,
        rd.nome AS nome_regra,
        rd.tipo AS tipo_regra,
        rd.quantidade_minima,
        rd.valor_minimo,
        rd.tipo_desconto,
        rd.valor_desconto,
        rd.ativo,
        COALESCE(cv.nome, fp.nome, cat.nome) AS referencia,
        rd.criado_em,
        rd.atualizado_em`
      baseSql = `FROM vendas.regras_desconto rd
        LEFT JOIN vendas.canais_venda cv ON rd.tipo = 'canal' AND cv.id = rd.referencia_id
        LEFT JOIN financeiro.metodos_pagamento fp ON rd.tipo = 'pagamento' AND fp.id = rd.referencia_id
        LEFT JOIN produtos.categorias cat ON rd.tipo = 'categoria' AND cat.id = rd.referencia_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY rd.id ASC'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim()
    let rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Para pedidos, agrupar itens
    if (view === 'pedidos') {
      type PedidoAgregado = {
        pedido: unknown
        cliente: unknown
        vendedor: unknown
        territorio: unknown
        canal_venda: unknown
        data_pedido: unknown
        status: unknown
        pedido_subtotal: unknown
        desconto_total: unknown
        valor_total: unknown
        criado_em: unknown
        atualizado_em: unknown
        itens: Array<{
          produto: unknown
          quantidade: unknown
          preco_unitario: unknown
          desconto_item: unknown
          subtotal_item: unknown
        }>
      }
      const pedidosMap = new Map<number, PedidoAgregado>()

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

    // Para devolucoes, agrupar itens
    if (view === 'devolucoes') {
      type DevolucaoAgregada = {
        devolucao: unknown
        pedido: unknown
        cliente: unknown
        motivo: unknown
        data_devolucao: unknown
        valor_total: unknown
        criado_em: unknown
        atualizado_em: unknown
        itens: Array<{
          produto: unknown
          quantidade: unknown
          valor_unitario: unknown
          subtotal: unknown
        }>
      }
      const devolucoesMap = new Map<number, DevolucaoAgregada>()

      for (const row of rows) {
        const devolucaoId = Number(row.devolucao)

        if (!devolucoesMap.has(devolucaoId)) {
          // Primeira vez vendo esta devolução
          devolucoesMap.set(devolucaoId, {
            devolucao: row.devolucao,
            pedido: row.pedido,
            cliente: row.cliente,
            motivo: row.motivo,
            data_devolucao: row.data_devolucao,
            valor_total: row.valor_total,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
            itens: []
          })
        }

        // Adicionar item se existir
        if (row.item_id) {
          devolucoesMap.get(devolucaoId)!.itens.push({
            produto: row.produto,
            quantidade: row.quantidade,
            valor_unitario: row.valor_unitario,
            subtotal: row.subtotal,
          })
        }
      }

      rows = Array.from(devolucoesMap.values())
    }

    // Para tabelas_preco, agrupar itens (produtos)
    if (view === 'tabelas_preco') {
      type TabelaAgregada = {
        tabela_preco: unknown
        nome_tabela: unknown
        descricao: unknown
        ativo: unknown
        criado_em: unknown
        atualizado_em: unknown
        itens: Array<{
          produto: unknown
          preco_produto: unknown
        }>
      }
      const tabelasMap = new Map<number, TabelaAgregada>()
      for (const row of rows) {
        const tpId = Number(row.tabela_preco)
        if (!tabelasMap.has(tpId)) {
          tabelasMap.set(tpId, {
            tabela_preco: row.tabela_preco,
            nome_tabela: row.nome_tabela,
            descricao: row.descricao,
            ativo: row.ativo,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
            itens: []
          })
        }
        if (row.item_id) {
          tabelasMap.get(tpId)!.itens.push({
            produto: row.produto,
            preco_produto: row.preco_produto,
          })
        }
      }
      rows = Array.from(tabelasMap.values())
    }
    if (view === 'promocoes') {
      type PromocaoAgregada = {
        promocao: unknown
        nome_promocao: unknown
        tipo_desconto: unknown
        valor_desconto: unknown
        valor_minimo: unknown
        data_inicio: unknown
        data_fim: unknown
        ativo: unknown
        criado_em: unknown
        atualizado_em: unknown
        itens: Array<{
          produto: unknown
        }>
      }
      const promosMap = new Map<number, PromocaoAgregada>()
      for (const row of rows) {
        const prId = Number(row.promocao)
        if (!promosMap.has(prId)) {
          promosMap.set(prId, {
            promocao: row.promocao,
            nome_promocao: row.nome_promocao,
            tipo_desconto: row.tipo_desconto,
            valor_desconto: row.valor_desconto,
            valor_minimo: row.valor_minimo,
            data_inicio: row.data_inicio,
            data_fim: row.data_fim,
            ativo: row.ativo,
            criado_em: row.criado_em,
            atualizado_em: row.atualizado_em,
            itens: []
          })
        }
        if (row.item_id) {
          promosMap.get(prId)!.itens.push({ produto: row.produto })
        }
      }
      rows = Array.from(promosMap.values())
    }

    // Total - para pedidos e devolucoes, contar apenas registros distintos
    const totalSql = view === 'pedidos'
      ? `SELECT COUNT(DISTINCT p.id)::int AS total FROM vendas.pedidos p`
      : view === 'devolucoes'
      ? `SELECT COUNT(DISTINCT d.id)::int AS total FROM vendas.devolucoes d`
      : view === 'tabelas_preco'
      ? `SELECT COUNT(DISTINCT tp.id)::int AS total FROM vendas.tabelas_preco tp`
      : view === 'promocoes'
      ? `SELECT COUNT(DISTINCT pr.id)::int AS total FROM vendas.promocoes pr`
      : view === 'regras_desconto'
      ? `SELECT COUNT(DISTINCT rd.id)::int AS total FROM vendas.regras_desconto rd`
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
