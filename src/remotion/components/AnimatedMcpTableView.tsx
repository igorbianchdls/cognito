import type { DataResultStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { DataResultView } from '@/products/plugin/web/src/views/DataResultView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpTableView({ data, startFrame = 0 }: { data: DataResultStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DataResultView data={data} />
    </McpMobileResultFrame>
  )
}
