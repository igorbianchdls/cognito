import type { AnalysisStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { AnalysisView } from '@/products/plugin/web/src/views/AnalysisView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpAnalysisView({ data, startFrame = 0 }: { data: AnalysisStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <AnalysisView data={data} />
    </McpMobileResultFrame>
  )
}
