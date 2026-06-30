import { getCloudConnector } from '@/products/integracoes/connectors/registry/providerRegistry'
import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import {
  createIntegrationEvent,
  finishCloudSyncRun,
  getCloudIntegrationConnection,
  getCloudIntegrationDestination,
  getCloudIntegrationPipeline,
  startCloudSyncRun,
  type CloudIntegrationDestination,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { buildTenantBigQueryDestinationConfig } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'
import { enqueueNextChunk } from '@/products/integracoes/cloud/src/sync-engine/chunkQueue'
import { processSyncChunk } from '@/products/integracoes/cloud/src/sync-engine/orchestrator'
import { readCheckpoint, withStats, writeCheckpoint } from '@/products/integracoes/cloud/src/sync-engine/checkpointStore'
import type { SyncChunkPayload } from '@/products/integracoes/cloud/src/sync-engine/chunkTypes'

export type RunSyncChunkJobOutput = {
  ok: boolean
  mode: 'gcp_worker'
  chunkMode: 'resource_chunk'
  connectionId: string
  pipelineId?: string | null
  destinationId?: string | null
  runId: string
  provider: string
  resources: string[]
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  status: 'success' | 'warning' | 'error'
  message: string
}

function defaultBigQueryDestination(tenantId: number): CloudIntegrationDestination {
  return {
    id: 'default-bigquery',
    tenantId,
    type: 'bigquery',
    name: 'BigQuery padrao',
    status: 'active',
    config: buildTenantBigQueryDestinationConfig(tenantId, {}, process.env.GCP_PROJECT_ID || 'creatto-463117'),
    secretRef: null,
    metadata: { implicit: true },
  }
}

function parseCredentials(value: string | null): Record<string, unknown> | string | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : value
  } catch {
    return value
  }
}

export async function runSyncChunkJob(input: SyncChunkPayload): Promise<RunSyncChunkJobOutput> {
  const pipeline = input.pipelineId
    ? await getCloudIntegrationPipeline({
      tenantId: input.tenantId,
      pipelineId: input.pipelineId,
    })
    : null
  if (input.pipelineId && !pipeline) {
    throw new Error(`Pipeline ${input.pipelineId} nao encontrado para tenant ${input.tenantId}`)
  }

  const connectionId = pipeline?.sourceConnectionId || input.connectionId
  const connection = await getCloudIntegrationConnection({
    tenantId: input.tenantId,
    connectionId,
  })
  if (!connection) {
    throw new Error(`Conexao ${connectionId} nao encontrada para tenant ${input.tenantId}`)
  }

  const destinationId = pipeline?.destinationId || input.destinationId
  const destination = destinationId
    ? await getCloudIntegrationDestination({
      tenantId: input.tenantId,
      destinationId,
    })
    : defaultBigQueryDestination(input.tenantId)
  if (!destination) {
    throw new Error(`Destino ${destinationId} nao encontrado para tenant ${input.tenantId}`)
  }
  if (destination.status !== 'active') {
    throw new Error(`Destino ${destination.id} esta com status ${destination.status}`)
  }

  const connector = getCloudConnector(connection.provider)
  if (!connector) {
    throw new Error(`Connector cloud nao registrado para provider ${connection.provider}`)
  }

  const run = await startCloudSyncRun({
    tenantId: input.tenantId,
    connectionId: connection.id,
    pipelineId: pipeline?.id || null,
    destinationId: destination.id === 'default-bigquery' ? null : destination.id,
    runId: input.runId,
    trigger: input.trigger,
    resources: [input.resource],
    requestedBy: input.requestedBy,
  })

  if (!['running', 'queued', 'already_running'].includes(run.status)) {
    const status = run.status === 'success' || run.status === 'warning' ? run.status : 'error'
    return {
      ok: status !== 'error',
      mode: 'gcp_worker',
      chunkMode: 'resource_chunk',
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      provider: connection.provider,
      resources: [input.resource],
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      status,
      message: 'Run ja estava finalizada; chunk ignorado.',
    }
  }

  const cursor = input.cursor || await readCheckpoint({
    tenantId: input.tenantId,
    connectionId: connection.id,
    resource: input.resource,
    cursorKey: run.id,
  })

  await createIntegrationEvent({
    tenantId: input.tenantId,
    connectionId: connection.id,
    eventType: 'sync.resource.chunk_started',
    actor: 'integrations-worker',
    message: `Chunk do recurso ${input.resource} iniciado.`,
    metadata: {
      runId: run.id,
      resource: input.resource,
      cursor: cursor || null,
      pageSize: input.pageSize || null,
      provider: connection.provider,
    },
  })

  try {
    const rawCredentials = parseCredentials(connection.secretRef ? await readSecret(connection.secretRef) : null)
    const credentials = await refreshOAuthCredentialsIfNeeded({
      tenantId: input.tenantId,
      connectionId: connection.id,
      provider: connection.provider,
      credentials: rawCredentials,
    })
    const chunk = await processSyncChunk({
      payload: {
        ...input,
        connectionId: connection.id,
        pipelineId: pipeline?.id || input.pipelineId,
        destinationId: destination.id === 'default-bigquery' ? undefined : destination.id,
        runId: run.id,
        cursor,
      },
      connector,
      context: {
        tenantId: input.tenantId,
        connectionId: connection.id,
        provider: connection.provider,
        secretRef: connection.secretRef,
        credentials,
        selectedResources: connection.selectedResources,
        cursor,
        metadata: connection.metadata,
      },
      destination,
    })

    await createIntegrationEvent({
      tenantId: input.tenantId,
      connectionId: connection.id,
      eventType: 'sync.resource.chunk_completed',
      severity: chunk.status === 'error' ? 'error' : chunk.status === 'warning' ? 'warning' : 'info',
      actor: 'integrations-worker',
      message: `Chunk do recurso ${input.resource} concluido.`,
      metadata: {
        runId: run.id,
        resource: input.resource,
        done: chunk.done,
        recordsIn: chunk.recordsIn,
        recordsUpdated: chunk.recordsUpdated,
        recordsFailed: chunk.recordsFailed,
        rowsWritten: chunk.rowsWritten,
        normalizedRowsWritten: chunk.normalizedRowsWritten,
        normalizationWarnings: chunk.normalizationWarnings,
        nextCursor: chunk.nextCursor || null,
      },
    })

    if (chunk.nextCursor && !chunk.done) {
      await enqueueNextChunk({
        ...input,
        connectionId: connection.id,
        pipelineId: pipeline?.id || input.pipelineId,
        destinationId: destination.id === 'default-bigquery' ? undefined : destination.id,
        runId: run.id,
        cursor: chunk.nextCursor,
      })

      await writeCheckpoint({
        tenantId: input.tenantId,
        connectionId: connection.id,
        resource: input.resource,
        cursor: chunk.nextCursor,
        cursorKey: run.id,
      })

      return {
        ok: chunk.status !== 'error',
        mode: 'gcp_worker',
        chunkMode: 'resource_chunk',
        connectionId: connection.id,
        pipelineId: pipeline?.id || null,
        destinationId: destination.id === 'default-bigquery' ? null : destination.id,
        runId: run.id,
        provider: connection.provider,
        resources: [input.resource],
        recordsIn: chunk.recordsIn,
        recordsUpdated: chunk.recordsUpdated,
        recordsFailed: chunk.recordsFailed,
        status: chunk.status,
        message: 'Chunk processado; proximo chunk enfileirado.',
      }
    }

    await writeCheckpoint({
      tenantId: input.tenantId,
      connectionId: connection.id,
      resource: input.resource,
      cursorKey: run.id,
      cursor: withStats({
        done: true,
        completedAt: new Date().toISOString(),
      }, {
        recordsIn: chunk.recordsIn,
        recordsUpdated: chunk.recordsUpdated,
        recordsFailed: chunk.recordsFailed,
        chunksProcessed: chunk.chunksProcessed,
      }),
    })

    await finishCloudSyncRun({
      tenantId: input.tenantId,
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      status: chunk.status,
      recordsIn: chunk.recordsIn,
      recordsUpdated: chunk.recordsUpdated,
      recordsFailed: chunk.recordsFailed,
      metadata: {
        chunked: true,
        resources: [{
          resource: input.resource,
          status: chunk.status,
          recordsIn: chunk.recordsIn,
          recordsUpdated: chunk.recordsUpdated,
          recordsFailed: chunk.recordsFailed,
          rowsWritten: chunk.rowsWritten,
          normalizedRowsWritten: chunk.normalizedRowsWritten,
          normalizationWarnings: chunk.normalizationWarnings,
        }],
      },
    })

    return {
      ok: chunk.status !== 'error',
      mode: 'gcp_worker',
      chunkMode: 'resource_chunk',
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      provider: connection.provider,
      resources: [input.resource],
      recordsIn: chunk.recordsIn,
      recordsUpdated: chunk.recordsUpdated,
      recordsFailed: chunk.recordsFailed,
      status: chunk.status,
      message: 'Sync chunked do recurso concluida.',
    }
  } catch (error) {
    await finishCloudSyncRun({
      tenantId: input.tenantId,
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      status: 'error',
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 1,
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: {
        chunked: true,
        resources: [{
          resource: input.resource,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
        }],
      },
    })
    throw error
  }
}
