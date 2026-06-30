import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

export type SyncChunkMode = 'resource_chunk'

export type SyncCursor = Record<string, unknown>

export type SyncChunkPayload = {
  mode: SyncChunkMode
  tenantId: number
  connectionId: string
  pipelineId?: string
  destinationId?: string
  runId?: string
  trigger: IntegrationSyncTrigger
  resource: string
  cursor?: SyncCursor
  pageSize?: number
  requestedBy?: string
}

export type SyncChunkStats = {
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  chunksProcessed: number
}

export type SyncChunkResult = SyncChunkStats & {
  done: boolean
  status: 'success' | 'warning' | 'error'
  nextCursor?: SyncCursor
  normalizedRowsWritten: number
  rowsWritten: number
  normalizationWarnings: string[]
}
