import type { DataResultStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { DataResultView } from '@/assets/remotion/result-preview/views/DataResultView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpTableView({ data, startFrame = 0 }: { data: DataResultStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DataResultView data={data} />
    </McpMobileResultFrame>
  )
}
