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

    // Tailwind Classes - Title/Subtitle (precedence over individual props)
    titleClassName?: string
    subtitleClassName?: string
    containerClassName?: string

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
    // Horizontal Bar Chart Specific Properties  
    groupMode?: 'grouped' | 'stacked'
    layout?: 'horizontal' | 'vertical'
    padding?: number
    innerPadding?: number
    
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

export interface HorizontalBarChartStore {
  horizontalBarCharts: HorizontalBarChartConfig[]
}

// Load horizontal bar charts from localStorage on initialization
const loadHorizontalBarChartsFromStorage = (): HorizontalBarChartStore => {
  if (typeof window === 'undefined') return { horizontalBarCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-horizontal-bar-charts')
    return stored ? JSON.parse(stored) : { horizontalBarCharts: [] }
  } catch {
    return { horizontalBarCharts: [] }
  }
}

export const $horizontalBarChartStore = atom<HorizontalBarChartStore>(loadHorizontalBarChartsFromStorage())

// Auto-save to localStorage whenever horizontal bar charts change
if (typeof window !== 'undefined') {
  $horizontalBarChartStore.subscribe(store => {
    localStorage.setItem('cognito-horizontal-bar-charts', JSON.stringify(store))
  })
}

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
    defaultWidth: 60,
    defaultHeight: 150,
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
  },

  // Update layout (for react-grid-layout)
  updateHorizontalBarChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    console.log('📐 Updating HorizontalBarCharts layout for', layout.length, 'items')
    const currentState = $horizontalBarChartStore.get()
    
    const updatedCharts = currentState.horizontalBarCharts.map(chart => {
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
    
    $horizontalBarChartStore.set({
      ...currentState,
      horizontalBarCharts: updatedCharts
    })
  },

  // Clear all horizontal bar charts
  clearAll: () => {
    console.log('🗑️ Clearing all horizontal bar charts')
    $horizontalBarChartStore.set({ horizontalBarCharts: [] })
    $selectedHorizontalBarChartId.set(null)
  }
}