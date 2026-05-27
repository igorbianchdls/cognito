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

function formatAxisValue(value: number, format: ChartFormat | undefined) {
  if (format === 'currency') {
    if (value >= 1000) return `R$ ${Math.round(value / 1000)}k`
    return `R$ ${Math.round(value)}`
  }

  if (value >= 1000) return `${Math.round(value / 1000)}k`
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
  const chartWidth = 650
  const chartHeight = 345
  const margin = { top: 18, right: 24, bottom: 42, left: 78 }
  const plotWidth = chartWidth - margin.left - margin.right
  const plotHeight = chartHeight - margin.top - margin.bottom
  const slotWidth = plotWidth / Math.max(rows.length, 1)
  const barWidth = Math.min(74, slotWidth * 0.52)
  const ticks = [1, 0.75, 0.5, 0.25, 0]

  return (
    <section
      className="chart-card"
      style={{
        gap: 0,
        overflow: 'hidden',
      }}
    >
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 16, lineHeight: 1.15 }}>{data.title || 'Grafico'}</h1>
          {data.subtitle ? <p style={{ ...subtitleStyle, fontSize: 11, lineHeight: 1.2 }}>{data.subtitle}</p> : null}
        </div>
      </header>

      <div
        style={{
          marginTop: -10,
        }}
      >
        <svg
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{
            display: 'block',
            overflow: 'visible',
            width: '100%',
          }}
        >
          {ticks.map((tick) => {
            const y = margin.top + plotHeight * (1 - tick)
            const tickValue = maxValue * tick

            return (
              <g key={tick}>
                <line
                  x1={margin.left}
                  x2={margin.left + plotWidth}
                  y1={y}
                  y2={y}
                  stroke="#e5ebe7"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                  strokeWidth={1.4}
                />
                <text
                  x={margin.left - 14}
                  y={y + 4}
                  fill="#6b7280"
                  fontSize={14}
                  fontWeight={600}
                  letterSpacing={0}
                  textAnchor="end"
                >
                  {formatAxisValue(tickValue, format)}
                </text>
              </g>
            )
          })}

          {rows.map((row, index) => {
            const rowProgress = clampProgress(localFrame, 24 + index * 6, 54 + index * 6)
            const valueOpacity = interpolate(valueProgress, [0, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
            const barHeight = (row.value / maxValue) * plotHeight * chartProgress * rowProgress
            const x = margin.left + slotWidth * index + slotWidth / 2 - barWidth / 2
            const y = margin.top + plotHeight - barHeight
            const color = index === 0 ? '#005c2f' : index === 1 ? '#008a3d' : index === 2 ? '#35bf6b' : '#7dd99d'

            return (
              <g key={row.label} opacity={rowProgress}>
                <text
                  x={x + barWidth / 2}
                  y={Math.max(margin.top + 18, y - 14)}
                  fill="#202622"
                  fontSize={15}
                  fontWeight={760}
                  letterSpacing={0}
                  opacity={valueOpacity}
                  textAnchor="middle"
                >
                  {formatValue(row.value * valueProgress, format)}
                </text>
                <path
                  d={[
                    `M ${x} ${margin.top + plotHeight}`,
                    `L ${x} ${y + 10}`,
                    `Q ${x} ${y} ${x + 10} ${y}`,
                    `L ${x + barWidth - 10} ${y}`,
                    `Q ${x + barWidth} ${y} ${x + barWidth} ${y + 10}`,
                    `L ${x + barWidth} ${margin.top + plotHeight}`,
                    'Z',
                  ].join(' ')}
                  fill={color}
                />
                <text
                  x={x + barWidth / 2}
                  y={margin.top + plotHeight + 34}
                  fill="#4f5a53"
                  fontSize={15}
                  fontWeight={700}
                  letterSpacing={0}
                  textAnchor="middle"
                >
                  {row.label === 'Mercado Livre' ? 'ML' : row.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
