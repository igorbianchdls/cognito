'use client'

import React from 'react'

import JsxCardSurface from '@/products/bi/json-render/components/JsxCardSurface'
import { useData, useDataValue } from '@/products/bi/json-render/context'
import { applyPrimaryDateRange } from '@/products/bi/json-render/dateFilters'

type AnyRecord = Record<string, any>
type ValueFormat = 'currency' | 'percent' | 'number'

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

  const { data } = useData()
  const valueFromPath = useDataValue(valuePath || '', undefined)
  const [queryState, setQueryState] = React.useState<{
    value: number | null
    rawRow?: AnyRecord
    error: string | null
    loading: boolean
  }>({
    value: null,
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
        const nextValue = pickFirstNumericValue(firstRow, [
          valueKey,
          'total',
          'valor_total',
          'faturamento_total',
          'gasto_total',
          'count',
          'value',
        ])

        if (!cancelled) {
          setQueryState({
            value: nextValue,
            rawRow: firstRow,
            error: null,
            loading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setQueryState({
            value: null,
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
  }, [JSON.stringify(dataQuery), JSON.stringify((data as AnyRecord)?.filters), valueKey])

  const pathNumericValue = Number(valueFromPath)
  const displayValue = hasServerQuery(dataQuery)
    ? queryState.value
    : (Number.isFinite(pathNumericValue) ? pathNumericValue : null)
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
      {description ? <p style={{ margin: 0, ...(descriptionStyle || {}) }}>{description}</p> : null}
      {queryState.error ? <div className="mt-1 text-xs text-red-600">{queryState.error}</div> : null}
    </JsxCardSurface>
  )
}
