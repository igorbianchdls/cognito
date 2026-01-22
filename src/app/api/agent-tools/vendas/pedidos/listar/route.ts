import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    // Pagination
    const page = typeof payload.page === 'number' && payload.page > 0 ? payload.page : 1
    const pageSize = typeof payload.pageSize === 'number' && payload.pageSize > 0 ? Math.min(1000, payload.pageSize) : 20
    const offset = (page - 1) * pageSize

    // Query aligned with /api/modulos/vendas?view=pedidos
    const selectSql = `SELECT
      p.id               AS pedido_id,
      p.data_pedido,
      p.status,
      p.subtotal,
      p.desconto_total,
      p.valor_total,
      p.descricao        AS pedido_descricao,
      p.observacoes,

      c.nome_fantasia    AS cliente,

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
    const baseSql = `FROM vendas.pedidos p
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
    const orderClause = 'ORDER BY p.data_pedido ASC, c.nome_fantasia ASC, s.nome ASC'
    const listSql = `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim()

    let rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Aggregate items per pedido
    type PedidoItem = { item_id: unknown; servico_id?: unknown; servico: unknown; quantidade: unknown; preco_unitario: unknown; subtotal: unknown }
    type PedidoAgregado = {
      pedido: unknown
      cliente: unknown
      vendedor: unknown
      filial: unknown
      canal_venda: unknown
      canal_venda_id?: unknown
      data_pedido: unknown
      status: unknown
      valor_total: number
      itens: PedidoItem[]
      // Aliases for Chat UI convenience
      numero_pedido?: string
      valor_total_pedido?: number
    }
    const pedidosMap = new Map<number, PedidoAgregado>()
    for (const row of rows) {
      const pedidoId = Number(row.pedido_id)
      if (!pedidosMap.has(pedidoId)) {
        pedidosMap.set(pedidoId, {
          pedido: row.pedido_id,
          cliente: row.cliente,
          vendedor: row.vendedor,
          filial: row.filial,
          canal_venda: row.canal_venda,
          canal_venda_id: row.canal_venda_id,
          data_pedido: row.data_pedido,
          status: row.status,
          valor_total: Number(row.valor_total || 0),
          itens: [],
          numero_pedido: String(row.pedido_id ?? ''),
          valor_total_pedido: Number(row.valor_total || 0),
        })
      }
      if (row.item_id) {
        pedidosMap.get(pedidoId)!.itens.push({
          item_id: row.item_id,
          servico_id: undefined,
          servico: row.servico,
          quantidade: row.quantidade,
          preco_unitario: row.preco_unitario,
          subtotal: (row as any).subtotal_item ?? row.subtotal,
        })
      }
    }
    const outRows = Array.from(pedidosMap.values())

    // Total distinct pedidos
    const totalSql = `SELECT COUNT(DISTINCT p.id)::int AS total FROM vendas.pedidos p WHERE p.tenant_id = 1`
    const totalRows = await runQuery<{ total: number }>(totalSql)
    const count = totalRows[0]?.total ?? outRows.length

    const message = `${outRows.length} pedidos encontrados`
    return Response.json({ ok: true, result: { success: true, rows: outRows, count, message, sql_query: listSql } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
