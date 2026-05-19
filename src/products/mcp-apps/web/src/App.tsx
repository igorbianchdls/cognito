import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ErrorState } from '@/products/mcp-apps/web/src/components/ErrorState'
import { LoadingState } from '@/products/mcp-apps/web/src/components/LoadingState'
import { useMcpAppToolResult } from '@/products/mcp-apps/web/src/bridge'
import type {
  AnalysisStructuredContent,
  AutomationStructuredContent,
  ChartResultStructuredContent,
  DataCatalogStructuredContent,
  DataResultStructuredContent,
  DashboardListStructuredContent,
  DashboardPreviewStructuredContent,
  TableStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { AnalysisView } from '@/products/mcp-apps/web/src/views/AnalysisView'
import { AutomationView } from '@/products/mcp-apps/web/src/views/AutomationView'
import { ChartResultView } from '@/products/mcp-apps/web/src/views/ChartResultView'
import { DashboardListView } from '@/products/mcp-apps/web/src/views/DashboardListView'
import { DashboardPreviewView } from '@/products/mcp-apps/web/src/views/DashboardPreviewView'
import { DataCatalogView } from '@/products/mcp-apps/web/src/views/DataCatalogView'
import { DataResultView } from '@/products/mcp-apps/web/src/views/DataResultView'
import { TableResultView } from '@/products/mcp-apps/web/src/views/TableResultView'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getView(structuredContent: unknown) {
  if (!isRecord(structuredContent)) return null
  return typeof structuredContent.view === 'string' ? structuredContent.view : null
}

export function App() {
  const { structuredContent, isError } = useMcpAppToolResult()

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
      {view === 'automation' || view === 'action_result' || tool === 'actions' || tool === 'alerts' || tool === 'schedules' ? (
        <AutomationView data={structuredContent as AutomationStructuredContent} />
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
