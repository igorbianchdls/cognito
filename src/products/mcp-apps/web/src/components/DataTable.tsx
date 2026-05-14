import { formatCellValue, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
import type { DataRow } from '@/products/mcp-apps/web/src/utils/table'
import { getColumnKind } from '@/products/mcp-apps/web/src/utils/table'
import { StatusBadge } from '@/products/mcp-apps/web/src/components/StatusBadge'

type DataTableProps = {
  rows: DataRow[]
  columns: string[]
}

export function DataTable({ rows, columns }: DataTableProps) {
  const visibleRows = rows.slice(0, 100)

  return (
    <section className="result-card table-card">
      <div className="result-card__header">
        <h2>Tabela</h2>
        <span>
          {visibleRows.length}
          {rows.length > visibleRows.length ? ` de ${rows.length}` : ''} linhas
        </span>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{humanizeKey(column)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => {
                  const kind = getColumnKind(column, rows)
                  const value = row[column]
                  return (
                    <td className={`data-table__cell data-table__cell--${kind}`} key={column}>
                      {kind === 'status' ? <StatusBadge value={value} /> : formatCellValue(column, value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
