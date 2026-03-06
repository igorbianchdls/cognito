export type ActionQueryRowValue = string | number | boolean | null | undefined

export type ActionQueryRow = Record<string, ActionQueryRowValue>

export type ActionQueryChartConfig = {
  xField: string
  valueField: string
  xLabel: string | null
  yLabel: string | null
}

export type ActionQueryToolViewModel = {
  ok: boolean
  tool: 'ecommerce' | 'marketing'
  action: string | null
  title: string
  rows: ActionQueryRow[]
  columns: string[]
  count: number
  chart: ActionQueryChartConfig | null
  sqlQuery: string | null
  error: string | null
}
