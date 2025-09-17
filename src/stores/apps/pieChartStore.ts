import { atom, computed } from 'nanostores'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface PieChartBigQueryData {
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

export interface PieChartConfig {
  id: string
  name: string
  bigqueryData: PieChartBigQueryData
  chartType: 'pie'
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

    innerRadius?: number
    outerRadius?: number
    enableLabels?: boolean
    labelFormat?: 'percentage' | 'value' | 'both'
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    enableArcLabels?: boolean
    enableArcLinkLabels?: boolean
    arcLabelsSkipAngle?: number
    arcLabelsTextColor?: string
    arcLinkLabelsSkipAngle?: number
    arcLinkLabelsTextColor?: string
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number
    // Pie Chart Specific Properties
    padAngle?: number
    cornerRadius?: number
    activeOuterRadiusOffset?: number
    
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
    
    // Container Background
    backgroundColor?: string

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

export interface PieChartStore {
  pieCharts: PieChartConfig[]
}

// Load pie charts from localStorage on initialization
const loadPieChartsFromStorage = (): PieChartStore => {
  if (typeof window === 'undefined') return { pieCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-pie-charts')
    return stored ? JSON.parse(stored) : { pieCharts: [] }
  } catch {
    return { pieCharts: [] }
  }
}

export const $pieChartStore = atom<PieChartStore>(loadPieChartsFromStorage())

// Auto-save to localStorage whenever pie charts change
if (typeof window !== 'undefined') {
  $pieChartStore.subscribe(store => {
    localStorage.setItem('cognito-pie-charts', JSON.stringify(store))
  })
}

// Selection management - following BarChart/LineChart pattern
export const $selectedPieChartId = atom<string | null>(null)

export const $selectedPieChart = computed([$pieChartStore, $selectedPieChartId], (store, selectedId) => {
  if (!selectedId) return null
  return store.pieCharts.find(chart => chart.id === selectedId) || null
})

// Computed store that converts PieChartConfig to DroppedWidget format
export const $pieChartsAsDropped = computed([$pieChartStore], (store) => {
  return store.pieCharts.map(pieChart => ({
    i: pieChart.id,
    id: pieChart.id,
    type: 'chart-pie' as const,
    name: pieChart.name,
    icon: '🥧',
    description: `Pie chart from ${pieChart.bigqueryData.selectedTable}`,
    defaultWidth: 60,
    defaultHeight: 150,
    x: pieChart.position.x,
    y: pieChart.position.y,
    w: pieChart.position.w,
    h: pieChart.position.h,
    pieChartConfig: pieChart
  }))
})

export const pieChartActions = {
  selectPieChart: (chartId: string | null) => {
    $selectedPieChartId.set(chartId)
  },

  addPieChart: (config: Omit<PieChartConfig, 'id'>) => {
    const newChart: PieChartConfig = {
      ...config,
      id: `pie-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const currentState = $pieChartStore.get()
    $pieChartStore.set({
      ...currentState,
      pieCharts: [...currentState.pieCharts, newChart]
    })

    return newChart
  },

  updatePieChart: (chartId: string, updates: Partial<PieChartConfig>) => {
    const currentState = $pieChartStore.get()
    $pieChartStore.set({
      ...currentState,
      pieCharts: currentState.pieCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removePieChart: (chartId: string) => {
    const currentState = $pieChartStore.get()
    $pieChartStore.set({
      ...currentState,
      pieCharts: currentState.pieCharts.filter(chart => chart.id !== chartId)
    })
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<PieChartBigQueryData>) => {
    const currentState = $pieChartStore.get()
    $pieChartStore.set({
      ...currentState,
      pieCharts: currentState.pieCharts.map(chart =>
        chart.id === chartId 
          ? { 
              ...chart, 
              bigqueryData: { ...chart.bigqueryData, ...bigqueryData }
            } 
          : chart
      )
    })
  },

  generatePieChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
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

  executePieChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $pieChartStore.get()
    const chart = currentState.pieCharts.find(c => c.id === chartId)
    
    if (!chart) return

    pieChartActions.updateBigQueryData(chartId, { 
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

      pieChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      pieChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshPieChart: async (chartId: string) => {
    await pieChartActions.executePieChartQuery(chartId)
  },

  // Update layout (for react-grid-layout)
  updatePieChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    console.log('📐 Updating PieCharts layout for', layout.length, 'items')
    const currentState = $pieChartStore.get()
    
    const updatedCharts = currentState.pieCharts.map(chart => {
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
    
    $pieChartStore.set({
      ...currentState,
      pieCharts: updatedCharts
    })
  },

  // Clear all pie charts
  clearAll: () => {
    console.log('🗑️ Clearing all pie charts')
    $pieChartStore.set({ pieCharts: [] })
    $selectedPieChartId.set(null)
  }
}