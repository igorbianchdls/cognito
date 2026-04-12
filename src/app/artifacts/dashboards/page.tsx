import { DashboardListPage } from '@/products/artifacts/dashboard/DashboardListPage'
import { listDashboards } from '@/products/artifacts/backend/dashboardArtifactsService'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactsDashboardsPage() {
  const dashboards = await listDashboards()
  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto bg-white">
        <DashboardListPage dashboards={dashboards} />
      </SidebarInset>
    </SidebarProvider>
  )
}
