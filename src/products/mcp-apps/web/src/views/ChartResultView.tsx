import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import type { ChartFormat, ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCurrency, formatNumber } from '@/products/mcp-apps/web/src/utils/format'

type ChartRow = {
  label: string
  value: number
  chartValue: number
  color: string
}

const CHART_COLORS = [
  '#005c2f',
  '#008a3d',
  '#35bf6b',
  '#7dd99d',
  '#b8def2',
  '#1f6f43',
  '#8ad0a7',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function normalizeNumericText(value: string) {
  const text = value.trim()
  if (!text) return ''
  const withoutCurrency = text.replace(/[^\d,.-]/g, '')
  if (withoutCurrency.includes(',')) {
    return withoutCurrency.replace(/\./g, '').replace(',', '.')
  }
  return withoutCurrency.replace(/,/g, '')
}

function toNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(normalizeNumericText(value))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toNumberOrNull(value: unknown) {
  const parsed = toNumber(value)
  return parsed === 0 && value !== 0 && value !== '0' ? null : parsed
}

function getLabel(row: Record<string, unknown>, field: string | undefined, index: number) {
  const value = field ? row[field] : undefined
  if (value !== null && value !== undefined && value !== '') return String(value)

  const fallbackEntry = Object.entries(row).find(([, entryValue]) => typeof entryValue === 'string' && entryValue.trim())
  if (fallbackEntry) return String(fallbackEntry[1])
  return `Item ${index + 1}`
}

function getValue(row: Record<string, unknown>, field: string | undefined, labelField: string | undefined) {
  if (field && row[field] !== undefined && row[field] !== null) return toNumber(row[field])

  const numericEntry = Object.entries(row).find(([key, value]) => key !== labelField && typeof value === 'number')
  if (numericEntry) return toNumber(numericEntry[1])
  return 0
}

function formatChartValue(value: number, format: ChartFormat | undefined) {
  if (format === 'currency') return formatCurrency(value)
  if (format === 'percent') return `${formatNumber(value)}%`
  return formatNumber(value)
}

function getChartRows(data: ChartResultStructuredContent) {
  const chart = data.chart || {}
  const labelField = chart.labelField || chart.xField || 'label'
  const valueField = chart.valueField || 'value'
  const rows = Array.isArray(data.rows) ? data.rows : []

  return rows
    .filter(isRecord)
    .map((row, index): ChartRow => {
      const value = getValue(row, valueField, labelField)
      return {
        label: getLabel(row, labelField, index),
        value,
        chartValue: Math.abs(value),
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
    .filter((row) => row.chartValue > 0)
}

function getTotalDisplay(data: ChartResultStructuredContent, rows: ChartRow[]) {
  const format = data.total?.format || data.chart?.format || 'currency'
  const rawValue = data.total?.value
  const parsedValue = toNumberOrNull(rawValue)
  const total = parsedValue ?? rows.reduce((sum, row) => sum + row.value, 0)

  if (typeof rawValue === 'string' && parsedValue === null && rawValue.trim()) {
    return rawValue
  }

  return formatChartValue(total, format)
}

export function ChartResultView({ data }: { data: ChartResultStructuredContent }) {
  const rows = getChartRows(data)
  const chartType = data.chart?.type || 'donut'
  const format = data.chart?.format || data.total?.format || 'currency'
  const title = data.title || 'Grafico'
  const subtitle = data.subtitle || `${formatNumber(rows.length)} registros`
  const totalDisplay = getTotalDisplay(data, rows)
  const totalMagnitude = rows.reduce((sum, row) => sum + row.chartValue, 0)
  const showDonut = chartType !== 'horizontal_bar' && chartType !== 'bar'

  if (!rows.length) {
    return (
      <EmptyState
        title={title}
        description="A tool chart nao recebeu linhas numericas para renderizar."
      />
    )
  }

  return (
    <section className="chart-card" aria-label={title}>
      <header className="chart-card__header">
        <div className="chart-card__copy">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <strong className="chart-card__total">{totalDisplay}</strong>
      </header>

      <div className={`chart-card__body${showDonut ? '' : ' chart-card__body--bars-only'}`}>
        {showDonut ? (
          <div className="chart-card__donut" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="chartValue"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="48%"
                  outerRadius="86%"
                  paddingAngle={1}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {rows.map((row, index) => (
                    <Cell key={`${row.label}-${index}`} fill={row.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : null}

        <div className="chart-breakdown">
          {rows.map((row) => {
            const percentage = totalMagnitude > 0 ? (row.chartValue / totalMagnitude) * 100 : 0
            return (
              <div className="chart-breakdown__row" key={row.label}>
                <span className="chart-breakdown__label">{row.label}</span>
                <span className="chart-breakdown__track" aria-hidden="true">
                  <span
                    className="chart-breakdown__fill"
                    style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: row.color }}
                  />
                </span>
                <span className="chart-breakdown__value">{formatChartValue(row.value, format)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
