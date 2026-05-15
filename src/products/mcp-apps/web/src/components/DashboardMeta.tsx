import type { DashboardPreview } from '@/products/mcp-apps/web/src/types/dashboard'

type DashboardMetaProps = {
  dashboard: DashboardPreview
}

export function DashboardMeta({ dashboard }: DashboardMetaProps) {
  const rows = [
    ['ID', dashboard.id || dashboard.artifact_id],
    ['Slug', dashboard.slug],
    ['Status', dashboard.status || dashboard.kind],
    ['Rascunho', dashboard.current_draft_version],
    ['Publicado', dashboard.current_published_version],
    ['Workspace', dashboard.workspace_id],
  ].filter(([, value]) => value != null && value !== '')

  return (
    <dl className="dashboard-meta">
      {rows.map(([label, value]) => (
        <div key={String(label)}>
          <dt>{label}</dt>
          <dd>{String(value)}</dd>
        </div>
      ))}
    </dl>
  )
}
