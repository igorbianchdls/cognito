import type { DashboardContent } from '../../shared/dashboardContracts'
import { emptyContent, type DashboardContext } from './common'
import { financeiroQueries } from './financeiroQueries'
import { vendasQueries } from './vendasQueries'
import { comprasQueries } from './comprasQueries'
import { estoqueQueries } from './estoqueQueries'
import { servicosQueries } from './servicosQueries'
export async function visaoGeralQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const result = emptyContent()
  const areas = [
    [
      'erp.financeiro.visualizar',
      financeiroQueries,
      ['saldo', 'receber-vencido', 'pagar-vencido', 'proximos'],
    ],
    ['erp.vendas.visualizar', vendasQueries, ['vendas']],
    ['erp.compras.visualizar', comprasQueries, ['compras']],
    ['erp.estoque.visualizar', estoqueQueries, ['repor']],
    ['erp.vendas.visualizar', servicosQueries, ['abertas']],
  ] as const
  for (const [capability, query, keys] of areas) {
    if (!ctx.capabilities.includes(capability)) continue
    const content = await query(ctx)
    result.metrics.push(
      ...content.metrics
        .filter((m) => (keys as readonly string[]).includes(m.key))
        .map((m) => ({ ...m, key: capability + '-' + m.key })),
    )
    if (query === financeiroQueries || query === vendasQueries)
      result.charts.push(content.charts[0])
    result.lists.push(
      ...content.lists.filter((l) => ['pendencias', 'reposicao', 'ordens'].includes(l.key)),
    )
  }
  result.notes = [
    'Os indicadores de posição atual usam a data de referência; vendas e compras usam o período selecionado.',
    'A Visão geral apresenta somente as áreas permitidas ao seu usuário.',
  ]
  return result
}
