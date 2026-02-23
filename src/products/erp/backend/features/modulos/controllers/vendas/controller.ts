import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { ORDER_BY_WHITELIST } from './query/orderByWhitelist'
import { parseVendasRequest } from './query/parseVendasRequest'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { view, page, pageSize, offset, orderBy, orderDir } = parseVendasRequest(searchParams, ORDER_BY_WHITELIST)
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    let selectSql = ''
    let baseSql = ''
    let orderClause = ''
    let hasNumeroPedidoCol = false

    if (view === 'pedidos') {
      const cols = await runQuery<{ column_name: string }>(
        `SELECT column_name
           FROM information_schema.columns
          WHERE table_schema = 'vendas'
            AND table_name = 'pedidos'`
      )
      hasNumeroPedidoCol = cols.some((c) => c.column_name === 'numero_pedido')
    }

    if (view === 'pedidos') {
      const numeroPedidoExpr = hasNumeroPedidoCol
        ? 'p.numero_pedido'
        : "('PV-' || p.id::text)"
      // Implementa a query fornecida (com IDs auxiliares para agregação)
      selectSql = `SELECT
        p.id               AS pedido_id,
        ${numeroPedidoExpr} AS numero_pedido,
        p.data_pedido,
        p.data_documento,
        p.data_lancamento,
        p.data_vencimento,
        p.status,
        p.subtotal,
        p.desconto_total,
        p.valor_total,
        p.descricao        AS pedido_descricao,
        p.observacoes,

        c.nome_fantasia    AS cliente,
        c.imagem_url       AS cliente_imagem_url,

        f.nome             AS vendedor,

        t.nome             AS territorio,
        cv.nome            AS canal_venda,
        camp.nome          AS campanha_venda,
        cr.nome            AS categoria_receita,
        cl.nome            AS centro_lucro,
        fil.nome           AS filial,
        un.nome            AS unidade_negocio,

        s.nome             AS servico,
        pi.quantidade,
        pi.preco_unitario,
        pi.desconto        AS desconto_item,
        pi.subtotal        AS subtotal_item,
        pi.id              AS item_id,
        p.canal_venda_id   AS canal_venda_id`
      baseSql = `FROM vendas.pedidos p
        JOIN vendas.pedidos_itens pi      ON pi.pedido_id = p.id
        JOIN entidades.clientes c         ON c.id = p.cliente_id
        JOIN servicos.catalogo_servicos s ON s.id = pi.servico_id
        LEFT JOIN comercial.vendedores v  ON v.id = p.vendedor_id
        LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
        LEFT JOIN vendas.canais_venda cv  ON cv.id = p.canal_venda_id
        LEFT JOIN comercial.campanhas_vendas camp ON camp.id = p.campanha_venda_id
        LEFT JOIN financeiro.categorias_receita cr ON cr.id = p.categoria_receita_id
        LEFT JOIN empresa.centros_lucro cl ON cl.id = p.centro_lucro_id
        LEFT JOIN empresa.filiais fil      ON fil.id = p.filial_id
        LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
        WHERE p.tenant_id = 1`
      orderClause = 'ORDER BY p.data_pedido ASC, c.nome_fantasia ASC, s.nome ASC'
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
        cv.id AS canal_venda,
        cv.nome AS nome_canal_venda,
        cv.descricao AS descricao_canal_venda,
        cv.ativo,
        cd.nome AS canal_distribuicao,
        cd.descricao AS descricao_canal_distribuicao,
        cv.criado_em,
        cv.atualizado_em`
      baseSql = `FROM vendas.canais_venda cv
        LEFT JOIN vendas.canais_distribuicao cd ON cd.id = cv.canal_distribuicao_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY cd.nome ASC, cv.nome ASC'
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
    } else if (view === 'canais_distribuicao') {
      selectSql = `SELECT
        cd.id AS canal_distribuicao,
        cd.nome AS nome_canal,
        cd.descricao,
        cd.ativo,
        cd.criado_em,
        cd.atualizado_em`
      baseSql = `FROM vendas.canais_distribuicao cd`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY cd.nome ASC'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim()
    let rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Para pedidos, agrupar itens (cabeçalho + linhas) a partir da query única
    if (view === 'pedidos') {
      type PedidoItem = {
        item_id: unknown
        servico_id: unknown
        servico: unknown
        quantidade: unknown
        preco_unitario: unknown
        subtotal: unknown
      }
      type PedidoAgregado = {
        pedido: unknown
        numero_pedido: unknown
        cliente: unknown
        cliente_imagem_url?: unknown
        vendedor: unknown
        filial: unknown
        canal_venda: unknown
        canal_venda_id?: unknown
        data_pedido: unknown
        data_documento: unknown
        data_lancamento: unknown
        data_vencimento: unknown
        status: unknown
        valor_total: number
        itens: PedidoItem[]
      }

      const headers = rows as Record<string, unknown>[]
      const pedidosMap = new Map<number, PedidoAgregado>()
      for (const row of headers) {
        const pedidoId = Number(row.pedido_id)
        if (!pedidosMap.has(pedidoId)) {
          pedidosMap.set(pedidoId, {
            pedido: row.pedido_id,
            numero_pedido: row.numero_pedido,
            cliente: row.cliente,
            cliente_imagem_url: row.cliente_imagem_url,
            vendedor: row.vendedor,
            filial: row.filial,
            canal_venda: row.canal_venda,
            canal_venda_id: row.canal_venda_id,
            data_pedido: row.data_pedido,
            data_documento: row.data_documento,
            data_lancamento: row.data_lancamento,
            data_vencimento: row.data_vencimento,
            status: row.status,
            valor_total: Number(row.valor_total || 0),
            itens: []
          })
        }
        // item desta linha
        if (row.item_id) {
          pedidosMap.get(pedidoId)!.itens.push({
            item_id: row.item_id,
            servico_id: undefined,
            servico: row.servico,
            quantidade: row.quantidade,
            preco_unitario: row.preco_unitario,
            subtotal: row.subtotal_item ?? row.subtotal,
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
      ? `SELECT COUNT(DISTINCT p.id)::int AS total FROM vendas.pedidos p WHERE p.tenant_id = 1`
      : view === 'devolucoes'
      ? `SELECT COUNT(DISTINCT d.id)::int AS total FROM vendas.devolucoes d`
      : view === 'tabelas_preco'
      ? `SELECT COUNT(DISTINCT tp.id)::int AS total FROM vendas.tabelas_preco tp`
      : view === 'promocoes'
      ? `SELECT COUNT(DISTINCT pr.id)::int AS total FROM vendas.promocoes pr`
      : view === 'canais_distribuicao'
      ? `SELECT COUNT(DISTINCT cd.id)::int AS total FROM vendas.canais_distribuicao cd`
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
