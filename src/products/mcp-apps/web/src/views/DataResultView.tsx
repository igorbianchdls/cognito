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

function buildTableSubtitle(data: DataResultStructuredContent, rows: DataRow[], columns: string[]) {
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
  const tableSubtitle = buildTableSubtitle(data, rows, columns)
  const description = [
    data.action ? `Acao: ${data.action}` : null,
    data.resource ? `Recurso: ${data.resource}` : null,
    typeof data.count === 'number' ? `${data.count} registros` : null,
  ].filter(Boolean).join(' · ')

  if (!rows.length) {
    return (
      <ResultShell
        eyebrow={toolVisual.label}
        icon={toolVisual.icon}
        tone={toolVisual.tone}
        title={tableTitle}
        description={description || 'A tool retornou uma resposta estruturada.'}
      >
        <EmptyState title="Sem linhas" description="A tool retornou uma tabela vazia." />
      </ResultShell>
    )
  }

  return (
    <ResultShell
      eyebrow={toolVisual.label}
      icon={toolVisual.icon}
      tone={toolVisual.tone}
      title={tableTitle}
      description={description || 'Resultado estruturado da tool.'}
    >
      <DataTable rows={rows} columns={columns} title={tableTitle} subtitle={tableSubtitle} />
    </ResultShell>
  )
}
