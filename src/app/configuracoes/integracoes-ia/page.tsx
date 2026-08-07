import { redirect } from 'next/navigation'

import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AiIntegrationsPanel from '@/products/ai-platform/frontend/AiIntegrationsPanel'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'

export const dynamic = 'force-dynamic'

export default async function AiIntegrationsPage() {
  const access = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!access) redirect('/erp')
  return <SidebarProvider><SidebarShadcn /><SidebarInset><AiIntegrationsPanel /></SidebarInset></SidebarProvider>
}
