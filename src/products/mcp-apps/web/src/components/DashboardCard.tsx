import type { DashboardListItem } from '@/products/mcp-apps/web/src/types/dashboard'

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
  const thumbnail = dashboard.thumbnail_data_url || ''

  return (
    <article className="dashboard-card">
      {thumbnail ? (
        <div className="dashboard-card__thumbnail">
          <img src={thumbnail} alt={`Miniatura de ${title}`} draggable={false} />
        </div>
      ) : (
        <div className="dashboard-card__thumbnail dashboard-card__thumbnail--empty">
          <span>{title.trim().slice(0, 2).toUpperCase() || 'DB'}</span>
        </div>
      )}
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
