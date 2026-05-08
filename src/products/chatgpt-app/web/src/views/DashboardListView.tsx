import { DashboardGrid } from '@/products/chatgpt-app/web/src/components/DashboardGrid'
import { DashboardHeader } from '@/products/chatgpt-app/web/src/components/DashboardHeader'
import { EmptyState } from '@/products/chatgpt-app/web/src/components/EmptyState'
import type { DashboardListStructuredContent } from '@/products/chatgpt-app/web/src/types/toolResult'

type DashboardListViewProps = {
  data: DashboardListStructuredContent
}

export function DashboardListView({ data }: DashboardListViewProps) {
  const dashboards = Array.isArray(data.dashboards) ? data.dashboards : []

  if (dashboards.length === 0) {
    return (
      <EmptyState
        title="Nenhum dashboard encontrado"
        description="A tool retornou uma lista vazia de dashboards."
      />
    )
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Cognito"
        title={data.title || 'Dashboards'}
        description={`${dashboards.length} dashboard${dashboards.length === 1 ? '' : 's'} retornado${dashboards.length === 1 ? '' : 's'}.`}
      />
      <DashboardGrid dashboards={dashboards} />
    </>
  )
}

