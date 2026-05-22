import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { StatusBadge } from '@/products/mcp-apps/web/src/components/StatusBadge'
import type { TableStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCellValue, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'

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

function getRowClassName(row: TableRow, isFinancialStatement: boolean) {
  const rowType = getRowType(row)
  if (!isFinancialStatement) return rowType ? `data-table__row--${rowType}` : undefined
  if (rowType === 'group' || rowType === 'subtotal') return 'financial-row--subtotal'
  if (rowType === 'child') return 'financial-row--child'
  return 'financial-row--normal'
}

function getGroupId(row: TableRow) {
  return String(row._groupId || row.group_id || '').trim()
}

function getParentGroupId(row: TableRow) {
  return String(row._parentGroupId || row.parent_group_id || '').trim()
}

function getCellKind(column: TableColumn) {
  const displayKey = column.format || column.key
  const normalized = displayKey.toLowerCase()
  if (normalized === 'currency' || normalized === 'currency_plain') return 'money'
  if (normalized === 'number' || normalized === 'percent') return 'number'
  return 'text'
}

function TableHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="chart-card__header">
      <div className="chart-card__copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </header>
  )
}

export function TableResultView({ data }: { data: TableStructuredContent }) {
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({})
  const rows = asRows(data.rows)
  const columns = asColumns(data.columns, rows)
  const title = data.title || 'Tabela'
  const subtitle = data.subtitle || undefined
  const isFinancialStatement = data.tool === 'financial_statement' || data.variant === 'financial_statement'
  const visibleRows = isFinancialStatement
    ? rows.filter((row) => {
        const parentGroupId = getParentGroupId(row)
        return !parentGroupId || !closedGroups[parentGroupId]
      })
    : rows

  function toggleGroup(groupId: string) {
    if (!groupId) return
    setClosedGroups((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }))
  }

  if (!rows.length) {
    return (
      <section className={`result-card table-card${isFinancialStatement ? ' financial-statement-card' : ''}`}>
        <TableHeader title={title} subtitle={subtitle} />
        <EmptyState title="Sem linhas" description="A consulta nao recebeu linhas para renderizar." />
      </section>
    )
  }

  return (
    <section className={`result-card table-card${isFinancialStatement ? ' financial-statement-card' : ''}`}>
      <TableHeader title={title} subtitle={subtitle} />
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
            {visibleRows.map((row, rowIndex) => {
              const rowType = getRowType(row)
              const groupId = getGroupId(row)
              const isExpandableGroup = Boolean(isFinancialStatement && rowType === 'group' && groupId)
              const isClosed = Boolean(groupId && closedGroups[groupId])
              return (
                <tr
                  key={`${groupId || getParentGroupId(row) || rowIndex}-${rowIndex}`}
                  className={getRowClassName(row, isFinancialStatement)}
                  onClick={isExpandableGroup ? () => toggleGroup(groupId) : undefined}
                >
                  {columns.map((column, columnIndex) => {
                    const value = row[column.key]
                    const displayKey = column.format || column.key
                    const isStatus = column.format === 'status' || column.key.toLowerCase().includes('status')
                    const cellKind = getCellKind(column)
                    return (
                      <td key={column.key} className={`data-table__cell data-table__cell--${cellKind}`}>
                        {isExpandableGroup && columnIndex === 0 ? (
                          <button
                            type="button"
                            className="financial-row__toggle"
                            aria-expanded={!isClosed}
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleGroup(groupId)
                            }}
                          >
                            {isClosed ? <ChevronRight size={15} strokeWidth={2.4} /> : <ChevronDown size={15} strokeWidth={2.4} />}
                            <span>{formatCellValue(displayKey, value)}</span>
                          </button>
                        ) : isStatus ? <StatusBadge value={value} /> : formatCellValue(displayKey, value)}
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
  )
}
