import type { DashboardListItem } from '@/products/plugin/web/src/types/dashboard'

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

function formatStatus(value?: string | null) {
  return String(value || 'draft').trim().toLowerCase()
}

function formatArtifactType(value?: string | null) {
  const type = String(value || 'dashboard').trim().toLowerCase()
  if (type === 'slide' || type === 'report') return type
  return 'dashboard'
}

function getInitials(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'DB'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

export function DashboardCard({ dashboard }: DashboardCardProps) {
  const title = dashboard.title || 'Dashboard sem titulo'
  const version = dashboard.current_draft_version ?? dashboard.current_published_version
  const thumbnail = dashboard.thumbnail_data_url || ''
  const status = formatStatus(dashboard.status)
  const artifactType = formatArtifactType(dashboard.artifact_type)

  return (
    <article className="dashboard-card">
      {thumbnail ? (
        <div className="dashboard-card__thumbnail">
          <img src={thumbnail} alt={`Miniatura de ${title}`} draggable={false} />
        </div>
      ) : (
        <div className="dashboard-card__thumbnail dashboard-card__thumbnail--empty">
          <span>{getInitials(title)}</span>
        </div>
      )}
      <div className="dashboard-card__body">
        <div className="dashboard-card__content">
          <div className="dashboard-card__topline">
            <span className="dashboard-card__status">{artifactType} / {status}</span>
            <span className="dashboard-card__version">{version ? `v${version}` : 'sem versao'}</span>
          </div>
          <h2>{title}</h2>
        </div>
        <div className="dashboard-card__footer">
          <p className="dashboard-card__updated">
            <span>Atualizado {formatDate(dashboard.updated_at)}</span>
          </p>
          {dashboard.url ? (
            <a className="dashboard-card__open" href={dashboard.url} target="_blank" rel="noreferrer">
              Abrir
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
