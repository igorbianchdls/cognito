import type { ConnectorsStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { ConnectorsView } from '@/products/mcp-apps/web/src/views/ConnectorsView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpConnectorsView({ data, startFrame = 0 }: { data: ConnectorsStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <ConnectorsView data={data} />
    </McpMobileResultFrame>
  )
}
