import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatCellValue, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
import type { DataRow } from '@/products/mcp-apps/web/src/utils/table'
import { getColumnKind } from '@/products/mcp-apps/web/src/utils/table'
import { StatusBadge } from '@/products/mcp-apps/web/src/components/StatusBadge'

type DataTableProps = {
  rows: DataRow[]
  columns: string[]
}

const pageSizeOptions = [25, 50, 100]
const defaultPageSize = 25

export function DataTable({ rows, columns }: DataTableProps) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const startIndex = rows.length ? currentPage * pageSize : 0
  const endIndex = Math.min(startIndex + pageSize, rows.length)
  const visibleRows = useMemo(() => rows.slice(startIndex, endIndex), [endIndex, rows, startIndex])
  const columnKinds = useMemo(
    () => Object.fromEntries(columns.map((column) => [column, getColumnKind(column, rows)])),
    [columns, rows],
  )
  const showPagination = rows.length > defaultPageSize

  useEffect(() => {
    setPage((value) => Math.min(value, pageCount - 1))
  }, [pageCount])

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value))
    setPage(0)
  }

  return (
    <section className="result-card table-card">
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
              <tr key={startIndex + rowIndex}>
                {columns.map((column) => {
                  const kind = columnKinds[column]
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
      {showPagination ? (
        <div className="table-pagination" aria-label="Paginacao da tabela">
          <label className="table-pagination__size">
            <span>Linhas</span>
            <select
              aria-label="Linhas por pagina"
              value={pageSize}
              onChange={(event) => handlePageSizeChange(event.target.value)}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="table-pagination__controls">
            <button
              type="button"
              aria-label="Pagina anterior"
              title="Pagina anterior"
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
            >
              <ChevronLeft size={15} strokeWidth={2.4} />
            </button>
            <span>
              Pagina {currentPage + 1} de {pageCount}
            </span>
            <button
              type="button"
              aria-label="Proxima pagina"
              title="Proxima pagina"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            >
              <ChevronRight size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
