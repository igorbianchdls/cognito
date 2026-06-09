import { DashboardGrid } from '@/products/plugin/web/src/components/DashboardGrid'
import { DashboardHeader } from '@/products/plugin/web/src/components/DashboardHeader'
import { EmptyState } from '@/products/plugin/web/src/components/EmptyState'
import type { DashboardListStructuredContent } from '@/products/plugin/web/src/types/toolResult'

type DashboardListViewProps = {
  data: DashboardListStructuredContent
}

export function DashboardListView({ data }: DashboardListViewProps) {
  const dashboards = Array.isArray(data.dashboards) ? data.dashboards : []
  const label = data.artifact_label || 'dashboard'
  const pluralLabel = data.artifact_label_plural || `${label}s`
  const countLabel = dashboards.length === 1 ? label : pluralLabel

  if (dashboards.length === 0) {
    return (
      <EmptyState
        title={`Nenhum ${label} encontrado`}
        description={`A tool retornou uma lista vazia de ${pluralLabel}.`}
      />
    )
  }

  return (
    <>
      <DashboardHeader
        eyebrow="Cognito"
        title={data.title || 'Dashboards'}
        description={`${dashboards.length} ${countLabel} retornado${dashboards.length === 1 ? '' : 's'}.`}
      />
      <DashboardGrid dashboards={dashboards} />
    </>
  )
}
