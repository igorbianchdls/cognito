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
export async function comprasQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const [data] = await rows(
    ctx,
    `WITH docs AS MATERIALIZED (SELECT * FROM erp.compras WHERE empresa_id=$1 AND tipo_movimento='compra' AND excluido_em IS NULL),
    atual AS (SELECT * FROM docs WHERE status IN ('confirmada','parcialmente_recebida','recebida') AND data_compra BETWEEN $2::date AND $3::date),
    anterior AS (SELECT * FROM docs WHERE status IN ('confirmada','parcialmente_recebida','recebida') AND data_compra BETWEEN $4::date AND $5::date),
    fornecedores AS (SELECT e.id,e.nome label,count(*)||' compras' detail,sum(c.total) value FROM atual c JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=c.fornecedor_id GROUP BY e.id,e.nome ORDER BY value DESC,e.id LIMIT 8),
    categorias AS (SELECT e.id,coalesce(e.nome,'Sem categoria') label,count(*)||' compras' detail,sum(c.total) value FROM atual c LEFT JOIN erp.categorias e ON e.empresa_id=$1 AND e.id=c.categoria_id GROUP BY e.id,e.nome ORDER BY value DESC LIMIT 8)
    SELECT (SELECT count(*) FROM atual) quantidade,(SELECT coalesce(sum(total),0) FROM atual) valor,(SELECT coalesce(sum(total),0) FROM anterior) anterior,
      (SELECT count(*) FROM atual WHERE status='parcialmente_recebida') parciais,(SELECT count(*) FROM atual WHERE status='confirmada') pendentes,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT to_char(data_compra,'YYYY-MM-DD') label,sum(total) valor FROM atual GROUP BY data_compra ORDER BY data_compra) x) evolucao,
      (SELECT coalesce(jsonb_agg(fornecedores),'[]') FROM fornecedores) fornecedores,(SELECT coalesce(jsonb_agg(categorias),'[]') FROM categorias) categorias,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT d.id,d.numero label,e.nome||' · '||CASE WHEN d.status='parcialmente_recebida' THEN 'recebimento parcial' ELSE 'aguardando recebimento' END detail,d.total value FROM atual d JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=d.fornecedor_id WHERE d.status IN ('confirmada','parcialmente_recebida') ORDER BY d.data_compra,d.id LIMIT 8) x) pedidos`,
    [ctx.tenantId, ctx.filters.from, ctx.filters.to, ctx.previous.from, ctx.previous.to],
  )
  const result = emptyContent(),
    href = periodLink(ctx, '/erp/compras/pedidos-compra', { tipo_movimento: 'compra' })
  result.metrics = [
    metric(ctx, {
      key: 'compras',
      label: 'Compras confirmadas',
      value: numeric(data.valor),
      previous: numeric(data.anterior),
      format: 'currency',
      description: 'Valor integral de compras confirmadas, recebidas ou parcialmente recebidas.',
      scope: 'periodo',
      href,
      tone: 'warning',
    }),
    metric(ctx, {
      key: 'quantidade',
      label: 'Quantidade de compras',
      value: numeric(data.quantidade),
      format: 'number',
      description: 'Pedidos confirmados no período pela data da compra.',
      scope: 'periodo',
      href,
    }),
    metric(ctx, {
      key: 'pendentes',
      label: 'Aguardando recebimento',
      value: numeric(data.pendentes),
      format: 'number',
      description: 'Compras do período confirmadas e ainda não recebidas.',
      scope: 'periodo',
      href: periodLink(ctx, '/erp/compras/pedidos-compra', { status: 'confirmada' }),
    }),
    metric(ctx, {
      key: 'parciais',
      label: 'Recebidas parcialmente',
      value: numeric(data.parciais),
      format: 'number',
      description: 'Compras do período com parte dos itens recebida.',
      scope: 'periodo',
      href: periodLink(ctx, '/erp/compras/pedidos-compra', { status: 'parcialmente_recebida' }),
    }),
  ]
  result.charts = [
    {
      key: 'compras',
      title: 'Evolução das compras',
      description: 'Valores por data da compra.',
      kind: 'bar',
      format: 'currency',
      series: [{ key: 'valor', label: 'Compras', color: '#d97706' }],
      records: data.evolucao as { label: string; valor: number }[],
    },
  ]
  result.lists = [
    {
      key: 'fornecedores',
      title: 'Principais fornecedores',
      description: 'Até 8 fornecedores por valor comprado.',
      rows: ranking(data.fornecedores as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'categorias',
      title: 'Compras por categoria',
      description: 'Até 8 categorias por valor comprado.',
      rows: ranking(data.categorias as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'pendencias',
      title: 'Recebimentos pendentes',
      description: 'Até 8 pedidos do período aguardando itens.',
      rows: ranking(data.pedidos as Record<string, unknown>[], href),
      href,
    },
  ]
  return result
}
