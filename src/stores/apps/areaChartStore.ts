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

    // Typography - Title/Subtitle
    titleFontSize?: number
    titleFontWeight?: number
    titleColor?: string
    subtitleFontSize?: number
    subtitleFontWeight?: number
    subtitleColor?: string

    // Spacing - Title/Subtitle
    titleMarginTop?: number
    titleMarginRight?: number
    titleMarginBottom?: number
    titleMarginLeft?: number
    titlePaddingTop?: number
    titlePaddingRight?: number
    titlePaddingBottom?: number
    titlePaddingLeft?: number

    subtitleMarginTop?: number
    subtitleMarginRight?: number
    subtitleMarginBottom?: number
    subtitleMarginLeft?: number
    subtitlePaddingTop?: number
    subtitlePaddingRight?: number
    subtitlePaddingBottom?: number
    subtitlePaddingLeft?: number

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
    // Area Chart Specific Properties
    lineWidth?: number
    enablePoints?: boolean
    pointSize?: number
    curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
    
    // Typography - Axis
    axisFontFamily?: string
    axisFontSize?: number
    axisFontWeight?: number
    axisTextColor?: string
    axisLegendFontSize?: number
    axisLegendFontWeight?: number
    
    // Typography - Labels  
    labelsFontFamily?: string
    labelsFontSize?: number
    labelsFontWeight?: number
    labelsTextColor?: string
    
    // Typography - Legends
    legendsFontFamily?: string
    legendsFontSize?: number
    legendsFontWeight?: number
    legendsTextColor?: string
    
    // Typography - Tooltip
    tooltipFontSize?: number
    tooltipFontFamily?: string
    
    // Container Border
    containerBorderWidth?: number
    containerBorderColor?: string
    containerBorderRadius?: number
    containerPadding?: number
    
    // Container Shadow
    containerShadowColor?: string
    containerShadowOpacity?: number
    containerShadowBlur?: number
    containerShadowOffsetX?: number
    containerShadowOffsetY?: number
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

// Load area charts from localStorage on initialization
const loadAreaChartsFromStorage = (): AreaChartStore => {
  if (typeof window === 'undefined') return { areaCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-area-charts')
    return stored ? JSON.parse(stored) : { areaCharts: [] }
  } catch {
    return { areaCharts: [] }
  }
}

export const $areaChartStore = atom<AreaChartStore>(loadAreaChartsFromStorage())

// Auto-save to localStorage whenever area charts change
if (typeof window !== 'undefined') {
  $areaChartStore.subscribe(store => {
    localStorage.setItem('cognito-area-charts', JSON.stringify(store))
  })
}

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
    defaultWidth: 60,
    defaultHeight: 150,
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
  },

  // Update layout (for react-grid-layout)
  updateAreaChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    console.log('📐 Updating AreaCharts layout for', layout.length, 'items')
    const currentState = $areaChartStore.get()
    
    const updatedCharts = currentState.areaCharts.map(chart => {
      const layoutItem = layout.find(l => l.i === chart.id)
      if (layoutItem) {
        return { 
          ...chart, 
          position: { 
            x: layoutItem.x, 
            y: layoutItem.y, 
            w: layoutItem.w, 
            h: layoutItem.h 
          }
        }
      }
      return chart
    })
    
    $areaChartStore.set({
      ...currentState,
      areaCharts: updatedCharts
    })
  },

  // Clear all area charts
  clearAll: () => {
    console.log('🗑️ Clearing all area charts')
    $areaChartStore.set({ areaCharts: [] })
    $selectedAreaChartId.set(null)
  }
}