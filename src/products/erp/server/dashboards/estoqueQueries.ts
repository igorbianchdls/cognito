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
export async function estoqueQueries(ctx: DashboardContext): Promise<DashboardContent> {
  const [data] = await rows(
    ctx,
    `WITH posicao AS MATERIALIZED (SELECT s.*,p.nome,p.sku,p.estoque_minimo,l.nome local,s.quantidade_fisica-s.quantidade_reservada disponivel,s.quantidade_fisica*s.custo_medio valor FROM erp.saldos_estoque s JOIN erp.produtos p ON p.empresa_id=$1 AND p.id=s.produto_id AND p.excluido_em IS NULL JOIN erp.locais_estoque l ON l.empresa_id=$1 AND l.id=s.local_estoque_id WHERE s.empresa_id=$1),
    reposicao AS (SELECT produto_id,min(nome) nome,min(sku) sku,sum(disponivel) disponivel,max(estoque_minimo) minimo FROM posicao GROUP BY produto_id HAVING sum(disponivel)<max(estoque_minimo)),
    movimentos AS (SELECT m.*,coalesce(data_operacional,(ocorrido_em AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone',true),''),'America/Sao_Paulo'))::date) dia FROM erp.movimentacoes_estoque m WHERE empresa_id=$1 AND coalesce(data_operacional,(ocorrido_em AT TIME ZONE coalesce(nullif(current_setting('app.erp_time_zone',true),''),'America/Sao_Paulo'))::date) BETWEEN $2::date AND $3::date)
    SELECT (SELECT coalesce(sum(valor),0) FROM posicao) valor,(SELECT count(DISTINCT produto_id) FROM posicao) produtos,(SELECT count(*) FROM posicao WHERE quantidade_reservada>0) reservas,(SELECT count(*) FROM reposicao) repor,
      (SELECT count(*) FROM movimentos WHERE quantidade>0) entradas,(SELECT count(*) FROM movimentos WHERE quantidade<0) saidas,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT dia::text label,count(*) FILTER(WHERE quantidade>0) entradas,count(*) FILTER(WHERE quantidade<0) saidas FROM movimentos GROUP BY dia ORDER BY dia) x) evolucao,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT produto_id id,nome label,sku||' · disponível '||disponivel||' · mínimo '||minimo detail,disponivel value FROM reposicao ORDER BY disponivel-minimo,produto_id LIMIT 8) x) repor_lista,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT id,nome label,local||' · físico '||quantidade_fisica||' · reservado '||quantidade_reservada||' · disponível '||disponivel detail,valor value FROM posicao ORDER BY valor DESC,id LIMIT 8) x) produtos_lista,
      (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT min(local_estoque_id) id,local label,count(*)||' produtos/posições' detail,sum(valor) value FROM posicao GROUP BY local ORDER BY value DESC) x) locais`,
    [ctx.tenantId, ctx.filters.from, ctx.filters.to],
  )
  const result = emptyContent(),
    href = '/erp/estoque/posicao-estoque'
  result.metrics = [
    metric(ctx, {
      key: 'valor',
      label: 'Valor do estoque',
      value: numeric(data.valor),
      format: 'currency',
      description: 'Quantidade física × custo médio de cada produto/local, na posição atual.',
      scope: 'atual',
      href,
    }),
    metric(ctx, {
      key: 'produtos',
      label: 'Produtos em estoque',
      value: numeric(data.produtos),
      format: 'number',
      description: 'Produtos distintos com posição de estoque, incluindo saldo zero.',
      scope: 'atual',
      href,
    }),
    metric(ctx, {
      key: 'repor',
      label: 'Produtos para repor',
      value: numeric(data.repor),
      format: 'number',
      description: 'Disponibilidade somada nos locais abaixo do mínimo do produto.',
      scope: 'atual',
      href,
      tone: 'warning',
    }),
    metric(ctx, {
      key: 'reservas',
      label: 'Posições com reservas',
      value: numeric(data.reservas),
      format: 'number',
      description: 'Pares de produto/local com quantidade reservada maior que zero.',
      scope: 'atual',
      href,
    }),
    metric(ctx, {
      key: 'entradas',
      label: 'Movimentos de entrada',
      value: numeric(data.entradas),
      format: 'number',
      description: 'Número de entradas no período, incluindo transferências entre locais.',
      scope: 'periodo',
      href: periodLink(ctx, '/erp/estoque/movimentacoes'),
    }),
    metric(ctx, {
      key: 'saidas',
      label: 'Movimentos de saída',
      value: numeric(data.saidas),
      format: 'number',
      description: 'Número de saídas no período, incluindo transferências entre locais.',
      scope: 'periodo',
      href: periodLink(ctx, '/erp/estoque/movimentacoes'),
    }),
  ]
  result.charts = [
    {
      key: 'movimentos',
      title: 'Movimentações do estoque',
      description:
        'Contagem de movimentos por data operacional; unidades diferentes não são somadas.',
      kind: 'bar',
      format: 'number',
      series: [
        { key: 'entradas', label: 'Entradas', color: '#059669' },
        { key: 'saidas', label: 'Saídas', color: '#d97706' },
      ],
      records: data.evolucao as { label: string; entradas: number; saidas: number }[],
    },
  ]
  result.lists = [
    {
      key: 'reposicao',
      title: 'Precisam de reposição',
      description: 'Até 8 produtos com disponibilidade abaixo do mínimo.',
      rows: ranking(data.repor_lista as Record<string, unknown>[], href).map((r) => ({
        ...r,
        format: 'number',
      })),
      href,
    },
    {
      key: 'valor',
      title: 'Maior valor em estoque',
      description: 'Até 8 posições de produto/local.',
      rows: ranking(data.produtos_lista as Record<string, unknown>[], href),
      href,
    },
    {
      key: 'locais',
      title: 'Estoque por local',
      description: 'Valor atual dos produtos em cada depósito.',
      rows: ranking(data.locais as Record<string, unknown>[], href),
      href,
    },
  ]
  result.notes = [
    'Os saldos e reservas são a posição atual. O filtro de período afeta apenas as movimentações.',
  ]
  return result
}
