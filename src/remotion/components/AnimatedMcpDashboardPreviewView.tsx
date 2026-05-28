import type { DashboardPreviewStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { DashboardPreviewView } from '@/products/mcp-apps/web/src/views/DashboardPreviewView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDashboardPreviewView({ data, startFrame = 0 }: { data: DashboardPreviewStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DashboardPreviewView data={data} />
    </McpMobileResultFrame>
  )
}
