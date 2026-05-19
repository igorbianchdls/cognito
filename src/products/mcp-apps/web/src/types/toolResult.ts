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

export type DashboardStructuredContent =
  | DashboardListStructuredContent
  | DashboardPreviewStructuredContent
  | ChartResultStructuredContent
  | DataCatalogStructuredContent
  | DataResultStructuredContent
