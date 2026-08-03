'use client'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ErpEntityPage } from '@/products/erp/frontend/components/ErpEntityPage'
import { ErpShell } from '@/products/erp/frontend/layout/ErpShell'
import { PurchaseWorkspacePage } from '@/products/erp/frontend/modules/compras/PurchaseWorkspacePage'
import { PurchaseInvoicesPage } from '@/products/erp/frontend/modules/compras/PurchaseInvoicesPage'
import { PayablesWorkspacePage } from '@/products/erp/frontend/modules/financeiro/PayablesWorkspacePage'
import { getErpEntityConfig } from '@/products/erp/frontend/modules/entityRegistry'
import { OverviewPage } from '@/products/erp/frontend/modules/overview/OverviewPage'
import { getErpModule, getErpSection } from '@/products/erp/shared/navigation'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'

function ErpPlaceholderPage({
  sectionId,
  moduleId,
}: {
  sectionId: ErpSectionId
  moduleId?: ErpModuleId
}) {
  const section = getErpSection(sectionId)
  const module = getErpModule(sectionId, moduleId)

  return (
    <div className="flex min-h-[420px] flex-col justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/70 px-8">
      <div className="max-w-xl">
        <div className="text-xs font-medium uppercase tracking-normal text-gray-500">ERP</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-gray-950">{module?.label ?? section.label}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Esta area ja esta navegavel e pronta para receber uma configuracao reutilizavel como os cadastros. O proximo passo e definir colunas, campos, filtros e dados mockados deste modulo.
        </p>
      </div>
    </div>
  )
}

export default function ErpPage({
  section = 'overview',
  module,
}: {
  section?: ErpSectionId
  module?: ErpModuleId
}) {
  const entityConfig = getErpEntityConfig(section, module)
  const sectionConfig = getErpSection(section)
  const moduleConfig = getErpModule(section, module)

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <PageContainer className="bg-white">
          <ErpShell sectionId={sectionConfig.id} moduleId={moduleConfig?.id}>
            {sectionConfig.id === 'overview' ? (
              <OverviewPage />
            ) : sectionConfig.id === 'compras' && moduleConfig?.id === 'pedidos-compra' ? (
              <PurchaseWorkspacePage />
            ) : sectionConfig.id === 'compras' && moduleConfig?.id === 'parcelas-a-pagar' ? (
              <PayablesWorkspacePage purchaseOnly />
            ) : sectionConfig.id === 'compras' && moduleConfig?.id === 'notas-compra' ? (
              <PurchaseInvoicesPage />
            ) : sectionConfig.id === 'financeiro' && moduleConfig?.id === 'contas-a-pagar' ? (
              <PayablesWorkspacePage />
            ) : entityConfig ? (
              <ErpEntityPage config={entityConfig} />
            ) : (
              <ErpPlaceholderPage sectionId={sectionConfig.id} moduleId={moduleConfig?.id} />
            )}
          </ErpShell>
        </PageContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}
