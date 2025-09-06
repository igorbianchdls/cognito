import { atom, computed } from 'nanostores'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface HorizontalBarChartBigQueryData {
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

export interface HorizontalBarChartConfig {
  id: string
  name: string
  bigqueryData: HorizontalBarChartBigQueryData
  chartType: 'horizontal-bar'
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
    enableLabel?: boolean
    labelPosition?: 'start' | 'middle' | 'end'
    labelSkipWidth?: number
    labelSkipHeight?: number
    labelTextColor?: string
    labelFormat?: string
    labelOffset?: number
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface HorizontalBarChartStore {
  horizontalBarCharts: HorizontalBarChartConfig[]
}

const initialHorizontalBarChartState: HorizontalBarChartStore = {
  horizontalBarCharts: []
}

export const $horizontalBarChartStore = atom<HorizontalBarChartStore>(initialHorizontalBarChartState)

// Selection management - following other chart patterns
export const $selectedHorizontalBarChartId = atom<string | null>(null)

export const $selectedHorizontalBarChart = computed([$horizontalBarChartStore, $selectedHorizontalBarChartId], (store, selectedId) => {
  if (!selectedId) return null
  return store.horizontalBarCharts.find(chart => chart.id === selectedId) || null
})

// Computed store that converts HorizontalBarChartConfig to DroppedWidget format
export const $horizontalBarChartsAsDropped = computed([$horizontalBarChartStore], (store) => {
  return store.horizontalBarCharts.map(horizontalBarChart => ({
    i: horizontalBarChart.id,
    id: horizontalBarChart.id,
    type: 'chart-horizontal-bar' as const,
    name: horizontalBarChart.name,
    icon: '📊',
    description: `Horizontal bar chart from ${horizontalBarChart.bigqueryData.selectedTable}`,
    defaultWidth: 4,
    defaultHeight: 3,
    x: horizontalBarChart.position.x,
    y: horizontalBarChart.position.y,
    w: horizontalBarChart.position.w,
    h: horizontalBarChart.position.h,
    horizontalBarChartConfig: horizontalBarChart
  }))
})

export const horizontalBarChartActions = {
  selectHorizontalBarChart: (chartId: string | null) => {
    $selectedHorizontalBarChartId.set(chartId)
  },

  addHorizontalBarChart: (config: Omit<HorizontalBarChartConfig, 'id'>) => {
    const newChart: HorizontalBarChartConfig = {
      ...config,
      id: `horizontal-bar-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const currentState = $horizontalBarChartStore.get()
    $horizontalBarChartStore.set({
      ...currentState,
      horizontalBarCharts: [...currentState.horizontalBarCharts, newChart]
    })

    return newChart
  },

  updateHorizontalBarChart: (chartId: string, updates: Partial<HorizontalBarChartConfig>) => {
    const currentState = $horizontalBarChartStore.get()
    $horizontalBarChartStore.set({
      ...currentState,
      horizontalBarCharts: currentState.horizontalBarCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removeHorizontalBarChart: (chartId: string) => {
    const currentState = $horizontalBarChartStore.get()
    $horizontalBarChartStore.set({
      ...currentState,
      horizontalBarCharts: currentState.horizontalBarCharts.filter(chart => chart.id !== chartId)
    })
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<HorizontalBarChartBigQueryData>) => {
    const currentState = $horizontalBarChartStore.get()
    $horizontalBarChartStore.set({
      ...currentState,
      horizontalBarCharts: currentState.horizontalBarCharts.map(chart =>
        chart.id === chartId 
          ? { 
              ...chart, 
              bigqueryData: { ...chart.bigqueryData, ...bigqueryData }
            } 
          : chart
      )
    })
  },

  generateHorizontalBarChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
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

  executeHorizontalBarChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $horizontalBarChartStore.get()
    const chart = currentState.horizontalBarCharts.find(c => c.id === chartId)
    
    if (!chart) return

    horizontalBarChartActions.updateBigQueryData(chartId, { 
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

      horizontalBarChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      horizontalBarChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshHorizontalBarChart: async (chartId: string) => {
    await horizontalBarChartActions.executeHorizontalBarChartQuery(chartId)
  }
}