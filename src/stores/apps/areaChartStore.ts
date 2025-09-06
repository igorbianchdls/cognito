import { atom, computed } from 'nanostores'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface AreaChartBigQueryData {
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

export interface AreaChartConfig {
  id: string
  name: string
  bigqueryData: AreaChartBigQueryData
  chartType: 'area'
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
    areaOpacity?: number
    fillOpacity?: number
    strokeWidth?: number
    curved?: boolean
    gradient?: boolean
    xAxisTitle?: string
    yAxisTitle?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    enablePointLabels?: boolean
    pointLabelTextColor?: string
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface AreaChartStore {
  areaCharts: AreaChartConfig[]
}

const initialAreaChartState: AreaChartStore = {
  areaCharts: []
}

export const $areaChartStore = atom<AreaChartStore>(initialAreaChartState)

// Selection management - following BarChart/LineChart/PieChart pattern
export const $selectedAreaChartId = atom<string | null>(null)

export const $selectedAreaChart = computed([$areaChartStore, $selectedAreaChartId], (store, selectedId) => {
  if (!selectedId) return null
  return store.areaCharts.find(chart => chart.id === selectedId) || null
})

// Computed store that converts AreaChartConfig to DroppedWidget format
export const $areaChartsAsDropped = computed([$areaChartStore], (store) => {
  return store.areaCharts.map(areaChart => ({
    i: areaChart.id,
    id: areaChart.id,
    type: 'chart-area' as const,
    name: areaChart.name,
    icon: '📊',
    description: `Area chart from ${areaChart.bigqueryData.selectedTable}`,
    defaultWidth: 4,
    defaultHeight: 3,
    x: areaChart.position.x,
    y: areaChart.position.y,
    w: areaChart.position.w,
    h: areaChart.position.h,
    areaChartConfig: areaChart
  }))
})

export const areaChartActions = {
  selectAreaChart: (chartId: string | null) => {
    $selectedAreaChartId.set(chartId)
  },

  addAreaChart: (config: Omit<AreaChartConfig, 'id'>) => {
    const newChart: AreaChartConfig = {
      ...config,
      id: `area-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const currentState = $areaChartStore.get()
    $areaChartStore.set({
      ...currentState,
      areaCharts: [...currentState.areaCharts, newChart]
    })

    return newChart
  },

  updateAreaChart: (chartId: string, updates: Partial<AreaChartConfig>) => {
    const currentState = $areaChartStore.get()
    $areaChartStore.set({
      ...currentState,
      areaCharts: currentState.areaCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removeAreaChart: (chartId: string) => {
    const currentState = $areaChartStore.get()
    $areaChartStore.set({
      ...currentState,
      areaCharts: currentState.areaCharts.filter(chart => chart.id !== chartId)
    })
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<AreaChartBigQueryData>) => {
    const currentState = $areaChartStore.get()
    $areaChartStore.set({
      ...currentState,
      areaCharts: currentState.areaCharts.map(chart =>
        chart.id === chartId 
          ? { 
              ...chart, 
              bigqueryData: { ...chart.bigqueryData, ...bigqueryData }
            } 
          : chart
      )
    })
  },

  generateAreaChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
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

  executeAreaChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $areaChartStore.get()
    const chart = currentState.areaCharts.find(c => c.id === chartId)
    
    if (!chart) return

    areaChartActions.updateBigQueryData(chartId, { 
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

      areaChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      areaChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshAreaChart: async (chartId: string) => {
    await areaChartActions.executeAreaChartQuery(chartId)
  }
}