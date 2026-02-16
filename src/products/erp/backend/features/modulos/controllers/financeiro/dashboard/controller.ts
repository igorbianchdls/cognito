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
    const tenantParam = searchParams.get('tenant_id') || undefined
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 6))
    const tenant = tenantParam ? Number(tenantParam) : undefined

    // KPI período (mês/intervalo)
    const deDate = de || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    const ateDate = ate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

    // Prepare tenant filters
    const tCr = tenant ? ' AND cr.tenant_id = $3' : ''
    const tCp = tenant ? ' AND cp.tenant_id = $3' : ''
    const tPr = tenant ? ' AND pr.tenant_id = $3' : ''
    const tPe = tenant ? ' AND pe.tenant_id = $3' : ''
    const kpiParams: unknown[] = tenant ? [deDate, ateDate, tenant] : [deDate, ateDate]

    const arSql = `SELECT COALESCE(SUM(cr.valor_liquido), 0) AS total
                     FROM financeiro.contas_receber cr
                    WHERE LOWER(cr.status) NOT IN ('recebido','baixado','liquidado')
                      AND DATE(cr.data_vencimento) BETWEEN $1 AND $2${tCr}`.replace(/\s+/g, ' ')
    const [arRow] = await runQuery<{ total: number | null }>(arSql, kpiParams)

    const apSql = `SELECT COALESCE(SUM(cp.valor_liquido), 0) AS total
                     FROM financeiro.contas_pagar cp
                    WHERE LOWER(cp.status) NOT IN ('pago','baixado','liquidado')
                      AND DATE(cp.data_vencimento) BETWEEN $1 AND $2${tCp}`.replace(/\s+/g, ' ')
    const [apRow] = await runQuery<{ total: number | null }>(apSql, kpiParams)

    const recSql = `SELECT COALESCE(SUM(pr.valor_total_recebido), 0) AS total
                      FROM financeiro.pagamentos_recebidos pr
                     WHERE DATE(pr.data_recebimento) BETWEEN $1 AND $2${tPr}`.replace(/\s+/g, ' ')
    const [recRow] = await runQuery<{ total: number | null }>(recSql, kpiParams)

    const pagoSql = `SELECT COALESCE(SUM(pe.valor_total_pagamento), 0) AS total
                      FROM financeiro.pagamentos_efetuados pe
                     WHERE DATE(pe.data_pagamento) BETWEEN $1 AND $2${tPe}`.replace(/\s+/g, ' ')
    const [pagoRow] = await runQuery<{ total: number | null }>(pagoSql, kpiParams)

    const receitaSql = `SELECT COALESCE(SUM(cr.valor_liquido), 0) AS total
                          FROM financeiro.contas_receber cr
                         WHERE DATE(cr.data_vencimento) BETWEEN $1 AND $2${tCr}`.replace(/\s+/g, ' ')
    const [receitaRow] = await runQuery<{ total: number | null }>(receitaSql, kpiParams)

    const despesasSql = `SELECT COALESCE(SUM(cp.valor_liquido), 0) AS total
                           FROM financeiro.contas_pagar cp
                          WHERE DATE(cp.data_vencimento) BETWEEN $1 AND $2${tCp}`.replace(/\s+/g, ' ')
    const [despesasRow] = await runQuery<{ total: number | null }>(despesasSql, kpiParams)

    const arCountSql = `SELECT COUNT(*)::int AS count
                          FROM financeiro.contas_receber cr
                         WHERE LOWER(cr.status) = 'pendente'
                           AND DATE(cr.data_vencimento) BETWEEN $1 AND $2${tCr}`.replace(/\s+/g, ' ')
    const [arCountRow] = await runQuery<{ count: number | null }>(arCountSql, kpiParams)

    const apCountSql = `SELECT COUNT(*)::int AS count
                          FROM financeiro.contas_pagar cp
                         WHERE LOWER(cp.status) = 'pendente'
                           AND DATE(cp.data_vencimento) BETWEEN $1 AND $2${tCp}`.replace(/\s+/g, ' ')
    const [apCountRow] = await runQuery<{ count: number | null }>(apCountSql, kpiParams)

    const kpis = {
      ar_mes: Number(arRow?.total ?? 0),
      ap_mes: Number(apRow?.total ?? 0),
      recebidos_mes: Number(recRow?.total ?? 0),
      pagos_mes: Number(pagoRow?.total ?? 0),
      geracao_caixa: Number(recRow?.total ?? 0) - Number(pagoRow?.total ?? 0),
      receita_mes: Number(receitaRow?.total ?? 0),
      despesas_mes: Number(despesasRow?.total ?? 0),
      lucro_mes: Number(receitaRow?.total ?? 0) - Number(despesasRow?.total ?? 0),
      ar_count: Number(arCountRow?.count ?? 0),
      ap_count: Number(apCountRow?.count ?? 0),
    }

    // CHARTS: Top agregações (label,value)
    type ChartItem = { label: string; value: number }

    // Helpers to build WHERE and params for AP e AR
    const buildApWhere = () => {
      const params: unknown[] = []
      let idx = 1
      const filters: string[] = []
      if (deDate) { filters.push(`cp.data_vencimento >= $${idx++}`); params.push(deDate) }
      if (ateDate) { filters.push(`cp.data_vencimento <= $${idx++}`); params.push(ateDate) }
      if (tenant) { filters.push(`cp.tenant_id = $${idx++}`); params.push(tenant) }
      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
      return { where, params }
    }
    const buildArWhere = () => {
      const params: unknown[] = []
      let idx = 1
      const filters: string[] = []
      if (deDate) { filters.push(`cr.data_vencimento >= $${idx++}`); params.push(deDate) }
      if (ateDate) { filters.push(`cr.data_vencimento <= $${idx++}`); params.push(ateDate) }
      if (tenant) { filters.push(`cr.tenant_id = $${idx++}`); params.push(tenant) }
      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
      return { where, params }
    }

    const ap = { fornecedor: [] as ChartItem[], centro_custo: [] as ChartItem[], filial: [] as ChartItem[], departamento: [] as ChartItem[], unidade_negocio: [] as ChartItem[], categoria: [] as ChartItem[], titulo: [] as ChartItem[] }
    const ar = { centro_lucro: [] as ChartItem[], categoria: [] as ChartItem[] }

    {
      const { where, params } = buildApWhere()
      const limIdx = params.length + 1
      const base = `FROM financeiro.contas_pagar cp`;
      // fornecedor
      ap.fornecedor = await runQuery<ChartItem>(
        `SELECT COALESCE(f.nome_fantasia, 'Sem fornecedor') AS label, COALESCE(SUM(cp.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // centro_custo
      ap.centro_custo = await runQuery<ChartItem>(
        `SELECT COALESCE(cc.nome, 'Sem centro de custo') AS label, COALESCE(SUM(cp.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // filial
      ap.filial = await runQuery<ChartItem>(
        `SELECT COALESCE(fil.nome, 'Sem filial') AS label, COALESCE(SUM(cp.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // departamento
      ap.departamento = await runQuery<ChartItem>(
        `SELECT COALESCE(dep.nome, 'Sem departamento') AS label, COALESCE(SUM(cp.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // unidade_negocio
      ap.unidade_negocio = await runQuery<ChartItem>(
        `SELECT COALESCE(un.nome, 'Sem unidade') AS label, COALESCE(SUM(cp.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // categoria despesa
      ap.categoria = await runQuery<ChartItem>(
        `SELECT COALESCE(cat.nome, 'Sem categoria') AS label, COALESCE(SUM(cp.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN financeiro.categorias_despesa cat ON cat.id = cp.categoria_despesa_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // titulos (individuais)
      ap.titulo = await runQuery<ChartItem>(
        `SELECT COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text)) AS label,
                COALESCE(cp.valor_liquido,0)::float AS value
           ${base}
           ${where}
           ORDER BY value DESC NULLS LAST
           LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
    }

    {
      const { where, params } = buildArWhere()
      const limIdx = params.length + 1
      const base = `FROM financeiro.contas_receber cr`;
      // centro_lucro
      ar.centro_lucro = await runQuery<ChartItem>(
        `SELECT COALESCE(cl.nome, 'Sem centro de lucro') AS label, COALESCE(SUM(cr.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
      // categoria_receita
      ar.categoria = await runQuery<ChartItem>(
        `SELECT COALESCE(cat.nome, 'Sem categoria') AS label, COALESCE(SUM(cr.valor_liquido), 0)::float AS value
           ${base}
           LEFT JOIN financeiro.categorias_receita cat ON cat.id = cr.categoria_receita_id
           ${where}
           GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT $${limIdx}::int`.replace(/\s+/g, ' '),
        [...params, limit]
      )
    }

    return Response.json(
      {
        success: true,
        de: deDate,
        ate: ateDate,
        kpis,
        charts: {
          ap,
          ar,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('💰 API /api/modulos/financeiro/dashboard error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
