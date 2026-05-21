import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import { StatusBadge } from '@/products/mcp-apps/web/src/components/StatusBadge'
import type { TableStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCellValue, getToolVisual, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'

type TableRow = Record<string, unknown>
type TableColumn = {
  key: string
  label: string
  format?: string
}

function asRows(value: unknown): TableRow[] {
  return Array.isArray(value)
    ? value.filter((item): item is TableRow => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function asColumns(value: unknown, rows: TableRow[]): TableColumn[] {
  if (Array.isArray(value) && value.length) {
    return value
      .map((column) => {
        if (typeof column === 'string') {
          if (column.startsWith('_')) return null
          return { key: column, label: humanizeKey(column) }
        }
        if (!column || typeof column !== 'object' || Array.isArray(column)) return null
        const record = column as Record<string, unknown>
        const key = String(record.key || record.field || record.name || '').trim()
        if (!key || key.startsWith('_')) return null
        return {
          key,
          label: String(record.label || humanizeKey(key)),
          format: record.format ? String(record.format) : undefined,
        }
      })
      .filter((column): column is TableColumn => Boolean(column))
  }

  const keys = rows.length ? Object.keys(rows[0] || {}).filter((key) => !key.startsWith('_')) : []
  return keys.map((key) => ({ key, label: humanizeKey(key) }))
}

function getRowType(row: TableRow) {
  return String(row._rowType || row.row_type || '').trim().toLowerCase()
}

function getCellKind(column: TableColumn) {
  const displayKey = column.format || column.key
  const normalized = displayKey.toLowerCase()
  if (normalized === 'currency' || normalized === 'currency_plain') return 'money'
  if (normalized === 'number' || normalized === 'percent') return 'number'
  return 'text'
}

export function TableResultView({ data }: { data: TableStructuredContent }) {
  const rows = asRows(data.rows)
  const columns = asColumns(data.columns, rows)
  const visual = getToolVisual(data.tool)
  const title = data.title || 'Tabela'
  const isFinancialStatement = data.tool === 'financial_statement' || data.variant === 'financial_statement'

  if (!rows.length) {
    return (
      <ResultShell eyebrow={visual.label} icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
        <EmptyState title="Sem linhas" description="A consulta nao recebeu linhas para renderizar." />
      </ResultShell>
    )
  }

  return (
    <ResultShell eyebrow={visual.label} icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
      <section className={`result-card table-card${isFinancialStatement ? ' financial-statement-card' : ''}`}>
        <div className="table-scroll">
          <table className={`data-table${isFinancialStatement ? ' data-table--financial' : ''}`}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowType = getRowType(row)
                return (
                  <tr key={rowIndex} className={rowType ? `data-table__row--${rowType}` : undefined}>
                    {columns.map((column) => {
                      const value = row[column.key]
                      const displayKey = column.format || column.key
                      const isStatus = column.format === 'status' || column.key.toLowerCase().includes('status')
                      const cellKind = getCellKind(column)
                      return (
                        <td key={column.key} className={`data-table__cell data-table__cell--${cellKind}`}>
                          {isStatus ? <StatusBadge value={value} /> : formatCellValue(displayKey, value)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </ResultShell>
  )
}
