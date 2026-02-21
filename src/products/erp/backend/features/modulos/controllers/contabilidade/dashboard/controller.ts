import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ChartItem = { label: string; value: number }

function buildLancamentosWhere(params: unknown[], options: { de: string; ate: string; tenant?: number }) {
  const filters: string[] = []
  filters.push(`lc.data_lancamento >= $${params.length + 1}`)
  params.push(options.de)
  filters.push(`lc.data_lancamento <= $${params.length + 1}`)
  params.push(options.ate)
  if (typeof options.tenant === 'number' && Number.isFinite(options.tenant)) {
    filters.push(`lc.tenant_id = $${params.length + 1}`)
    params.push(options.tenant)
  }
  return `WHERE ${filters.join(' AND ')}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const limitParam = searchParams.get('limit') || undefined
    const tenantParam = searchParams.get('tenant_id') || undefined

    const today = new Date()
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
    const defaultTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

    const deDate = de || defaultFrom
    const ateDate = ate || defaultTo
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 8))
    const tenant = tenantParam ? Number(tenantParam) : undefined

    const kpiParams: unknown[] = []
    const whereKpi = buildLancamentosWhere(kpiParams, { de: deDate, ate: ateDate, tenant })

    const kpiSql = `
      SELECT
        COALESCE(SUM(lc.total_debitos), 0)::float AS total_debitos,
        COALESCE(SUM(lc.total_creditos), 0)::float AS total_creditos,
        COALESCE(SUM(lc.total_debitos - lc.total_creditos), 0)::float AS saldo,
        COUNT(*)::int AS lancamentos
      FROM contabilidade.lancamentos_contabeis lc
      ${whereKpi}`.replace(/\s+/g, ' ')

    const [kpiRow] = await runQuery<{
      total_debitos: number
      total_creditos: number
      saldo: number
      lancamentos: number
    }>(kpiSql, kpiParams)

    const linhasParams: unknown[] = []
    const whereLinhas = buildLancamentosWhere(linhasParams, { de: deDate, ate: ateDate, tenant })
    const linhasSql = `
      SELECT
        COUNT(*)::int AS linhas,
        COUNT(DISTINCT lcl.conta_id)::int AS contas_movimentadas
      FROM contabilidade.lancamentos_contabeis_linhas lcl
      JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
      ${whereLinhas}`.replace(/\s+/g, ' ')

    const [linhasRow] = await runQuery<{ linhas: number; contas_movimentadas: number }>(linhasSql, linhasParams)

    const chartWhere = (alias = 'lc') => {
      const params: unknown[] = []
      const filters: string[] = []
      filters.push(`${alias}.data_lancamento >= $${params.length + 1}`)
      params.push(deDate)
      filters.push(`${alias}.data_lancamento <= $${params.length + 1}`)
      params.push(ateDate)
      if (typeof tenant === 'number' && Number.isFinite(tenant)) {
        filters.push(`${alias}.tenant_id = $${params.length + 1}`)
        params.push(tenant)
      }
      return {
        where: `WHERE ${filters.join(' AND ')}`,
        params,
      }
    }

    const tipoDebitoCtx = chartWhere('lc')
    const tipoDebito = await runQuery<ChartItem>(
      `SELECT COALESCE(pc.tipo_conta, 'Sem tipo') AS label, COALESCE(SUM(lcl.debito), 0)::float AS value
       FROM contabilidade.lancamentos_contabeis_linhas lcl
       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
       LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
       ${tipoDebitoCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${tipoDebitoCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...tipoDebitoCtx.params, limit],
    )

    const tipoCreditoCtx = chartWhere('lc')
    const tipoCredito = await runQuery<ChartItem>(
      `SELECT COALESCE(pc.tipo_conta, 'Sem tipo') AS label, COALESCE(SUM(lcl.credito), 0)::float AS value
       FROM contabilidade.lancamentos_contabeis_linhas lcl
       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
       LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
       ${tipoCreditoCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${tipoCreditoCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...tipoCreditoCtx.params, limit],
    )

    const topDebitoCtx = chartWhere('lc')
    const topDebito = await runQuery<ChartItem>(
      `SELECT COALESCE(pc.nome, 'Sem conta') AS label, COALESCE(SUM(lcl.debito), 0)::float AS value
       FROM contabilidade.lancamentos_contabeis_linhas lcl
       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
       LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
       ${topDebitoCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${topDebitoCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...topDebitoCtx.params, limit],
    )

    const topCreditoCtx = chartWhere('lc')
    const topCredito = await runQuery<ChartItem>(
      `SELECT COALESCE(pc.nome, 'Sem conta') AS label, COALESCE(SUM(lcl.credito), 0)::float AS value
       FROM contabilidade.lancamentos_contabeis_linhas lcl
       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
       LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
       ${topCreditoCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${topCreditoCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...topCreditoCtx.params, limit],
    )

    const origemCtx = chartWhere('lc')
    const origem = await runQuery<ChartItem>(
      `SELECT COALESCE(NULLIF(TRIM(lc.origem_tabela), ''), 'manual') AS label,
              COUNT(DISTINCT lc.id)::int AS value
       FROM contabilidade.lancamentos_contabeis lc
       ${origemCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${origemCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...origemCtx.params, limit],
    )

    const evolucaoDebitoCtx = chartWhere('lc')
    const evolucaoDebito = await runQuery<ChartItem>(
      `SELECT TO_CHAR(DATE_TRUNC('month', lc.data_lancamento), 'YYYY-MM') AS label,
              COALESCE(SUM(lcl.debito), 0)::float AS value
       FROM contabilidade.lancamentos_contabeis_linhas lcl
       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
       ${evolucaoDebitoCtx.where}
       GROUP BY 1
       ORDER BY 1 ASC
       LIMIT $${evolucaoDebitoCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...evolucaoDebitoCtx.params, Math.max(12, limit)],
    )

    const evolucaoCreditoCtx = chartWhere('lc')
    const evolucaoCredito = await runQuery<ChartItem>(
      `SELECT TO_CHAR(DATE_TRUNC('month', lc.data_lancamento), 'YYYY-MM') AS label,
              COALESCE(SUM(lcl.credito), 0)::float AS value
       FROM contabilidade.lancamentos_contabeis_linhas lcl
       JOIN contabilidade.lancamentos_contabeis lc ON lc.id = lcl.lancamento_id
       ${evolucaoCreditoCtx.where}
       GROUP BY 1
       ORDER BY 1 ASC
       LIMIT $${evolucaoCreditoCtx.params.length + 1}::int`.replace(/\s+/g, ' '),
      [...evolucaoCreditoCtx.params, Math.max(12, limit)],
    )

    return Response.json(
      {
        success: true,
        de: deDate,
        ate: ateDate,
        kpis: {
          total_debitos: Number(kpiRow?.total_debitos ?? 0),
          total_creditos: Number(kpiRow?.total_creditos ?? 0),
          saldo: Number(kpiRow?.saldo ?? 0),
          lancamentos: Number(kpiRow?.lancamentos ?? 0),
          linhas: Number(linhasRow?.linhas ?? 0),
          contas_movimentadas: Number(linhasRow?.contas_movimentadas ?? 0),
        },
        charts: {
          tipo_debito: tipoDebito,
          tipo_credito: tipoCredito,
          top_debito: topDebito,
          top_credito: topCredito,
          origem,
          evolucao_debito: evolucaoDebito,
          evolucao_credito: evolucaoCredito,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('📘 API /api/modulos/contabilidade/dashboard error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
