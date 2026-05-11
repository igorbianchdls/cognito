import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ErrorState } from '@/products/mcp-apps/web/src/components/ErrorState'
import { LoadingState } from '@/products/mcp-apps/web/src/components/LoadingState'
import { useMcpAppToolResult } from '@/products/mcp-apps/web/src/bridge'
import type {
  DashboardListStructuredContent,
  DashboardPreviewStructuredContent,
} from '@/products/mcp-apps/web/src/types/toolResult'
import { DashboardListView } from '@/products/mcp-apps/web/src/views/DashboardListView'
import { DashboardPreviewView } from '@/products/mcp-apps/web/src/views/DashboardPreviewView'

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

  return (
    <main className="app-shell">
      {view === 'dashboard_list' ? (
        <DashboardListView data={structuredContent as DashboardListStructuredContent} />
      ) : null}
      {view === 'dashboard_preview' ? (
        <DashboardPreviewView data={structuredContent as DashboardPreviewStructuredContent} />
      ) : null}
      {!view ? (
        <EmptyState
          title="Formato nao reconhecido"
          description="A resposta da tool nao informou uma view renderizavel."
        />
      ) : null}
    </main>
  )
}

export default App

