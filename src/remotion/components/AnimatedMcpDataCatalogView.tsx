import { CheckCircle2, CircleAlert, Database, LayoutList } from 'lucide-react'
import { interpolate, useCurrentFrame } from 'remotion'

import type { DataCatalogStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

type DataRow = Record<string, unknown>

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

function asRows(value: unknown): DataRow[] {
  return Array.isArray(value)
    ? value.filter((item): item is DataRow => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function asRecord(value: unknown): DataRow {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value)) ? (value as DataRow) : {}
}

function toNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

function formatCompact(value: unknown) {
  const numberValue = toNumber(value)
  if (Math.abs(numberValue) >= 1000000) return `${formatNumber(numberValue / 1000000)} mi`
  if (Math.abs(numberValue) >= 1000) return `${formatNumber(numberValue / 1000)} mil`
  return formatNumber(numberValue)
}

function statusTone(value: unknown) {
  const status = String(value || '').toLowerCase()
  if (status === 'connected' || status === 'ok' || status === 'ready') return { background: '#e6f6ed', color: '#126236' }
  if (status === 'empty' || status.includes('atenc') || status.includes('warn')) return { background: '#fff1df', color: '#9a4d00' }
  return { background: '#eef2f7', color: '#314039' }
}

export function AnimatedMcpDataCatalogView({ data, startFrame = 0 }: { data: DataCatalogStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const sources = asRows(data.sources).slice(0, 4)
  const resources = asRows(data.resources).slice(0, 3)
  const quality = asRecord(data.quality)
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 2) : []
  const connectedSources = sources.filter((source) => String(source.status || '').toLowerCase() === 'connected').length
  const totalRecords = resources.reduce((acc, resource) => acc + toNumber(resource.total_records), 0)
  const score = quality.score !== undefined ? toNumber(quality.score) : null
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const kpis = [
    { label: 'Fontes', value: sources.length ? `${connectedSources}/${sources.length}` : '-' },
    { label: 'Recursos', value: resources.length ? formatNumber(resources.length) : '-' },
    { label: 'Registros', value: totalRecords ? formatCompact(totalRecords) : '-' },
    { label: 'Score', value: score === null ? '-' : `${formatNumber(score)}/100` },
  ]

  return (
    <section className="chart-card" style={{ gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 32, letterSpacing: 0, lineHeight: 1.12 }}>
            {data.title || 'Catalogo de Dados'}
          </h1>
          {data.subtitle ? (
            <p style={{ ...subtitleStyle, fontSize: 18, letterSpacing: 0, lineHeight: 1.25 }}>{data.subtitle}</p>
          ) : null}
        </div>
      </header>

      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginTop: 14 }}>
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            style={{
              ...fadeSlide(localFrame, 24 + index * 5),
              background: '#f7faf8',
              border: '1px solid #e4ebe6',
              borderRadius: 8,
              display: 'grid',
              gap: 6,
              padding: '12px 10px',
            }}
          >
            <span style={{ color: '#5c675f', fontSize: 14, fontWeight: 780, letterSpacing: 0, textTransform: 'uppercase' }}>
              {kpi.label}
            </span>
            <strong style={{ color: '#151816', fontSize: 24, fontWeight: 850, letterSpacing: 0, lineHeight: 1.05 }}>
              {kpi.value}
            </strong>
          </div>
        ))}
      </div>

      {sources.length ? (
        <div style={{ display: 'grid', gap: 9, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 16 }}>
          {sources.map((source, index) => {
            const tone = statusTone(source.status)
            return (
              <article
                key={`${String(source.domain || source.label || index)}-${index}`}
                style={{
                  ...fadeSlide(localFrame, 48 + index * 6),
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1px solid #e6ebe7',
                  borderRadius: 8,
                  display: 'flex',
                  gap: 11,
                  minWidth: 0,
                  padding: '13px 12px',
                }}
              >
                <span
                  style={{
                    alignItems: 'center',
                    background: '#edf6f0',
                    borderRadius: 999,
                    color: '#225f42',
                    display: 'inline-flex',
                    flex: '0 0 38px',
                    height: 38,
                    justifyContent: 'center',
                    width: 38,
                  }}
                >
                  <Database size={22} strokeWidth={2.3} />
                </span>
                <div style={{ display: 'grid', gap: 5, minWidth: 0 }}>
                  <strong style={{ color: '#232a26', fontSize: 20, fontWeight: 780, letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(source.label || source.domain || '-')}
                  </strong>
                  <span
                    style={{
                      ...tone,
                      borderRadius: 999,
                      display: 'inline-flex',
                      fontSize: 13,
                      fontWeight: 820,
                      justifySelf: 'start',
                      letterSpacing: 0,
                      lineHeight: 1,
                      padding: '6px 9px',
                    }}
                  >
                    {String(source.status || '-')}
                  </span>
                </div>
                <strong style={{ color: '#151816', fontSize: 19, fontVariantNumeric: 'tabular-nums', fontWeight: 830, marginLeft: 'auto' }}>
                  {formatCompact(source.total_records)}
                </strong>
              </article>
            )
          })}
        </div>
      ) : null}

      {resources.length ? (
        <div style={{ display: 'grid', gap: 9, marginTop: 15 }}>
          {resources.map((resource, index) => {
            const tone = statusTone(resource.status)
            return (
              <article
                key={`${String(resource.resource || resource.label || index)}-${index}`}
                style={{
                  ...fadeSlide(localFrame, 76 + index * 7),
                  alignItems: 'center',
                  borderTop: index > 0 ? '1px solid #edf0ed' : undefined,
                  display: 'grid',
                  gap: 14,
                  gridTemplateColumns: 'minmax(0, 1fr) 92px 90px',
                  padding: '9px 0',
                }}
              >
                <div style={{ alignItems: 'center', display: 'flex', gap: 10, minWidth: 0 }}>
                  <LayoutList color="#225f42" size={22} strokeWidth={2.3} />
                  <span style={{ color: '#252d28', fontSize: 20, fontWeight: 760, letterSpacing: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {String(resource.label || resource.resource || '-')}
                  </span>
                </div>
                <span style={{ color: '#4f5a53', fontSize: 17, fontWeight: 720, justifySelf: 'end', letterSpacing: 0 }}>
                  {formatCompact(resource.total_records)}
                </span>
                <span
                  style={{
                    ...tone,
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 820,
                    justifySelf: 'end',
                    letterSpacing: 0,
                    lineHeight: 1,
                    padding: '7px 10px',
                  }}
                >
                  {String(resource.status || '-')}
                </span>
              </article>
            )
          })}
        </div>
      ) : null}

      {recommendations.length ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {recommendations.map((recommendation, index) => (
            <div
              key={`${recommendation}-${index}`}
              style={{
                ...fadeSlide(localFrame, 102 + index * 7),
                alignItems: 'center',
                background: index === 0 ? '#e8f7ee' : '#fff8da',
                borderRadius: 8,
                color: index === 0 ? '#126236' : '#7a5b00',
                display: 'flex',
                fontSize: 17,
                fontWeight: 680,
                gap: 9,
                letterSpacing: 0,
                lineHeight: 1.22,
                padding: '10px 12px',
              }}
            >
              {index === 0 ? <CheckCircle2 size={21} strokeWidth={2.4} /> : <CircleAlert size={21} strokeWidth={2.4} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(recommendation)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
