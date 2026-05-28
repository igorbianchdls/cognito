import { AlertTriangle, CheckCircle2, CircleAlert, Info } from 'lucide-react'
import { interpolate, useCurrentFrame } from 'remotion'

import type { AnalysisStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

type AnalysisItem = Record<string, unknown>

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

function asRows(value: unknown): AnalysisItem[] {
  return Array.isArray(value)
    ? value.filter((item): item is AnalysisItem => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatMetric(metric: AnalysisItem) {
  const value = metric.value ?? metric.valor ?? metric.total ?? '-'
  const format = String(metric.format || '').toLowerCase()

  if (typeof value === 'number' || String(value).trim() !== '') {
    const numberValue = toNumber(value)
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        currency: 'BRL',
        maximumFractionDigits: 0,
        style: 'currency',
      }).format(numberValue)
    }
    if (format === 'percent') {
      return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(numberValue * 100)}%`
    }
    if (format === 'number') {
      return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(numberValue)
    }
  }

  return String(value)
}

function getSeverity(value: unknown) {
  const severity = String(value || 'info').toLowerCase()
  if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') return severity
  return 'info'
}

function severityTone(severity: string) {
  if (severity === 'critical' || severity === 'high') return { background: '#fff1df', color: '#a34400', border: '#ffd9a6' }
  if (severity === 'medium') return { background: '#fff8da', color: '#8a6400', border: '#f4df83' }
  if (severity === 'low') return { background: '#e8f7ee', color: '#126236', border: '#bde7cc' }
  return { background: '#eef2f7', color: '#314039', border: '#dce3ea' }
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical' || severity === 'high') return <AlertTriangle size={24} strokeWidth={2.4} />
  if (severity === 'medium') return <CircleAlert size={24} strokeWidth={2.4} />
  if (severity === 'low') return <CheckCircle2 size={24} strokeWidth={2.4} />
  return <Info size={24} strokeWidth={2.4} />
}

export function AnimatedMcpAnalysisView({ data, startFrame = 0 }: { data: AnalysisStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const metrics = asRows(data.metrics).slice(0, 3)
  const sections = asRows(data.sections).slice(0, 3)
  const nextSteps = Array.isArray(data.next_steps) ? data.next_steps.slice(0, 2) : []
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const summaryStyle = fadeSlide(localFrame, 24)
  const title = data.title || 'Analise'

  return (
    <section className="chart-card" style={{ gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 32, letterSpacing: 0, lineHeight: 1.12 }}>{title}</h1>
          {data.subtitle ? (
            <p style={{ ...subtitleStyle, fontSize: 18, letterSpacing: 0, lineHeight: 1.25 }}>{data.subtitle}</p>
          ) : null}
        </div>
      </header>

      {data.summary ? (
        <p
          style={{
            ...summaryStyle,
            color: '#29302b',
            fontSize: 20,
            fontWeight: 520,
            letterSpacing: 0,
            lineHeight: 1.34,
            margin: '12px 0 0',
          }}
        >
          {data.summary}
        </p>
      ) : null}

      {metrics.length ? (
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 18 }}>
          {metrics.map((metric, index) => (
            <div
              key={`${String(metric.label || metric.name || index)}-${index}`}
              style={{
                ...fadeSlide(localFrame, 38 + index * 6),
                background: '#f7faf8',
                border: '1px solid #e4ebe6',
                borderRadius: 8,
                display: 'grid',
                gap: 6,
                minWidth: 0,
                padding: '13px 12px',
              }}
            >
              <span
                style={{
                  color: '#5c675f',
                  fontSize: 14,
                  fontWeight: 760,
                  letterSpacing: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {String(metric.label || metric.name || metric.title || `Metrica ${index + 1}`)}
              </span>
              <strong style={{ color: '#151816', fontSize: 24, fontWeight: 850, letterSpacing: 0, lineHeight: 1.05 }}>
                {formatMetric(metric)}
              </strong>
            </div>
          ))}
        </div>
      ) : null}

      {sections.length ? (
        <div style={{ display: 'grid', gap: 11, marginTop: 16 }}>
          {sections.map((section, index) => {
            const severity = getSeverity(section.severity)
            const tone = severityTone(severity)
            const heading = String(section.title || section.kind || `Achado ${index + 1}`)

            return (
              <article
                key={`${heading}-${index}`}
                style={{
                  ...fadeSlide(localFrame, 62 + index * 9),
                  background: '#ffffff',
                  border: `1px solid ${tone.border}`,
                  borderRadius: 8,
                  display: 'grid',
                  gap: 8,
                  padding: '13px 14px',
                }}
              >
                <header style={{ alignItems: 'center', display: 'flex', gap: 11, minWidth: 0 }}>
                  <span
                    style={{
                      alignItems: 'center',
                      background: tone.background,
                      borderRadius: 999,
                      color: tone.color,
                      display: 'inline-flex',
                      flex: '0 0 40px',
                      height: 40,
                      justifyContent: 'center',
                      width: 40,
                    }}
                  >
                    <SeverityIcon severity={severity} />
                  </span>
                  <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                    <p style={{ color: '#6b746e', fontSize: 14, fontWeight: 780, letterSpacing: 0, margin: 0, textTransform: 'uppercase' }}>
                      {humanize(String(section.kind || severity))}
                    </p>
                    <h2
                      style={{
                        color: '#141816',
                        fontSize: 21,
                        fontWeight: 780,
                        letterSpacing: 0,
                        lineHeight: 1.15,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {heading}
                    </h2>
                  </div>
                </header>
                {section.evidence ? (
                  <p style={{ color: '#3b443f', fontSize: 17, letterSpacing: 0, lineHeight: 1.28, margin: 0 }}>
                    {String(section.evidence)}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}

      {nextSteps.length ? (
        <div
          style={{
            ...fadeSlide(localFrame, 94),
            background: '#f6f8f6',
            border: '1px solid #e5ebe6',
            borderRadius: 8,
            display: 'grid',
            gap: 8,
            marginTop: 14,
            padding: '12px 14px',
          }}
        >
          {nextSteps.map((step, index) => (
            <div
              key={`${step}-${index}`}
              style={{ alignItems: 'center', color: '#2d352f', display: 'flex', fontSize: 17, fontWeight: 650, gap: 9, letterSpacing: 0, lineHeight: 1.2 }}
            >
              <span style={{ background: '#225f42', borderRadius: 999, color: '#ffffff', flex: '0 0 24px', fontSize: 13, fontWeight: 850, lineHeight: '24px', textAlign: 'center' }}>
                {index + 1}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(step)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
