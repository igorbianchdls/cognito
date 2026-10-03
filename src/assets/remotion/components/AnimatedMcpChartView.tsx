import type { ChartResultStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { ChartResultView } from '@/assets/remotion/result-preview/views/ChartResultView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpChartView({ data, startFrame = 0 }: { data: ChartResultStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <ChartResultView data={data} />
    </McpMobileResultFrame>
  )
}
