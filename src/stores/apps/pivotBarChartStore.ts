import { atom, computed } from 'nanostores'
import type { LegendConfig } from '@/types/apps/chartWidgets'

export type PivotMeasure = 'faturamento' | 'quantidade' | 'pedidos' | 'itens'

export interface PivotDataSource {
  schema?: string
  table: string
  dimension1: string
  dimension2?: string
  measure: PivotMeasure
  aggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
  limit?: number
}

export interface PivotSeriesMeta { key: string; label: string; color: string }

export interface PivotBarChartBigQueryData {
  query: string
  selectedTable: string | null
  data: { items: Array<Record<string, unknown>>; series: PivotSeriesMeta[] } | null
  lastExecuted: Date | null
  isLoading: boolean
  error: string | null
}

export interface PivotBarChartConfig {
  id: string
  name: string
  chartType: 'pivot-bar'
  dataSource: PivotDataSource
  styling: {
    layout?: 'vertical' | 'horizontal'
    groupMode?: 'grouped' | 'stacked'
    enableGridX?: boolean
    enableGridY?: boolean
    gridColor?: string
    gridStrokeWidth?: number
    // Axis & Body Typography (optional, align with other charts)
    axisFontFamily?: string
    axisFontSize?: number
    axisFontWeight?: number
    axisTextColor?: string
    axisLegendFontSize?: number
    axisLegendFontWeight?: number
    labelsFontFamily?: string
    labelsFontSize?: number
    labelsFontWeight?: number
    labelsTextColor?: string
    legendsFontFamily?: string
    legendsFontSize?: number
    legendsFontWeight?: number
    legendsTextColor?: string
    tooltipFontSize?: number
    tooltipFontFamily?: string
    // Title/Subtitle
    titleFontFamily?: string
    titleFontSize?: number
    titleFontWeight?: number
    titleColor?: string
    subtitleFontFamily?: string
    subtitleFontSize?: number
    subtitleFontWeight?: number
    subtitleColor?: string
    // Container
    containerBackground?: string
    containerOpacity?: number
    containerBackdropFilter?: string
    containerFilter?: string
    containerBoxShadow?: string
    containerBorder?: string
    containerTransform?: string
    containerTransition?: string
    containerBorderWidth?: number
    containerBorderColor?: string
    containerBorderAccentColor?: string
    containerBorderRadius?: number
    containerBorderVariant?: 'smooth' | 'accent' | 'none'
    containerPadding?: number
    // Bars
    borderRadius?: number
    borderWidth?: number
    borderColor?: string
    padding?: number
    innerPadding?: number
  }
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  legends?: LegendConfig
  position: { x: number; y: number; w: number; h: number }
  bigqueryData: PivotBarChartBigQueryData
}

export interface PivotBarChartStore { pivotBarCharts: PivotBarChartConfig[] }

const loadFromStorage = (): PivotBarChartStore => {
  if (typeof window === 'undefined') return { pivotBarCharts: [] }
  try {
    const raw = localStorage.getItem('cognito-pivot-bar-charts')
    return raw ? JSON.parse(raw) : { pivotBarCharts: [] }
  } catch { return { pivotBarCharts: [] } }
}

export const $pivotBarChartStore = atom<PivotBarChartStore>(loadFromStorage())
if (typeof window !== 'undefined') {
  $pivotBarChartStore.subscribe((s) => localStorage.setItem('cognito-pivot-bar-charts', JSON.stringify(s)))
}

export const $selectedPivotBarChartId = atom<string | null>(null)
export const $selectedPivotBarChart = computed([$pivotBarChartStore, $selectedPivotBarChartId], (s, id) => id ? (s.pivotBarCharts.find(c => c.id === id) || null) : null)

export const $pivotBarChartsAsDropped = computed([$pivotBarChartStore], (s) => s.pivotBarCharts.map(c => ({
  i: c.id, id: c.id, type: 'chart-pivot-bar' as const, name: c.name, icon: '📊', description: `Pivot bar chart from ${c.dataSource.table}`, defaultWidth: 60, defaultHeight: 150, x: c.position.x, y: c.position.y, w: c.position.w, h: c.position.h, pivotBarChartConfig: c
})))

export const pivotBarChartActions = {
  add: (config: Omit<PivotBarChartConfig, 'id'>) => {
    const c: PivotBarChartConfig = { ...config, id: `pivot-bar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
    const cur = $pivotBarChartStore.get()
    $pivotBarChartStore.set({ ...cur, pivotBarCharts: [...cur.pivotBarCharts, c] })
    return c
  },
  update: (id: string, updates: Partial<PivotBarChartConfig>) => {
    const cur = $pivotBarChartStore.get()
    $pivotBarChartStore.set({ ...cur, pivotBarCharts: cur.pivotBarCharts.map(c => c.id === id ? { ...c, ...updates } : c) })
  },
  remove: (id: string) => {
    const cur = $pivotBarChartStore.get()
    $pivotBarChartStore.set({ ...cur, pivotBarCharts: cur.pivotBarCharts.filter(c => c.id !== id) })
    if ($selectedPivotBarChartId.get() === id) $selectedPivotBarChartId.set(null)
  },
  select: (id: string | null) => $selectedPivotBarChartId.set(id),
  updateBigQuery: (id: string, data: Partial<PivotBarChartBigQueryData>) => {
    const cur = $pivotBarChartStore.get()
    $pivotBarChartStore.set({ ...cur, pivotBarCharts: cur.pivotBarCharts.map(c => c.id === id ? { ...c, bigqueryData: { ...c.bigqueryData, ...data } } : c) })
  },
  executeQuery: async (id: string): Promise<void> => {
    const cur = $pivotBarChartStore.get()
    const chart = cur.pivotBarCharts.find(c => c.id === id)
    if (!chart) return
    pivotBarChartActions.updateBigQuery(id, { isLoading: true, error: null })
    try {
      const response = await fetch('/api/dashboard-supabase/grouped', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chart.dataSource) })
      const json = await response.json()
      if (!json.success) throw new Error(json.error || 'Query failed')
      pivotBarChartActions.updateBigQuery(id, { data: { items: json.items, series: json.series }, lastExecuted: new Date(), isLoading: false })
    } catch (e) {
      pivotBarChartActions.updateBigQuery(id, { isLoading: false, error: e instanceof Error ? e.message : 'Unknown error' })
    }
  },
  refresh: async (id: string) => pivotBarChartActions.executeQuery(id),
  updateLayout: (layout: import('@/types/apps/droppedWidget').LayoutItem[]) => {
    const cur = $pivotBarChartStore.get()
    const updated = cur.pivotBarCharts.map(c => {
      const l = layout.find(li => li.i === c.id)
      return l ? { ...c, position: { x: l.x, y: l.y, w: l.w, h: l.h } } : c
    })
    $pivotBarChartStore.set({ ...cur, pivotBarCharts: updated })
  }
}
