import type { AutomationStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { AutomationView } from '@/assets/remotion/result-preview/views/AutomationView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpAutomationView({ data, startFrame = 0 }: { data: AutomationStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <AutomationView data={data} />
    </McpMobileResultFrame>
  )
}
