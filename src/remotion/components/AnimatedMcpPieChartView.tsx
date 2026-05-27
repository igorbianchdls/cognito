import { interpolate, useCurrentFrame } from 'remotion'

import type { ChartFormat, ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'

type PieRow = {
  label: string
  value: number
  color: string
}

const COLORS = ['#005c2f', '#008a3d', '#35bf6b', '#7dd99d']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0

  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function getRows(data: ChartResultStructuredContent): PieRow[] {
  const chart = data.chart || {}
  const labelField = chart.labelField || chart.xField || 'label'
  const valueField = chart.valueField || 'value'
  const rows = Array.isArray(data.rows) ? data.rows : []

  return rows
    .filter(isRecord)
    .map((row, index) => ({
      color: COLORS[index % COLORS.length],
      label: String(row[labelField] ?? `Item ${index + 1}`),
      value: Math.abs(toNumber(row[valueField])),
    }))
    .filter((row) => row.value > 0)
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

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle - 90) * Math.PI / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function arcPath(cx: number, cy: number, outerRadius: number, innerRadius: number, startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle)
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle)
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle)
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ')
}

export function AnimatedMcpPieChartView({ data, startFrame = 0 }: { data: ChartResultStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const rows = getRows(data)
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1
  const format = data.chart?.format || data.total?.format || 'currency'
  const titleOpacity = progress(localFrame, 0, 18)
  const pieProgress = progress(localFrame, 24, 82)
  let currentAngle = -90

  return (
    <section className="chart-card" style={{ gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ fontSize: 32, letterSpacing: 0, lineHeight: 1.12, margin: 0, opacity: titleOpacity }}>
            {data.title || 'Participacao'}
          </h1>
          {data.subtitle ? (
            <p style={{ fontSize: 18, letterSpacing: 0, lineHeight: 1.25, opacity: titleOpacity }}>{data.subtitle}</p>
          ) : null}
        </div>
      </header>

      <div style={{ alignItems: 'center', display: 'grid', gap: 18, gridTemplateColumns: '230px 1fr', marginTop: 4 }}>
        <svg viewBox="0 0 240 240" style={{ display: 'block', width: '100%' }}>
          <circle cx="120" cy="120" fill="#edf0ed" r="92" />
          <circle cx="120" cy="120" fill="#ffffff" r="54" />
          {rows.map((row) => {
            const angle = row.value / total * 360 * pieProgress
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle += row.value / total * 360
            if (angle <= 0.2) return null

            return (
              <path
                d={arcPath(120, 120, 92, 54, startAngle, endAngle)}
                fill={row.color}
                key={row.label}
                stroke="#ffffff"
                strokeWidth={3}
              />
            )
          })}
        </svg>

        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((row, index) => {
            const rowOpacity = progress(localFrame, 48 + index * 8, 68 + index * 8)
            const percent = row.value / total * 100
            return (
              <div
                key={row.label}
                style={{
                  alignItems: 'center',
                  display: 'grid',
                  gap: 8,
                  gridTemplateColumns: '12px 1fr',
                  opacity: rowOpacity,
                }}
              >
                <span style={{ background: row.color, borderRadius: 999, height: 12, width: 12 }} />
                <div>
                  <div style={{ color: '#202622', fontSize: 15, fontWeight: 760, letterSpacing: 0 }}>{row.label}</div>
                  <div style={{ color: '#64748b', fontSize: 13, fontWeight: 650, letterSpacing: 0 }}>
                    {percent.toFixed(1).replace('.', ',')}% · {formatValue(row.value, format)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
