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
      mtWhere = `WHERE mt.periodo = date_trunc('month', CURRENT_DATE)`
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

