import { cashAllocationSql } from '../erpCashReport'
import type { DashboardContent } from '../../shared/dashboardContracts'
import {
  emptyContent,
  metric,
  numeric,
  periodLink,
  ranking,
  rows,
  type DashboardContext,
} from './common'
export async function resultadosQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const sql = `${cashAllocationSql},signed AS (SELECT *,amount*signal*CASE WHEN tipo='receber' THEN 1 ELSE -1 END valor FROM allocated)
    SELECT coalesce(sum(valor) FILTER(WHERE tipo='receber'),0) entradas,-coalesce(sum(valor) FILTER(WHERE tipo='pagar'),0) saidas,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT data_pagamento::text label,coalesce(sum(valor) FILTER(WHERE tipo='receber'),0) entradas,-coalesce(sum(valor) FILTER(WHERE tipo='pagar'),0) saidas,sum(valor) resultado FROM signed GROUP BY data_pagamento ORDER BY data_pagamento) x) evolucao,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT coalesce(c.id::text,'sem-categoria') id,coalesce(c.nome,'Sem categoria') label,CASE WHEN a.tipo='receber' THEN 'Recebimentos líquidos de estornos' ELSE 'Pagamentos líquidos de estornos' END detail,sum(a.valor) value FROM signed a LEFT JOIN erp.categorias c ON c.empresa_id=$1 AND c.id=a.categoria_id GROUP BY c.id,c.nome,a.tipo ORDER BY abs(sum(a.valor)) DESC,c.id LIMIT 8) x) categorias,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT coalesce(c.id::text,'sem-centro') id,coalesce(c.nome,'Sem centro de custo') label,'Resultado pelo caixa' detail,sum(a.valor) value FROM signed a LEFT JOIN erp.centros_custo c ON c.empresa_id=$1 AND c.id=a.centro_custo_id GROUP BY c.id,c.nome ORDER BY abs(sum(a.valor)) DESC,c.id LIMIT 8) x) centros
    FROM signed`
  const [data] = await rows(ctx, sql, [ctx.tenantId, ctx.filters.from, ctx.filters.to])
  const [before] = ctx.filters.compare
    ? await rows(ctx, sql, [ctx.tenantId, ctx.previous.from, ctx.previous.to])
    : [{}]
  const result = emptyContent(),
    href = periodLink(ctx, '/erp/relatorios/dre-caixa')
  const incoming = numeric(data.entradas),
    outgoing = numeric(data.saidas),
    balance = incoming - outgoing
  result.metrics = [
    metric(ctx, {
      key: 'recebimentos',
      label: 'Recebimentos realizados',
      value: incoming,
      previous: numeric(before.entradas),
      format: 'currency',
      description:
        'Pagamentos recebidos, líquidos de encargos, descontos, tarifas e estornos do período.',
      scope: 'periodo',
      href,
      tone: 'success',
    }),
    metric(ctx, {
      key: 'pagamentos',
      label: 'Pagamentos realizados',
      value: outgoing,
      previous: numeric(before.saidas),
      format: 'currency',
      description: 'Pagamentos efetuados, líquidos de estornos realizados no período.',
      scope: 'periodo',
      href,
      tone: 'warning',
    }),
    metric(ctx, {
      key: 'resultado',
      label: 'Resultado pelo caixa',
      value: Math.round(balance * 100) / 100,
      previous: numeric(before.entradas) - numeric(before.saidas),
      format: 'currency',
      description:
        'Recebimentos realizados menos pagamentos realizados. Transferências e adiantamentos não compõem este resultado.',
      scope: 'periodo',
      href,
      tone: balance < 0 ? 'danger' : 'success',
    }),
  ]
  result.charts = [
    {
      key: 'resultado',
      title: 'Evolução do resultado',
      description: 'Recebimentos, pagamentos e diferença por dia.',
      kind: 'line',
      format: 'currency',
      series: [
        { key: 'entradas', label: 'Recebimentos', color: '#059669' },
        { key: 'saidas', label: 'Pagamentos', color: '#d97706' },
        { key: 'resultado', label: 'Resultado', color: '#2563eb' },
      ],
      records: data.evolucao as { label: string; resultado: number }[],
    },
  ]
  result.lists = [
    {
      key: 'categorias',
      title: 'Resultado por categoria',
      description: 'Até 8 categorias por impacto; pagamentos têm sinal negativo.',
      rows: ranking(data.categorias as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'centros',
      title: 'Resultado por centro de custo',
      description: 'Rateios são respeitados, inclusive os ajustes de centavos.',
      rows: ranking(data.centros as Record<string, unknown>[], href),
      href,
    },
  ]
  result.notes = [
    'Critério de caixa: os movimentos são reconhecidos na data do pagamento ou estorno. Os rateios distribuem os valores por categoria e centro de custo.',
  ]
  return result
}
