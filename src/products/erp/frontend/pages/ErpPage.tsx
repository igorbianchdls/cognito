'use client'

import { Suspense } from 'react'
import { DashboardRouter } from '@/products/erp/frontend/modules/dashboards/DashboardRouter'
import { DashboardRecordsPage } from '@/products/erp/frontend/modules/dashboards/components/DashboardRecordsPage'
import { DASHBOARD_IDS, type DashboardId } from '@/products/erp/shared/dashboardContracts'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { ErpEntityPage } from '@/products/erp/frontend/components/ErpEntityPage'
import { ErpImportExportPage } from '@/products/erp/frontend/components/ErpImportExportPage'
import { ErpOperationsWorkspacePage } from '@/products/erp/frontend/components/ErpOperationsWorkspacePage'
import { ErpShell } from '@/products/erp/frontend/layout/ErpShell'
import { PurchaseWorkspacePage } from '@/products/erp/frontend/modules/compras/PurchaseWorkspacePage'
import { PurchaseInvoicesPage } from '@/products/erp/frontend/modules/compras/PurchaseInvoicesPage'
import {ServiceInvoicesPage} from '@/products/erp/frontend/modules/vendas/ServiceInvoicesPage'
import { PayablesWorkspacePage } from '@/products/erp/frontend/modules/financeiro/PayablesWorkspacePage'
import { ReceivablesWorkspacePage } from '@/products/erp/frontend/modules/financeiro/ReceivablesWorkspacePage'
import { BankReconciliationPage } from '@/products/erp/frontend/modules/financeiro/BankReconciliationPage'
import { PeriodClosuresPage } from '@/products/erp/frontend/modules/financeiro/PeriodClosuresPage'
import { SalesWorkspacePage } from '@/products/erp/frontend/modules/vendas/SalesWorkspacePage'
import { ServiceOrdersWorkspacePage } from '@/products/erp/frontend/modules/vendas/ServiceOrdersWorkspacePage'
import { AutomationWorkspacePage } from '@/products/erp/frontend/components/ErpRoutineWorkspacePage'
import {
  isProfessionalReport,
  ProfessionalReportPage,
} from '@/products/erp/frontend/modules/relatorios/ProfessionalReportPage'
import { getErpEntityConfig } from '@/products/erp/frontend/modules/entityRegistry'
import { OverviewPage } from '@/products/erp/frontend/modules/overview/OverviewPage'
import { getErpModule, getErpSection } from '@/products/erp/shared/navigation'
import { ERP_OPERATION_CONFIGS } from '@/products/erp/shared/operations'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'

function ErpPlaceholderPage({
  sectionId,
  moduleId,
}: {
  sectionId: ErpSectionId
  moduleId?: ErpModuleId
}) {
  const section = getErpSection(sectionId)
  const selectedModule = getErpModule(sectionId, moduleId)

  return (
    <div className="flex min-h-[420px] flex-col justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/70 px-8">
      <div className="max-w-xl">
        <div className="text-xs font-medium uppercase tracking-normal text-gray-500">ERP</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-gray-950">
          {selectedModule?.label ?? section.label}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Este modulo ainda nao faz parte da versao operacional. Quando for ativado, usara os mesmos
          contratos, controles de acesso e componentes reutilizaveis dos demais modulos do ERP.
        </p>
      </div>
    </div>
  )
}

function ErpPageContent({
  section = 'overview',
  module,
  dashboardRecords,
}: {
  section?: ErpSectionId
  module?: ErpModuleId
  dashboardRecords?: boolean
}) {
  const entityConfig = getErpEntityConfig(section, module)
  const sectionConfig = getErpSection(section)
  const moduleConfig = getErpModule(section, module)
  const operationConfig = moduleConfig ? ERP_OPERATION_CONFIGS[moduleConfig.id] : undefined
  const usesWorkspaceChrome =
    (sectionConfig.id === 'financeiro' && ['contas-a-pagar', 'contas-a-receber'].includes(moduleConfig?.id ?? '')) ||
    (sectionConfig.id === 'vendas' && ['orcamentos', 'pedidos', 'ordens-servico', 'contratos','notas-fiscais'].includes(moduleConfig?.id ?? '')) ||
    ['compras', 'estoque'].includes(sectionConfig.id) || Boolean(entityConfig)

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="h-screen overflow-hidden">
        <PageContainer className="bg-white">
          <ErpShell
            sectionId={sectionConfig.id}
            moduleId={moduleConfig?.id}
            hideSectionTabs={usesWorkspaceChrome || ['overview', 'dashboards'].includes(sectionConfig.id)}
          >
            {sectionConfig.id === 'overview' ? (
              <OverviewPage />
            ) : sectionConfig.id === 'dashboards' &&
              DASHBOARD_IDS.includes(moduleConfig?.id as DashboardId) ? (
              dashboardRecords ? (
                <DashboardRecordsPage key={moduleConfig?.id} id={moduleConfig!.id as DashboardId} />
              ) : (
                <DashboardRouter key={moduleConfig?.id} id={moduleConfig!.id as DashboardId} />
              )
            ) : sectionConfig.id === 'vendas' && moduleConfig?.id === 'notas-fiscais' ? (
              <ServiceInvoicesPage />
            ) : sectionConfig.id === 'vendas' && moduleConfig?.id === 'pedidos' ? (
              <SalesWorkspacePage />
            ) : sectionConfig.id === 'vendas' && moduleConfig?.id === 'orcamentos' ? (
              <SalesWorkspacePage documentType="orcamento" />
            ) : sectionConfig.id === 'vendas' && moduleConfig?.id === 'ordens-servico' ? (
              <ServiceOrdersWorkspacePage />
            ) : sectionConfig.id === 'compras' && moduleConfig?.id === 'pedidos-compra' ? (
              <PurchaseWorkspacePage />
            ) : sectionConfig.id === 'compras' && moduleConfig?.id === 'parcelas-a-pagar' ? (
              <PayablesWorkspacePage purchaseOnly />
            ) : sectionConfig.id === 'compras' && moduleConfig?.id === 'notas-compra' ? (
              <PurchaseInvoicesPage />
            ) : sectionConfig.id === 'financeiro' && moduleConfig?.id === 'contas-a-pagar' ? (
              <PayablesWorkspacePage />
            ) : sectionConfig.id === 'financeiro' && moduleConfig?.id === 'contas-a-receber' ? (
              <ReceivablesWorkspacePage />
            ) : sectionConfig.id === 'financeiro' && moduleConfig?.id === 'conciliacao-bancaria' ? (
              <BankReconciliationPage />
            ) : sectionConfig.id === 'financeiro' && moduleConfig?.id === 'fechamentos' ? (
              <PeriodClosuresPage />
            ) : sectionConfig.id === 'cadastros' && moduleConfig?.id === 'importacoes' ? (
              <ErpImportExportPage />
            ) : sectionConfig.id === 'cadastros' && moduleConfig?.id === 'automacoes' ? (
              <AutomationWorkspacePage />
            ) : sectionConfig.id === 'relatorios' && isProfessionalReport(moduleConfig?.id) ? (
              <ProfessionalReportPage reportId={moduleConfig.id} />
            ) : operationConfig ? (
              <ErpOperationsWorkspacePage config={operationConfig} />
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

export default function ErpPage(props: {
  section?: ErpSectionId
  module?: ErpModuleId
  dashboardRecords?: boolean
}) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Carregando ERP…</div>}>
      <ErpPageContent {...props} />
    </Suspense>
  )
}
