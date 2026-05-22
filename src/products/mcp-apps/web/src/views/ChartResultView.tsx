"use client"

import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import type { ChartFormat, ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCurrency, formatNumber } from '@/products/mcp-apps/web/src/utils/format'

type ChartRow = {
  label: string
  value: number
  chartValue: number
  color: string
}

type ChartVariant = 'donut' | 'bar' | 'horizontal_bar' | 'line' | 'area'

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

function abbreviateLabel(value: string) {
  const text = value.trim()
  if (text.length <= 16) return text
  return `${text.slice(0, 15)}…`
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

function getChartVariant(chartType: string) {
  const normalized = chartType.trim().toLowerCase()
  if (normalized === 'bar' || normalized === 'horizontal_bar' || normalized === 'line' || normalized === 'area') {
    return normalized as ChartVariant
  }
  return 'donut'
}

function renderDonut(rows: ChartRow[]) {
  return (
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
  )
}

function renderVerticalBarChart(rows: ChartRow[], format: ChartFormat | undefined) {
  const valueColor = rows[0]?.color ?? CHART_COLORS[0]

  return (
    <div className="chart-card__plot" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#e5ebe7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            interval={0}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => abbreviateLabel(String(value))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => formatChartValue(Number(value), format)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            formatter={(value: unknown) => formatChartValue(Number(value), format)}
            labelFormatter={(label: unknown) => String(label)}
            contentStyle={{ borderRadius: 10, borderColor: '#dde5df', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {rows.map((row, index) => (
              <Cell key={`${row.label}-${index}`} fill={row.color || valueColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderHorizontalBarChart(rows: ChartRow[], format: ChartFormat | undefined) {
  const valueColor = rows[0]?.color ?? CHART_COLORS[0]

  return (
    <div className="chart-card__plot" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 10, bottom: 10, left: 12 }}>
          <CartesianGrid stroke="#e5ebe7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            type="number"
            dataKey="value"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => formatChartValue(Number(value), format)}
          />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => abbreviateLabel(String(value))}
          />
          <Tooltip
            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            formatter={(value: unknown) => formatChartValue(Number(value), format)}
            labelFormatter={(label: unknown) => String(label)}
            contentStyle={{ borderRadius: 10, borderColor: '#dde5df', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {rows.map((row, index) => (
              <Cell key={`${row.label}-${index}`} fill={row.color || valueColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderLineChart(rows: ChartRow[], format: ChartFormat | undefined) {
  const stroke = rows[0]?.color ?? CHART_COLORS[0]

  return (
    <div className="chart-card__plot" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 10, bottom: 10, left: 0 }}>
          <CartesianGrid stroke="#e5ebe7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            interval={0}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => abbreviateLabel(String(value))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => formatChartValue(Number(value), format)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            formatter={(value: unknown) => formatChartValue(Number(value), format)}
            labelFormatter={(label: unknown) => String(label)}
            contentStyle={{ borderRadius: 10, borderColor: '#dde5df', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#ffffff', stroke, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderAreaChart(rows: ChartRow[], format: ChartFormat | undefined, gradientId: string) {
  const stroke = rows[0]?.color ?? CHART_COLORS[0]

  return (
    <div className="chart-card__plot" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 10, bottom: 10, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5ebe7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={10}
            interval={0}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => abbreviateLabel(String(value))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            width={72}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickFormatter={(value) => formatChartValue(Number(value), format)}
          />
          <Tooltip
            cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
            formatter={(value: unknown) => formatChartValue(Number(value), format)}
            labelFormatter={(label: unknown) => String(label)}
            contentStyle={{ borderRadius: 10, borderColor: '#dde5df', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: '#ffffff', stroke, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ChartResultView({ data }: { data: ChartResultStructuredContent }) {
  const gradientId = useId()
  const rows = getChartRows(data)
  const chartType = getChartVariant(String(data.chart?.type || 'donut'))
  const format = data.chart?.format || data.total?.format || 'currency'
  const title = data.title || 'Grafico'
  const subtitle = data.subtitle || `${formatNumber(rows.length)} registros`
  const totalMagnitude = rows.reduce((sum, row) => sum + row.chartValue, 0)

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
      </header>

      <div className={`chart-card__body${chartType === 'donut' ? '' : ' chart-card__body--chart-only'}`}>
        {chartType === 'donut' ? (
          <>
            {renderDonut(rows)}
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
          </>
        ) : null}

        {chartType === 'bar' ? renderVerticalBarChart(rows, format) : null}
        {chartType === 'horizontal_bar' ? renderHorizontalBarChart(rows, format) : null}
        {chartType === 'line' ? renderLineChart(rows, format) : null}
        {chartType === 'area' ? renderAreaChart(rows, format, `chart-area-${gradientId}`) : null}
      </div>
    </section>
  )
}
