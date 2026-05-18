import { DataTable } from '@/products/mcp-apps/web/src/components/DataTable'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import type { DataResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCurrency, formatNumber, getToolVisual } from '@/products/mcp-apps/web/src/utils/format'
import {
  getColumns,
  getPrimaryMoneyColumn,
  getRows,
  sumNumericColumn,
  type DataRow,
} from '@/products/mcp-apps/web/src/utils/table'

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

export function DataResultView({ data }: DataResultViewProps) {
  const rows = getRows(data)
  const columns = getColumns(data, rows)
  const toolVisual = getToolVisual(data.tool)
  const tableTitle = data.title || 'Resultado'
  const description = buildResultDescription(data, rows, columns)

  if (!rows.length) {
    return (
      <ResultShell
        icon={toolVisual.icon}
        tone={toolVisual.tone}
        title={tableTitle}
        description={description}
      >
        <EmptyState title="Sem linhas" description="A tool retornou uma tabela vazia." />
      </ResultShell>
    )
  }

  return (
    <ResultShell
      icon={toolVisual.icon}
      tone={toolVisual.tone}
      title={tableTitle}
      description={description}
    >
      <DataTable rows={rows} columns={columns} title={tableTitle} />
    </ResultShell>
  )
}
