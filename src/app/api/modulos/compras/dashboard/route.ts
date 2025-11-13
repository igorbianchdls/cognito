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
    const status = searchParams.get('status') || undefined
    const fornecedorIdParam = searchParams.get('fornecedor_id') || undefined
    const fornecedorId = fornecedorIdParam ? Number(fornecedorIdParam) : undefined
    const limitParam = searchParams.get('limit') || undefined
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 6))

    // WHERE for compras (c)
    const cWhereParts: string[] = []
    const cParams: unknown[] = []
    let ci = 1
    if (de) { cWhereParts.push(`c.data_emissao >= $${ci++}`); cParams.push(de) }
    if (ate) { cWhereParts.push(`c.data_emissao <= $${ci++}`); cParams.push(ate) }
    if (status) { cWhereParts.push(`LOWER(c.status) = LOWER($${ci++})`); cParams.push(status) }
    if (typeof fornecedorId === 'number' && !Number.isNaN(fornecedorId)) { cWhereParts.push(`c.fornecedor_id = $${ci++}`); cParams.push(fornecedorId) }
    const cWhere = cWhereParts.length ? `WHERE ${cWhereParts.join(' AND ')}` : ''

    // WHERE for recebimentos (r)
    const rWhereParts: string[] = []
    const rParams: unknown[] = []
    let ri = 1
    if (de) { rWhereParts.push(`r.data_recebimento >= $${ri++}`); rParams.push(de) }
    if (ate) { rWhereParts.push(`r.data_recebimento <= $${ri++}`); rParams.push(ate) }
    if (status) { rWhereParts.push(`LOWER(r.status) = LOWER($${ri++})`); rParams.push(status) }
    const joinR = (typeof fornecedorId === 'number' && !Number.isNaN(fornecedorId)) ? ' JOIN compras.compras c ON c.id = r.compra_id' : ''
    if (joinR) { rWhereParts.push(`c.fornecedor_id = $${ri++}`); rParams.push(fornecedorId as number) }
    const rWhere = rWhereParts.length ? `WHERE ${rWhereParts.join(' AND ')}` : ''

    // Queries
    const gastoRows = await runQuery<{ gasto: string | number }>(
      `SELECT COALESCE(SUM(c.valor_total), 0) AS gasto FROM compras.compras c ${cWhere}`,
      cParams
    )
    const fornecedoresRows = await runQuery<{ fornecedores: number }>(
      `SELECT COUNT(DISTINCT c.fornecedor_id)::int AS fornecedores FROM compras.compras c ${cWhere}`,
      cParams
    )
    const pedidosRows = await runQuery<{ pedidos: number }>(
      `SELECT COUNT(DISTINCT c.id)::int AS pedidos FROM compras.compras c ${cWhere}`,
      cParams
    )
    const transacoesRows = await runQuery<{ transacoes: number }>(
      `SELECT COUNT(DISTINCT r.id)::int AS transacoes FROM compras.recebimentos r${joinR} ${rWhere}`,
      rParams
    )

    const gasto = Number(gastoRows[0]?.gasto ?? 0) || 0
    const fornecedores = Number(fornecedoresRows[0]?.fornecedores ?? 0) || 0
    const pedidos = Number(pedidosRows[0]?.pedidos ?? 0) || 0
    const transacoes = Number(transacoesRows[0]?.transacoes ?? 0) || 0

    // Charts (aggregations)
    type ChartItem = { label: string; value: number }
    const limIndex = cParams.length + 1
    const charts = {
      fornecedores: [] as ChartItem[],
      centro_custo: [] as ChartItem[],
      filiais: [] as ChartItem[],
      categorias: [] as ChartItem[],
      projetos: [] as ChartItem[],
      departamentos: [] as ChartItem[],
      status: [] as ChartItem[],
    }

    const fornecedoresSql = `SELECT COALESCE(f.nome, '—') AS label, COALESCE(SUM(c.valor_total),0)::float AS value
                             FROM compras.compras c
                             LEFT JOIN entidades.fornecedores f ON f.id = c.fornecedor_id
                             ${cWhere}
                             GROUP BY 1
                             ORDER BY 2 DESC
                             LIMIT $${limIndex}::int`;
    charts.fornecedores = await runQuery<ChartItem>(fornecedoresSql, [...cParams, limit])

    const ccSql = `SELECT COALESCE(cc.nome, '—') AS label, COALESCE(SUM(c.valor_total),0)::float AS value
                   FROM compras.compras c
                   LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
                   ${cWhere}
                   GROUP BY 1
                   ORDER BY 2 DESC
                   LIMIT $${limIndex}::int`;
    charts.centro_custo = await runQuery<ChartItem>(ccSql, [...cParams, limit])

    const filiaisSql = `SELECT COALESCE(fil.nome, '—') AS label, COALESCE(SUM(c.valor_total),0)::float AS value
                        FROM compras.compras c
                        LEFT JOIN empresa.filiais fil ON fil.id = c.filial_id
                        ${cWhere}
                        GROUP BY 1
                        ORDER BY 2 DESC
                        LIMIT $${limIndex}::int`;
    charts.filiais = await runQuery<ChartItem>(filiaisSql, [...cParams, limit])

    const categoriasSql = `SELECT COALESCE(cat.nome, '—') AS label, COALESCE(SUM(c.valor_total),0)::float AS value
                           FROM compras.compras c
                           LEFT JOIN financeiro.categorias_financeiras cat ON cat.id = c.categoria_financeira_id
                           ${cWhere}
                           GROUP BY 1
                           ORDER BY 2 DESC
                           LIMIT $${limIndex}::int`;
    charts.categorias = await runQuery<ChartItem>(categoriasSql, [...cParams, limit])

    const projetosSql = `SELECT COALESCE(pr.nome, '—') AS label, COALESCE(SUM(c.valor_total),0)::float AS value
                         FROM compras.compras c
                         LEFT JOIN financeiro.projetos pr ON pr.id = c.projeto_id
                         ${cWhere}
                         GROUP BY 1
                         ORDER BY 2 DESC
                         LIMIT $${limIndex}::int`;
    charts.projetos = await runQuery<ChartItem>(projetosSql, [...cParams, limit])

    const departamentosSql = `SELECT COALESCE(d.nome, '—') AS label, COALESCE(SUM(c.valor_total),0)::float AS value
                              FROM compras.compras c
                              LEFT JOIN empresa.centros_custo cc ON cc.id = c.centro_custo_id
                              LEFT JOIN empresa.departamentos d ON d.id = cc.departamento_id
                              ${cWhere}
                              GROUP BY 1
                              ORDER BY 2 DESC
                              LIMIT $${limIndex}::int`;
    charts.departamentos = await runQuery<ChartItem>(departamentosSql, [...cParams, limit])

    const statusSql = `SELECT COALESCE(c.status, '—') AS label, COUNT(*)::int AS value
                       FROM compras.compras c
                       ${cWhere}
                       GROUP BY 1
                       ORDER BY 2 DESC
                       LIMIT $${limIndex}::int`;
    charts.status = await runQuery<ChartItem>(statusSql, [...cParams, limit])

    return Response.json(
      {
        success: true,
        kpis: { gasto, fornecedores, transacoes, pedidos },
        charts,
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('📦 API /api/modulos/compras/dashboard error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
