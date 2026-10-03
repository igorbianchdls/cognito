import type { DataCatalogStructuredContent } from '@/assets/remotion/result-preview/types/toolResult'
import { DataCatalogView } from '@/assets/remotion/result-preview/views/DataCatalogView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDataCatalogView({ data, startFrame = 0 }: { data: DataCatalogStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DataCatalogView data={data} />
    </McpMobileResultFrame>
  )
}
