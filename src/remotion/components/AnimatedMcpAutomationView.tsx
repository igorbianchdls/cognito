import type { AutomationStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { AutomationView } from '@/products/mcp-apps/web/src/views/AutomationView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpAutomationView({ data, startFrame = 0 }: { data: AutomationStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <AutomationView data={data} />
    </McpMobileResultFrame>
  )
}
