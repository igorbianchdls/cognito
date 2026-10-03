import { DashboardHeader } from '@/assets/remotion/result-preview/components/DashboardHeader'
import { DashboardMeta } from '@/assets/remotion/result-preview/components/DashboardMeta'
import { DashboardPreviewFrame } from '@/assets/remotion/result-preview/components/DashboardPreviewFrame'
import { EmptyState } from '@/assets/remotion/result-preview/components/EmptyState'
import type { DashboardPreviewStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'

type DashboardPreviewViewProps = {
  data: DashboardPreviewStructuredContent
}

export function DashboardPreviewView({ data }: DashboardPreviewViewProps) {
  const dashboard = data.dashboard

  if (!dashboard) {
    return (
      <EmptyState
        title="Dashboard nao informado"
        description="A tool open_artifact precisa receber kind e id validos."
      />
    )
  }

  return (
    <section className="dashboard-preview-layout">
      <DashboardHeader
        eyebrow="Preview"
        title={data.title || dashboard.title || 'Dashboard'}
        description={dashboard.embed_url
          ? 'Visualizacao interativa do dashboard.'
          : 'Metadados e source retornados pela tool de leitura.'}
      />
      <DashboardMeta dashboard={dashboard} />
      <DashboardPreviewFrame dashboard={dashboard} />
    </section>
  )
}
