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

    // WHERE for devolucoes (d)
    const dConds: string[] = []
    const dParams: unknown[] = []
    let di = 1
    if (de) { dConds.push(`d.data_devolucao >= $${di++}`); dParams.push(de) }
    if (ate) { dConds.push(`d.data_devolucao <= $${di++}`); dParams.push(ate) }
    const dWhere = dConds.length ? `WHERE ${dConds.join(' AND ')}` : ''

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
    let itensRes: { itens: number }[] = []
    try { itensRes = await runQuery<{ itens: number }>(itensSql, pParams) } catch (e) { console.error('🛒 VENDAS dashboard itensSql error:', e); itensRes = [{ itens: 0 }] }
    const [{ itens }] = itensRes

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
    let metaRes: { meta: number }[] = []
    try { metaRes = await runQuery<{ meta: number }>(metaSql, mtParams) } catch (e) { console.error('🛒 VENDAS dashboard metaSql error:', e); metaRes = [{ meta: 0 }] }
    const [{ meta }] = metaRes

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
    const vendSql = `SELECT COALESCE(f.nome_razao_social,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                     FROM vendas.pedidos p
                     LEFT JOIN comercial.vendedores v ON v.id = p.vendedor_id
                     LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                     ${pWhere}
                     GROUP BY 1
                     ORDER BY 2 DESC
                     LIMIT $${pParams.length + 1}::int`;
    let vendedores: ChartItem[] = []
    try { vendedores = await runQuery<ChartItem>(vendSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard vendedores error:', e); vendedores = [] }

    // Produtos (por subtotal do item)
    const prodSql = `SELECT COALESCE(pr.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                     FROM vendas.pedidos p
                     JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                     LEFT JOIN produtos.produto pr ON pr.id = pi.produto_id
                     ${pWhere}
                     GROUP BY 1
                     ORDER BY 2 DESC
                     LIMIT $${pParams.length + 1}::int`;
    let produtos: ChartItem[] = []
    try { produtos = await runQuery<ChartItem>(prodSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard produtos error:', e); produtos = [] }

    // Territórios
    const terrSql = `SELECT COALESCE(t.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                     FROM vendas.pedidos p
                     LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
                     ${pWhere}
                     GROUP BY 1
                     ORDER BY 2 DESC
                     LIMIT $${pParams.length + 1}::int`;
    let territorios: ChartItem[] = []
    try { territorios = await runQuery<ChartItem>(terrSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard territorios error:', e); territorios = [] }

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
    let categorias: ChartItem[] = []
    try { categorias = await runQuery<ChartItem>(catSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard categorias error:', e); categorias = [] }

    // Canais de venda
    const canaisSql = `SELECT COALESCE(cv.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                       FROM vendas.pedidos p
                       LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    let canais: ChartItem[] = []
    try { canais = await runQuery<ChartItem>(canaisSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais error:', e); canais = [] }

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
    let topClientes: { cliente: string; total: number; pedidos: number }[] = []
    try { topClientes = await runQuery<{ cliente: string; total: number; pedidos: number }>(topClientesSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard clientes error:', e); topClientes = [] }

    // Vendas por Cidade (somente c.cidade, sem UF)
    const cidadeSql = `SELECT COALESCE(c.cidade, '—') AS cidade, COALESCE(SUM(p.valor_total),0)::float AS total
                       FROM vendas.pedidos p
                       LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    let vendasCidade: { cidade: string; total: number }[] = []
    try { vendasCidade = await runQuery<{ cidade: string; total: number }>(cidadeSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard cidades error:', e); vendasCidade = [] }

    // Vendas por Centro de Lucro (corrigido para centros_lucro)
    const centroLucroSql = `SELECT COALESCE(cl.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                            FROM vendas.pedidos p
                            LEFT JOIN empresa.centros_lucro cl ON cl.id = p.centro_lucro_id
                            ${pWhere}
                            GROUP BY 1
                            ORDER BY 2 DESC
                            LIMIT $${pParams.length + 1}::int`;
    let centrosLucro: ChartItem[] = []
    try { centrosLucro = await runQuery<ChartItem>(centroLucroSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard centros_lucro error:', e); centrosLucro = [] }

    // Vendas por Campanha de Vendas
    const campanhaVendaSql = `SELECT COALESCE(camp.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                              FROM vendas.pedidos p
                              LEFT JOIN comercial.campanhas_vendas camp ON camp.id = p.campanha_venda_id
                              ${pWhere}
                              GROUP BY 1
                              ORDER BY 2 DESC
                              LIMIT $${pParams.length + 1}::int`;
    let campanhasVendas: ChartItem[] = []
    try { campanhasVendas = await runQuery<ChartItem>(campanhaVendaSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard campanhas_vendas error:', e); campanhasVendas = [] }

    // Vendas por Canal de Distribuição
    const canalDistribuicaoSql = `SELECT COALESCE(cd.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                                  FROM vendas.pedidos p
                                  LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                                  LEFT JOIN vendas.canais_distribuicao cd ON cd.id = cv.canal_distribuicao_id
                                  ${pWhere}
                                  GROUP BY 1
                                  ORDER BY 2 DESC
                                  LIMIT $${pParams.length + 1}::int`;
    let canaisDistribuicao: ChartItem[] = []
    try { canaisDistribuicao = await runQuery<ChartItem>(canalDistribuicaoSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais_distribuicao error:', e); canaisDistribuicao = [] }

    // Meta x Faturamento por Território
    const metaTerrSql = `SELECT COALESCE(t.nome,'—') AS label, COALESCE(SUM(mt.valor_meta),0)::float AS meta
                         FROM comercial.metas_territorios mt
                         LEFT JOIN comercial.territorios t ON t.id = mt.territorio_id
                         ${mtWhere}
                         GROUP BY 1`;
    let metasPorTerr: { label: string; meta: number }[] = []
    try { metasPorTerr = await runQuery<{ label: string; meta: number }>(metaTerrSql, mtParams) } catch (e) { console.error('🛒 VENDAS dashboard metas por território error:', e); metasPorTerr = [] }

    const fatTerrSql = `SELECT COALESCE(t.nome,'—') AS label, COALESCE(SUM(p.valor_total),0)::float AS faturamento
                        FROM vendas.pedidos p
                        LEFT JOIN comercial.territorios t ON t.id = p.territorio_id
                        ${pWhere}
                        GROUP BY 1`;
    let fatPorTerr: { label: string; faturamento: number }[] = []
    try { fatPorTerr = await runQuery<{ label: string; faturamento: number }>(fatTerrSql, pParams) } catch (e) { console.error('🛒 VENDAS dashboard faturamento por território error:', e); fatPorTerr = [] }

    const fatMap = new Map<string, number>(fatPorTerr.map(r => [r.label || '—', Number(r.faturamento || 0)]))
    const allTerrLabels = Array.from(new Set([ ...metasPorTerr.map(r => r.label || '—'), ...fatPorTerr.map(r => r.label || '—') ]))
    const metaTerritorio = allTerrLabels.map(label => ({
      label,
      meta: Number((metasPorTerr.find(r => (r.label||'—') === label)?.meta) || 0),
      faturamento: Number(fatMap.get(label) || 0),
    })).sort((a,b)=> (b.faturamento + b.meta) - (a.faturamento + a.meta)).slice(0, limit)

    // Vendas por Cupom
    const cupomSql = `SELECT COALESCE(cup.codigo, '—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                      FROM vendas.pedidos p
                      LEFT JOIN vendas.cupons cup ON cup.id = p.cupom_id
                      ${pWhere}
                      GROUP BY 1
                      ORDER BY 2 DESC
                      LIMIT $${pParams.length + 1}::int`;
    let cupons: ChartItem[] = []
    try { cupons = await runQuery<ChartItem>(cupomSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard cupons error:', e); cupons = [] }

    // Vendas por Estado (c.estado)
    const estadoSql = `SELECT COALESCE(c.estado, '—') AS label, COALESCE(SUM(p.valor_total),0)::float AS value
                       FROM vendas.pedidos p
                       LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    let estados: ChartItem[] = []
    try { estados = await runQuery<ChartItem>(estadoSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard estados error:', e); estados = [] }

    // Devolução por Canal (% = valor_devolucao / vendas)
    const devolCanalSql = `SELECT COALESCE(cv.nome,'—') AS canal, COALESCE(SUM(d.valor_total),0)::float AS devolucoes
                           FROM vendas.devolucoes d
                           LEFT JOIN vendas.pedidos p ON p.id = d.pedido_id
                           LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                           ${dWhere}
                           GROUP BY 1`;
    let devolucoesPorCanal: { canal: string; devolucoes: number }[] = []
    try { devolucoesPorCanal = await runQuery<{ canal: string; devolucoes: number }>(devolCanalSql, dParams) } catch (e) { console.error('🛒 VENDAS dashboard devolução canal error:', e); devolucoesPorCanal = [] }
    const vendasCanalFullSql = `SELECT COALESCE(cv.nome,'—') AS canal, COALESCE(SUM(p.valor_total),0)::float AS vendas
                                FROM vendas.pedidos p
                                LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                                ${pWhere}
                                GROUP BY 1`;
    let vendasPorCanalFull: { canal: string; vendas: number }[] = []
    try { vendasPorCanalFull = await runQuery<{ canal: string; vendas: number }>(vendasCanalFullSql, pParams) } catch (e) { console.error('🛒 VENDAS dashboard vendas canal full error:', e); vendasPorCanalFull = [] }
    const vendasCanalMap = new Map<string, number>(vendasPorCanalFull.map(r => [r.canal || '—', Number(r.vendas || 0)]))
    const taxaDevolucaoCanal = Array.from(new Set([...devolucoesPorCanal.map(r=>r.canal||'—'), ...vendasPorCanalFull.map(r=>r.canal||'—')]))
      .map(label => {
        const dev = Number((devolucoesPorCanal.find(r => (r.canal||'—') === label)?.devolucoes) || 0)
        const ven = Number(vendasCanalMap.get(label) || 0)
        return { label, value: ven > 0 ? (dev / ven) * 100 : 0 }
      })
      .sort((a,b)=> b.value - a.value)
      .slice(0, limit)

    // Devolução por Cliente (% = valor_devolucao / vendas)
    const devolClienteSql = `SELECT COALESCE(c.nome_fantasia,'—') AS cliente, COALESCE(SUM(d.valor_total),0)::float AS devolucoes
                             FROM vendas.devolucoes d
                             LEFT JOIN vendas.pedidos p ON p.id = d.pedido_id
                             LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                             ${dWhere}
                             GROUP BY 1`;
    let devolucoesPorCliente: { cliente: string; devolucoes: number }[] = []
    try { devolucoesPorCliente = await runQuery<{ cliente: string; devolucoes: number }>(devolClienteSql, dParams) } catch (e) { console.error('🛒 VENDAS dashboard devolução cliente error:', e); devolucoesPorCliente = [] }
    const vendasClienteFullSql = `SELECT COALESCE(c.nome_fantasia,'—') AS cliente, COALESCE(SUM(p.valor_total),0)::float AS vendas
                                  FROM vendas.pedidos p
                                  LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                                  ${pWhere}
                                  GROUP BY 1`;
    let vendasPorClienteFull: { cliente: string; vendas: number }[] = []
    try { vendasPorClienteFull = await runQuery<{ cliente: string; vendas: number }>(vendasClienteFullSql, pParams) } catch (e) { console.error('🛒 VENDAS dashboard vendas cliente full error:', e); vendasPorClienteFull = [] }
    const vendasClienteMap = new Map<string, number>(vendasPorClienteFull.map(r => [r.cliente || '—', Number(r.vendas || 0)]))
    const taxaDevolucaoCliente = Array.from(new Set([...devolucoesPorCliente.map(r=>r.cliente||'—'), ...vendasPorClienteFull.map(r=>r.cliente||'—')]))
      .map(label => {
        const dev = Number((devolucoesPorCliente.find(r => (r.cliente||'—') === label)?.devolucoes) || 0)
        const ven = Number(vendasClienteMap.get(label) || 0)
        return { label, value: ven > 0 ? (dev / ven) * 100 : 0 }
      })
      .sort((a,b)=> b.value - a.value)
      .slice(0, limit)

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
          centros_lucro: centrosLucro,
          campanhas_vendas: campanhasVendas,
          canais_distribuicao: canaisDistribuicao,
          estados,
          devolucao_canal: taxaDevolucaoCanal,
          devolucao_cliente: taxaDevolucaoCliente,
          meta_territorio: metaTerritorio,
          cupons,
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
