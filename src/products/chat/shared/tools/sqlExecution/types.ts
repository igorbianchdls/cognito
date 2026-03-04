export type SqlExecutionRowValue = string | number | boolean | null | undefined

export type SqlExecutionRow = Record<string, SqlExecutionRowValue>

export type SqlExecutionChartConfig = {
  xField: string
  valueField: string
  xLabel: string | null
  yLabel: string | null
}

export type SqlExecutionToolViewModel = {
  ok: boolean
  title: string
  rows: SqlExecutionRow[]
  columns: string[]
  count: number
  chart: SqlExecutionChartConfig | null
  sqlQuery: string | null
  maxRows: number | null
  error: string | null
}
