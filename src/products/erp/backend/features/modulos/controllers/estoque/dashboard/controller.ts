import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ChartItem = { label: string; value: number }

const parseNumericId = (value?: string | null): number | null => {
  if (!value) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

function buildWhere(
  alias: 'ea' | 'm',
  filters: { de?: string; ate?: string; almoxarifadoId?: number | null; produtoId?: number | null; includeDate?: boolean },
) {
  const params: unknown[] = []
  const whereParts: string[] = []
  const dateField = alias === 'ea' ? 'ea.atualizado_em' : 'm.data_movimento'
  const includeDate = filters.includeDate !== false

  if (includeDate && filters.de) {
    whereParts.push(`${dateField} >= $${params.length + 1}`)
    params.push(filters.de)
  }
  if (includeDate && filters.ate) {
    whereParts.push(`${dateField} <= $${params.length + 1}`)
    params.push(filters.ate)
  }
  if (typeof filters.almoxarifadoId === 'number') {
    whereParts.push(`${alias}.almoxarifado_id = $${params.length + 1}`)
    params.push(filters.almoxarifadoId)
  }
  if (typeof filters.produtoId === 'number') {
    whereParts.push(`${alias}.produto_id = $${params.length + 1}`)
    params.push(filters.produtoId)
  }

  return {
    where: whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '',
    params,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const almoxarifadoId = parseNumericId(searchParams.get('almoxarifado_id'))
    const produtoId = parseNumericId(searchParams.get('produto_id'))
    const limitParam = searchParams.get('limit') || undefined
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 8))

    // estoque_atual é snapshot de saldo; não deve zerar por filtro de período do dateRange.
    const stockWhereCtx = buildWhere('ea', { de, ate, almoxarifadoId, produtoId, includeDate: false })
    const movWhereCtx = buildWhere('m', { de, ate, almoxarifadoId, produtoId })

    const [{ produtos_ativos }] = await runQuery<{ produtos_ativos: number }>(
      `SELECT COUNT(DISTINCT ea.produto_id)::int AS produtos_ativos
       FROM estoque.estoques_atual ea
       ${stockWhereCtx.where}`.replace(/\s+/g, ' '),
      stockWhereCtx.params,
    )

    const [{ quantidade_total }] = await runQuery<{ quantidade_total: number }>(
      `SELECT COALESCE(SUM(ea.quantidade), 0)::float AS quantidade_total
       FROM estoque.estoques_atual ea
       ${stockWhereCtx.where}`.replace(/\s+/g, ' '),
      stockWhereCtx.params,
    )

    const [{ valor_total_estoque }] = await runQuery<{ valor_total_estoque: number }>(
      `SELECT COALESCE(SUM(ea.quantidade * ea.custo_medio), 0)::float AS valor_total_estoque
       FROM estoque.estoques_atual ea
       ${stockWhereCtx.where}`.replace(/\s+/g, ' '),
      stockWhereCtx.params,
    )

    const [{ movimentacoes_periodo }] = await runQuery<{ movimentacoes_periodo: number }>(
      `SELECT COUNT(*)::int AS movimentacoes_periodo
       FROM estoque.movimentacoes_estoque m
       ${movWhereCtx.where}`.replace(/\s+/g, ' '),
      movWhereCtx.params,
    )

    const stockLimitIndex = stockWhereCtx.params.length + 1
    const movLimitIndex = movWhereCtx.params.length + 1

    const estoqueAlmoxarifado = await runQuery<ChartItem>(
      `SELECT COALESCE(a.nome, '—') AS label, COALESCE(SUM(ea.quantidade),0)::float AS value
       FROM estoque.estoques_atual ea
       LEFT JOIN estoque.almoxarifados a ON a.id = ea.almoxarifado_id
       ${stockWhereCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${stockLimitIndex}::int`.replace(/\s+/g, ' '),
      [...stockWhereCtx.params, limit],
    )

    const estoqueProduto = await runQuery<ChartItem>(
      `SELECT COALESCE(p.nome, ea.produto_id::text) AS label, COALESCE(SUM(ea.quantidade),0)::float AS value
       FROM estoque.estoques_atual ea
       LEFT JOIN produtos.produto p ON p.id = ea.produto_id
       ${stockWhereCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${stockLimitIndex}::int`.replace(/\s+/g, ' '),
      [...stockWhereCtx.params, limit],
    )

    const movimentacoesTipo = await runQuery<ChartItem>(
      `SELECT COALESCE(tm.descricao, m.tipo_movimento, '—') AS label, COALESCE(SUM(m.quantidade),0)::float AS value
       FROM estoque.movimentacoes_estoque m
       LEFT JOIN estoque.tipos_movimentacao tm ON tm.codigo = m.tipo_codigo
       ${movWhereCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${movLimitIndex}::int`.replace(/\s+/g, ' '),
      [...movWhereCtx.params, limit],
    )

    const movimentacoesMensal = await runQuery<ChartItem>(
      `SELECT TO_CHAR(DATE_TRUNC('month', m.data_movimento), 'YYYY-MM') AS label,
              COALESCE(SUM(m.valor_total),0)::float AS value
       FROM estoque.movimentacoes_estoque m
       ${movWhereCtx.where}
       GROUP BY 1
       ORDER BY 1 ASC
       LIMIT $${movLimitIndex}::int`.replace(/\s+/g, ' '),
      [...movWhereCtx.params, limit],
    )

    const entradasSaidas = await runQuery<ChartItem>(
      `SELECT CASE
                WHEN LOWER(COALESCE(tm.natureza, m.tipo_movimento, '')) LIKE '%entrada%' THEN 'Entradas'
                WHEN LOWER(COALESCE(tm.natureza, m.tipo_movimento, '')) LIKE '%saida%' THEN 'Saídas'
                ELSE 'Outros'
              END AS label,
              COALESCE(SUM(m.quantidade),0)::float AS value
       FROM estoque.movimentacoes_estoque m
       LEFT JOIN estoque.tipos_movimentacao tm ON tm.codigo = m.tipo_codigo
       ${movWhereCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC`.replace(/\s+/g, ' '),
      movWhereCtx.params,
    )

    return Response.json(
      {
        success: true,
        kpis: {
          produtos_ativos: Number(produtos_ativos || 0),
          quantidade_total: Number(quantidade_total || 0),
          valor_total_estoque: Number(valor_total_estoque || 0),
          movimentacoes_periodo: Number(movimentacoes_periodo || 0),
        },
        charts: {
          estoque_almoxarifado: estoqueAlmoxarifado,
          estoque_produto: estoqueProduto,
          movimentacoes_tipo: movimentacoesTipo,
          movimentacoes_mensal: movimentacoesMensal,
          entradas_saidas: entradasSaidas,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('📦 API /api/modulos/estoque/dashboard error:', error)
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
