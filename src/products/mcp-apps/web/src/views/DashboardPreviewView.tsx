import { DashboardHeader } from '@/products/mcp-apps/web/src/components/DashboardHeader'
import { DashboardMeta } from '@/products/mcp-apps/web/src/components/DashboardMeta'
import { DashboardPreviewFrame } from '@/products/mcp-apps/web/src/components/DashboardPreviewFrame'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import type { DashboardPreviewStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

type DashboardPreviewViewProps = {
  data: DashboardPreviewStructuredContent
}

export function DashboardPreviewView({ data }: DashboardPreviewViewProps) {
  const dashboard = data.dashboard

  if (!dashboard) {
    return (
        <EmptyState
          title="Dashboard nao informado"
          description="A tool open_dashboard precisa receber um id valido."
        />
    )
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Preview"
        title={data.title || dashboard.title || 'Dashboard'}
        description={dashboard.embed_url
          ? 'Dashboard completo renderizado a partir do embed seguro.'
          : 'Metadados e source retornados pela tool de leitura.'}
      />
      <DashboardMeta dashboard={dashboard} />
      <DashboardPreviewFrame dashboard={dashboard} />
    </>
  )
}
