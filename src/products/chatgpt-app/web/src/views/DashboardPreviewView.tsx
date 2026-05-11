import { DashboardHeader } from '@/products/chatgpt-app/web/src/components/DashboardHeader'
import { DashboardMeta } from '@/products/chatgpt-app/web/src/components/DashboardMeta'
import { DashboardPreviewFrame } from '@/products/chatgpt-app/web/src/components/DashboardPreviewFrame'
import { EmptyState } from '@/products/chatgpt-app/web/src/components/EmptyState'
import type { DashboardPreviewStructuredContent } from '@/products/chatgpt-app/web/src/types/toolResult'

type DashboardPreviewViewProps = {
  data: DashboardPreviewStructuredContent
}

export function DashboardPreviewView({ data }: DashboardPreviewViewProps) {
  const dashboard = data.dashboard

  if (!dashboard) {
    return (
      <EmptyState
        title="Dashboard nao informado"
        description="A render tool precisa receber o objeto retornado por dashboard_read."
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
