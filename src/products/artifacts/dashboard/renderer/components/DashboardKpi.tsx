'use client'

import React from 'react'

import JsxCardSurface from '@/products/bi/json-render/components/JsxCardSurface'
import { useData, useDataValue } from '@/products/bi/json-render/context'
import { applyPrimaryDateRange } from '@/products/bi/json-render/dateFilters'

type AnyRecord = Record<string, any>
type ValueFormat = 'currency' | 'percent' | 'number'
type ComparisonMode = 'previous_period' | 'previous_month' | 'previous_year'

function pickFirstNumericValue(row: AnyRecord | undefined, keys: string[]): number | null {
  if (!row) return null
  for (const key of keys) {
    const value = row[key]
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

function formatValue(value: number | null, format: ValueFormat): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '-'
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

function parseIsoDate(input: unknown): Date | null {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null
  const date = new Date(`${input}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function shiftMonthsClamped(date: Date, delta: number): Date {
  const first = new Date(date.getFullYear(), date.getMonth() + delta, 1)
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  return new Date(first.getFullYear(), first.getMonth(), Math.min(date.getDate(), lastDay))
}

function deriveComparisonRange(mode: ComparisonMode | undefined, fromRaw: unknown, toRaw: unknown): { from: string; to: string } | null {
  if (!mode) return null
  const from = parseIsoDate(fromRaw)
  const to = parseIsoDate(toRaw)
  if (!from || !to) return null

  if (mode === 'previous_period') {
    const diffDays = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000))
    const compareTo = shiftDays(from, -1)
    const compareFrom = shiftDays(compareTo, -diffDays)
    return { from: formatIsoDate(compareFrom), to: formatIsoDate(compareTo) }
  }

  if (mode === 'previous_month') {
    return {
      from: formatIsoDate(shiftMonthsClamped(from, -1)),
      to: formatIsoDate(shiftMonthsClamped(to, -1)),
    }
  }

  const compareFrom = new Date(from)
  compareFrom.setFullYear(compareFrom.getFullYear() - 1)
  const compareTo = new Date(to)
  compareTo.setFullYear(compareTo.getFullYear() - 1)
  return { from: formatIsoDate(compareFrom), to: formatIsoDate(compareTo) }
}

function defaultComparisonLabel(mode: ComparisonMode | undefined): string {
  if (mode === 'previous_month') return 'vs. mes anterior'
  if (mode === 'previous_year') return 'vs. ano anterior'
  if (mode === 'previous_period') return 'vs. periodo anterior'
  return ''
}

function getDeltaColor(deltaPercent: number | null, colors: { positive: string; negative: string; neutral: string }) {
  if (typeof deltaPercent === 'number' && Number.isFinite(deltaPercent)) {
    if (deltaPercent > 0) return colors.positive
    if (deltaPercent < 0) return colors.negative
  }
  return colors.neutral
}

function hasServerQuery(dataQuery: AnyRecord | undefined) {
  return Boolean(dataQuery && ((dataQuery.model && dataQuery.measure) || (typeof dataQuery.query === 'string' && dataQuery.query.trim())))
}

export default function DashboardKpi({
  element,
}: {
  element: any
}) {
  const props = (element?.props || {}) as AnyRecord
  const dataQuery = (props.dataQuery || {}) as AnyRecord
  const valueKey = typeof props.valueKey === 'string' && props.valueKey.trim() ? props.valueKey.trim() : 'value'
  const format = props.format === 'currency' || props.format === 'percent' || props.format === 'number'
    ? (props.format as ValueFormat)
    : 'number'
  const comparisonMode =
    props.comparisonMode === 'previous_period' ||
    props.comparisonMode === 'previous_month' ||
    props.comparisonMode === 'previous_year'
      ? (props.comparisonMode as ComparisonMode)
      : undefined
  const showComparison =
    props.showComparison === undefined
      ? Boolean(comparisonMode)
      : props.showComparison === true || props.showComparison === 'true'
  const unit = typeof props.unit === 'string' && props.unit.trim() ? props.unit.trim() : ''
  const title = typeof props.title === 'string' ? props.title : ''
  const description = typeof props.description === 'string' ? props.description : ''
  const valuePath = typeof props.valuePath === 'string' && props.valuePath.trim() ? props.valuePath.trim() : ''
  const cardStyle = props.cardStyle && typeof props.cardStyle === 'object' ? (props.cardStyle as React.CSSProperties) : undefined
  const titleStyle = props.titleStyle && typeof props.titleStyle === 'object' ? (props.titleStyle as React.CSSProperties) : undefined
  const valueStyle = props.valueStyle && typeof props.valueStyle === 'object' ? (props.valueStyle as React.CSSProperties) : undefined
  const descriptionStyle =
    props.descriptionStyle && typeof props.descriptionStyle === 'object'
      ? (props.descriptionStyle as React.CSSProperties)
      : undefined
  const comparisonStyle =
    props.comparisonStyle && typeof props.comparisonStyle === 'object'
      ? (props.comparisonStyle as React.CSSProperties)
      : undefined
  const positiveColor = typeof props.positiveColor === 'string' ? props.positiveColor : '#15803D'
  const negativeColor = typeof props.negativeColor === 'string' ? props.negativeColor : '#DC2626'
  const neutralColor = typeof props.neutralColor === 'string' ? props.neutralColor : '#64748B'

  const { data } = useData()
  const valueFromPath = useDataValue(valuePath || '', undefined)
  const [queryState, setQueryState] = React.useState<{
    value: number | null
    previousValue: number | null
    rawRow?: AnyRecord
    error: string | null
    loading: boolean
  }>({
    value: null,
    previousValue: null,
    rawRow: undefined,
    error: null,
    loading: hasServerQuery(dataQuery),
  })

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      if (!hasServerQuery(dataQuery)) {
        if (!cancelled) {
          setQueryState({
            value: null,
            previousValue: null,
            rawRow: undefined,
            error: null,
            loading: false,
          })
        }
        return
      }

      try {
        if (!cancelled) {
          setQueryState((prev) => ({
            ...prev,
            error: null,
            loading: true,
          }))
        }

        const filters = applyPrimaryDateRange({ ...(dataQuery.filters || {}) } as AnyRecord, data)
        const globalFilters = (data as AnyRecord)?.filters
        if (globalFilters && typeof globalFilters === 'object') {
          for (const [key, value] of Object.entries(globalFilters)) {
            if (key === 'dateRange') continue
            if (filters[key] === undefined) filters[key] = value
          }
        }

        const isSqlQueryMode = Boolean(typeof dataQuery.query === 'string' && dataQuery.query.trim())
        const url = isSqlQueryMode
          ? '/api/modulos/query/execute'
          : `/api/modulos/${String(dataQuery.model).split('.')[0]}/query`
        const body = isSqlQueryMode
          ? {
              dataQuery: {
                query: dataQuery.query,
                ...(typeof dataQuery.yField === 'string' && dataQuery.yField.trim() ? { yField: dataQuery.yField.trim() } : {}),
                ...(typeof dataQuery.xField === 'string' && dataQuery.xField.trim() ? { xField: dataQuery.xField.trim() } : {}),
                ...(typeof dataQuery.keyField === 'string' && dataQuery.keyField.trim() ? { keyField: dataQuery.keyField.trim() } : {}),
                filters,
                limit: dataQuery.limit ?? 1,
              },
            }
          : {
              dataQuery: {
                model: dataQuery.model,
                dimension: undefined,
                measure: dataQuery.measure,
                filters,
                orderBy: dataQuery.orderBy,
                limit: dataQuery.limit,
              },
            }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await response.json()
        if (!response.ok || json?.success === false) {
          throw new Error(String(json?.message || `Query failed (${response.status})`))
        }

        const rows = Array.isArray(json?.rows) ? json.rows : []
        const firstRow = rows.length > 0 && rows[0] && typeof rows[0] === 'object'
          ? ({ ...(rows[0] as AnyRecord) } as AnyRecord)
          : undefined
        const currentValue = pickFirstNumericValue(firstRow, [
          valueKey,
          'total',
          'valor_total',
          'faturamento_total',
          'gasto_total',
          'count',
          'value',
        ])
        let previousValue: number | null = null
        const comparisonRange = deriveComparisonRange(comparisonMode, filters.de, filters.ate)

        if (comparisonMode && comparisonRange) {
          const comparisonFilters: AnyRecord = { ...filters }
          comparisonFilters.de = comparisonRange.from
          comparisonFilters.ate = comparisonRange.to
          delete comparisonFilters.compare_de
          delete comparisonFilters.compare_ate
          delete comparisonFilters.comparison_mode

          const comparisonResponse = await fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(
              isSqlQueryMode
                ? {
                    dataQuery: {
                      query: dataQuery.query,
                      ...(typeof dataQuery.yField === 'string' && dataQuery.yField.trim() ? { yField: dataQuery.yField.trim() } : {}),
                      ...(typeof dataQuery.xField === 'string' && dataQuery.xField.trim() ? { xField: dataQuery.xField.trim() } : {}),
                      ...(typeof dataQuery.keyField === 'string' && dataQuery.keyField.trim() ? { keyField: dataQuery.keyField.trim() } : {}),
                      filters: comparisonFilters,
                      limit: dataQuery.limit ?? 1,
                    },
                  }
                : {
                    dataQuery: {
                      model: dataQuery.model,
                      dimension: undefined,
                      measure: dataQuery.measure,
                      filters: comparisonFilters,
                      orderBy: dataQuery.orderBy,
                      limit: dataQuery.limit,
                    },
                  },
            ),
          })
          const comparisonJson = await comparisonResponse.json()
          if (!comparisonResponse.ok || comparisonJson?.success === false) {
            throw new Error(String(comparisonJson?.message || `Query failed (${comparisonResponse.status})`))
          }
          const comparisonRows = Array.isArray(comparisonJson?.rows) ? comparisonJson.rows : []
          const comparisonRow = comparisonRows.length > 0 && comparisonRows[0] && typeof comparisonRows[0] === 'object'
            ? ({ ...(comparisonRows[0] as AnyRecord) } as AnyRecord)
            : undefined
          previousValue = pickFirstNumericValue(comparisonRow, [
            valueKey,
            'total',
            'valor_total',
            'faturamento_total',
            'gasto_total',
            'count',
            'value',
          ])
        }

        if (!cancelled) {
          setQueryState({
            value: currentValue,
            previousValue,
            rawRow: firstRow,
            error: null,
            loading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setQueryState({
            value: null,
            previousValue: null,
            rawRow: undefined,
            error: error instanceof Error ? error.message : 'Erro ao executar query',
            loading: false,
          })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [JSON.stringify(dataQuery), JSON.stringify((data as AnyRecord)?.filters), comparisonMode, valueKey])

  const pathNumericValue = Number(valueFromPath)
  const displayValue = hasServerQuery(dataQuery)
    ? queryState.value
    : (Number.isFinite(pathNumericValue) ? pathNumericValue : null)
  const canRenderComparison = showComparison && Boolean(comparisonMode) && hasServerQuery(dataQuery) && !queryState.error
  const previousValue = queryState.previousValue
  const delta =
    displayValue !== null && previousValue !== null
      ? displayValue - previousValue
      : null
  const deltaPercent =
    delta !== null && previousValue !== null && previousValue !== 0
      ? (delta / previousValue) * 100
      : null
  const comparisonLabel = defaultComparisonLabel(comparisonMode)
  const comparisonText =
    deltaPercent === null || !Number.isFinite(deltaPercent)
      ? `- ${comparisonLabel}`.trim()
      : `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}% ${comparisonLabel}`.trim()
  const comparisonColor = getDeltaColor(deltaPercent, {
    positive: positiveColor,
    negative: negativeColor,
    neutral: neutralColor,
  })
  const formattedValue = queryState.loading && hasServerQuery(dataQuery)
    ? '...'
    : formatValue(displayValue, format)

  return (
    <JsxCardSurface
      element={{
        type: 'Card',
        props: {
          style: {
            height: '100%',
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            ...(cardStyle || {}),
          },
        },
      }}
    >
      {title ? <h2 style={{ margin: 0, ...(titleStyle || {}) }}>{title}</h2> : null}
      <div style={{ margin: 0, ...(valueStyle || {}) }}>
        {formattedValue}
        {unit ? ` ${unit}` : ''}
      </div>
      {canRenderComparison ? (
        <p
          style={{
            margin: 0,
            color: comparisonColor,
            fontSize: 13,
            ...(comparisonStyle || {}),
          }}
        >
          {queryState.loading ? '...' : comparisonText}
        </p>
      ) : null}
      {description ? <p style={{ margin: 0, ...(descriptionStyle || {}) }}>{description}</p> : null}
      {queryState.error ? <div className="mt-1 text-xs text-red-600">{queryState.error}</div> : null}
    </JsxCardSurface>
  )
}
