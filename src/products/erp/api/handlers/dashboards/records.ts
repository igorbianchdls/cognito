import { NextResponse } from 'next/server'
import { withErpHttp } from '../../http/handler'
import { resolveErpApiSession } from '../../http/access'
import { loadDashboardRecords } from '../../../server/dashboards/drilldownQueries'
import {
  DASHBOARD_IDS,
  dashboardRecordsSchema,
  type DashboardId,
} from '../../../shared/dashboardContracts'
import { ErpDomainError } from '../../../shared/erpErrors'
export async function dashboardRecordsGET(
  request: Request,
  context: { params: Promise<{ dashboardId: string }> },
) {
  const session = await resolveErpApiSession()
  if (!session) throw new ErpDomainError('AUTH_REQUIRED', 'Entre na sua conta.', 401)
  const { dashboardId } = await context.params,
    params = new URL(request.url).searchParams
  if (!DASHBOARD_IDS.includes(dashboardId as DashboardId))
    throw new ErpDomainError('NOT_FOUND', 'Dashboard não encontrado.', 404)
  const allowed = [
    'source',
    'from',
    'to',
    'includeForecast',
    'status',
    'id',
    'dimension',
    'dimensionId',
    'page',
    'pageSize',
  ]
  for (const [key, value] of params) {
    if (
      !allowed.includes(key) ||
      params.getAll(key).length > 1 ||
      (key === 'includeForecast' && !['true', 'false'].includes(value))
    )
      throw new ErpDomainError('VALIDATION_ERROR', 'Filtro de registros inválido.', 422)
  }
  const filters = dashboardRecordsSchema.parse({
    ...Object.fromEntries(params),
    includeForecast: params.get('includeForecast') === 'true',
  })
  return NextResponse.json(await loadDashboardRecords(session, dashboardId as DashboardId, filters))
}
export const GET = withErpHttp(dashboardRecordsGET, {
  operation: 'GET /api/erp/dashboards/[dashboardId]/registros',
})
