import { publishSyncMessage } from '@/products/integracoes/cloud/src/lib/pubsub'
import type { SyncChunkPayload } from '@/products/integracoes/cloud/src/sync-engine/chunkTypes'

export async function enqueueNextChunk(input: SyncChunkPayload) {
  return publishSyncMessage({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    pipelineId: input.pipelineId,
    destinationId: input.destinationId,
    runId: input.runId,
    trigger: input.trigger,
    resources: [input.resource],
    mode: 'resource_chunk',
    resource: input.resource,
    cursor: input.cursor,
    pageSize: input.pageSize,
    requestedBy: input.requestedBy || 'sync-engine',
  })
}
