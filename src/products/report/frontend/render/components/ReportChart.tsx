'use client'

import React from 'react'
import { Bar, BarChart as RechartsBarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type AnyRecord = Record<string, unknown>
type ChartFormat = 'currency' | 'number' | 'percent'
type ChartSeries = {
  color: string
  key: string
  label: string
}

const DEFAULT_COLORS = ['#2563EB', '#0F766E', '#EA580C', '#7C3AED']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function formatValue(value: unknown, format: ChartFormat): string {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return String(value ?? '')

  if (format === 'currency') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(numeric)
  }

  if (format === 'percent') {
    return `${(numeric * 100).toFixed(2)}%`
  }

  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(numeric)
}

function toNumber(value: unknown, fallback: number): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function resolveSeries(input: unknown, data: AnyRecord[], xKey: string): ChartSeries[] {
  if (Array.isArray(input)) {
    const mapped = input
      .map((item, index) => {
        if (typeof item === 'string' && item.trim()) {
          return {
            key: item.trim(),
            label: item.trim(),
            color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
          }
        }

        if (isRecord(item) && typeof item.key === 'string' && item.key.trim()) {
          const key = item.key.trim()
          const label = typeof item.label === 'string' && item.label.trim() ? item.label.trim() : key
          const color =
            typeof item.color === 'string' && item.color.trim()
              ? item.color.trim()
              : DEFAULT_COLORS[index % DEFAULT_COLORS.length]
          return { key, label, color }
        }

        return null
      })
      .filter((item): item is ChartSeries => item !== null)

    if (mapped.length) return mapped
  }

  const sample = data[0] || {}
  const inferred = Object.entries(sample)
    .filter(([key, value]) => key !== xKey && typeof value === 'number')
    .map(([key], index) => ({
      key,
      label: key,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
    }))

  return inferred
}

export function ReportChart({ element }: { element: any }) {
  const props = (element?.props || {}) as Record<string, unknown>
  const type = typeof props.type === 'string' ? props.type.trim().toLowerCase() : 'bar'
  const title = typeof props.title === 'string' && props.title.trim() ? props.title.trim() : ''
  const xKey = typeof props.xKey === 'string' && props.xKey.trim() ? props.xKey.trim() : 'label'
  const height = toNumber(props.height, 240)
  const format = props.format === 'currency' || props.format === 'percent' ? props.format : 'number'
  const wrapperStyle = isRecord(props.style) ? (props.style as React.CSSProperties) : undefined
  const data = Array.isArray(props.data) ? props.data.filter(isRecord) : []
  const series = resolveSeries(props.series, data, xKey)

  if (type !== 'bar') {
    return (
      <div className="rounded border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
        Unsupported report chart type: {type || 'unknown'}
      </div>
    )
  }

  if (!data.length || !series.length) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Chart requires static `data` and at least one numeric series.
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height,
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: title ? 12 : 0,
        boxSizing: 'border-box',
        ...wrapperStyle,
      }}
    >
      {title ? (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', letterSpacing: '-0.02em' }}>
          {title}
        </div>
      ) : null}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            accessibilityLayer
            data={data as Array<Record<string, unknown>>}
            margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
            barGap={12}
          >
            <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3" />
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              tickFormatter={(value) => formatValue(value, format)}
              width={72}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              formatter={(value: unknown, name: string) => [formatValue(value, format), name]}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
            />
            {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 12, color: '#6B7280' }} /> : null}
            {series.map((serie) => (
              <Bar
                key={serie.key}
                dataKey={serie.key}
                fill={serie.color}
                name={serie.label}
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
