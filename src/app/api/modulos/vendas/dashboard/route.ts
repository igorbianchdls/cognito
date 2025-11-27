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
    const vendasSql = `SELECT COALESCE(SUM(pi.subtotal),0)::float AS vendas,
                              COUNT(DISTINCT p.id)::int AS pedidos,
                              COALESCE(SUM(pi.desconto),0)::float AS descontos
                       FROM vendas.pedidos p
                       LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
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
    // Se houver período, considerar o mês de início até o início do mês seguinte de 'ate' (intervalo aberto à direita).
    const mtParams: unknown[] = []
    let mtWhereMt = ''
    let mvWhere = ''
    if (de || ate) {
      const fromVal = de || ate!
      const toVal = ate || de!
      const fromExprMt = `date_trunc('month', $${mtParams.push(fromVal)})`
      const toExprMt = `date_trunc('month', $${mtParams.push(toVal)}) + interval '1 month'`
      mtWhereMt = `WHERE mt.periodo >= ${fromExprMt} AND mt.periodo < ${toExprMt}`
      mvWhere = `WHERE m.periodo >= ${fromExprMt} AND m.periodo < ${toExprMt}`
    } else {
      mtWhereMt = ''
      mvWhere = ''
    }
    const metaSql = `SELECT COALESCE(SUM(mt.valor_meta),0)::float AS meta
                     FROM comercial.metas_territorios mt
                     ${mtWhereMt}`
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

    // COGS (Cost of Goods Sold) - Custo real dos produtos vendidos
    const cogsSql = `SELECT COALESCE(SUM(pi.quantidade * pc.custo), 0)::float AS cogs
                     FROM vendas.pedidos p
                     JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                     LEFT JOIN LATERAL (
                       SELECT custo
                       FROM produtos.produto_custos
                       WHERE produto_id = pi.produto_id
                       ORDER BY data_referencia DESC
                       LIMIT 1
                     ) pc ON true
                     ${pWhere}`
    let cogsRes: { cogs: number }[] = []
    try { cogsRes = await runQuery<{ cogs: number }>(cogsSql, pParams) } catch (e) { console.error('🛒 VENDAS dashboard cogsSql error:', e); cogsRes = [{ cogs: 0 }] }
    const [{ cogs }] = cogsRes
    const cogsNum = Number(cogs || 0)
    const margemBruta = vendasNum > 0 ? ((vendasNum - cogsNum) / vendasNum) * 100 : 0

    // Charts
    type ChartItem = { label: string; value: number }
    // Vendedores (via view comercial.vw_pedidos_completo, sem filtro de período)
    const vendSql = `SELECT vendedor_nome AS label,
                     COALESCE(SUM(item_subtotal),0)::float AS value
                     FROM comercial.vw_pedidos_completo
                     GROUP BY vendedor_nome
                     ORDER BY value DESC
                     LIMIT $1::int`;
    let vendedores: ChartItem[] = []
    try { vendedores = await runQuery<ChartItem>(vendSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard vendedores error:', e); vendedores = [] }

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

    // Serviços (via view comercial.vw_pedidos_completo, sem filtro de período)
    const servSql = `SELECT servico_nome AS label,
                     COALESCE(SUM(item_subtotal),0)::float AS value
                     FROM comercial.vw_pedidos_completo
                     GROUP BY servico_nome
                     ORDER BY value DESC
                     LIMIT $1::int`;
    let servicos: ChartItem[] = []
    try { servicos = await runQuery<ChartItem>(servSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard servicos error:', e); servicos = [] }

    // Territórios (via view comercial.vw_pedidos_completo, sem filtro de período)
    const terrSql = `SELECT territorio_nome AS label,
                     COALESCE(SUM(item_subtotal),0)::float AS value
                     FROM comercial.vw_pedidos_completo
                     GROUP BY territorio_nome
                     ORDER BY value DESC
                     LIMIT $1::int`;
    let territorios: ChartItem[] = []
    try { territorios = await runQuery<ChartItem>(terrSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard territorios error:', e); territorios = [] }

    // Faturamento por Categoria de Serviço (via view comercial.vw_pedidos_completo, sem filtro de período)
    const catSql = `SELECT categoria_servico_nome AS label,
                           COALESCE(SUM(item_subtotal),0)::float AS value
                    FROM comercial.vw_pedidos_completo
                    GROUP BY categoria_servico_nome
                    ORDER BY value DESC
                    LIMIT $1::int`;
    let categorias: ChartItem[] = []
    try { categorias = await runQuery<ChartItem>(catSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard categorias error:', e); categorias = [] }

    // Canais de venda (via view comercial.vw_pedidos_completo, sem filtro de período)
    const canaisSql = `SELECT canal_venda_nome AS label,
                       COALESCE(SUM(item_subtotal),0)::float AS value
                       FROM comercial.vw_pedidos_completo
                       GROUP BY canal_venda_nome
                       ORDER BY value DESC
                       LIMIT $1::int`;
    let canais: ChartItem[] = []
    try { canais = await runQuery<ChartItem>(canaisSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais error:', e); canais = [] }

    // Top clientes
    const topClientesSql = `SELECT COALESCE(c.nome_fantasia,'—') AS cliente,
                                   COALESCE(SUM(pi.subtotal),0)::float AS total,
                                   COUNT(DISTINCT p.id)::int AS pedidos
                            FROM vendas.pedidos p
                            LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                            LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                            ${pWhere}
                            GROUP BY 1
                            ORDER BY 2 DESC
                            LIMIT $${pParams.length + 1}::int`;
    let topClientes: { cliente: string; total: number; pedidos: number }[] = []
    try { topClientes = await runQuery<{ cliente: string; total: number; pedidos: number }>(topClientesSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard clientes error:', e); topClientes = [] }

    // Vendas por Cidade (somente c.cidade, sem UF)
    const cidadeSql = `SELECT COALESCE(c.cidade, '—') AS cidade, COALESCE(SUM(pi.subtotal),0)::float AS total
                       FROM vendas.pedidos p
                       LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                       LEFT JOIN entidades.clientes c ON c.id = p.cliente_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    let vendasCidade: { cidade: string; total: number }[] = []
    try { vendasCidade = await runQuery<{ cidade: string; total: number }>(cidadeSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard cidades error:', e); vendasCidade = [] }

    // Vendas por Centro de Lucro (corrigido para centros_lucro)
    const centroLucroSql = `SELECT COALESCE(cl.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                            FROM vendas.pedidos p
                            LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                            LEFT JOIN empresa.centros_lucro cl ON cl.id = p.centro_lucro_id
                            ${pWhere}
                            GROUP BY 1
                            ORDER BY 2 DESC
                            LIMIT $${pParams.length + 1}::int`;
    let centrosLucro: ChartItem[] = []
    try { centrosLucro = await runQuery<ChartItem>(centroLucroSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard centros_lucro error:', e); centrosLucro = [] }

    // Vendas por Campanha de Vendas
    const campanhaVendaSql = `SELECT COALESCE(camp.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                              FROM vendas.pedidos p
                              LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                              LEFT JOIN comercial.campanhas_vendas camp ON camp.id = p.campanha_venda_id
                              ${pWhere}
                              GROUP BY 1
                              ORDER BY 2 DESC
                              LIMIT $${pParams.length + 1}::int`;
    let campanhasVendas: ChartItem[] = []
    try { campanhasVendas = await runQuery<ChartItem>(campanhaVendaSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard campanhas_vendas error:', e); campanhasVendas = [] }

    // Vendas por Canal de Distribuição (via view comercial.vendas_vw, sem filtro de período)
    const canalDistribuicaoSql = `SELECT canal_distribuicao_nome AS label,
                                  COALESCE(SUM(item_subtotal),0)::float AS value
                                  FROM comercial.vendas_vw
                                  GROUP BY canal_distribuicao_nome
                                  ORDER BY value DESC
                                  LIMIT $1::int`;
    let canaisDistribuicao: ChartItem[] = []
    try { canaisDistribuicao = await runQuery<ChartItem>(canalDistribuicaoSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais_distribuicao error:', e); canaisDistribuicao = [] }

    // Canais de Distribuição (agregado: faturamento, pedidos, ticket médio por pedido) somente concluídos
    const cdWhere = pWhere ? `${pWhere} AND p.status = 'concluido'` : `WHERE p.status = 'concluido'`
    const canaisDistribuicaoAggSql = `SELECT
                                        COALESCE(cd.nome,'—') AS nome,
                                        COALESCE(SUM(i.subtotal),0)::float AS faturamento_total,
                                        COUNT(DISTINCT p.id)::int AS pedidos_distintos,
                                        COALESCE(SUM(i.subtotal) / NULLIF(COUNT(DISTINCT p.id), 0), 0)::float AS ticket_medio
                                      FROM vendas.pedidos_itens i
                                      LEFT JOIN vendas.pedidos p ON p.id = i.pedido_id
                                      LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                                      LEFT JOIN vendas.canais_distribuicao cd ON cd.id = cv.canal_distribuicao_id
                                      ${cdWhere}
                                      GROUP BY 1
                                      ORDER BY faturamento_total DESC
                                      LIMIT $${pParams.length + 1}::int`;
    type CanalDistribRow = { nome: string; faturamento_total: number; pedidos_distintos: number; ticket_medio: number }
    let canaisDistribAgg: CanalDistribRow[] = []
    try { canaisDistribAgg = await runQuery<CanalDistribRow>(canaisDistribuicaoAggSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais_distrib agg error:', e); canaisDistribAgg = [] }
    // Pedidos por Canal de Distribuição (via view comercial.vendas_vw)
    const canalDistribuicaoPedidosViewSql = `SELECT canal_distribuicao_nome AS label,
                                                    COUNT(DISTINCT pedido_id)::int AS value
                                             FROM comercial.vendas_vw
                                             GROUP BY canal_distribuicao_nome
                                             ORDER BY value DESC
                                             LIMIT $1::int`;
    let canaisDistribuicaoPedidos: ChartItem[] = []
    try { canaisDistribuicaoPedidos = await runQuery<ChartItem>(canalDistribuicaoPedidosViewSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais_distrib pedidos(view) error:', e); canaisDistribuicaoPedidos = [] }

    // Ticket médio por Canal de Distribuição (via view comercial.vendas_vw)
    const canalDistribuicaoTicketViewSql = `SELECT canal_distribuicao_nome AS label,
                                                   COALESCE(SUM(item_subtotal) / NULLIF(COUNT(DISTINCT pedido_id), 0), 0)::float AS value
                                            FROM comercial.vendas_vw
                                            GROUP BY canal_distribuicao_nome
                                            ORDER BY value DESC
                                            LIMIT $1::int`;
    let canaisDistribuicaoTicket: ChartItem[] = []
    try { canaisDistribuicaoTicket = await runQuery<ChartItem>(canalDistribuicaoTicketViewSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard canais_distrib ticket(view) error:', e); canaisDistribuicaoTicket = [] }

    // Faturamento por Marca
    const marcasSql = `SELECT COALESCE(m.nome,'—') AS label, COALESCE(SUM(pi.quantidade * pi.preco_unitario),0)::float AS value
                       FROM vendas.pedidos p
                       JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                       LEFT JOIN produtos.produto pr ON pr.id = pi.produto_id
                       LEFT JOIN produtos.marcas m ON m.id = pr.marca_id
                       ${pWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${pParams.length + 1}::int`;
    let marcas: ChartItem[] = []
    try { marcas = await runQuery<ChartItem>(marcasSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard marcas error:', e); marcas = [] }

    // Faturamento por Filial
    const filiaisSql = `SELECT COALESCE(f.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                        FROM vendas.pedidos p
                        LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                        LEFT JOIN empresa.filiais f ON f.id = p.filial_id
                        ${pWhere}
                        GROUP BY 1
                        ORDER BY 2 DESC
                        LIMIT $${pParams.length + 1}::int`;
    let filiais: ChartItem[] = []
    try { filiais = await runQuery<ChartItem>(filiaisSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard filiais error:', e); filiais = [] }

    // Vendas por Business Unit (Unidade de Negócio)
    const unidadesNegocioSql = `SELECT COALESCE(un.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                                FROM vendas.pedidos p
                                LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                                LEFT JOIN empresa.unidades_negocio un ON un.id = p.unidade_negocio_id
                                ${pWhere}
                                GROUP BY 1
                                ORDER BY 2 DESC
                                LIMIT $${pParams.length + 1}::int`;
    let unidadesNegocio: ChartItem[] = []
    try { unidadesNegocio = await runQuery<ChartItem>(unidadesNegocioSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard unidades_negocio error:', e); unidadesNegocio = [] }

    // Faturamento por Sales Office
    const salesOfficesSql = `SELECT COALESCE(so.nome,'—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                             FROM vendas.pedidos p
                             LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                             LEFT JOIN comercial.sales_offices so ON so.id = p.sales_office_id
                             ${pWhere}
                             GROUP BY 1
                             ORDER BY 2 DESC
                             LIMIT $${pParams.length + 1}::int`;
    let salesOffices: ChartItem[] = []
    try { salesOffices = await runQuery<ChartItem>(salesOfficesSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard sales_offices error:', e); salesOffices = [] }

    // Categorias de Serviços: faturamento, ticket médio (por item), e número de pedidos por categoria
    const servCatWhere = pWhere ? `${pWhere} AND p.status = 'concluido'` : `WHERE p.status = 'concluido'`
    const servCatSql = `SELECT
                          COALESCE(cat.id, 0)::int AS categoria_id,
                          COALESCE(cat.nome, '—') AS categoria_nome,
                          COALESCE(SUM(i.subtotal), 0)::float AS faturamento_total,
                          COALESCE(SUM(i.quantidade), 0)::float AS quantidade_total,
                          COALESCE(AVG(i.subtotal), 0)::float AS ticket_medio_item,
                          COUNT(DISTINCT p.id)::int AS pedidos_distintos
                        FROM vendas.pedidos_itens i
                        LEFT JOIN vendas.pedidos p ON p.id = i.pedido_id
                        LEFT JOIN servicos.catalogo_servicos s ON s.id = i.servico_id
                        LEFT JOIN servicos.categorias_servicos cat ON cat.id = s.categoria_id
                        ${servCatWhere}
                        GROUP BY cat.id, cat.nome
                        ORDER BY faturamento_total DESC
                        LIMIT $${pParams.length + 1}::int`;
    type ServCatRow = { categoria_nome: string; faturamento_total: number; quantidade_total: number; ticket_medio_item: number; pedidos_distintos: number }
    let servCatRows: ServCatRow[] = []
    try { servCatRows = await runQuery<ServCatRow>(servCatSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard servicos categorias error:', e); servCatRows = [] }
    const servicosCategoriasFaturamento: ChartItem[] = servCatRows.map(r => ({ label: r.categoria_nome || '—', value: Number(r.faturamento_total || 0) }))

    // Ticket médio por Categoria de Serviço (via view comercial.vw_pedidos_completo)
    const servCatTicketViewSql = `SELECT categoria_servico_nome AS label,
                                         COALESCE(SUM(item_subtotal) / NULLIF(COUNT(DISTINCT pedido_id), 0), 0)::float AS value
                                  FROM comercial.vw_pedidos_completo
                                  GROUP BY categoria_servico_nome
                                  ORDER BY value DESC
                                  LIMIT $1::int`;
    let servicosCategoriasTicketView: ChartItem[] = []
    try { servicosCategoriasTicketView = await runQuery<ChartItem>(servCatTicketViewSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard serv_cat_ticket(view) error:', e); servicosCategoriasTicketView = [] }

    // Pedidos por Categoria de Serviço (via view comercial.vw_pedidos_completo)
    const servCatPedidosViewSql = `SELECT categoria_servico_nome AS label,
                                          COUNT(DISTINCT pedido_id)::int AS value
                                   FROM comercial.vw_pedidos_completo
                                   GROUP BY categoria_servico_nome
                                   ORDER BY value DESC
                                   LIMIT $1::int`;
    let servicosCategoriasPedidosView: ChartItem[] = []
    try { servicosCategoriasPedidosView = await runQuery<ChartItem>(servCatPedidosViewSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard serv_cat_pedidos(view) error:', e); servicosCategoriasPedidosView = [] }

    // Meta x Faturamento por Território (Novembro/2025) — via view comercial.vw_vendas_metas
    const metaFatTerrViewSQL = `
      SELECT
        territorio_nome AS label,
        COALESCE(SUM(subtotal),0)::float AS faturamento,
        COALESCE(MAX(meta_faturamento_territorio),0)::float AS meta
      FROM comercial.vw_vendas_metas
      WHERE EXTRACT(YEAR FROM data_pedido) = 2025
        AND EXTRACT(MONTH FROM data_pedido) = 11
      GROUP BY territorio_nome
      ORDER BY faturamento DESC
      LIMIT $1::int`;
    let metaTerritorio: { label: string; meta: number; faturamento: number }[] = []
    try { metaTerritorio = await runQuery<{ label: string; meta: number; faturamento: number }>(metaFatTerrViewSQL, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard meta_fat_territorio(view) error:', e); metaTerritorio = [] }

    // Meta x Ticket Médio por Território (Novembro/2025) — via view comercial.vw_vendas_metas
    const metaTicketTerrViewSQL = `
      SELECT
        territorio_nome AS label,
        COALESCE(MAX(meta_ticket_territorio),0)::float AS meta,
        CASE WHEN COUNT(DISTINCT pedido_id) > 0
             THEN COALESCE(SUM(subtotal),0)::float / NULLIF(COUNT(DISTINCT pedido_id), 0)
             ELSE 0 END AS realizado
      FROM comercial.vw_vendas_metas
      WHERE EXTRACT(YEAR FROM data_pedido) = 2025
        AND EXTRACT(MONTH FROM data_pedido) = 11
      GROUP BY territorio_nome
      ORDER BY territorio_nome
      LIMIT $1::int`;
    let metaTicketMedioTerritorio: { label: string; meta: number; realizado: number }[] = []
    try { metaTicketMedioTerritorio = await runQuery<{ label: string; meta: number; realizado: number }>(metaTicketTerrViewSQL, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard meta_ticket_territorio(view) error:', e); metaTicketMedioTerritorio = [] }

    // Meta x Novos Clientes por Território (Novembro/2025) — via view comercial.vw_vendas_metas
    const metaNovosTerrViewSQL = `WITH novos AS (
    SELECT
        territorio_id,
        COUNT(DISTINCT cliente_id) AS novos_clientes_real
    FROM comercial.vw_vendas_metas
    WHERE EXTRACT(YEAR FROM data_pedido) = 2025
      AND EXTRACT(MONTH FROM data_pedido) = 11
      AND cliente_id IN (
            SELECT cliente_id
            FROM vendas.pedidos
            GROUP BY cliente_id
            HAVING MIN(data_pedido) BETWEEN '2025-11-01' AND '2025-11-30'
      )
    GROUP BY territorio_id
)
SELECT
    vm.territorio_nome AS label,
    COALESCE(MAX(vm.meta_novos_clientes_territorio), 0)::float AS meta,
    COALESCE(n.novos_clientes_real, 0)::float AS realizado
FROM comercial.vw_vendas_metas vm
LEFT JOIN novos n ON n.territorio_id = vm.territorio_id
WHERE EXTRACT(YEAR FROM data_pedido) = 2025
  AND EXTRACT(MONTH FROM data_pedido) = 11
GROUP BY vm.territorio_nome, n.novos_clientes_real
ORDER BY vm.territorio_nome
LIMIT $1::int`;
    let metaNovosClientesTerritorio: { label: string; meta: number; realizado: number }[] = []
    try { metaNovosClientesTerritorio = await runQuery<{ label: string; meta: number; realizado: number }>(metaNovosTerrViewSQL, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard meta_novos_territorio(view) error:', e); metaNovosClientesTerritorio = [] }

    // Meta x Faturamento por Vendedor (Novembro/2025) — via view comercial.vw_vendas_metas
    const metaVendViewSql = `
      SELECT
        vendedor_nome AS label,
        COALESCE(SUM(subtotal),0)::float AS faturamento,
        COALESCE(MAX(meta_faturamento_vendedor),0)::float AS meta
      FROM comercial.vw_vendas_metas
      WHERE EXTRACT(YEAR FROM data_pedido) = 2025
        AND EXTRACT(MONTH FROM data_pedido) = 11
      GROUP BY vendedor_nome
      ORDER BY faturamento DESC
      LIMIT $1::int`;
    let metaVendedor: { label: string; meta: number; faturamento: number }[] = []
    try { metaVendedor = await runQuery<{ label: string; meta: number; faturamento: number }>(metaVendViewSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard meta_fat_vendedor(view) error:', e); metaVendedor = [] }

    // Meta x Faturamento por Vendedor (via vw_metas_detalhe)
    // Meta x Faturamento por Vendedor (via vw_metas_detalhe) – filtra por mês/ano quando de/ate fornecidos
    const ym = (() => {
      if (de) {
        const d = new Date(de)
        if (!isNaN(d.getTime())) return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 }
      }
      if (ate) {
        const d = new Date(ate)
        if (!isNaN(d.getTime())) return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 }
      }
      // Default para Novembro/2025
      return { ano: 2025, mes: 11 }
    })()
    const metaVendVwSql = `
      SELECT
          m.meta_id,
          m.vendedor_id,
          m.vendedor,
          m.mes,
          m.ano,
          m.valor_meta,
          COALESCE(SUM(m.subtotal), 0) AS realizado
      FROM comercial.vw_metas_detalhe m
      WHERE m.tipo_meta = 'faturamento' AND m.ano = ${ym.ano} AND m.mes = ${ym.mes}
      GROUP BY
          m.meta_id,
          m.vendedor_id,
          m.vendedor,
          m.mes,
          m.ano,
          m.valor_meta
      ORDER BY m.vendedor`;
    type MetaVendVwRow = { meta_id: number; vendedor_id: number; vendedor: string; mes: number; ano: number; valor_meta: number; realizado: number }
    let metaVendVwRows: MetaVendVwRow[] = []
    try { metaVendVwRows = await runQuery<MetaVendVwRow>(metaVendVwSql) } catch (e) { console.error('🛒 VENDAS dashboard meta_vendedor_vw error:', e); metaVendVwRows = [] }

    const metaVendVWMap = new Map<string, { label: string; meta: number; faturamento: number }>()
    for (const r of metaVendVwRows) {
      const label = r.vendedor || '—'
      const cur = metaVendVWMap.get(label) || { label, meta: 0, faturamento: 0 }
      cur.meta += Number(r.valor_meta || 0)
      cur.faturamento += Number(r.realizado || 0)
      metaVendVWMap.set(label, cur)
    }
    const metaVendedorVW = Array.from(metaVendVWMap.values())
      .sort((a,b)=> (b.faturamento + b.meta) - (a.faturamento + a.meta))
      .slice(0, limit)

    // Meta x Novos Clientes por Vendedor (Novembro/2025) — via view comercial.vw_vendas_metas
    const metaNovosClientesVendSql = `WITH novos AS (
    SELECT
        vendedor_id,
        COUNT(DISTINCT cliente_id) AS novos_clientes_real
    FROM comercial.vw_vendas_metas
    WHERE EXTRACT(YEAR FROM data_pedido) = 2025
      AND EXTRACT(MONTH FROM data_pedido) = 11
      AND cliente_id IN (
            SELECT cliente_id
            FROM vendas.pedidos
            GROUP BY cliente_id
            HAVING MIN(data_pedido) BETWEEN '2025-11-01' AND '2025-11-30'
      )
    GROUP BY vendedor_id
)
SELECT
    vm.vendedor_nome AS label,
    COALESCE(MAX(vm.meta_novos_clientes_vendedor), 0)::float AS meta,
    COALESCE(n.novos_clientes_real, 0)::float AS realizado
FROM comercial.vw_vendas_metas vm
LEFT JOIN novos n ON n.vendedor_id = vm.vendedor_id
WHERE EXTRACT(YEAR FROM data_pedido) = 2025
  AND EXTRACT(MONTH FROM data_pedido) = 11
GROUP BY vm.vendedor_nome, n.novos_clientes_real
ORDER BY vm.vendedor_nome
LIMIT $1::int`;
    let metaNovosClientesVendedor: { label: string; meta: number; realizado: number }[] = []
    try { metaNovosClientesVendedor = await runQuery<{ label: string; meta: number; realizado: number }>(metaNovosClientesVendSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard meta_novos_clientes_vw error:', e); metaNovosClientesVendedor = [] }

    // Meta x Ticket Médio por Vendedor (Novembro/2025) — via view comercial.vw_vendas_metas
    const metaTicketVendSql = `
      SELECT
        vendedor_nome AS label,
        COALESCE(MAX(meta_ticket_vendedor),0)::float AS meta,
        CASE WHEN COUNT(DISTINCT pedido_id) > 0
             THEN COALESCE(SUM(subtotal),0)::float / NULLIF(COUNT(DISTINCT pedido_id), 0)
             ELSE 0 END AS realizado
      FROM comercial.vw_vendas_metas
      WHERE EXTRACT(YEAR FROM data_pedido) = 2025
        AND EXTRACT(MONTH FROM data_pedido) = 11
      GROUP BY vendedor_nome
      ORDER BY vendedor_nome
      LIMIT $1::int`;
    let metaTicketMedioVendedor: { label: string; meta: number; realizado: number }[] = []
    try { metaTicketMedioVendedor = await runQuery<{ label: string; meta: number; realizado: number }>(metaTicketVendSql, [limit]) } catch (e) { console.error('🛒 VENDAS dashboard meta_ticket_medio_vw error:', e); metaTicketMedioVendedor = [] }

    // Vendas por Cupom
    const cupomSql = `SELECT COALESCE(cup.codigo, '—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                      FROM vendas.pedidos p
                      LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                      LEFT JOIN vendas.cupons cup ON cup.id = p.cupom_id
                      ${pWhere}
                      GROUP BY 1
                      ORDER BY 2 DESC
                      LIMIT $${pParams.length + 1}::int`;
    let cupons: ChartItem[] = []
    try { cupons = await runQuery<ChartItem>(cupomSql, [...pParams, limit]) } catch (e) { console.error('🛒 VENDAS dashboard cupons error:', e); cupons = [] }

    // Vendas por Estado (c.estado)
    const estadoSql = `SELECT COALESCE(c.estado, '—') AS label, COALESCE(SUM(pi.subtotal),0)::float AS value
                       FROM vendas.pedidos p
                       LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
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
    const vendasCanalFullSql = `SELECT COALESCE(cv.nome,'—') AS canal, COALESCE(SUM(pi.subtotal),0)::float AS vendas
                                FROM vendas.pedidos p
                                LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
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
    const vendasClienteFullSql = `SELECT COALESCE(c.nome_fantasia,'—') AS cliente, COALESCE(SUM(pi.subtotal),0)::float AS vendas
                                  FROM vendas.pedidos p
                                  LEFT JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
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
          cogs: cogsNum,
          margemBruta,
        },
        charts: {
          vendedores,
          produtos,
          servicos,
          territorios,
          categorias,
          canais,
          clientes: topClientes,
          cidades: vendasCidade,
          centros_lucro: centrosLucro,
          campanhas_vendas: campanhasVendas,
          canais_distribuicao: canaisDistribuicao,
          canais_distribuicao_ticket: canaisDistribuicaoTicket,
          canais_distribuicao_pedidos: canaisDistribuicaoPedidos,
          marcas,
          filiais,
          unidades_negocio: unidadesNegocio,
          sales_offices: salesOffices,
          estados,
          devolucao_canal: taxaDevolucaoCanal,
          devolucao_cliente: taxaDevolucaoCliente,
          servicos_categorias_faturamento: servicosCategoriasFaturamento,
          servicos_categorias_ticket: servicosCategoriasTicketView,
          servicos_categorias_pedidos: servicosCategoriasPedidosView,
          meta_territorio: metaTerritorio,
          meta_vendedor: metaVendedor,
          meta_vendedor_vw: metaVendedorVW,
          meta_novos_clientes_vw: metaNovosClientesVendedor,
          meta_ticket_medio_vw: metaTicketMedioVendedor,
          meta_ticket_medio_territorio: metaTicketMedioTerritorio,
          meta_novos_clientes_territorio: metaNovosClientesTerritorio,
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
