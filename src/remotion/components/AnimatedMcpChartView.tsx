import type { ChartResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { ChartResultView } from '@/products/mcp-apps/web/src/views/ChartResultView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpChartView({ data, startFrame = 0 }: { data: ChartResultStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <ChartResultView data={data} />
    </McpMobileResultFrame>
  )
}
