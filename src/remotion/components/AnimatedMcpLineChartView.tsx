import { interpolate, useCurrentFrame } from 'remotion'

import type { ChartFormat, ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

type LineRow = {
  label: string
  value: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function getRows(data: ChartResultStructuredContent): LineRow[] {
  const chart = data.chart || {}
  const labelField = chart.labelField || chart.xField || 'label'
  const valueField = chart.valueField || 'value'
  const rows = Array.isArray(data.rows) ? data.rows : []

  return rows
    .filter(isRecord)
    .map((row, index) => ({
      label: String(row[labelField] ?? `P${index + 1}`),
      value: Math.max(0, toNumber(row[valueField])),
    }))
}

function formatValue(value: number, format: ChartFormat | undefined) {
  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      currency: 'BRL',
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(value)
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

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function fadeSlide(frame: number, start: number) {
  const opacity = progress(frame, start, start + 18)
  const y = interpolate(frame, [start, start + 22], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

export function AnimatedMcpLineChartView({ data, startFrame = 0 }: { data: ChartResultStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const rows = getRows(data)
  const maxValue = Math.max(...rows.map((row) => row.value), 1)
  const format = data.chart?.format || data.total?.format || 'currency'
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const lineProgress = progress(localFrame, 28, 92)
  const valueProgress = progress(localFrame, 84, 122)
  const chartWidth = 650
  const chartHeight = 345
  const margin = { top: 34, right: 30, bottom: 48, left: 78 }
  const plotWidth = chartWidth - margin.left - margin.right
  const plotHeight = chartHeight - margin.top - margin.bottom
  const baselineY = margin.top + plotHeight
  const step = rows.length > 1 ? plotWidth / (rows.length - 1) : plotWidth
  const ticks = [1, 0.75, 0.5, 0.25, 0]
  const points = rows.map((row, index) => ({
    ...row,
    x: margin.left + step * index,
    y: margin.top + plotHeight * (1 - row.value / maxValue),
  }))
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : ''

  return (
    <section className="chart-card" style={{ gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 32, letterSpacing: 0, lineHeight: 1.12 }}>
            {data.title || 'Evolucao'}
          </h1>
          {data.subtitle ? (
            <p style={{ ...subtitleStyle, fontSize: 18, letterSpacing: 0, lineHeight: 1.25 }}>{data.subtitle}</p>
          ) : null}
        </div>
      </header>

      <div style={{ marginTop: 8 }}>
        <svg
          role="img"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{
            display: 'block',
            overflow: 'visible',
            width: '100%',
          }}
        >
          <defs>
            <linearGradient id="mcp-line-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#008a3d" stopOpacity={0.26 * lineProgress} />
              <stop offset="100%" stopColor="#008a3d" stopOpacity={0} />
            </linearGradient>
          </defs>

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

          {areaPath ? <path d={areaPath} fill="url(#mcp-line-fill)" opacity={lineProgress} /> : null}

          {linePath ? (
            <path
              d={linePath}
              fill="none"
              pathLength={1}
              stroke="#008a3d"
              strokeDasharray={1}
              strokeDashoffset={1 - lineProgress}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={7}
            />
          ) : null}

          {points.map((point, index) => {
            const pointProgress = progress(localFrame, 48 + index * 7, 72 + index * 7)
            return (
              <g key={point.label} opacity={pointProgress}>
                <circle cx={point.x} cy={point.y} fill="#ffffff" r={10 * pointProgress} stroke="#008a3d" strokeWidth={5} />
                <text
                  x={point.x}
                  y={Math.max(margin.top + 16, point.y - 22)}
                  fill="#202622"
                  fontSize={14}
                  fontWeight={760}
                  letterSpacing={0}
                  opacity={valueProgress}
                  textAnchor="middle"
                >
                  {formatValue(point.value * valueProgress, format)}
                </text>
                <text
                  x={point.x}
                  y={baselineY + 36}
                  fill="#4f5a53"
                  fontSize={15}
                  fontWeight={700}
                  letterSpacing={0}
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
