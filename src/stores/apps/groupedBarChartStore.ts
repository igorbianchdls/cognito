import { atom, computed } from 'nanostores'
import type { LegendConfig } from '@/types/apps/chartWidgets'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface GroupedBarChartBigQueryData {
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

export interface GroupedBarChartConfig {
  id: string
  name: string
  bigqueryData: GroupedBarChartBigQueryData
  chartType: 'grouped-bar'
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

    // Tailwind Classes
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
    groupMode?: 'grouped'
    layout?: 'horizontal' | 'vertical'
    padding?: number
    innerPadding?: number
    barColor?: string

    // Container Glass Effect & Modern Styles
    containerBackground?: string
    containerOpacity?: number
    containerBackdropFilter?: string
    containerFilter?: string
    containerBoxShadow?: string
    containerBorder?: string
    containerTransform?: string
    containerTransition?: string

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

export interface GroupedBarChartStore {
  groupedBarCharts: GroupedBarChartConfig[]
}

const loadFromStorage = (): GroupedBarChartStore => {
  if (typeof window === 'undefined') return { groupedBarCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-grouped-bar-charts')
    return stored ? JSON.parse(stored) : { groupedBarCharts: [] }
  } catch {
    return { groupedBarCharts: [] }
  }
}

export const $groupedBarChartStore = atom<GroupedBarChartStore>(loadFromStorage())

// Auto-save
if (typeof window !== 'undefined') {
  $groupedBarChartStore.subscribe(store => {
    localStorage.setItem('cognito-grouped-bar-charts', JSON.stringify(store))
  })
}

export const $selectedGroupedBarChartId = atom<string | null>(null)
export const $selectedGroupedBarChart = computed([$groupedBarChartStore, $selectedGroupedBarChartId], (store, id) => {
  if (!id) return null
  return store.groupedBarCharts.find(c => c.id === id) || null
})

export const $groupedBarChartsAsDropped = computed([$groupedBarChartStore], (store) => {
  return store.groupedBarCharts.map(chart => ({
    i: chart.id,
    id: chart.id,
    type: 'chart-grouped-bar' as const,
    name: chart.name,
    icon: '📊',
    description: `Grouped bar chart from ${chart.bigqueryData.selectedTable}`,
    defaultWidth: 60,
    defaultHeight: 150,
    x: chart.position.x,
    y: chart.position.y,
    w: chart.position.w,
    h: chart.position.h,
    groupedBarChartConfig: chart
  }))
})

export const groupedBarChartActions = {
  addGroupedBarChart: (config: Omit<GroupedBarChartConfig, 'id'>) => {
    const newChart: GroupedBarChartConfig = {
      ...config,
      id: `grouped-bar-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    const currentState = $groupedBarChartStore.get()
    $groupedBarChartStore.set({
      ...currentState,
      groupedBarCharts: [...currentState.groupedBarCharts, newChart]
    })
    return newChart
  },

  updateGroupedBarChart: (chartId: string, updates: Partial<GroupedBarChartConfig>) => {
    const currentState = $groupedBarChartStore.get()
    $groupedBarChartStore.set({
      ...currentState,
      groupedBarCharts: currentState.groupedBarCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removeGroupedBarChart: (chartId: string) => {
    const currentState = $groupedBarChartStore.get()
    $groupedBarChartStore.set({
      ...currentState,
      groupedBarCharts: currentState.groupedBarCharts.filter(chart => chart.id !== chartId)
    })
    if ($selectedGroupedBarChartId.get() === chartId) {
      $selectedGroupedBarChartId.set(null)
    }
  },

  selectGroupedBarChart: (chartId: string | null) => {
    $selectedGroupedBarChartId.set(chartId)
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<GroupedBarChartBigQueryData>) => {
    const currentState = $groupedBarChartStore.get()
    $groupedBarChartStore.set({
      ...currentState,
      groupedBarCharts: currentState.groupedBarCharts.map(chart =>
        chart.id === chartId
          ? { ...chart, bigqueryData: { ...chart.bigqueryData, ...bigqueryData } }
          : chart
      )
    })
  },

  generateGroupedBarChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
    let query = `SELECT `
    const selectFields: string[] = []

    xAxis.forEach(field => { selectFields.push(field.name) })

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

  executeGroupedBarChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $groupedBarChartStore.get()
    const chart = currentState.groupedBarCharts.find(c => c.id === chartId)
    if (!chart) return

    groupedBarChartActions.updateBigQueryData(chartId, { isLoading: true, error: null })
    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', query: chart.bigqueryData.query })
      })
      if (!response.ok) throw new Error(`Query failed: ${response.statusText}`)
      const data = await response.json()
      groupedBarChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      groupedBarChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshGroupedBarChart: async (chartId: string) => {
    await groupedBarChartActions.executeGroupedBarChartQuery(chartId)
  },

  updateGroupedBarChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    const currentState = $groupedBarChartStore.get()
    const updatedCharts = currentState.groupedBarCharts.map(chart => {
      const layoutItem = layout.find(l => l.i === chart.id)
      if (layoutItem) {
        return {
          ...chart,
          position: { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
        }
      }
      return chart
    })
    $groupedBarChartStore.set({ ...currentState, groupedBarCharts: updatedCharts })
  }
}

