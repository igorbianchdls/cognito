import type {
  SqlExecutionChartConfig,
  SqlExecutionRow,
  SqlExecutionRowValue,
  SqlExecutionToolViewModel,
} from '@/products/chat/shared/tools/sqlExecution/types'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toText(value: unknown): string | null {
  const v = String(value ?? '').trim()
  return v || null
}

function toNum(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeCellValue(value: unknown): SqlExecutionRowValue {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function normalizeRows(rawRows: unknown): SqlExecutionRow[] {
  if (!Array.isArray(rawRows)) return []
  return rawRows.map((raw) => {
    if (!isRecord(raw)) return {}
    const out: SqlExecutionRow = {}
    for (const [key, value] of Object.entries(raw)) {
      out[key] = normalizeCellValue(value)
    }
    return out
  })
}

function inferColumns(rows: SqlExecutionRow[]): string[] {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function normalizeChartConfig(raw: unknown): SqlExecutionChartConfig | null {
  if (!isRecord(raw)) return null
  const xField = toText(raw.xField)
  const valueField = toText(raw.valueField)
  if (!xField || !valueField) return null
  return {
    xField,
    valueField,
    xLabel: toText(raw.xLabel),
    yLabel: toText(raw.yLabel),
  }
}

export function extractSqlExecutionToolViewModel(input: unknown, output: unknown): SqlExecutionToolViewModel | null {
  if (!isRecord(output)) return null
  const root = output
  const payload = isRecord(root.data) ? root.data : (isRecord(root.result) ? root.result : root)
  if (!isRecord(payload)) return null

  const inputObj = isRecord(input) ? input : null
  const rows = normalizeRows(payload.rows)
  const columns = Array.isArray(payload.columns)
    ? payload.columns.map((c) => String(c || '').trim()).filter(Boolean)
    : inferColumns(rows)
  const count = toNum(payload.count) ?? rows.length

  return {
    ok: Boolean(root.ok ?? payload.success ?? true),
    title: toText(payload.title) ?? toText(inputObj?.title) ?? 'Resultado da Consulta',
    rows,
    columns,
    count,
    chart: normalizeChartConfig(payload.chart),
    sqlQuery: toText(payload.sql_query),
    maxRows: toNum(payload.max_rows),
    error: toText(payload.error) ?? toText(root.error),
  }
}
