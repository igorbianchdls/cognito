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

export type DashboardStructuredContent =
  | DashboardListStructuredContent
  | DashboardPreviewStructuredContent

