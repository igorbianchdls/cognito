import { interpolate, useCurrentFrame } from 'remotion'

import type { ChartFormat, ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

type ChartRow = {
  label: string
  value: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatValue(value: number, format: ChartFormat | undefined) {
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      currency: 'BRL',
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(value)
  }

  if (format === 'percent') {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value)}%`
  }

  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

function getRows(data: ChartResultStructuredContent): ChartRow[] {
  const chart = data.chart || {}
  const labelField = chart.labelField || chart.xField || 'label'
  const valueField = chart.valueField || 'value'
  const rows = Array.isArray(data.rows) ? data.rows : []

  return rows
    .filter(isRecord)
    .map((row, index) => ({
      label: String(row[labelField] ?? `Item ${index + 1}`),
      value: Math.abs(toNumber(row[valueField])),
    }))
    .filter((row) => row.value > 0)
}

function clampProgress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function fadeSlide(frame: number, start: number) {
  const opacity = interpolate(frame, [start, start + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [start, start + 22], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

export function AnimatedMcpChartView({ data, startFrame = 0 }: { data: ChartResultStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const rows = getRows(data)
  const maxValue = Math.max(...rows.map((row) => row.value), 1)
  const format = data.chart?.format || data.total?.format || 'currency'
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const chartProgress = clampProgress(localFrame, 26, 82)
  const valueProgress = clampProgress(localFrame, 66, 104)

  return (
    <section
      className="chart-card"
      style={{
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <header className="chart-card__header">
        <div className="chart-card__copy">
          <h1 style={titleStyle}>{data.title || 'Grafico'}</h1>
          {data.subtitle ? <p style={subtitleStyle}>{data.subtitle}</p> : null}
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gap: 16,
          paddingTop: 6,
        }}
      >
        {rows.map((row, index) => {
          const width = `${Math.max(2, (row.value / maxValue) * chartProgress * 100)}%`
          const valueOpacity = interpolate(valueProgress, [0, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })

          return (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gap: 8,
                opacity: clampProgress(localFrame, 22 + index * 6, 42 + index * 6),
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    color: '#202622',
                    fontSize: 15,
                    fontWeight: 720,
                    letterSpacing: 0,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    color: '#4f5a53',
                    fontSize: 14,
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 760,
                    letterSpacing: 0,
                    opacity: valueOpacity,
                  }}
                >
                  {formatValue(row.value * valueProgress, format)}
                </span>
              </div>
              <div
                style={{
                  background: '#edf0ed',
                  borderRadius: 999,
                  height: 18,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: index === 0 ? '#005c2f' : index === 1 ? '#008a3d' : index === 2 ? '#35bf6b' : '#7dd99d',
                    borderRadius: 999,
                    height: '100%',
                    width,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
