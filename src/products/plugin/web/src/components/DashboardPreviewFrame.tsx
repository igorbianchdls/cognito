import type { DashboardPreview } from '@/products/plugin/web/src/types/dashboard'

type DashboardPreviewFrameProps = {
  dashboard: DashboardPreview
}

export function DashboardPreviewFrame({ dashboard }: DashboardPreviewFrameProps) {
  const source = dashboard.source || ''
  const embedUrl = dashboard.embed_url || ''

  if (embedUrl) {
    return (
      <section className="dashboard-preview-frame dashboard-embed-frame">
        <div className="dashboard-preview-frame__bar">
          <span>Preview interativo</span>
          <a href={embedUrl} target="_blank" rel="noreferrer">
            Abrir em nova aba
          </a>
        </div>
        <iframe
          title={dashboard.title || dashboard.id || dashboard.artifact_id || 'Dashboard'}
          src={embedUrl}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </section>
    )
  }

  return (
    <section className="dashboard-preview-frame">
      <div className="dashboard-preview-frame__bar">
        <span>Source TSX</span>
        <span>{source.length.toLocaleString('pt-BR')} chars</span>
      </div>
      <pre>{source || 'Source nao retornado para este dashboard.'}</pre>
    </section>
  )
}
