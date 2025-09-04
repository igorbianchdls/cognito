export interface BarChartConfig {
  bigqueryData: {
    query: string
    selectedTable: string | null
    columns: {
      xAxis: Array<{
        name: string
        type: string
        mode?: string
        description?: string
        aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN'
      }>
      yAxis: Array<{
        name: string
        type: string
        mode?: string
        description?: string
        aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN'
      }>
      filters: Array<{
        name: string
        type: string
        mode?: string
        description?: string
        aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN'
      }>
    }
    data: Record<string, unknown>[] | null
    lastExecuted: Date | null
    isLoading: boolean
    error: string | null
  }
  styling: {
    colors: string[]
    showLegend: boolean
    showGrid: boolean
    title?: string
  }
}