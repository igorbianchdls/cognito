import { BarChart3, Clock3, ExternalLink } from 'lucide-react'
import { interpolate, useCurrentFrame } from 'remotion'

import type { DashboardListStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import type { DashboardListItem } from '@/products/mcp-apps/web/src/types/dashboard'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function fadeSlide(frame: number, start: number, fromY = 14) {
  const opacity = progress(frame, start, start + 18)
  const y = interpolate(frame, [start, start + 22], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

function asDashboards(value: unknown): DashboardListItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is DashboardListItem => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function formatDate(value: unknown) {
  if (!value) return 'Sem atualizacao'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date).replace('.', '')
}

function statusTone(value: unknown) {
  const status = String(value || '').toLowerCase()
  if (status === 'published' || status === 'active') return { background: '#e6f6ed', color: '#126236', label: 'Publicado' }
  if (status === 'draft') return { background: '#fff1df', color: '#9a4d00', label: 'Rascunho' }
  return { background: '#eef2f7', color: '#314039', label: status || 'Indefinido' }
}

function DashboardPreviewMark({ index }: { index: number }) {
  const colors = index === 0
    ? ['#225f42', '#35bf6b', '#cfeedd']
    : index === 1
      ? ['#245e8f', '#58a6d6', '#d7ebf7']
      : ['#745b16', '#d2a72f', '#f5e7b7']

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colors[2]} 0%, #ffffff 100%)`,
        border: '1px solid #dde5df',
        borderRadius: 8,
        display: 'grid',
        gap: 8,
        padding: 10,
      }}
    >
      <div style={{ alignItems: 'end', display: 'grid', gap: 5, gridTemplateColumns: '1fr 1fr 1fr', height: 72 }}>
        {[0.48, 0.76, 0.58].map((height, itemIndex) => (
          <span
            key={`${height}-${itemIndex}`}
            style={{
              background: itemIndex === 0 ? colors[0] : colors[1],
              borderRadius: 5,
              display: 'block',
              height: `${height * 100}%`,
            }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gap: 5 }}>
        <span style={{ background: colors[0], borderRadius: 999, display: 'block', height: 7, opacity: 0.85, width: '72%' }} />
        <span style={{ background: colors[1], borderRadius: 999, display: 'block', height: 7, opacity: 0.65, width: '48%' }} />
      </div>
    </div>
  )
}

export function AnimatedMcpDashboardListView({ data, startFrame = 0 }: { data: DashboardListStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const dashboards = asDashboards(data.dashboards).slice(0, 3)
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const subtitle = `${dashboards.length} dashboard${dashboards.length === 1 ? '' : 's'} retornado${dashboards.length === 1 ? '' : 's'}`

  return (
    <section className="chart-card" style={{ gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 32, letterSpacing: 0, lineHeight: 1.12 }}>
            {data.title || 'Dashboards'}
          </h1>
          <p style={{ ...subtitleStyle, fontSize: 18, letterSpacing: 0, lineHeight: 1.25 }}>{subtitle}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        {dashboards.map((dashboard, index) => {
          const tone = statusTone(dashboard.status)
          const version = dashboard.current_published_version ?? dashboard.current_draft_version

          return (
            <article
              key={dashboard.id || dashboard.slug || index}
              style={{
                ...fadeSlide(localFrame, 26 + index * 10),
                background: '#ffffff',
                border: '1px solid #e2e8e3',
                borderRadius: 8,
                display: 'grid',
                gap: 14,
                gridTemplateColumns: '162px minmax(0, 1fr)',
                minHeight: 132,
                padding: 12,
              }}
            >
              <DashboardPreviewMark index={index} />
              <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
                <div style={{ alignItems: 'center', display: 'flex', gap: 8, justifyContent: 'space-between', minWidth: 0 }}>
                  <span
                    style={{
                      ...tone,
                      borderRadius: 999,
                      display: 'inline-flex',
                      fontSize: 14,
                      fontWeight: 830,
                      letterSpacing: 0,
                      lineHeight: 1,
                      padding: '7px 10px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tone.label}
                  </span>
                  {version ? (
                    <span style={{ color: '#5f6963', fontSize: 15, fontWeight: 760, letterSpacing: 0, whiteSpace: 'nowrap' }}>
                      v{version}
                    </span>
                  ) : null}
                </div>
                <h2
                  style={{
                    color: '#141816',
                    fontSize: 25,
                    fontWeight: 800,
                    letterSpacing: 0,
                    lineHeight: 1.14,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {dashboard.title || 'Dashboard'}
                </h2>
                <div style={{ alignItems: 'center', color: '#4f5a53', display: 'flex', fontSize: 16, fontWeight: 620, gap: 8, letterSpacing: 0 }}>
                  <Clock3 size={18} strokeWidth={2.3} />
                  <span>{formatDate(dashboard.updated_at)}</span>
                </div>
                <div style={{ alignItems: 'center', color: '#225f42', display: 'flex', fontSize: 16, fontWeight: 760, gap: 8, letterSpacing: 0, marginTop: 'auto' }}>
                  <BarChart3 size={19} strokeWidth={2.4} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {dashboard.slug || dashboard.id || 'dashboard'}
                  </span>
                  <ExternalLink size={17} strokeWidth={2.4} />
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
