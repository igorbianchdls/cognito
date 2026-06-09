import { DataTable } from '@/products/plugin/web/src/components/DataTable'
import { EmptyState } from '@/products/plugin/web/src/components/EmptyState'
import type { DataResultStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { formatCurrency, formatNumber } from '@/products/plugin/web/src/utils/format'
import {
  getColumns,
  getPrimaryMoneyColumn,
  getRows,
  sumNumericColumn,
  type DataRow,
} from '@/products/plugin/web/src/utils/table'

type DataResultViewProps = {
  data: DataResultStructuredContent
}

function normalizeColumnName(column: string) {
  return column
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function getLiquidValueColumn(columns: string[], rows: DataRow[]) {
  const explicitLiquidColumn = columns.find((column) => {
    const normalized = normalizeColumnName(column)
    return normalized.includes('valorliquido') && rows.some((row) => typeof row[column] === 'number')
  })

  return explicitLiquidColumn || getPrimaryMoneyColumn(columns, rows)
}

function buildResultDescription(data: DataResultStructuredContent, rows: DataRow[], columns: string[]) {
  const count = typeof data.count === 'number' ? data.count : rows.length
  const liquidValueColumn = getLiquidValueColumn(columns, rows)
  const parts = [`${formatNumber(count)} registros`]

  if (liquidValueColumn) {
    parts.push(`Valor liquido: ${formatCurrency(sumNumericColumn(rows, liquidValueColumn))}`)
  }

  return parts.join(' · ')
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

export function DataResultView({ data }: DataResultViewProps) {
  const rows = getRows(data)
  const columns = getColumns(data, rows)
  const tableTitle = data.title || 'Resultado'
  const description = buildResultDescription(data, rows, columns)

  if (!rows.length) {
    return (
      <section className="table-card">
        <TableHeader title={tableTitle} subtitle={description} />
        <EmptyState title="Sem linhas" description="A tool retornou uma tabela vazia." />
      </section>
    )
  }

  return <DataTable rows={rows} columns={columns} title={tableTitle} subtitle={description} />
}
