import { EmptyState } from '@/products/plugin/web/src/components/EmptyState'
import { ErrorState } from '@/products/plugin/web/src/components/ErrorState'
import { LoadingState } from '@/products/plugin/web/src/components/LoadingState'
import { ToolCallCard } from '@/products/plugin/web/src/components/ToolCallCard'
import { usePluginToolResult } from '@/products/plugin/web/src/bridge'
import type {
  AnalysisStructuredContent,
  AutomationStructuredContent,
  ChartResultStructuredContent,
  ConnectorsStructuredContent,
  DataCatalogStructuredContent,
  DataResultStructuredContent,
  DashboardListStructuredContent,
  DashboardPreviewStructuredContent,
  TableStructuredContent,
} from '@/products/plugin/web/src/types/toolResult'
import { AnalysisView } from '@/products/plugin/web/src/views/AnalysisView'
import { AutomationView } from '@/products/plugin/web/src/views/AutomationView'
import { ChartResultView } from '@/products/plugin/web/src/views/ChartResultView'
import { ConnectorsView } from '@/products/plugin/web/src/views/ConnectorsView'
import { DashboardListView } from '@/products/plugin/web/src/views/DashboardListView'
import { DashboardPreviewView } from '@/products/plugin/web/src/views/DashboardPreviewView'
import { DataCatalogView } from '@/products/plugin/web/src/views/DataCatalogView'
import { DataResultView } from '@/products/plugin/web/src/views/DataResultView'
import { TableResultView } from '@/products/plugin/web/src/views/TableResultView'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getView(structuredContent: unknown) {
  if (!isRecord(structuredContent)) return null
  return typeof structuredContent.view === 'string' ? structuredContent.view : null
}

export function App() {
  const { toolInput, structuredContent, isError } = usePluginToolResult()

  if (isError) {
    return (
      <main className="app-shell">
        <ErrorState />
      </main>
    )
  }

  if (!structuredContent) {
    return (
      <main className="app-shell">
        <ToolCallCard toolInput={toolInput} status="running" />
        <LoadingState />
      </main>
    )
  }

  const view = getView(structuredContent)
  const tool = isRecord(structuredContent) && typeof structuredContent.tool === 'string'
    ? structuredContent.tool
    : null
  const isDataTool = tool === 'erp' || tool === 'erp_acoes' || tool === 'crm' || tool === 'sql' || tool === 'sql_execution' || tool === 'ecommerce' || tool === 'marketing'

  return (
    <main className="app-shell">
      <ToolCallCard structuredContent={structuredContent} toolInput={toolInput} status="done" />
      {view === 'dashboard_list' ? (
        <DashboardListView data={structuredContent as DashboardListStructuredContent} />
      ) : null}
      {view === 'dashboard_preview' ? (
        <DashboardPreviewView data={structuredContent as DashboardPreviewStructuredContent} />
      ) : null}
      {view === 'chart' ? (
        <ChartResultView data={structuredContent as ChartResultStructuredContent} />
      ) : null}
      {view === 'analysis' || tool === 'analysis' ? (
        <AnalysisView data={structuredContent as AnalysisStructuredContent} />
      ) : null}
      {view === 'table' || tool === 'table' ? (
        <TableResultView data={structuredContent as TableStructuredContent} />
      ) : null}
      {view === 'automation' || view === 'automation_list' || view === 'action_result' || tool === 'actions' || tool === 'alerts' || tool === 'schedules' ? (
        <AutomationView data={structuredContent as AutomationStructuredContent} />
      ) : null}
      {view === 'connectors' || tool === 'connectors' ? (
        <ConnectorsView data={structuredContent as ConnectorsStructuredContent} />
      ) : null}
      {view === 'data_catalog' || tool === 'data_catalog' ? (
        <DataCatalogView data={structuredContent as DataCatalogStructuredContent} />
      ) : null}
      {isDataTool ? (
        <DataResultView data={structuredContent as DataResultStructuredContent} />
      ) : null}
      {!view && !isDataTool ? (
        <EmptyState
          title="Formato nao reconhecido"
          description="A resposta da tool nao informou uma view renderizavel."
        />
      ) : null}
    </main>
  )
}

export default App
