'use client'

import React from 'react'

import { applyPrimaryDateRange } from '@/products/bi/json-render/dateFilters'
import { useData } from '@/products/bi/json-render/context'

type AnyRecord = Record<string, any>
type QueryFormat = 'currency' | 'percent' | 'number'
type ComparisonMode = 'previous_period' | 'previous_month' | 'previous_year'

export type DashboardQueryResult = {
  comparisonLabel: string
  comparisonValue: number | null
  comparisonValueFormatted: string
  delta: number | null
  deltaFormatted: string
  deltaPercent: number | null
  deltaPercentDisplay: string
  deltaPercentFormatted: string
  error: string | null
  loading: boolean
  rawRow?: AnyRecord
  value: number | null
  valueFormatted: string
}

const EMPTY_RESULT: DashboardQueryResult = {
  comparisonLabel: '',
  comparisonValue: null,
  comparisonValueFormatted: '-',
  delta: null,
  deltaFormatted: '-',
  deltaPercent: null,
  deltaPercentDisplay: '-',
  deltaPercentFormatted: '-',
  error: null,
  loading: true,
  rawRow: undefined,
  value: null,
  valueFormatted: '-',
}

const DashboardQueryContext = React.createContext<DashboardQueryResult | null>(null)

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

function deriveComparisonRange(mode: unknown, fromRaw: unknown, toRaw: unknown): { from: string; to: string } | null {
  const from = parseIsoDate(fromRaw)
  const to = parseIsoDate(toRaw)
  if (!from || !to) return null

  const normalizedMode = String(mode || '').trim()
  if (!normalizedMode) return null

  if (normalizedMode === 'previous_period') {
    const diffDays = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000))
    const compareTo = shiftDays(from, -1)
    const compareFrom = shiftDays(compareTo, -diffDays)
    return { from: formatIsoDate(compareFrom), to: formatIsoDate(compareTo) }
  }

  if (normalizedMode === 'previous_month') {
    return {
      from: formatIsoDate(shiftMonthsClamped(from, -1)),
      to: formatIsoDate(shiftMonthsClamped(to, -1)),
    }
  }

  if (normalizedMode === 'previous_year') {
    const compareFrom = new Date(from)
    compareFrom.setFullYear(compareFrom.getFullYear() - 1)
    const compareTo = new Date(to)
    compareTo.setFullYear(compareTo.getFullYear() - 1)
    return { from: formatIsoDate(compareFrom), to: formatIsoDate(compareTo) }
  }

  return null
}

function setByPath(prev: AnyRecord, path: string, value: unknown): AnyRecord {
  if (!path) return prev
  const parts = path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return prev

  const root: AnyRecord = Array.isArray(prev) ? [...prev] : { ...(prev || {}) }
  let curr: AnyRecord = root
  for (let index = 0; index < parts.length; index += 1) {
    const key = parts[index]
    if (index === parts.length - 1) {
      if (value === undefined) delete curr[key]
      else curr[key] = value
      return root
    }
    curr[key] = curr[key] && typeof curr[key] === 'object' ? { ...curr[key] } : {}
    curr = curr[key]
  }
  return root
}

function getByPath(obj: AnyRecord | undefined, path: string): unknown {
  if (!obj || !path) return undefined
  const parts = path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean)
  let curr: unknown = obj
  for (const part of parts) {
    if (!curr || typeof curr !== 'object') return undefined
    curr = (curr as AnyRecord)[part]
  }
  return curr
}

function pickFirstNumericValue(row: AnyRecord | undefined, keys: string[]): number | null {
  if (!row) return null
  for (const key of keys) {
    const value = row[key]
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

function formatNumber(value: number | null, format: QueryFormat): string {
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
    return `${numeric.toFixed(1)}%`
  }
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(numeric)
}

function defaultComparisonLabel(mode: unknown): string {
  if (mode === 'previous_month') return 'vs. mes anterior'
  if (mode === 'previous_year') return 'vs. ano anterior'
  if (mode === 'previous_period') return 'vs. periodo anterior'
  return ''
}

function buildQueryResult({
  comparisonMode,
  format,
  row,
  valueKey,
}: {
  comparisonMode?: ComparisonMode
  format: QueryFormat
  row?: AnyRecord
  valueKey?: string
}): DashboardQueryResult {
  const value = pickFirstNumericValue(row, [
    valueKey || 'value',
    'total',
    'valor_total',
    'faturamento_total',
    'gasto_total',
    'count',
    'value',
  ])

  const comparisonValue = pickFirstNumericValue(row, [
    'comparison_value',
    'compare_value',
    'previous_value',
    'valor_anterior',
    'previous_period_value',
  ])

  const explicitDelta = pickFirstNumericValue(row, ['delta', 'delta_value', 'difference'])
  const explicitDeltaPercent = pickFirstNumericValue(row, [
    'delta_percent',
    'variation_percent',
    'delta_pct',
    'percent_change',
  ])

  const delta =
    explicitDelta !== null
      ? explicitDelta
      : value !== null && comparisonValue !== null
        ? value - comparisonValue
        : null

  const deltaPercent =
    explicitDeltaPercent !== null
      ? explicitDeltaPercent
      : delta !== null && comparisonValue !== null && comparisonValue !== 0
        ? (delta / comparisonValue) * 100
        : null

  const comparisonLabel =
    (typeof row?.comparison_label === 'string' ? row.comparison_label : '').trim() || defaultComparisonLabel(comparisonMode)

  const deltaPercentDisplay =
    deltaPercent === null || !Number.isFinite(deltaPercent)
      ? '-'
      : `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`

  const deltaDisplay =
    delta === null || !Number.isFinite(delta)
      ? '-'
      : `${delta > 0 ? '+' : ''}${formatNumber(delta, format)}`

  return {
    comparisonLabel,
    comparisonValue,
    comparisonValueFormatted: formatNumber(comparisonValue, format),
    delta,
    deltaFormatted: deltaDisplay,
    deltaPercent,
    deltaPercentDisplay,
    deltaPercentFormatted: formatNumber(deltaPercent, 'percent'),
    error: null,
    loading: false,
    rawRow: row,
    value,
    valueFormatted: formatNumber(value, format),
  }
}

export function useDashboardQueryResult() {
  return React.useContext(DashboardQueryContext)
}

export function resolveDashboardQueryTemplate(input: string, queryResult: DashboardQueryResult | null) {
  if (!input.includes('{{')) return input
  return input.replace(/\{\{\s*query\.([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, path: string) => {
    const value = getByPath(queryResult?.rawRow ? { ...queryResult, rawRow: queryResult.rawRow } : (queryResult as AnyRecord | undefined), path)
    if (value === undefined || value === null) return ''
    return String(value)
  })
}

export default function DashboardQuery({
  element,
  children,
}: {
  element: any
  children?: React.ReactNode
}) {
  const { data, setData } = useData()
  const props = (element?.props || {}) as AnyRecord
  const dq = (props.dataQuery || {}) as AnyRecord
  const valueKey = typeof props.valueKey === 'string' ? props.valueKey.trim() : ''
  const resultPath = typeof props.resultPath === 'string' ? props.resultPath.trim() : ''
  const comparisonMode =
    props.comparisonMode === 'previous_period' ||
    props.comparisonMode === 'previous_month' ||
    props.comparisonMode === 'previous_year'
      ? (props.comparisonMode as ComparisonMode)
      : undefined
  const format: QueryFormat =
    props.format === 'currency' || props.format === 'percent' || props.format === 'number' ? props.format : 'number'

  const [result, setResult] = React.useState<DashboardQueryResult>(EMPTY_RESULT)

  React.useEffect(() => {
    let cancelled = false

    async function run() {
      const isSqlQueryMode = typeof dq.query === 'string' && dq.query.trim()
      if (!dq || (!isSqlQueryMode && (!dq.model || !dq.measure))) {
        const emptyResult = { ...EMPTY_RESULT, loading: false }
        if (!cancelled) {
          setResult(emptyResult)
          if (resultPath) setData((prev) => setByPath((prev || {}) as AnyRecord, resultPath, undefined))
        }
        return
      }

      try {
        if (!cancelled) {
          setResult((prev) => ({ ...prev, loading: true, error: null }))
        }

        const filters = applyPrimaryDateRange({ ...(dq.filters || {}) } as AnyRecord, data)
        const comparisonRange = deriveComparisonRange(comparisonMode, filters.de, filters.ate)
        if (comparisonRange) {
          if (filters.compare_de === undefined) filters.compare_de = comparisonRange.from
          if (filters.compare_ate === undefined) filters.compare_ate = comparisonRange.to
          if (filters.comparison_mode === undefined) filters.comparison_mode = comparisonMode
        }

        const globalFilters = (data as AnyRecord)?.filters
        if (globalFilters && typeof globalFilters === 'object') {
          for (const [key, value] of Object.entries(globalFilters)) {
            if (key === 'dateRange') continue
            if (filters[key] === undefined) filters[key] = value
          }
        }

        const url = isSqlQueryMode
          ? '/api/modulos/query/execute'
          : `/api/modulos/${String(dq.model).split('.')[0]}/query`

        const body = isSqlQueryMode
          ? {
              dataQuery: {
                query: dq.query,
                ...(typeof dq.yField === 'string' && dq.yField.trim() ? { yField: dq.yField.trim() } : {}),
                ...(typeof dq.xField === 'string' && dq.xField.trim() ? { xField: dq.xField.trim() } : {}),
                ...(typeof dq.keyField === 'string' && dq.keyField.trim() ? { keyField: dq.keyField.trim() } : {}),
                filters,
                limit: dq.limit ?? 1,
              },
            }
          : {
              dataQuery: {
                model: dq.model,
                dimension: undefined,
                measure: dq.measure,
                filters,
                orderBy: dq.orderBy,
                limit: dq.limit,
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
        const firstRow =
          rows.length > 0 && rows[0] && typeof rows[0] === 'object' ? ({ ...(rows[0] as AnyRecord) } as AnyRecord) : undefined

        const nextResult = buildQueryResult({
          comparisonMode,
          format,
          row: firstRow,
          valueKey,
        })

        if (!cancelled) {
          setResult(nextResult)
          if (resultPath) {
            setData((prev) => setByPath((prev || {}) as AnyRecord, resultPath, nextResult))
          }
        }
      } catch (error) {
        const errorResult: DashboardQueryResult = {
          ...EMPTY_RESULT,
          error: error instanceof Error ? error.message : 'Erro ao executar query',
          loading: false,
        }
        if (!cancelled) {
          setResult(errorResult)
          if (resultPath) {
            setData((prev) => setByPath((prev || {}) as AnyRecord, resultPath, errorResult))
          }
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [JSON.stringify(dq), JSON.stringify((data as AnyRecord)?.filters), comparisonMode, format, resultPath, setData, valueKey, data])

  return <DashboardQueryContext.Provider value={result}>{children}</DashboardQueryContext.Provider>
}
