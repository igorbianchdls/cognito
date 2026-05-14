import { formatCurrency, formatNumber } from '@/products/mcp-apps/web/src/utils/format'
import type { DataRow } from '@/products/mcp-apps/web/src/utils/table'
import { countPendingOverdue, getPrimaryMoneyColumn, sumNumericColumn } from '@/products/mcp-apps/web/src/utils/table'

type MetricSummaryProps = {
  rows: DataRow[]
  columns: string[]
  count?: number
}

export function MetricSummary({ rows, columns, count }: MetricSummaryProps) {
  const primaryMoneyColumn = getPrimaryMoneyColumn(columns, rows)
  const overdue = countPendingOverdue(rows)
  const metrics = [
    {
      label: 'Registros',
      value: formatNumber(typeof count === 'number' ? count : rows.length),
    },
    primaryMoneyColumn
      ? {
          label: primaryMoneyColumn.replace(/[_-]+/g, ' '),
          value: formatCurrency(sumNumericColumn(rows, primaryMoneyColumn)),
        }
      : null,
    overdue
      ? {
          label: 'Vencidos',
          value: formatNumber(overdue),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <section className="metric-grid" aria-label="Resumo">
      {metrics.map((metric) => (
        <article className="metric-card" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
        </article>
      ))}
    </section>
  )
}
