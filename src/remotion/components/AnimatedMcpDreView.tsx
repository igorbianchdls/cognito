import type { TableStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { TableResultView } from '@/products/mcp-apps/web/src/views/TableResultView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDreView({ data, startFrame = 0 }: { data: TableStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <TableResultView data={data} />
    </McpMobileResultFrame>
  )
}
