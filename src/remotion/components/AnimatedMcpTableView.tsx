import { interpolate, useCurrentFrame } from 'remotion'

import type { DataResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatCellValue, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
import {
  getColumnKind,
  getColumns,
  getPrimaryMoneyColumn,
  getRows,
  sumNumericColumn,
} from '@/products/mcp-apps/web/src/utils/table'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function fadeSlide(frame: number, start: number, fromY = 16) {
  const opacity = progress(frame, start, start + 18)
  const y = interpolate(frame, [start, start + 22], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function buildSubtitle(data: DataResultStructuredContent, columns: string[], rows: Record<string, unknown>[]) {
  if (data.title && typeof data.count !== 'number' && !rows.length) return undefined

  const count = typeof data.count === 'number' ? data.count : rows.length
  const moneyColumn = getPrimaryMoneyColumn(columns, rows)
  const parts = [`${new Intl.NumberFormat('pt-BR').format(count)} registros`]

  if (moneyColumn) {
    parts.push(`Valor liquido: ${formatCurrency(sumNumericColumn(rows, moneyColumn))}`)
  }

  return parts.join(' · ')
}

function statusStyle(value: unknown) {
  const normalized = String(value ?? '').toLowerCase()
  if (normalized.includes('pago') || normalized.includes('recebido') || normalized.includes('ganho')) {
    return { background: '#e6f6ed', color: '#126236' }
  }
  if (normalized.includes('venc') || normalized.includes('atras')) {
    return { background: '#fff1df', color: '#9a4d00' }
  }
  if (normalized.includes('cancel')) {
    return { background: '#f4f5f4', color: '#68726c' }
  }
  return { background: '#eef2f7', color: '#314039' }
}

function pickColumn(columns: string[], candidates: string[]) {
  return candidates
    .map((candidate) => columns.find((column) => column.toLowerCase().includes(candidate)))
    .find(Boolean)
}

function buildMobileColumns(columns: string[]) {
  const nameColumn = pickColumn(columns, ['fornecedor', 'cliente', 'nome', 'produto']) || columns[0]
  const dateColumn = pickColumn(columns, ['vencimento', 'data']) || columns.find((column) => column !== nameColumn)
  const statusColumn = pickColumn(columns, ['status', 'situacao'])
  const moneyColumn = pickColumn(columns, ['valor_liquido', 'valor', 'total', 'receita'])

  return [nameColumn, dateColumn, statusColumn, moneyColumn].filter((column): column is string => Boolean(column))
}

function shortHeader(column: string) {
  const normalized = column.toLowerCase()
  if (normalized.includes('fornecedor')) return 'Fornecedor'
  if (normalized.includes('cliente')) return 'Cliente'
  if (normalized.includes('vencimento')) return 'Venc.'
  if (normalized.includes('data')) return 'Data'
  if (normalized.includes('status') || normalized.includes('situacao')) return 'Status'
  if (normalized.includes('valor') || normalized.includes('total') || normalized.includes('receita')) return 'Valor'
  return humanizeKey(column)
}

export function AnimatedMcpTableView({ data, startFrame = 0 }: { data: DataResultStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const rows = getRows(data).slice(0, 5)
  const sourceColumns = getColumns(data, rows)
  const columns = buildMobileColumns(sourceColumns)
  const columnKinds = Object.fromEntries(columns.map((column) => [column, getColumnKind(column, rows)]))
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const headerRowStyle = fadeSlide(localFrame, 24, 10)
  const title = data.title || 'Resultado'
  const subtitle = (data as { subtitle?: string }).subtitle || buildSubtitle(data, columns, rows)

  return (
    <section className="table-card" style={{ gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 32, letterSpacing: 0, lineHeight: 1.12 }}>{title}</h1>
          {subtitle ? (
            <p style={{ ...subtitleStyle, fontSize: 18, letterSpacing: 0, lineHeight: 1.25 }}>{subtitle}</p>
          ) : null}
        </div>
      </header>

      <div
        className="table-scroll"
        style={{
          marginTop: 8,
          maxHeight: 'none',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: 22,
            tableLayout: 'fixed',
            width: '100%',
          }}
        >
          <thead style={headerRowStyle}>
            <tr>
              {columns.map((column, columnIndex) => (
                <th
                  key={column}
                  style={{
                    background: '#f6f7f5',
                    borderBottom: '1px solid #e6e8e4',
                    color: '#606a64',
                    fontSize: 17,
                    fontWeight: 850,
                    letterSpacing: 0,
                    padding: '14px 14px',
                    textAlign: columnKinds[column] === 'money' ? 'right' : 'left',
                    textTransform: 'uppercase',
                    width: columnIndex === 0 ? '35%' : columnKinds[column] === 'money' ? '25%' : '20%',
                  }}
                >
                  {shortHeader(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowStyle = fadeSlide(localFrame, 42 + rowIndex * 9, 18)
              return (
                <tr key={rowIndex} style={rowStyle}>
                  {columns.map((column, columnIndex) => {
                    const kind = columnKinds[column]
                    const value = row[column]
                    const isStatus = kind === 'status'
                    const isFirstColumn = columnIndex === 0

                    return (
                      <td
                        key={column}
                        style={{
                          borderBottom: '1px solid #edf0ec',
                          color: isFirstColumn ? '#151816' : '#29302b',
                          fontSize: 22,
                          fontVariantNumeric: kind === 'money' || kind === 'number' ? 'tabular-nums' : undefined,
                          fontWeight: isFirstColumn ? 740 : 560,
                          letterSpacing: 0,
                          lineHeight: 1.22,
                          overflow: 'hidden',
                          padding: '17px 14px',
                          textAlign: kind === 'money' || kind === 'number' ? 'right' : 'left',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isStatus ? (
                          <span
                            style={{
                              ...statusStyle(value),
                              borderRadius: 999,
                              display: 'inline-flex',
                              fontSize: 17,
                              fontWeight: 800,
                              letterSpacing: 0,
                              lineHeight: 1,
                              padding: '8px 12px',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatCellValue(column, value)}
                          </span>
                        ) : (
                          formatCellValue(column, value)
                        )}
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
