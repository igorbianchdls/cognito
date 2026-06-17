import type { DataCatalogStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import { DataCatalogView } from '@/products/plugin/web/src/views/DataCatalogView'
import { McpMobileResultFrame } from '@/assets/remotion/components/McpMobileResultFrame'

export function AnimatedMcpDataCatalogView({ data, startFrame = 0 }: { data: DataCatalogStructuredContent; startFrame?: number }) {
  return (
    <McpMobileResultFrame startFrame={startFrame}>
      <DataCatalogView data={data} />
    </McpMobileResultFrame>
  )
}
