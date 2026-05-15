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

export type DashboardStructuredContent =
  | DashboardListStructuredContent
  | DashboardPreviewStructuredContent
  | DataResultStructuredContent
