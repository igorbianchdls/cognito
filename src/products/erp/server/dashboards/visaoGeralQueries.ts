import type { DashboardContent } from '../../shared/dashboardContracts'
import { emptyContent, link, rows, type DashboardContext } from './common'
import { financialRows } from '../erpReadQueries'
import { financeiroQueries } from './financeiroQueries'
import { vendasQueries } from './vendasQueries'
import { comprasQueries } from './comprasQueries'
import { estoqueQueries } from './estoqueQueries'
import { servicosQueries } from './servicosQueries'
import { resultadosQueries } from './resultadosQueries'
export async function visaoGeralQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const result = emptyContent()
  const areas = [
    [
      ['erp.financeiro.visualizar'],
      financeiroQueries,
      ['saldo', 'receber-vencido', 'pagar-vencido', 'proximos'],
    ],
    [['erp.vendas.visualizar'], vendasQueries, ['vendas']],
    [['erp.compras.visualizar'], comprasQueries, ['compras']],
    [['erp.estoque.visualizar'], estoqueQueries, ['repor']],
    [['erp.vendas.visualizar'], servicosQueries, ['abertas', 'atrasadas']],
    [['erp.relatorios.visualizar', 'erp.financeiro.visualizar'], resultadosQueries, ['resultado']],
  ] as const
  for (const [capabilities, query, keys] of areas) {
    if (!capabilities.every((capability) => ctx.capabilities.includes(capability))) continue
    const content = await query(ctx)
    result.metrics.push(
      ...content.metrics
        .filter((m) => (keys as readonly string[]).includes(m.key))
        .map((m) => ({ ...m, key: capabilities[0] + '-' + m.key })),
    )
    if (query === financeiroQueries || query === vendasQueries)
      result.charts.push(content.charts[0])
    result.lists.push(
      ...content.lists.filter((l) =>
        ['pendencias', 'reposicao', 'ordens', 'clientes'].includes(l.key),
      ),
    )
  }
  if (ctx.capabilities.includes('erp.financeiro.visualizar')) {
    const until = new Date(Date.parse(ctx.reference) + 7 * 86400000).toISOString().slice(0, 10)
    const href = link('/erp/financeiro/contas-a-pagar', { from: ctx.reference, to: until })
    const upcoming = await rows(
      ctx,
      `WITH parcelas AS (${financialRows('pagar')})
      SELECT p.id::text,p.descricao label,p.fornecedor detail,p.saldo value,
        p.vencimento::text date,CASE WHEN t.tipo_lancamento='previsao' THEN 'Previsão'
          WHEN p.valor_pago+p.credito>0 THEN 'Parcial' ELSE 'A vencer' END status
      FROM parcelas p JOIN erp.contas_pagar t ON t.empresa_id=$1 AND t.id=p.conta_id
      WHERE p.saldo>0 AND p.status NOT IN ('cancelado','renegociado','pago')
        AND ($4::boolean OR t.tipo_lancamento='efetivo')
        AND p.vencimento BETWEEN $2::date AND $3::date
      ORDER BY p.vencimento,p.id LIMIT 5`,
      [ctx.tenantId, ctx.reference, until, ctx.filters.includeForecast],
    )
    result.lists.unshift({
      key: 'proximos-vencimentos',
      title: 'Próximos vencimentos',
      description: 'Até cinco parcelas a pagar nos próximos sete dias, pela posição atual.',
      href,
      rows: upcoming.map((r) => ({
        id: String(r.id),
        label: String(r.label),
        detail: String(r.detail || ''),
        value: Number(r.value),
        date: String(r.date),
        status: String(r.status),
        href,
      })),
    })
  }
  result.notes = [
    'Os indicadores de posição atual usam a data de referência; vendas e compras usam o período selecionado.',
    'A Visão geral apresenta somente as áreas permitidas ao seu usuário.',
  ]
  return result
}
