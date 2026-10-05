import { notFound } from 'next/navigation'
import ErpPage from '@/products/erp/frontend/pages/ErpPage'
import { DASHBOARD_IDS, type DashboardId } from '@/products/erp/shared/dashboardContracts'
export default async function DashboardRecordsRoute({params}:{params:Promise<{dashboardId:string}>}){
  const {dashboardId}=await params
  if(!DASHBOARD_IDS.includes(dashboardId as DashboardId))notFound()
  return <ErpPage section="dashboards" module={dashboardId as DashboardId} dashboardRecords/>
}
