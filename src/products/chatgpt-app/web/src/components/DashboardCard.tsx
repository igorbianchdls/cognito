import type { DashboardListItem } from '@/products/chatgpt-app/web/src/types/dashboard'

type DashboardCardProps = {
  dashboard: DashboardListItem
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function DashboardCard({ dashboard }: DashboardCardProps) {
  const title = dashboard.title || 'Dashboard sem titulo'
  const version = dashboard.current_draft_version ?? dashboard.current_published_version

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__topline">
        <span>{dashboard.status || 'draft'}</span>
        <span>{version ? `v${version}` : 'sem versao'}</span>
      </div>
      <h2>{title}</h2>
      <p>{dashboard.slug || dashboard.id || 'Sem identificador'}</p>
      <div className="dashboard-card__footer">
        <span>Atualizado {formatDate(dashboard.updated_at)}</span>
        {dashboard.url ? (
          <a href={dashboard.url} target="_blank" rel="noreferrer">
            Abrir
          </a>
        ) : null}
      </div>
    </article>
  )
}

