import { atom, computed } from 'nanostores'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface LineChartBigQueryData {
  query: string
  selectedTable: string | null
  columns: {
    xAxis: BigQueryField[]
    yAxis: BigQueryField[]
    filters: BigQueryField[]
  }
  data: Record<string, unknown>[] | null
  lastExecuted: Date | null
  isLoading: boolean
  error: string | null
}

export interface LineChartConfig {
  id: string
  name: string
  bigqueryData: LineChartBigQueryData
  chartType: 'line'
  styling: {
    colors: string[]
    showLegend: boolean
    showGrid: boolean
    enableGridX?: boolean
    enableGridY?: boolean
    legendPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
    legendDirection?: 'row' | 'column'
    legendSpacing?: number
    legendSymbolSize?: number
    legendSymbolShape?: 'circle' | 'square' | 'triangle'
    title?: string
    style?: string
    xAxisTitle?: string
    yAxisTitle?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    enablePointLabels?: boolean
    pointLabelTextColor?: string
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number
    xAxisLegend?: string
    xAxisLegendPosition?: 'start' | 'middle' | 'end'
    xAxisLegendOffset?: number
    xAxisTickRotation?: number
    xAxisTickSize?: number
    xAxisTickPadding?: number
    yAxisLegend?: string
    yAxisLegendOffset?: number
    yAxisTickRotation?: number
    yAxisTickSize?: number
    yAxisTickPadding?: number
    // Line Chart Specific Properties
    lineWidth?: number
    enablePoints?: boolean
    pointSize?: number
    curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
    enableArea?: boolean
    areaOpacity?: number
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface LineChartStore {
  lineCharts: LineChartConfig[]
}

// Load line charts from localStorage on initialization
const loadLineChartsFromStorage = (): LineChartStore => {
  if (typeof window === 'undefined') return { lineCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-line-charts')
    return stored ? JSON.parse(stored) : { lineCharts: [] }
  } catch {
    return { lineCharts: [] }
  }
}

export const $lineChartStore = atom<LineChartStore>(loadLineChartsFromStorage())

// Auto-save to localStorage whenever line charts change
if (typeof window !== 'undefined') {
  $lineChartStore.subscribe(store => {
    localStorage.setItem('cognito-line-charts', JSON.stringify(store))
  })
}

// Selection management for line charts
export const $selectedLineChartId = atom<string | null>(null)

// Computed store for selected line chart
export const $selectedLineChart = computed([$lineChartStore, $selectedLineChartId], (store, selectedId) => {
  if (!selectedId) return null
  return store.lineCharts.find(chart => chart.id === selectedId) || null
})

// Computed store that converts LineChartConfig to DroppedWidget format
export const $lineChartsAsDropped = computed([$lineChartStore], (store) => {
  return store.lineCharts.map(lineChart => ({
    i: lineChart.id,
    id: lineChart.id,
    type: 'chart-line' as const,
    name: lineChart.name,
    icon: '📈',
    description: `Line chart from ${lineChart.bigqueryData.selectedTable}`,
    defaultWidth: 4,
    defaultHeight: 3,
    x: lineChart.position.x,
    y: lineChart.position.y,
    w: lineChart.position.w,
    h: lineChart.position.h,
    lineChartConfig: lineChart
  }))
})

export const lineChartActions = {
  addLineChart: (config: Omit<LineChartConfig, 'id'>) => {
    const newChart: LineChartConfig = {
      ...config,
      id: `line-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const currentState = $lineChartStore.get()
    $lineChartStore.set({
      ...currentState,
      lineCharts: [...currentState.lineCharts, newChart]
    })

    return newChart
  },

  updateLineChart: (chartId: string, updates: Partial<LineChartConfig>) => {
    const currentState = $lineChartStore.get()
    $lineChartStore.set({
      ...currentState,
      lineCharts: currentState.lineCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removeLineChart: (chartId: string) => {
    const currentState = $lineChartStore.get()
    $lineChartStore.set({
      ...currentState,
      lineCharts: currentState.lineCharts.filter(chart => chart.id !== chartId)
    })
    
    // Clear selection if the removed chart was selected
    if ($selectedLineChartId.get() === chartId) {
      $selectedLineChartId.set(null)
    }
  },

  selectLineChart: (chartId: string | null) => {
    $selectedLineChartId.set(chartId)
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<LineChartBigQueryData>) => {
    const currentState = $lineChartStore.get()
    $lineChartStore.set({
      ...currentState,
      lineCharts: currentState.lineCharts.map(chart =>
        chart.id === chartId 
          ? { 
              ...chart, 
              bigqueryData: { ...chart.bigqueryData, ...bigqueryData }
            } 
          : chart
      )
    })
  },

  generateLineChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
    let query = `SELECT `
    
    const selectFields: string[] = []
    
    xAxis.forEach(field => {
      selectFields.push(field.name)
    })
    
    yAxis.forEach(field => {
      if (field.aggregation && field.aggregation !== 'COUNT') {
        selectFields.push(`${field.aggregation}(${field.name}) as ${field.name}`)
      } else if (field.aggregation === 'COUNT') {
        selectFields.push(`COUNT(*) as ${field.name}`)
      } else {
        selectFields.push(field.name)
      }
    })
    
    query += selectFields.join(', ')
    query += ` FROM \`creatto-463117.biquery_data.${tableName}\``
    
    if (filters.length > 0) {
      const whereConditions = filters.map(filter => `${filter.name} IS NOT NULL`).join(' AND ')
      query += ` WHERE ${whereConditions}`
    }
    
    if (xAxis.length > 0) {
      query += ` GROUP BY ${xAxis.map(field => field.name).join(', ')}`
    }
    
    query += ` LIMIT 1000`
    
    return query
  },

  executeLineChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $lineChartStore.get()
    const chart = currentState.lineCharts.find(c => c.id === chartId)
    
    if (!chart) return

    lineChartActions.updateBigQueryData(chartId, { 
      isLoading: true, 
      error: null 
    })

    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: chart.bigqueryData.query 
        })
      })

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`)
      }

      const data = await response.json()

      lineChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      lineChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshLineChart: async (chartId: string) => {
    await lineChartActions.executeLineChartQuery(chartId)
  }
}