import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const limitParam = searchParams.get('limit') || undefined
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 5))

    // WHERE for pedidos (p)
    const pConds: string[] = []
    const pParams: unknown[] = []
    let pi = 1
    if (de) { pConds.push(`p.data_pedido >= $${pi++}`); pParams.push(de) }
    if (ate) { pConds.push(`p.data_pedido <= $${pi++}`); pParams.push(ate) }
    const pWhere = pConds.length ? `WHERE ${pConds.join(' AND ')}` : ''

    // KPI: vendas, pedidos, descontos
    const vendasSql = `SELECT COALESCE(SUM(p.valor_total),0)::float AS vendas,
                              COUNT(DISTINCT p.id)::int AS pedidos,
                              COALESCE(SUM(p.desconto_total),0)::float AS descontos
                       FROM vendas.pedidos p
                       ${pWhere}`
    const [{ vendas, pedidos, descontos }] = await runQuery<{ vendas: number; pedidos: number; descontos: number }>(vendasSql, pParams)

    // KPI: itens vendidos (via itens de pedido)
    const itensSql = `SELECT COALESCE(SUM(pi.quantidade),0)::float AS itens
                      FROM vendas.pedidos_itens pi
                      JOIN vendas.pedidos p ON p.id = pi.pedido_id
                      ${pWhere}`
    const [{ itens }] = await runQuery<{ itens: number }>(itensSql, pParams)

    // KPI: meta (somatório de todas as metas de territórios)
    // Se houver período, somar metas cujos períodos estejam entre o mês de 'de' e o mês de 'ate'.
    const mtParams: unknown[] = []
    let mtWhere = ''
    if (de || ate) {
      const deMonth = de ? `date_trunc('month', $${mtParams.push(de)})` : `date_trunc('month', CURRENT_DATE)`
      const ateMonth = ate ? `date_trunc('month', $${mtParams.push(ate)})` : `date_trunc('month', CURRENT_DATE)`
      mtWhere = `WHERE mt.periodo >= ${deMonth} AND mt.periodo <= ${ateMonth}`
    } else {
      // Sem período, considerar todas as metas (todos os territórios)
      mtWhere = ''
    }
    const metaSql = `SELECT COALESCE(SUM(mt.valor_meta),0)::float AS meta
                     FROM comercial.metas_territorios mt
                     ${mtWhere}`
    const [{ meta }] = await runQuery<{ meta: number }>(metaSql, mtParams)

    const vendasNum = Number(vendas || 0)
    const pedidosNum = Number(pedidos || 0)
    const descontosNum = Number(descontos || 0)
    const itensNum = Number(itens || 0)
    const metaNum = Number(meta || 0)

    const ticketMedio = pedidosNum > 0 ? vendasNum / pedidosNum : 0
    const percentMeta = metaNum > 0 ? (vendasNum / metaNum) * 100 : 0

    // COGS/Margem: placeholders (0) até termos custo real
    const cogs = 0
    const margemBruta = vendasNum > 0 ? ((vendasNum - cogs) / vendasNum) * 100 : 0

    // Charts
    type ChartItem = { label: string; value: number }
    // Vendedores
    const vendSql = `SELECT COALESCE(f.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                     FROM vendas.pedidos p
                     LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
                     LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                     ${pWhere}
                     GROUP BY 1
                     ORDER BY 2 DESC
                     LIMIT $${pParams.length + 1}::int`;
    const vendedores = await runQuery<ChartItem>(vendSql, [...pParams, limit])

    // Produtos (por subtotal do item)
    const prodSql = `SELECT COALESCE(pr.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                     FROM vendas.pedidos p
                     JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                     LEFT JOIN produtos.produto pr ON pr.id = pi.produto_id
                     ${pWhere}
                     GROUP BY 1
                     ORDER BY 2 DESC
                     LIMIT $${pParams.length + 1}::int`;
    const produtos = await runQuery<ChartItem>(prodSql, [...pParams, limit])

    // Territórios
    const terrSql = `SELECT COALESCE(t.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                     FROM vendas.pedidos p
                     LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
                     ${pWhere}
                     GROUP BY 1
                     ORDER BY 2 DESC
                     LIMIT $${pParams.length + 1}::int`;
    const territorios = await runQuery<ChartItem>(terrSql, [...pParams, limit])

    // Categorias de produto
    const catSql = `SELECT COALESCE(cat.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                    FROM vendas.pedidos p
                    JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                    LEFT JOIN produtos.produto pr ON pr.id = pi.produto_id
                    LEFT JOIN produtos.categorias cat ON cat.id = pr.categoria_id
                    ${pWhere}
                    GROUP BY 1
                    ORDER BY 2 DESC
                    LIMIT $${pParams.length + 1}::int`;
    const categorias = await runQuery<ChartItem>(catSql, [...pParams, limit])

    // Canais de venda
    const canaisSql = `SELECT COALESCE(cv.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                       FROM vendas.pedidos p
                       LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    const canais = await runQuery<ChartItem>(canaisSql, [...pParams, limit])

    // Top clientes
    const topClientesSql = `SELECT COALESCE(c.nome_fantasia,'—') AS cliente,
                                   COALESCE(SUM(p.valor_total),0)::float AS total,
                                   COUNT(DISTINCT p.id)::int AS pedidos
                            FROM vendas.pedidos p
                            LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                            ${pWhere}
                            GROUP BY 1
                            ORDER BY 2 DESC
                            LIMIT $${pParams.length + 1}::int`;
    const topClientes = await runQuery<{ cliente: string; total: number; pedidos: number }>(topClientesSql, [...pParams, limit])

    // Vendas por Cidade/UF
    const cidadeSql = `SELECT COALESCE(CONCAT_WS(' - ', c.cidade, c.uf), '—') AS cidade, COALESCE(SUM(p.valor_total),0)::float AS total
                       FROM vendas.pedidos p
                       LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    const vendasCidade = await runQuery<{ cidade: string; total: number }>(cidadeSql, [...pParams, limit])

    return Response.json(
      {
        success: true,
        kpis: {
          vendas: vendasNum,
          pedidos: pedidosNum,
          descontos: descontosNum,
          itensVendidos: itensNum,
          meta: metaNum,
          ticketMedio,
          percentMeta,
          cogs,
          margemBruta,
        },
        charts: {
          vendedores,
          produtos,
          territorios,
          categorias,
          canais,
          clientes: topClientes,
          cidades: vendasCidade,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('🛒 API /api/modulos/vendas/dashboard error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
