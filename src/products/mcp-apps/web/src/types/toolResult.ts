import type { DashboardListItem, DashboardPreview } from '@/products/mcp-apps/web/src/types/dashboard'

export type McpAppToolResult = {
  content?: unknown[]
  structuredContent?: unknown
  isError?: boolean
}

export type DashboardListStructuredContent = {
  ok?: boolean
  tool?: string
  view?: 'dashboard_list'
  title?: string
  dashboards?: DashboardListItem[]
}

export type DashboardPreviewStructuredContent = {
  ok?: boolean
  tool?: string
  view?: 'dashboard_preview'
  title?: string
  dashboard?: DashboardPreview
}

export type DataResultStructuredContent = {
  ok?: boolean
  tool?: 'erp' | 'erp_acoes' | 'crm' | 'sql' | 'sql_execution' | 'ecommerce' | 'marketing' | string
  view?: string
  title?: string
  action?: string
  resource?: string
  count?: number
  columns?: string[]
  rows?: unknown[]
  chart?: unknown
}

export type ChartFormat = 'currency' | 'number' | 'percent' | string

export type ChartTotal = {
  label?: string
  value?: number | string | null
  format?: ChartFormat
}

export type ChartConfig = {
  type?: 'donut' | 'horizontal_bar' | 'bar' | string
  labelField?: string
  xField?: string
  valueField?: string
  format?: ChartFormat
}

export type ChartResultStructuredContent = {
  ok?: boolean
  tool?: 'chart' | string
  view?: 'chart'
  title?: string
  subtitle?: string
  total?: ChartTotal
  chart?: ChartConfig
  rows?: unknown[]
}

export type DataCatalogStructuredContent = {
  ok?: boolean
  success?: boolean
  tool?: 'data_catalog' | string
  view?: 'data_catalog'
  action?: string
  domain?: string
  resource?: string
  title?: string
  subtitle?: string
  sources?: unknown[]
  resources?: unknown[]
  fields?: unknown[]
  relationships?: unknown[]
  quality?: unknown
  coverage?: unknown[]
  issues?: string[]
  recommendations?: string[]
  rows?: unknown[]
  columns?: string[]
  count?: number
}

export type AnalysisStructuredContent = {
  ok?: boolean
  tool?: 'analysis' | string
  view?: 'analysis'
  type?: string
  title?: string
  subtitle?: string | null
  summary?: string | null
  metrics?: unknown[]
  sections?: unknown[]
  next_steps?: string[]
}

export type TableStructuredContent = {
  ok?: boolean
  tool?: 'table' | string
  view?: 'table'
  title?: string
  subtitle?: string | null
  columns?: unknown[]
  rows?: unknown[]
  count?: number
}

export type AutomationStructuredContent = {
  ok?: boolean
  tool?: 'actions' | 'alerts' | 'schedules' | string
  view?: 'automation' | 'action_result'
  kind?: string
  action?: string
  title?: string
  subtitle?: string | null
  domain?: string
  dry_run?: boolean
  preview?: unknown
  result?: unknown
  rows?: unknown[]
  columns?: string[]
  count?: number
}

export type DashboardStructuredContent =
  | DashboardListStructuredContent
  | DashboardPreviewStructuredContent
  | ChartResultStructuredContent
  | DataCatalogStructuredContent
  | AnalysisStructuredContent
  | TableStructuredContent
  | AutomationStructuredContent
  | DataResultStructuredContent
