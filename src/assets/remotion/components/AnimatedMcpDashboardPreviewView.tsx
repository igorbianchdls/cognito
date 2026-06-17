import type { DashboardPreviewStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { DashboardPreviewView } from '@/products/plugin/web/src/views/DashboardPreviewView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDashboardPreviewView({ data, startFrame = 0 }: { data: DashboardPreviewStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DashboardPreviewView data={data} />
    </McpMobileResultFrame>
  )
}
