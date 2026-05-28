import type { DataCatalogStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { DataCatalogView } from '@/products/mcp-apps/web/src/views/DataCatalogView'
import { McpMobileResultFrame } from '@/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDataCatalogView({ data, startFrame = 0 }: { data: DataCatalogStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DataCatalogView data={data} />
    </McpMobileResultFrame>
  )
}
