import type { DashboardPreviewStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { DashboardPreviewView } from '@/assets/remotion/result-preview/views/DashboardPreviewView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDashboardPreviewView({ data, startFrame = 0 }: { data: DashboardPreviewStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DashboardPreviewView data={data} />
    </McpMobileResultFrame>
  )
}
