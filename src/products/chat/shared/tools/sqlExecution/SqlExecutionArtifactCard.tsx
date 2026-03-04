"use client"

import { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Table as TableIcon } from 'lucide-react'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import type { SqlExecutionRow, SqlExecutionToolViewModel } from '@/products/chat/shared/tools/sqlExecution/types'

function safeExportName(title: string) {
  const cleaned = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'sql_result'
}

function buildColumns(keys: string[]): ColumnDef<SqlExecutionRow>[] {
  return keys.map((key) => ({
    accessorKey: key,
    header: key,
    cell: ({ row }) => {
      const value = row.getValue(key)
      if (value == null || value === '') return <span className="text-muted-foreground">-</span>
      return <span>{String(value)}</span>
    },
  }))
}

export function SqlExecutionArtifactCard({
  model,
}: {
  model: SqlExecutionToolViewModel
}) {
  const columns = useMemo(() => buildColumns(model.columns), [model.columns])
  const chartOptions = useMemo(
    () =>
      model.chart
        ? {
            xKey: model.chart.xField,
            valueKeys: [model.chart.valueField],
            initialChartType: 'bar',
            chartTypes: ['bar'],
            xLegend: model.chart.xLabel || model.chart.xField,
            yLegend: model.chart.yLabel || model.chart.valueField,
          }
        : undefined,
    [model.chart],
  )
  const message = model.ok
    ? `Consulta executada com sucesso (${model.count} linha(s)).`
    : 'Falha ao executar consulta SQL.'

  return (
    <ArtifactDataTable<SqlExecutionRow>
      data={model.rows}
      columns={columns}
      title={model.title}
      icon={TableIcon}
      message={message}
      success={model.ok}
      count={model.count}
      error={model.error || undefined}
      exportFileName={safeExportName(model.title)}
      sqlQuery={model.sqlQuery || undefined}
      chartOptions={chartOptions}
    />
  )
}
