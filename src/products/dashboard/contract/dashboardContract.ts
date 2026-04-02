'use client'

import { DASHBOARD_CHART_PALETTE_OPTIONS } from '@/products/dashboard/workspace/chartPalettes'

export const DASHBOARD_SUPPORTED_COMPONENTS = [
  'DashboardTemplate',
  'Theme',
  'Dashboard',
  'Card',
  'Tabs',
  'Tab',
  'TabPanel',
  'Query',
  'Chart',
  'BarChart',
  'LineChart',
  'PieChart',
  'HorizontalBarChart',
  'ScatterChart',
  'RadarChart',
  'TreemapChart',
  'ComposedChart',
  'FunnelChart',
  'SankeyChart',
  'Gauge',
  'KPI',
  'Table',
  'PivotTable',
  'Filter',
  'Select',
  'OptionList',
  'DatePicker',
  'Insights',
  'Text',
  'TextNode',
  'Br',
] as const

export const DASHBOARD_SUPPORTED_COMPONENT_SET = new Set<string>(DASHBOARD_SUPPORTED_COMPONENTS)

export const DASHBOARD_SUPPORTED_HTML_TAGS = [
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'p',
  'span',
  'strong',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
] as const

export const DASHBOARD_SUPPORTED_HTML_TAG_SET = new Set<string>(DASHBOARD_SUPPORTED_HTML_TAGS)

export const DASHBOARD_SUPPORTED_CHART_TYPES = [
  'bar',
  'line',
  'pie',
  'horizontal-bar',
  'scatter',
  'radar',
  'treemap',
  'composed',
  'funnel',
  'sankey',
  'gauge',
] as const

export const DASHBOARD_SUPPORTED_CHART_TYPE_SET = new Set<string>(DASHBOARD_SUPPORTED_CHART_TYPES)

export const DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS = [
  '7d',
  '14d',
  '30d',
  '90d',
  'month',
  'quarter',
] as const

export const DASHBOARD_SUPPORTED_DATE_PICKER_PRESET_SET = new Set<string>(DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS)

export const DASHBOARD_SUPPORTED_CHART_PALETTES = DASHBOARD_CHART_PALETTE_OPTIONS.map((option) => option.value) as string[]

export const DASHBOARD_SUPPORTED_CHART_PALETTE_SET = new Set<string>(DASHBOARD_SUPPORTED_CHART_PALETTES)

export const DASHBOARD_DEFAULT_CHART_PALETTE = DASHBOARD_CHART_PALETTE_OPTIONS[0]?.value || 'teal'

export function resolveDashboardChartPaletteColors(input: unknown): string[] {
  const normalized = String(input || '')
    .trim()
    .toLowerCase()
  const matched = DASHBOARD_CHART_PALETTE_OPTIONS.find((option) => option.value === normalized)
  return [...(matched?.colors || DASHBOARD_CHART_PALETTE_OPTIONS[0]?.colors || [])]
}

export function normalizeDashboardChartType(input: unknown): string {
  const raw = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
  if (raw === 'barchart') return 'bar'
  if (raw === 'linechart') return 'line'
  if (raw === 'piechart') return 'pie'
  if (raw === 'horizontalbar' || raw === 'horizontal-bar') return 'horizontal-bar'
  if (raw === 'horizontalbarchart' || raw === 'horizontal-bar-chart') return 'horizontal-bar'
  if (raw === 'scatterchart') return 'scatter'
  if (raw === 'radarchart') return 'radar'
  if (raw === 'treemapchart') return 'treemap'
  if (raw === 'composedchart') return 'composed'
  if (raw === 'funnelchart') return 'funnel'
  if (raw === 'sankeychart') return 'sankey'
  if (raw === 'gaugechart') return 'gauge'
  return raw
}
