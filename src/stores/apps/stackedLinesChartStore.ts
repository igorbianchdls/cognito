import { atom, computed } from 'nanostores'
import type { LegendConfig } from '@/types/apps/chartWidgets'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface StackedLinesChartBigQueryData {
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

export interface StackedLinesChartConfig {
  id: string
  name: string
  bigqueryData: StackedLinesChartBigQueryData
  chartType: 'stacked-lines'
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

    // Typography - Title/Subtitle
    titleFontFamily?: string
    titleFontSize?: number
    titleFontWeight?: number
    titleColor?: string
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

    // Tailwind Classes - Title/Subtitle
    titleClassName?: string
    subtitleClassName?: string
    containerClassName?: string

    xAxisTitle?: string
    yAxisTitle?: string
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
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

    // Line specific
    lineWidth?: number
    enablePoints?: boolean
    pointSize?: number
    curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
    enableArea?: boolean
    areaOpacity?: number
    
    // Typography - Axis
    axisFontFamily?: string
    axisFontSize?: number
    axisFontWeight?: number
    axisTextColor?: string
    axisLegendFontSize?: number
    axisLegendFontWeight?: number
    
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

    // Container visual effects
    containerBackground?: string
    containerOpacity?: number
    containerBackdropFilter?: string
    containerBoxShadow?: string

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

export interface StackedLinesChartStore {
  stackedLinesCharts: StackedLinesChartConfig[]
}

const loadFromStorage = (): StackedLinesChartStore => {
  if (typeof window === 'undefined') return { stackedLinesCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-stacked-lines-charts')
    return stored ? JSON.parse(stored) : { stackedLinesCharts: [] }
  } catch {
    return { stackedLinesCharts: [] }
  }
}

export const $stackedLinesChartStore = atom<StackedLinesChartStore>(loadFromStorage())

if (typeof window !== 'undefined') {
  $stackedLinesChartStore.subscribe(store => {
    localStorage.setItem('cognito-stacked-lines-charts', JSON.stringify(store))
  })
}

export const $selectedStackedLinesChartId = atom<string | null>(null)
export const $selectedStackedLinesChart = computed([$stackedLinesChartStore, $selectedStackedLinesChartId], (store, id) => {
  if (!id) return null
  return store.stackedLinesCharts.find(c => c.id === id) || null
})

export const $stackedLinesChartsAsDropped = computed([$stackedLinesChartStore], (store) => {
  return store.stackedLinesCharts.map(chart => ({
    i: chart.id,
    id: chart.id,
    type: 'chart-stacked-lines' as const,
    name: chart.name,
    icon: '📈',
    description: `Stacked lines chart from ${chart.bigqueryData.selectedTable}`,
    defaultWidth: 60,
    defaultHeight: 150,
    x: chart.position.x,
    y: chart.position.y,
    w: chart.position.w,
    h: chart.position.h,
    stackedLinesChartConfig: chart
  }))
})

export const stackedLinesChartActions = {
  addStackedLinesChart: (config: Omit<StackedLinesChartConfig, 'id'>) => {
    const newChart: StackedLinesChartConfig = {
      ...config,
      id: `stacked-lines-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    const current = $stackedLinesChartStore.get()
    $stackedLinesChartStore.set({ ...current, stackedLinesCharts: [...current.stackedLinesCharts, newChart] })
    return newChart
  },

  updateStackedLinesChart: (chartId: string, updates: Partial<StackedLinesChartConfig>) => {
    const current = $stackedLinesChartStore.get()
    $stackedLinesChartStore.set({
      ...current,
      stackedLinesCharts: current.stackedLinesCharts.map(c => c.id === chartId ? { ...c, ...updates } : c)
    })
  },

  removeStackedLinesChart: (chartId: string) => {
    const current = $stackedLinesChartStore.get()
    $stackedLinesChartStore.set({
      ...current,
      stackedLinesCharts: current.stackedLinesCharts.filter(c => c.id !== chartId)
    })
    if ($selectedStackedLinesChartId.get() === chartId) $selectedStackedLinesChartId.set(null)
  },

  selectStackedLinesChart: (chartId: string | null) => {
    $selectedStackedLinesChartId.set(chartId)
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<StackedLinesChartBigQueryData>) => {
    const current = $stackedLinesChartStore.get()
    $stackedLinesChartStore.set({
      ...current,
      stackedLinesCharts: current.stackedLinesCharts.map(chart => chart.id === chartId ? { ...chart, bigqueryData: { ...chart.bigqueryData, ...bigqueryData } } : chart)
    })
  },

  generateStackedLinesChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
    let query = `SELECT `
    const selectFields: string[] = []
    xAxis.forEach(f => selectFields.push(f.name))
    yAxis.forEach(field => {
      if (field.aggregation && field.aggregation !== 'COUNT') selectFields.push(`${field.aggregation}(${field.name}) as ${field.name}`)
      else if (field.aggregation === 'COUNT') selectFields.push(`COUNT(*) as ${field.name}`)
      else selectFields.push(field.name)
    })
    query += selectFields.join(', ')
    query += ` FROM \`creatto-463117.biquery_data.${tableName}\``
    if (filters.length > 0) {
      const whereCond = filters.map(fl => `${fl.name} IS NOT NULL`).join(' AND ')
      query += ` WHERE ${whereCond}`
    }
    if (xAxis.length > 0) query += ` GROUP BY ${xAxis.map(f => f.name).join(', ')}`
    query += ` LIMIT 1000`
    return query
  },

  executeStackedLinesChartQuery: async (chartId: string): Promise<void> => {
    const current = $stackedLinesChartStore.get()
    const chart = current.stackedLinesCharts.find(c => c.id === chartId)
    if (!chart) return
    stackedLinesChartActions.updateBigQueryData(chartId, { isLoading: true, error: null })
    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', query: chart.bigqueryData.query })
      })
      if (!response.ok) throw new Error(`Query failed: ${response.statusText}`)
      const data = await response.json()
      stackedLinesChartActions.updateBigQueryData(chartId, { data: data.rows || [], lastExecuted: new Date(), isLoading: false, error: null })
    } catch (error) {
      stackedLinesChartActions.updateBigQueryData(chartId, { isLoading: false, error: error instanceof Error ? error.message : 'Unknown error occurred' })
    }
  },

  refreshStackedLinesChart: async (chartId: string) => {
    await stackedLinesChartActions.executeStackedLinesChartQuery(chartId)
  },

  updateStackedLinesChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    const current = $stackedLinesChartStore.get()
    const updated = current.stackedLinesCharts.map(chart => {
      const l = layout.find(li => li.i === chart.id)
      if (l) return { ...chart, position: { x: l.x, y: l.y, w: l.w, h: l.h } }
      return chart
    })
    $stackedLinesChartStore.set({ ...current, stackedLinesCharts: updated })
  }
}

