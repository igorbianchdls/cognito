import type { Connector } from '@/products/integracoes/connectors/base/Connector'
import type { ConnectorContext } from '@/products/integracoes/connectors/base/ConnectorContext'
import type { ConnectorRowBatch } from '@/products/integracoes/connectors/base/ConnectorResult'
import type { CloudIntegrationDestination } from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { writeRowsToDestination } from '@/products/integracoes/destinations/cloud/destinationWriterRegistry'
import { runNormalization } from '@/products/integracoes/datawarehouse/normalization/runNormalization'
import {
  readStats,
  withStats,
  withoutStats,
} from '@/products/integracoes/cloud/src/sync-engine/checkpointStore'
import type {
  SyncChunkPayload,
  SyncChunkResult,
} from '@/products/integracoes/cloud/src/sync-engine/chunkTypes'

function normalizeRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)))
}

function aggregateStatus(current: 'success' | 'warning' | 'error', next: string): 'success' | 'warning' | 'error' {
  if (current === 'error' || next === 'error') return 'error'
  if (current === 'warning' || next === 'warning') return 'warning'
  return 'success'
}

function batchesFor(resource: string, result: { batches?: ConnectorRowBatch[], rows?: Record<string, unknown>[] }) {
  return result.batches?.length
    ? result.batches
    : [{
        resource,
        rows: normalizeRows(result.rows),
      }]
}

export async function processSyncChunk(input: {
  payload: SyncChunkPayload
  connector: Connector
  context: ConnectorContext
  destination: CloudIntegrationDestination
}): Promise<SyncChunkResult> {
  if (!input.connector.fetchChunk) {
    throw new Error(`Connector ${input.context.provider} nao implementa fetchChunk.`)
  }

  const result = await input.connector.fetchChunk(input.context, input.payload.resource, {
    cursor: withoutStats(input.payload.cursor),
    pageSize: input.payload.pageSize,
  })

  let rowsWritten = 0
  let normalizedRowsWritten = 0
  const normalizationWarnings: string[] = []
  let status: 'success' | 'warning' | 'error' = result.status

  for (const batch of batchesFor(input.payload.resource, result)) {
    const batchRows = normalizeRows(batch.rows)
    const batchResource = batch.resource || input.payload.resource
    const sourceTable = `${input.context.provider}_${batchResource}`
    const write = await writeRowsToDestination({
      tenantId: input.payload.tenantId,
      connectionId: input.payload.connectionId,
      pipelineId: input.payload.pipelineId || null,
      destination: input.destination,
      provider: input.context.provider,
      resource: batchResource,
      runId: input.payload.runId,
      table: sourceTable,
      rows: batchRows,
    })
    rowsWritten += write.insertedRows

    try {
      const normalized = await runNormalization({
        tenantId: input.payload.tenantId,
        connectionId: input.payload.connectionId,
        provider: input.context.provider,
        resource: batchResource,
        runId: input.payload.runId,
        sourceTable,
        rows: batchRows,
      })
      normalizedRowsWritten += normalized.write?.insertedRows || 0
    } catch (error) {
      normalizationWarnings.push(error instanceof Error ? error.message : String(error))
      status = aggregateStatus(status, 'warning')
    }
  }

  const previousStats = readStats(input.payload.cursor)
  const stats = {
    recordsIn: previousStats.recordsIn + result.recordsIn,
    recordsUpdated: previousStats.recordsUpdated + (result.recordsUpdated || rowsWritten),
    recordsFailed: previousStats.recordsFailed + result.recordsFailed,
    chunksProcessed: previousStats.chunksProcessed + 1,
  }

  const nextCursor = result.nextCursor
    ? withStats(result.nextCursor, stats)
    : undefined

  return {
    ...stats,
    done: result.done,
    status,
    nextCursor,
    rowsWritten,
    normalizedRowsWritten,
    normalizationWarnings,
  }
}
