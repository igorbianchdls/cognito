import { atom, computed } from 'nanostores'
import type { LegendConfig } from '@/types/apps/chartWidgets'

export interface BigQueryField {
  name: string
  type: string
  mode?: string
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface RadialStackedChartBigQueryData {
  query: string
  selectedTable: string | null
  columns: {
    // For 'measures' mode: two yAxis measures
    yAxis?: BigQueryField[]
    // For 'series' mode
    series?: BigQueryField[]
    xAxis?: BigQueryField[]
    filters: BigQueryField[]
  }
  data: Record<string, unknown>[] | null
  lastExecuted: Date | null
  isLoading: boolean
  error: string | null
}

export type RadialStackedMode = 'measures' | 'series'

export interface RadialStackedChartConfig {
  id: string
  name: string
  chartType: 'radial-stacked'
  mode: RadialStackedMode
  keys: string[] // stacked keys expected by component
  bigqueryData: RadialStackedChartBigQueryData
  styling: {
    // Chart geometry
    startAngle?: number
    endAngle?: number
    innerRadius?: number
    outerRadius?: number
    cornerRadius?: number
    stackId?: string

    // Title/Subtitle
    title?: string
    subtitle?: string
    titleFontFamily?: string
    titleFontSize?: number
    titleFontWeight?: number
    titleColor?: string
    subtitleFontFamily?: string
    subtitleFontSize?: number
    subtitleFontWeight?: number
    subtitleColor?: string

    // Container visual styles
    containerClassName?: string
    containerBackground?: string
    backgroundColor?: string
    backgroundOpacity?: number
    backgroundGradient?: {
      enabled: boolean
      type: 'linear' | 'radial' | 'conic'
      direction: string
      startColor: string
      endColor: string
    }
    backdropFilter?: { enabled: boolean; blur: number }
    containerOpacity?: number
    containerBackdropFilter?: string
    containerFilter?: string
    containerBoxShadow?: string
    containerBorder?: string
    containerTransform?: string
    containerTransition?: string

    // Border
    containerBorderWidth?: number
    containerBorderColor?: string
    containerBorderAccentColor?: string
    containerBorderRadius?: number
    containerBorderVariant?: 'smooth' | 'accent' | 'none'
    containerPadding?: number

    // Shadow
    containerShadowColor?: string
    containerShadowOpacity?: number
    containerShadowBlur?: number
    containerShadowOffsetX?: number
    containerShadowOffsetY?: number
  }
  legends?: LegendConfig
  position: { x: number; y: number; w: number; h: number }
}

export interface RadialStackedChartStore {
  radialStackedCharts: RadialStackedChartConfig[]
}

const loadFromStorage = (): RadialStackedChartStore => {
  if (typeof window === 'undefined') return { radialStackedCharts: [] }
  try {
    const stored = localStorage.getItem('cognito-radial-stacked-charts')
    return stored ? JSON.parse(stored) : { radialStackedCharts: [] }
  } catch {
    return { radialStackedCharts: [] }
  }
}

export const $radialStackedChartStore = atom<RadialStackedChartStore>(loadFromStorage())

if (typeof window !== 'undefined') {
  $radialStackedChartStore.subscribe(store => {
    localStorage.setItem('cognito-radial-stacked-charts', JSON.stringify(store))
  })
}

export const $selectedRadialStackedChartId = atom<string | null>(null)
export const $selectedRadialStackedChart = computed([$radialStackedChartStore, $selectedRadialStackedChartId], (store, id) => {
  if (!id) return null
  return store.radialStackedCharts.find(c => c.id === id) || null
})

export const $radialStackedChartsAsDropped = computed([$radialStackedChartStore], (store) => {
  return store.radialStackedCharts.map(chart => ({
    i: chart.id,
    id: chart.id,
    type: 'chart-radial-stacked' as const,
    name: chart.name,
    icon: '🧭',
    description: `Radial stacked chart from ${chart.bigqueryData.selectedTable}`,
    defaultWidth: 60,
    defaultHeight: 150,
    x: chart.position.x,
    y: chart.position.y,
    w: chart.position.w,
    h: chart.position.h,
    radialStackedChartConfig: chart
  }))
})

export const radialStackedChartActions = {
  addRadialStackedChart: (config: Omit<RadialStackedChartConfig, 'id'>) => {
    const newChart: RadialStackedChartConfig = {
      ...config,
      id: `radial-stacked-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    const current = $radialStackedChartStore.get()
    $radialStackedChartStore.set({ ...current, radialStackedCharts: [...current.radialStackedCharts, newChart] })
    return newChart
  },

  updateRadialStackedChart: (chartId: string, updates: Partial<RadialStackedChartConfig>) => {
    const current = $radialStackedChartStore.get()
    $radialStackedChartStore.set({
      ...current,
      radialStackedCharts: current.radialStackedCharts.map(c => c.id === chartId ? { ...c, ...updates } : c)
    })
  },

  removeRadialStackedChart: (chartId: string) => {
    const current = $radialStackedChartStore.get()
    $radialStackedChartStore.set({
      ...current,
      radialStackedCharts: current.radialStackedCharts.filter(c => c.id !== chartId)
    })
    if ($selectedRadialStackedChartId.get() === chartId) $selectedRadialStackedChartId.set(null)
  },

  selectRadialStackedChart: (chartId: string | null) => {
    $selectedRadialStackedChartId.set(chartId)
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<RadialStackedChartBigQueryData>) => {
    const current = $radialStackedChartStore.get()
    $radialStackedChartStore.set({
      ...current,
      radialStackedCharts: current.radialStackedCharts.map(chart => chart.id === chartId ? { ...chart, bigqueryData: { ...chart.bigqueryData, ...bigqueryData } } : chart)
    })
  },

  // Query helpers
  generateMeasuresQuery: (tableName: string, valueField: string, targetField: string, schema = 'vendas', filters: BigQueryField[] = [], aggregation: BigQueryField['aggregation'] = 'SUM') => {
    const qualified = `"${schema}"."${tableName}"`
    const where = filters.length > 0 ? ` WHERE ${filters.map(f => `"${f.name}" IS NOT NULL`).join(' AND ')}` : ''
    return `SELECT ${aggregation}("${valueField}") as value, ${aggregation}("${targetField}") as target FROM ${qualified}${where} LIMIT 1`
  },
  generateSeriesQuery: (tableName: string, seriesField: string, valueField: string, schema = 'vendas', filters: BigQueryField[] = [], aggregation: BigQueryField['aggregation'] = 'SUM') => {
    const qualified = `"${schema}"."${tableName}"`
    const where = filters.length > 0 ? ` WHERE ${filters.map(f => `"${f.name}" IS NOT NULL`).join(' AND ')}` : ''
    return `SELECT "${seriesField}" as serie, ${aggregation}("${valueField}") as value FROM ${qualified}${where} GROUP BY "${seriesField}" ORDER BY value DESC LIMIT 5`
  },

  executeRadialStackedQuery: async (chartId: string): Promise<void> => {
    const current = $radialStackedChartStore.get()
    const chart = current.radialStackedCharts.find(c => c.id === chartId)
    if (!chart) return
    radialStackedChartActions.updateBigQueryData(chartId, { isLoading: true, error: null })
    try {
      const response = await fetch('/api/bigquery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'execute', query: chart.bigqueryData.query }) })
      if (!response.ok) throw new Error(`Query failed: ${response.statusText}`)
      const data = await response.json()
      radialStackedChartActions.updateBigQueryData(chartId, { data: data.rows || [], lastExecuted: new Date(), isLoading: false, error: null })
    } catch (error) {
      radialStackedChartActions.updateBigQueryData(chartId, { isLoading: false, error: error instanceof Error ? error.message : 'Unknown error occurred' })
    }
  },

  refreshRadialStackedChart: async (chartId: string) => {
    await radialStackedChartActions.executeRadialStackedQuery(chartId)
  },

  updateRadialStackedChartsLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    const current = $radialStackedChartStore.get()
    const updated = current.radialStackedCharts.map(chart => {
      const l = layout.find(li => li.i === chart.id)
      if (l) return { ...chart, position: { x: l.x, y: l.y, w: l.w, h: l.h } }
      return chart
    })
    $radialStackedChartStore.set({ ...current, radialStackedCharts: updated })
  }
}

