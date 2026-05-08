import type { DashboardPreview } from '@/products/chatgpt-app/web/src/types/dashboard'

type DashboardPreviewFrameProps = {
  dashboard: DashboardPreview
}

export function DashboardPreviewFrame({ dashboard }: DashboardPreviewFrameProps) {
  const source = dashboard.source || ''

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

