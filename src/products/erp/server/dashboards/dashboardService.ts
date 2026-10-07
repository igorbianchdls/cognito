import { withTransaction } from '@/lib/postgres'
import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { ErpDomainError } from '../../shared/erpErrors'
import {
  DASHBOARDS,
  DASHBOARD_IDS,
  dashboardFilterSchema,
  dashboardToday,
  previousDashboardPeriod,
  type DashboardFilters,
  type DashboardId,
  type DashboardResponse,
} from '../../shared/dashboardContracts'
import type { ErpAccessContext } from '../erpAccess'
import { financeiroQueries } from './financeiroQueries'
import { vendasQueries } from './vendasQueries'
import { comprasQueries } from './comprasQueries'
import { estoqueQueries } from './estoqueQueries'
import { resultadosQueries } from './resultadosQueries'
import { servicosQueries } from './servicosQueries'
import { visaoGeralQueries } from './visaoGeralQueries'
import { attachDrilldownLinks } from './drilldownLinks'
import { normalizeTimeZone } from '@/products/erp/shared/businessDate'
const queries = {
  'visao-geral': visaoGeralQueries,
  financeiro: financeiroQueries,
  vendas: vendasQueries,
  compras: comprasQueries,
  estoque: estoqueQueries,
  resultados: resultadosQueries,
  servicos: servicosQueries,
}
export async function loadDashboard(
  session: ErpAccessContext,
  id: DashboardId,
  raw: DashboardFilters,
): Promise<DashboardResponse> {
  if (!DASHBOARD_IDS.includes(id))
    throw new ErpDomainError('NOT_FOUND', 'Dashboard não encontrado.', 404)
  const context = getErpDatabaseContext()
  if (context?.tenantId !== session.tenantId || context.userId !== session.sharedUserId)
    throw new ErpDomainError('ACCESS_DENIED', 'Contexto de empresa inválido.', 403)
  if (!DASHBOARDS[id].capabilities.every((c) => session.capabilities.includes(c)))
    throw new ErpDomainError(
      'ACCESS_DENIED',
      'Seu perfil não permite consultar este dashboard.',
      403,
    )
  const filters = dashboardFilterSchema.parse(raw),
    reference = dashboardToday(new Date(), session.timeZone),
    previous = previousDashboardPeriod(filters)
  return withTransaction(async (client) => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const content = attachDrilldownLinks(
      await queries[id]({
        tenantId: session.tenantId,
        capabilities: session.capabilities,
        client,
        filters,
        previous,
        reference,
      }),
      filters,
    )
    return {
      ...content,
      id,
      title: DASHBOARDS[id].title,
      description: DASHBOARDS[id].description,
      period: { from: filters.from, to: filters.to },
      previousPeriod: filters.compare ? previous : null,
      reference,
      timezone: normalizeTimeZone(session.timeZone),
      generatedAt: new Date().toISOString(),
      availableDashboards: DASHBOARD_IDS.filter((d) =>
        DASHBOARDS[d].capabilities.every((c) => session.capabilities.includes(c)),
      ),
    }
  })
}
