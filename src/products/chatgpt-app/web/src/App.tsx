import { EmptyState } from '@/products/chatgpt-app/web/src/components/EmptyState'
import { ErrorState } from '@/products/chatgpt-app/web/src/components/ErrorState'
import { LoadingState } from '@/products/chatgpt-app/web/src/components/LoadingState'
import { useChatGptToolResult } from '@/products/chatgpt-app/web/src/bridge'
import type {
  DashboardListStructuredContent,
  DashboardPreviewStructuredContent,
} from '@/products/chatgpt-app/web/src/types/toolResult'
import { DashboardListView } from '@/products/chatgpt-app/web/src/views/DashboardListView'
import { DashboardPreviewView } from '@/products/chatgpt-app/web/src/views/DashboardPreviewView'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function getView(structuredContent: unknown) {
  if (!isRecord(structuredContent)) return null
  return typeof structuredContent.view === 'string' ? structuredContent.view : null
}

export function App() {
  const { structuredContent, isError } = useChatGptToolResult()

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

