import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { NextResponse } from 'next/server'
import { withErpHttp } from '../../http/handler'
import { resolveErpApiSession } from '../../http/access'
import { loadDashboard } from '../../../server/dashboards/dashboardService'
import { DASHBOARD_IDS, type DashboardId } from '../../../shared/dashboardContracts'
import { ErpDomainError } from '../../../shared/erpErrors'
async function handleGET(request: Request, context: { params: Promise<{ dashboardId: string }> }) {
  const session = await resolveErpApiSession()
  if (!session) throw new ErpDomainError('AUTH_REQUIRED', 'Entre na sua conta.', 401)
  const { dashboardId } = await context.params,
    params = new URL(request.url).searchParams
  if (!DASHBOARD_IDS.includes(dashboardId as DashboardId))
    throw new ErpDomainError('NOT_FOUND', 'Dashboard não encontrado.', 404)
  const allowed = ['from', 'to', 'compare', 'includeForecast']
  for (const [key, value] of params) {
    if (!allowed.includes(key) || params.getAll(key).length > 1)
      throw new ErpDomainError('VALIDATION_ERROR', 'Filtro de dashboard inválido.', 422)
    if (['compare', 'includeForecast'].includes(key) && !['true', 'false'].includes(value))
      throw new ErpDomainError('VALIDATION_ERROR', 'Informe true ou false para as opções.', 422)
  }
  const today = erpToday()
  return NextResponse.json(
    await loadDashboard(session, dashboardId as DashboardId, {
      from: params.get('from') || today.slice(0, 7) + '-01',
      to: params.get('to') || today,
      compare: params.get('compare') !== 'false',
      includeForecast: params.get('includeForecast') === 'true',
    }),
  )
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/dashboards/[dashboardId]' })
