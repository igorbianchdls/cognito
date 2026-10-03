import type { DashboardListStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { DashboardListView } from '@/assets/remotion/result-preview/views/DashboardListView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDashboardListView({ data, startFrame = 0 }: { data: DashboardListStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DashboardListView data={data} />
    </McpMobileResultFrame>
  )
}
