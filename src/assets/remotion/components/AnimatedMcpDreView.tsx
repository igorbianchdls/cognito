import type { TableStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { TableResultView } from '@/assets/remotion/result-preview/views/TableResultView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDreView({ data, startFrame = 0 }: { data: TableStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <TableResultView data={data} />
    </McpMobileResultFrame>
  )
}
