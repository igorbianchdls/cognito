import { atom, computed } from 'nanostores'
import type { LegendConfig } from '@/types/apps/chartWidgets'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface BarChartBigQueryData {
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

export interface BarChartConfig {
  id: string
  name: string
  bigqueryData: BarChartBigQueryData
  chartType: 'bar'
  styling: {
    colors: string[]
    showLegend: boolean
    showGrid: boolean
    enableGridX?: boolean
    enableGridY?: boolean
    gridColor?: string
    gridStrokeWidth?: number
    legendPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
    legendDirection?: 'row' | 'column'
    legendSpacing?: number
    legendSymbolSize?: number
    legendSymbolShape?: 'circle' | 'square' | 'triangle'
    title?: string
    style?: string

    // Typography - Title
    titleFontFamily?: string
    titleFontSize?: number
    titleFontWeight?: number
    titleColor?: string
    
    // Typography - Subtitle  
    subtitleFontFamily?: string
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
    translateY?: number
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
    // Bar Chart Specific Properties
    groupMode?: 'grouped' | 'stacked'
    layout?: 'horizontal' | 'vertical'
    padding?: number
    innerPadding?: number
    barColor?: string
    
    // Container Glass Effect & Modern Styles (Props do fundo/container do chart)
    containerBackground?: string           // background (gradients, rgba, solid colors)
    containerOpacity?: number             // opacity (0-1)
    containerBackdropFilter?: string      // backdrop-filter (blur, saturate, etc)
    containerFilter?: string              // filter (brightness, contrast, etc)
    containerBoxShadow?: string           // box-shadow (shadows, glow effects)
    containerBorder?: string              // border (solid, gradient borders)
    containerTransform?: string           // transform (scale, rotate, perspective)
    containerTransition?: string          // transition (animations, easing)
    
    // Bar Visual Effects - CSS Only
    barOpacity?: number
    barHoverOpacity?: number
    borderOpacity?: number
    
    // Bar CSS Filters
    barBrightness?: number
    barSaturate?: number
    barContrast?: number
    barBlur?: number
    barBoxShadow?: string
    
    // Hover CSS Effects
    hoverBrightness?: number
    hoverSaturate?: number
    hoverScale?: number
    hoverBlur?: number
    
    // CSS Transitions
    transitionDuration?: string
    transitionEasing?: string
    
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
    backgroundOpacity?: number
    backgroundGradient?: {
      enabled: boolean
      type: 'linear' | 'radial' | 'conic'
      direction: string
      startColor: string
      endColor: string
    }
    backdropFilter?: {
      enabled: boolean
      blur: number
    }

    // Container Border
    containerBorderWidth?: number
    containerBorderColor?: string
    containerBorderAccentColor?: string
    containerBorderRadius?: number
    containerBorderVariant?: 'smooth' | 'accent' | 'none'
    containerPadding?: number
    
    // Container Shadow
    containerShadowColor?: string
    containerShadowOpacity?: number
    containerShadowBlur?: number
    containerShadowOffsetX?: number
    containerShadowOffsetY?: number
  }
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  legends?: LegendConfig
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface BarChartStore {
  barCharts: BarChartConfig[]
}

// Load bar charts from localStorage on initialization
const loadBarChartsFromStorage = (): BarChartStore => {
  if (typeof window === 'undefined') return { barCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-bar-charts')
    return stored ? JSON.parse(stored) : { barCharts: [] }
  } catch {
    return { barCharts: [] }
  }
}

export const $barChartStore = atom<BarChartStore>(loadBarChartsFromStorage())

// Auto-save to localStorage whenever bar charts change
if (typeof window !== 'undefined') {
  $barChartStore.subscribe(store => {
    localStorage.setItem('cognito-bar-charts', JSON.stringify(store))
  })
}

// Selection management for bar charts
export const $selectedBarChartId = atom<string | null>(null)

// Computed store for selected bar chart
export const $selectedBarChart = computed([$barChartStore, $selectedBarChartId], (store, selectedId) => {
  if (!selectedId) return null
  return store.barCharts.find(chart => chart.id === selectedId) || null
})

// Computed store that converts BarChartConfig to DroppedWidget format
export const $barChartsAsDropped = computed([$barChartStore], (store) => {
  return store.barCharts.map(barChart => ({
    i: barChart.id,
    id: barChart.id,
    type: 'chart-bar' as const,
    name: barChart.name,
    icon: '📊',
    description: `Bar chart from ${barChart.bigqueryData.selectedTable}`,
    defaultWidth: 60,
    defaultHeight: 150,
    x: barChart.position.x,
    y: barChart.position.y,
    w: barChart.position.w,
    h: barChart.position.h,
    barChartConfig: barChart
  }))
})

export const barChartActions = {
  addBarChart: (config: Omit<BarChartConfig, 'id'>) => {
    const newChart: BarChartConfig = {
      ...config,
      id: `bar-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: [...currentState.barCharts, newChart]
    })

    return newChart
  },

  updateBarChart: (chartId: string, updates: Partial<BarChartConfig>) => {
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: currentState.barCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removeBarChart: (chartId: string) => {
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: currentState.barCharts.filter(chart => chart.id !== chartId)
    })
    
    // Clear selection if the removed chart was selected
    if ($selectedBarChartId.get() === chartId) {
      $selectedBarChartId.set(null)
    }
  },

  selectBarChart: (chartId: string | null) => {
    $selectedBarChartId.set(chartId)
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<BarChartBigQueryData>) => {
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: currentState.barCharts.map(chart =>
        chart.id === chartId 
          ? { 
              ...chart, 
              bigqueryData: { ...chart.bigqueryData, ...bigqueryData }
            } 
          : chart
      )
    })
  },

  generateBarChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
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

  executeBarChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $barChartStore.get()
    const chart = currentState.barCharts.find(c => c.id === chartId)
    
    if (!chart) return

    barChartActions.updateBigQueryData(chartId, { 
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

      barChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      barChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshBarChart: async (chartId: string) => {
    await barChartActions.executeBarChartQuery(chartId)
  },

  // Update layout (for react-grid-layout)
  updateBarChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    console.log('📐 Updating BarCharts layout for', layout.length, 'items')
    const currentState = $barChartStore.get()
    
    const updatedCharts = currentState.barCharts.map(chart => {
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
    
    $barChartStore.set({
      ...currentState,
      barCharts: updatedCharts
    })
  },

  // Clear all bar charts
  clearAll: () => {
    console.log('🗑️ Clearing all bar charts')
    $barChartStore.set({ barCharts: [] })
    $selectedBarChartId.set(null)
  }
}
