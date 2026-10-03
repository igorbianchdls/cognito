import type { AnalysisStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { AnalysisView } from '@/assets/remotion/result-preview/views/AnalysisView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpAnalysisView({ data, startFrame = 0 }: { data: AnalysisStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <AnalysisView data={data} />
    </McpMobileResultFrame>
  )
}
