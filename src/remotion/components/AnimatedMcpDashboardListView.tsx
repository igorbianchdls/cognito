import type { DashboardListStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { DashboardListView } from '@/products/plugin/web/src/views/DashboardListView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDashboardListView({ data, startFrame = 0 }: { data: DashboardListStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DashboardListView data={data} />
    </McpMobileResultFrame>
  )
}
