import type { ChartResultStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { ChartResultView } from '@/products/plugin/web/src/views/ChartResultView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpChartView({ data, startFrame = 0 }: { data: ChartResultStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <ChartResultView data={data} />
    </McpMobileResultFrame>
  )
}
