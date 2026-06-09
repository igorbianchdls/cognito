import { isDateKey, isMoneyKey } from '@/products/plugin/web/src/utils/format'

export type DataRow = Record<string, unknown>

const preferredColumnWords = [
  'status',
  'numero',
  'documento',
  'fornecedor',
  'cliente',
  'produto',
  'campanha',
  'data',
  'vencimento',
  'valor',
  'total',
  'receita',
  'saldo',
]

function isRecord(value: unknown): value is DataRow {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function scoreColumn(column: string) {
  const normalized = column.toLowerCase()
  const preferredIndex = preferredColumnWords.findIndex((word) => normalized.includes(word))
  if (normalized === 'id' || normalized.endsWith('_id')) return 50
  if (preferredIndex >= 0) return preferredIndex
  return 20
}

export function getRows(data: { rows?: unknown }) {
  return Array.isArray(data.rows) ? data.rows.filter(isRecord) : []
}

export function getColumns(data: { columns?: unknown }, rows: DataRow[]) {
  const explicitColumns = Array.isArray(data.columns) ? data.columns.map(String) : []
  if (explicitColumns.length) return explicitColumns
  return Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).sort((a, b) => scoreColumn(a) - scoreColumn(b))
}

export function getColumnKind(column: string, rows: DataRow[]) {
  const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && value !== '')
  if (isMoneyKey(column)) return 'money'
  if (isDateKey(column)) return 'date'
  if (column.toLowerCase().includes('status') || column.toLowerCase().includes('situacao')) return 'status'
  if (values.some((value) => typeof value === 'number')) return 'number'
  return 'text'
}

export function getPrimaryMoneyColumn(columns: string[], rows: DataRow[]) {
  return columns.find((column) => {
    if (!isMoneyKey(column)) return false
    return rows.some((row) => typeof row[column] === 'number')
  })
}

export function sumNumericColumn(rows: DataRow[], column: string) {
  return rows.reduce((total, row) => {
    const value = row[column]
    return typeof value === 'number' && Number.isFinite(value) ? total + value : total
  }, 0)
}

export function countPendingOverdue(rows: DataRow[]) {
  const now = new Date()
  return rows.filter((row) => {
    const dateValue = row.data_vencimento ?? row.vencimento ?? row.due_date
    const status = String(row.status ?? row.situacao ?? '').toLowerCase()
    const date = dateValue ? new Date(String(dateValue)) : null
    if (!date || Number.isNaN(date.getTime())) return false
    const isPending = !status || status.includes('pend') || status.includes('abert') || status.includes('venc')
    return isPending && date.getTime() < now.getTime()
  }).length
}
