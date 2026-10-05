import type { DashboardContent } from '../../shared/dashboardContracts'
import {
  emptyContent,
  metric,
  numeric,
  parameters,
  periodLink,
  ranking,
  rows,
  type DashboardContext,
} from './common'
export async function servicosQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const [data] = await rows(
    ctx,
    `WITH limites AS (SELECT $7::boolean incluir_previsao),os AS MATERIALIZED (SELECT * FROM erp.ordens_servico WHERE empresa_id=$1 AND excluido_em IS NULL),
    contratos AS MATERIALIZED (SELECT c.*,v.id versao_atual,v.periodicidade periodicidade_atual FROM erp.contratos_vendas c JOIN LATERAL(SELECT * FROM erp.contratos_vendas_versoes v WHERE v.empresa_id=$1 AND v.contrato_id=c.id AND v.status='efetivada' AND v.vigencia_inicio<=$6::date AND (v.vigencia_fim IS NULL OR v.vigencia_fim>=$6::date) ORDER BY v.vigencia_inicio DESC,v.numero DESC LIMIT 1) v ON true WHERE c.empresa_id=$1 AND c.status='ativo' AND c.excluido_em IS NULL AND c.data_inicio<=$6::date AND (c.data_fim IS NULL OR c.data_fim>=$6::date)),
    finalizadas AS (SELECT * FROM os WHERE status='concluida' AND (concluida_em AT TIME ZONE 'America/Fortaleza')::date BETWEEN $2::date AND $3::date),
    anterior AS (SELECT * FROM os WHERE status='concluida' AND (concluida_em AT TIME ZONE 'America/Fortaleza')::date BETWEEN $4::date AND $5::date)
    SELECT (SELECT count(*) FROM os WHERE status NOT IN ('concluida','cancelada')) abertas,(SELECT count(*) FROM os WHERE status NOT IN ('concluida','cancelada') AND previsao_entrega<$6::date) atrasadas,
      (SELECT count(*) FROM finalizadas) concluidas,(SELECT count(*) FROM anterior) concluidas_anterior,(SELECT count(*) FROM contratos) contratos,
      (SELECT coalesce(sum(i.total),0) FROM contratos c JOIN erp.contratos_vendas_itens i ON i.empresa_id=$1 AND i.contrato_versao_id=c.versao_atual WHERE c.periodicidade_atual='mensal') mensal,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT to_char(concluida_em AT TIME ZONE 'America/Fortaleza','YYYY-MM-DD') label,count(*) quantidade FROM finalizadas GROUP BY 1 ORDER BY 1) x) evolucao,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id,numero label,coalesce(problema_informado,'Ordem de serviço')||' · '||CASE WHEN previsao_entrega<$6::date THEN 'atrasada' ELSE replace(status,'_',' ') END detail,total value FROM os WHERE status NOT IN ('concluida','cancelada') ORDER BY previsao_entrega NULLS LAST,id LIMIT 8) x) ordens,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT c.id,c.numero label,c.descricao||' · próxima geração '||coalesce(c.proxima_geracao_em::text,'não programada') detail,coalesce((SELECT sum(i.total) FROM erp.contratos_vendas_itens i WHERE i.empresa_id=$1 AND i.contrato_versao_id=c.versao_atual),0) value FROM contratos c ORDER BY c.proxima_geracao_em NULLS LAST,c.id LIMIT 8) x) proximas`,
    parameters(ctx),
  )
  const result = emptyContent(),
    href = '/erp/vendas/ordens-servico'
  result.metrics = [
    metric(ctx, {
      key: 'abertas',
      label: 'Ordens em aberto',
      value: numeric(data.abertas),
      format: 'number',
      description: 'Ordens atuais ainda não concluídas ou canceladas.',
      scope: 'atual',
      href,
    }),
    metric(ctx, {
      key: 'atrasadas',
      label: 'Ordens atrasadas',
      value: numeric(data.atrasadas),
      format: 'number',
      description: 'Ordens abertas com entrega prevista antes da referência.',
      scope: 'atual',
      href,
      tone: 'danger',
    }),
    metric(ctx, {
      key: 'concluidas',
      label: 'Ordens concluídas',
      value: numeric(data.concluidas),
      previous: numeric(data.concluidas_anterior),
      format: 'number',
      description: 'Ordens concluídas no período, pela data de conclusão.',
      scope: 'periodo',
      href: periodLink(ctx, href, { status: 'concluida' }),
      tone: 'success',
    }),
    metric(ctx, {
      key: 'contratos',
      label: 'Contratos ativos',
      value: numeric(data.contratos),
      format: 'number',
      description: 'Contratos ativos com uma versão efetivada e vigente na referência.',
      scope: 'atual',
      href: '/erp/vendas/contratos',
    }),
    metric(ctx, {
      key: 'mensal',
      label: 'Valor mensal contratado',
      value: numeric(data.mensal),
      format: 'currency',
      description: 'Total da versão vigente dos contratos de periodicidade mensal.',
      scope: 'atual',
      href: '/erp/vendas/contratos',
    }),
  ]
  result.charts = [
    {
      key: 'conclusoes',
      title: 'Conclusões no período',
      description: 'Ordens de serviço concluídas por dia.',
      kind: 'bar',
      format: 'number',
      series: [{ key: 'quantidade', label: 'Ordens concluídas', color: '#2563eb' }],
      records: data.evolucao as { label: string; quantidade: number }[],
    },
  ]
  result.lists = [
    {
      key: 'ordens',
      title: 'Ordens que precisam de atenção',
      description: 'Até 8 ordens abertas, pela previsão de entrega.',
      rows: ranking(data.ordens as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'contratos',
      title: 'Próximas gerações de contratos',
      description: 'Até 8 contratos ativos; valores por ciclo contratado.',
      rows: ranking(data.proximas as Record<string, unknown>[], '/erp/vendas/contratos'),
      href: '/erp/vendas/contratos',
    },
  ]
  result.notes = [
    'O valor mensal contratado considera contratos mensais e sua versão vigente. A próxima geração cria a operação comercial prevista pelo contrato.',
  ]
  return result
}
