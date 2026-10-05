import { financialRows } from '../erpReadQueries'
import type { DashboardContent } from '../../shared/dashboardContracts'
import {
  accountBalancesSql,
  cashMovementsSql,
  emptyContent,
  link,
  metric,
  numeric,
  parameters,
  periodLink,
  rows,
  type DashboardContext,
} from './common'
export async function financeiroQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const [data] = await rows(
    ctx,
    `WITH limites AS (SELECT $4::date anterior_inicio,$5::date anterior_fim),cash AS MATERIALIZED (${cashMovementsSql}),accounts AS MATERIALIZED (${accountBalancesSql}),
    parcelas AS MATERIALIZED (
      SELECT r.*,'receber' tipo,'efetivo' tipo_lancamento FROM (${financialRows('receber')}) r
      UNION ALL SELECT r.*,'pagar',t.tipo_lancamento FROM (${financialRows('pagar')}) r JOIN erp.contas_pagar t ON t.empresa_id=$1 AND t.id=r.conta_id),
    abertas AS MATERIALIZED (SELECT * FROM parcelas WHERE saldo>0 AND status NOT IN ('cancelado','renegociado','pago') AND ($7::boolean OR tipo_lancamento='efetivo')),
    diario AS (SELECT d::date dia,coalesce((SELECT sum(CASE WHEN tipo='receber' THEN saldo ELSE -saldo END) FROM abertas a WHERE a.vencimento=d::date),0)
      +coalesce((SELECT sum(valor) FROM cash WHERE data=d::date AND data>$6::date),0) valor FROM generate_series($6::date,$6::date+30,interval '1 day') d),
    projecao AS (SELECT dia::text label,(SELECT coalesce(sum(saldo),0) FROM accounts)+sum(valor) OVER(ORDER BY dia) saldo FROM diario)
    SELECT (SELECT coalesce(sum(saldo),0) FROM accounts) saldo,
      (SELECT coalesce(sum(saldo),0) FROM abertas WHERE tipo='receber' AND vencimento BETWEEN $2::date AND $3::date) receber,
      (SELECT coalesce(sum(saldo),0) FROM abertas WHERE tipo='pagar' AND vencimento BETWEEN $2::date AND $3::date) pagar,
      (SELECT coalesce(sum(saldo),0) FROM abertas WHERE tipo='receber' AND vencimento<$6::date) receber_vencido,
      (SELECT coalesce(sum(saldo),0) FROM abertas WHERE tipo='pagar' AND vencimento<$6::date) pagar_vencido,
      (SELECT coalesce(sum(saldo),0) FROM abertas WHERE tipo='pagar' AND vencimento BETWEEN $6::date AND $6::date+7) proximos,
      (SELECT coalesce(sum(saldo),0) FROM abertas WHERE tipo_lancamento='previsao' AND vencimento BETWEEN $2::date AND $3::date) previsoes,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT data::text label,sum(valor) FILTER(WHERE tipo='receber') entradas,-sum(valor) FILTER(WHERE tipo='pagar') saidas FROM cash WHERE data BETWEEN $2::date AND $3::date GROUP BY data ORDER BY data) x) realizado,
      (SELECT coalesce(jsonb_agg(projecao),'[]') FROM projecao) projecao,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id,nome label,'Saldo até '||$6::text detail,saldo value FROM accounts ORDER BY saldo DESC,id) x) contas,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id,descricao label,tipo||' · '||vencimento::text||CASE WHEN tipo_lancamento='previsao' THEN ' · previsão' ELSE '' END detail,saldo value,tipo,vencimento::text vencimento FROM abertas WHERE vencimento<=$6::date+7 ORDER BY vencimento,id LIMIT 8) x) pendencias`,
    parameters(ctx),
  )
  const result = emptyContent(),
    pagar = periodLink(ctx, '/erp/financeiro/contas-a-pagar'),
    receber = periodLink(ctx, '/erp/financeiro/contas-a-receber')
  result.metrics = [
    metric(ctx, {
      key: 'saldo',
      label: 'Saldo financeiro atual',
      value: numeric(data.saldo),
      format: 'currency',
      description:
        'Saldos iniciais e movimentos de caixa até a data de referência, incluindo adiantamentos e transferências.',
      scope: 'atual',
      href: '/erp/financeiro/contas-financeiras',
    }),
    metric(ctx, {
      key: 'receber',
      label: 'A receber no período',
      value: numeric(data.receber),
      format: 'currency',
      description: 'Saldo restante das parcelas com vencimento no período.',
      scope: 'periodo',
      href: receber,
      tone: 'success',
    }),
    metric(ctx, {
      key: 'pagar',
      label: 'A pagar no período',
      value: numeric(data.pagar),
      format: 'currency',
      description: ctx.filters.includeForecast
        ? 'Saldo restante das parcelas efetivas e previsões do período.'
        : 'Saldo restante das parcelas efetivas com vencimento no período.',
      scope: 'periodo',
      href: pagar,
      tone: 'warning',
    }),
    metric(ctx, {
      key: 'receber-vencido',
      label: 'Recebimentos vencidos',
      value: numeric(data.receber_vencido),
      format: 'currency',
      description:
        'Todas as parcelas com saldo e vencimento anterior à referência, independentemente do período.',
      scope: 'atual',
      href: link('/erp/financeiro/contas-a-receber', { status: 'vencido' }),
      tone: 'danger',
    }),
    metric(ctx, {
      key: 'pagar-vencido',
      label: 'Pagamentos vencidos',
      value: numeric(data.pagar_vencido),
      format: 'currency',
      description: 'Todas as parcelas com saldo e vencimento anterior à referência.',
      scope: 'atual',
      href: link('/erp/financeiro/contas-a-pagar', { status: 'vencido' }),
      tone: 'danger',
    }),
    metric(ctx, {
      key: 'proximos',
      label: 'A pagar em 7 dias',
      value: numeric(data.proximos),
      format: 'currency',
      description: 'Parcelas ainda em aberto, de hoje até os próximos sete dias.',
      scope: 'atual',
      href: link('/erp/financeiro/contas-a-pagar', {
        from: ctx.reference,
        to: new Date(Date.parse(ctx.reference) + 7 * 86400000).toISOString().slice(0, 10),
      }),
    }),
  ]
  if (ctx.filters.includeForecast)
    result.metrics.push(
      metric(ctx, {
        key: 'previsoes',
        label: 'Previsões incluídas',
        value: numeric(data.previsoes),
        format: 'currency',
        description: 'Parte do saldo a pagar do período que ainda é previsão financeira.',
        scope: 'periodo',
        href: periodLink(ctx, '/erp/financeiro/contas-a-pagar', { tipo_lancamento: 'previsao' }),
      }),
    )
  result.charts = [
    {
      key: 'realizado',
      title: 'Fluxo de caixa realizado',
      description: 'Movimentos de caixa por data; estornos afetam a data de sua realização.',
      kind: 'bar',
      format: 'currency',
      series: [
        { key: 'entradas', label: 'Recebimentos e adiantamentos', color: '#059669' },
        { key: 'saidas', label: 'Pagamentos e adiantamentos', color: '#d97706' },
      ],
      records: data.realizado as { label: string; entradas: number; saidas: number }[],
    },
    {
      key: 'projecao',
      title: 'Projeção dos próximos 30 dias',
      description:
        'Saldo atual + parcelas abertas por vencimento + movimentos futuros registrados. Atrasados aparecem nas pendências; encargos futuros não são estimados.',
      kind: 'line',
      format: 'currency',
      series: [{ key: 'saldo', label: 'Saldo projetado', color: '#2563eb' }],
      records: data.projecao as { label: string; saldo: number }[],
    },
  ]
  result.lists = [
    {
      key: 'contas',
      title: 'Saldo por conta',
      description: 'Posição na data de referência.',
      href: '/erp/financeiro/contas-financeiras',
      rows: (data.contas as { id: number; label: string; detail: string; value: number }[]).map(
        (r) => ({ ...r, id: String(r.id), href: '/erp/financeiro/contas-financeiras' }),
      ),
    },
    {
      key: 'pendencias',
      title: 'Vencidas e próximos vencimentos',
      description: 'Até 8 parcelas em ordem de vencimento, incluindo atrasadas.',
      rows: (
        data.pendencias as {
          id: number
          label: string
          detail: string
          value: number
          tipo: string
          vencimento: string
        }[]
      ).map((r) => ({
        ...r,
        id: String(r.id),
        href: link(`/erp/financeiro/contas-a-${r.tipo === 'pagar' ? 'pagar' : 'receber'}`, {
          from: r.vencimento,
          to: r.vencimento,
          query: r.label,
        }),
      })),
    },
  ]
  result.notes = [
    ctx.filters.includeForecast
      ? 'A projeção inclui previsões financeiras, identificadas nos indicadores.'
      : 'A projeção considera compromissos efetivos; previsões financeiras estão excluídas.',
    'A projeção é uma estimativa pelas datas de vencimento. Os saldos atuais e atrasados usam a data de referência, independentemente do período escolhido.',
  ]
  return result
}
