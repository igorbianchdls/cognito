import type { TableStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { TableResultView } from '@/products/plugin/web/src/views/TableResultView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDreView({ data, startFrame = 0 }: { data: TableStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <TableResultView data={data} />
    </McpMobileResultFrame>
  )
}
