import { ArtifactListPage } from '@/products/artifacts/dashboard/pages/DashboardListPage'
import { listArtifactsByType } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArtifactsReportsPage() {
  const tenant = await resolveAuthTenant({ access: 'read' })
  const reports = tenant ? await listArtifactsByType('report', 100, tenant.tenantId) : []
  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-auto bg-white">
        <ArtifactListPage artifacts={reports} artifactType="report" />
      </SidebarInset>
    </SidebarProvider>
  )
}
