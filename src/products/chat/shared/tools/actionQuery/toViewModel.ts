import type {
  ActionQueryChartConfig,
  ActionQueryRow,
  ActionQueryRowValue,
  ActionQueryToolViewModel,
} from '@/products/chat/shared/tools/actionQuery/types'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toText(value: unknown): string | null {
  const out = String(value ?? '').trim()
  return out || null
}

function toNum(value: unknown): number | null {
  if (value == null || value === '') return null
  const out = Number(value)
  return Number.isFinite(out) ? out : null
}

function normalizeCellValue(value: unknown): ActionQueryRowValue {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function normalizeRows(raw: unknown): ActionQueryRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (!isRecord(item)) return {}
    const out: ActionQueryRow = {}
    for (const [key, value] of Object.entries(item)) {
      out[key] = normalizeCellValue(value)
    }
    return out
  })
}

function inferColumns(rows: ActionQueryRow[]): string[] {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function normalizeChart(raw: unknown): ActionQueryChartConfig | null {
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

function normalizeToolName(value: unknown): 'ecommerce' | 'marketing' | null {
  const out = toText(value)?.toLowerCase()
  if (out === 'ecommerce') return out
  if (out === 'marketing') return out
  return null
}

export function extractActionQueryToolViewModel(toolName: 'ecommerce' | 'marketing', output: unknown): ActionQueryToolViewModel | null {
  if (!isRecord(output)) return null

  const root = output
  const payload = isRecord(root.data) ? root.data : (isRecord(root.result) ? root.result : root)
  if (!isRecord(payload)) return null

  const rows = normalizeRows(payload.rows)
  const columns = Array.isArray(payload.columns)
    ? payload.columns.map((col) => String(col || '').trim()).filter(Boolean)
    : inferColumns(rows)
  const count = toNum(payload.count) ?? rows.length
  const finalTool = normalizeToolName(payload.tool) || normalizeToolName(root.meta && isRecord(root.meta) ? root.meta.tool : null) || toolName

  return {
    ok: Boolean(root.ok ?? payload.success ?? true),
    tool: finalTool || toolName,
    action: toText(payload.action),
    title: toText(payload.title) || `${toolName} - resultado`,
    rows,
    columns,
    count,
    chart: normalizeChart(payload.chart),
    sqlQuery: toText(payload.sql_query),
    error: toText(payload.error) ?? toText(root.error),
  }
}
