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
export async function vendasQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const [data] = await rows(
    ctx,
    `WITH docs AS MATERIALIZED (SELECT * FROM erp.vendas WHERE empresa_id=$1 AND excluido_em IS NULL),
    atual AS (SELECT * FROM docs WHERE tipo_documento='venda' AND status IN ('confirmada','faturada') AND data_venda BETWEEN $2::date AND $3::date),
    anterior AS (SELECT * FROM docs WHERE tipo_documento='venda' AND status IN ('confirmada','faturada') AND data_venda BETWEEN $4::date AND $5::date),
    quotes AS (SELECT * FROM docs WHERE tipo_documento='orcamento' AND status<>'cancelada' AND data_venda BETWEEN $2::date AND $3::date),
    clientes AS (SELECT e.id,e.nome label,count(*)||' vendas' detail,sum(v.total) value FROM atual v JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=v.cliente_id GROUP BY e.id,e.nome ORDER BY value DESC,e.id LIMIT 8),
    vendedores AS (SELECT e.id,coalesce(e.nome,'Sem vendedor') label,count(*)||' vendas' detail,sum(v.total) value FROM atual v LEFT JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=v.vendedor_id GROUP BY e.id,e.nome ORDER BY value DESC LIMIT 8),
    produtos AS (SELECT coalesce(i.produto_id::text,'s-'||i.servico_id) id,i.descricao label,sum(i.quantidade)||' unidades' detail,round(sum(i.total*v.total/nullif(v.subtotal,0)),2) value FROM atual v JOIN erp.vendas_itens i ON i.empresa_id=$1 AND i.venda_id=v.id AND i.excluido_em IS NULL GROUP BY i.produto_id,i.servico_id,i.descricao ORDER BY value DESC LIMIT 8)
    SELECT (SELECT count(*) FROM atual) quantidade,(SELECT coalesce(sum(total),0) FROM atual) valor,(SELECT count(*) FROM anterior) quantidade_anterior,(SELECT coalesce(sum(total),0) FROM anterior) valor_anterior,
      (SELECT count(*) FROM quotes) orcamentos,(SELECT count(*) FROM quotes q WHERE EXISTS(SELECT 1 FROM docs v WHERE v.venda_origem_id=q.id AND v.tipo_documento='venda' AND v.status IN ('confirmada','faturada'))) convertidos,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT to_char(data_venda,'YYYY-MM-DD') label,sum(total) valor,count(*) quantidade FROM atual GROUP BY data_venda ORDER BY data_venda) x) evolucao,
      (SELECT coalesce(jsonb_agg(clientes),'[]') FROM clientes) clientes,(SELECT coalesce(jsonb_agg(vendedores),'[]') FROM vendedores) vendedores,(SELECT coalesce(jsonb_agg(produtos),'[]') FROM produtos) produtos`,
    [ctx.tenantId, ctx.filters.from, ctx.filters.to, ctx.previous.from, ctx.previous.to],
  )
  const result = emptyContent(),
    href = periodLink(ctx, '/erp/vendas/pedidos', { status: 'confirmada' })
  const total = numeric(data.valor),
    count = numeric(data.quantidade),
    before = numeric(data.valor_anterior),
    beforeCount = numeric(data.quantidade_anterior)
  result.metrics = [
    metric(ctx, {
      key: 'vendas',
      label: 'Vendas confirmadas',
      value: total,
      previous: before,
      format: 'currency',
      description: 'Total dos documentos confirmados ou faturados, pela data da venda.',
      scope: 'periodo',
      href,
      tone: 'success',
    }),
    metric(ctx, {
      key: 'quantidade',
      label: 'Quantidade de vendas',
      value: count,
      previous: beforeCount,
      format: 'number',
      description: 'Documentos do tipo venda; cada venda conta uma vez.',
      scope: 'periodo',
      href,
    }),
    metric(ctx, {
      key: 'ticket',
      label: 'Ticket médio',
      value: count ? total / count : 0,
      previous: beforeCount ? before / beforeCount : 0,
      format: 'currency',
      description: 'Valor das vendas dividido pela quantidade de vendas.',
      scope: 'periodo',
      href,
    }),
    metric(ctx, {
      key: 'orcamentos',
      label: 'Orçamentos emitidos',
      value: numeric(data.orcamentos),
      format: 'number',
      description: 'Orçamentos criados no período, excluindo cancelados.',
      scope: 'periodo',
      href: periodLink(ctx, '/erp/vendas/orcamentos'),
    }),
    metric(ctx, {
      key: 'conversao',
      label: 'Conversão de orçamentos',
      value: numeric(data.orcamentos)
        ? (numeric(data.convertidos) / numeric(data.orcamentos)) * 100
        : 0,
      format: 'percent',
      description: 'Orçamentos do período com uma venda confirmada vinculada, até esta consulta.',
      scope: 'periodo',
      href: periodLink(ctx, '/erp/vendas/orcamentos'),
    }),
  ]
  result.charts = [
    {
      key: 'evolucao',
      title: 'Evolução das vendas',
      description: 'Valores confirmados por dia da venda.',
      kind: 'line',
      format: 'currency',
      series: [{ key: 'valor', label: 'Vendas', color: '#2563eb' }],
      records: data.evolucao as { label: string; valor: number }[],
    },
  ]
  result.lists = [
    {
      key: 'clientes',
      title: 'Principais clientes',
      description: 'Até 8 clientes por valor vendido.',
      rows: ranking(data.clientes as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'vendedores',
      title: 'Vendas por vendedor',
      description: 'Até 8 responsáveis por valor vendido.',
      rows: ranking(data.vendedores as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'produtos',
      title: 'Produtos e serviços mais vendidos',
      description:
        'Valores dos itens com desconto e despesas do documento distribuídos proporcionalmente.',
      rows: ranking(data.produtos as Record<string, unknown>[], href),
      href,
    },
  ]
  return result
}
