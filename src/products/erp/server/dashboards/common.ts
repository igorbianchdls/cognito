import type { SQLClient } from '@/lib/postgres'
import type { ErpCapability } from '../../shared/professionalContracts'
import type {
  DashboardContent,
  DashboardFilters,
  DashboardMetric,
  DashboardPeriod,
  DashboardRow,
} from '../../shared/dashboardContracts'
export type DashboardContext = {
  tenantId: number
  client: Pick<SQLClient, 'query'>
  filters: DashboardFilters
  previous: DashboardPeriod
  reference: string
  capabilities: ErpCapability[]
}
export const emptyContent = (): DashboardContent => ({
  metrics: [],
  charts: [],
  lists: [],
  notes: [],
})
export const numeric = (value: unknown) => Number(value || 0)
export async function rows<T extends Record<string, unknown>>(
  ctx: DashboardContext,
  sql: string,
  params: unknown[] = parameters(ctx),
): Promise<T[]> {
  return (await ctx.client.query(sql, params)).rows as T[]
}
export const parameters = (ctx: DashboardContext) => [
  ctx.tenantId,
  ctx.filters.from,
  ctx.filters.to,
  ctx.previous.from,
  ctx.previous.to,
  ctx.reference,
  ctx.filters.includeForecast,
]
export function metric(
  ctx: DashboardContext,
  value: Omit<DashboardMetric, 'variation'>,
): DashboardMetric {
  if (!Number.isFinite(value.value)) throw new Error('Indicador inválido.')
  return {
    ...value,
    ...(value.scope === 'periodo' && ctx.filters.compare && value.previous !== undefined
      ? {
          variation:
            value.previous === 0
              ? null
              : Math.round(((value.value - value.previous) / Math.abs(value.previous)) * 1000) / 10,
        }
      : { previous: undefined }),
  }
}
export function link(path: string, params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter((p): p is [string, string] => Boolean(p[1])),
  )
  return path + (query.size ? '?' + query : '')
}
export const periodLink = (
  ctx: DashboardContext,
  path: string,
  extra: Record<string, string> = {},
) => link(path, { from: ctx.filters.from, to: ctx.filters.to, ...extra })
export function ranking(data: Record<string, unknown>[], path: string): DashboardRow[] {
  return data.map((r) => ({
    id: String(r.id ?? 'sem'),
    label: String(r.label),
    detail: String(r.detail || ''),
    value: numeric(r.value),
    href: typeof r.href === 'string' ? r.href : path,
  }))
}
export const cashMovementsSql = `SELECT p.id::text AS id,p.conta_financeira_id,p.data_pagamento AS data,p.tipo,
  p.valor_liquido*CASE WHEN p.estorno_de_pagamento_id IS NULL THEN 1 ELSE -1 END*CASE WHEN p.tipo='receber' THEN 1 ELSE -1 END AS valor
  FROM erp.pagamentos p WHERE p.empresa_id=$1 AND p.excluido_em IS NULL
  UNION ALL SELECT 'a-'||a.id,a.conta_financeira_id,a.data_movimento,a.lado,
    a.valor*CASE WHEN a.tipo='reversao' THEN CASE WHEN (o.lado='receber')=(o.tipo='constituicao') THEN -1 ELSE 1 END
      WHEN (a.lado='receber')=(a.tipo='constituicao') THEN 1 ELSE -1 END
    FROM erp.adiantamentos a LEFT JOIN erp.adiantamentos o ON o.empresa_id=a.empresa_id AND o.id=a.reversao_de_id WHERE a.empresa_id=$1`
export const accountBalancesSql = `SELECT a.id,a.nome,a.saldo_inicial+COALESCE((SELECT sum(m.valor) FROM cash m WHERE m.conta_financeira_id=a.id AND m.data>=a.data_saldo_inicial AND m.data<=$6::date),0)
  +COALESCE((SELECT sum(CASE WHEN t.conta_destino_id=a.id THEN t.valor ELSE -t.valor END) FROM erp.transferencias_financeiras t WHERE t.empresa_id=$1 AND t.excluido_em IS NULL AND t.status='concluida' AND t.data_transferencia BETWEEN a.data_saldo_inicial AND $6::date AND (t.conta_origem_id=a.id OR t.conta_destino_id=a.id)),0) AS saldo
  FROM erp.contas_financeiras a WHERE a.empresa_id=$1 AND a.excluido_em IS NULL AND a.data_saldo_inicial<=$6::date`
