import { DashboardListPage } from '@/products/artifacts/dashboard/DashboardListPage'
import { listDashboards } from '@/products/artifacts/backend/dashboardArtifactsService'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactsDashboardsPage() {
  const dashboards = await listDashboards()
  return <DashboardListPage dashboards={dashboards} />
}
