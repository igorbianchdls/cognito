import { DashboardListPage } from '@/products/artifacts/dashboard/pages/DashboardListPage'
import { listDashboards } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactsDashboardsPage() {
  const tenant = await resolveAuthTenant({ access: 'read' })
  const dashboards = tenant ? await listDashboards(100, tenant.tenantId) : []
  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto bg-white">
        <DashboardListPage dashboards={dashboards} />
      </SidebarInset>
    </SidebarProvider>
  )
}
