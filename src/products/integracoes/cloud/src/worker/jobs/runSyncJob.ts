import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'
import { getCloudConnector } from '@/products/integracoes/connectors/registry/providerRegistry'
import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { refreshOAuthCredentialsIfNeeded } from '@/products/integracoes/connectors/oauth/credentials'
import { writeRowsToDestination } from '@/products/integracoes/destinations/cloud/destinationWriterRegistry'
import {
  createIntegrationEvent,
  startCloudSyncRun,
  finishCloudSyncRun,
  getCloudIntegrationConnection,
  getCloudIntegrationDestination,
  getCloudIntegrationPipeline,
  readIntegrationCursor,
  writeIntegrationCursor,
  type CloudIntegrationDestination,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import { buildTenantBigQueryDestinationConfig } from '@/products/integracoes/datawarehouse/tenantBigQueryDatasets'

export type RunSyncJobInput = {
  tenantId: number
  connectionId: string
  pipelineId?: string
  destinationId?: string
  runId?: string
  trigger: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}

export type RunSyncJobOutput = {
  ok: boolean
  mode: 'gcp_worker'
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

function normalizeRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object' && !Array.isArray(row)))
}

function aggregateStatus(current: 'success' | 'warning' | 'error', next: string): 'success' | 'warning' | 'error' {
  if (current === 'error' || next === 'error') return 'error'
  if (current === 'warning' || next === 'warning') return 'warning'
  return 'success'
}

export async function runSyncJob(input: RunSyncJobInput): Promise<RunSyncJobOutput> {
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

  const resources = input.resources?.length
    ? input.resources
    : pipeline?.selectedResources?.length
      ? pipeline.selectedResources
      : connection.selectedResources
  if (!resources.length) {
    throw new Error(`Conexao ${connection.id} nao possui resources selecionados`)
  }

  const run = await startCloudSyncRun({
    tenantId: input.tenantId,
    connectionId: connection.id,
    pipelineId: pipeline?.id || null,
    destinationId: destination.id === 'default-bigquery' ? null : destination.id,
    runId: input.runId,
    trigger: input.trigger,
    resources,
    requestedBy: input.requestedBy,
  })

  let recordsIn = 0
  let recordsUpdated = 0
  let recordsFailed = 0
  let status: 'success' | 'warning' | 'error' = 'success'
  const resourceSummaries: Record<string, unknown>[] = []

  try {
    const rawCredentials = parseCredentials(connection.secretRef ? await readSecret(connection.secretRef) : null)
    const credentials = await refreshOAuthCredentialsIfNeeded({
      tenantId: input.tenantId,
      connectionId: connection.id,
      provider: connection.provider,
      credentials: rawCredentials,
    })

    for (const resource of resources) {
      await createIntegrationEvent({
        tenantId: input.tenantId,
        connectionId: connection.id,
        eventType: 'sync.resource.started',
        actor: 'integrations-worker',
        message: `Sincronizacao do recurso ${resource} iniciada.`,
        metadata: { runId: run.id, resource, provider: connection.provider },
      })

      try {
        const cursor = await readIntegrationCursor({
          tenantId: input.tenantId,
          connectionId: connection.id,
          resource,
        })
        const result = await connector.syncResource({
          tenantId: input.tenantId,
          connectionId: connection.id,
          provider: connection.provider,
          secretRef: connection.secretRef,
          credentials,
          selectedResources: connection.selectedResources,
          cursor,
          metadata: connection.metadata,
        }, resource)

        let rowsWritten = 0
        const batches = result.batches?.length
          ? result.batches
          : [{
            resource,
            rows: normalizeRows(result.rows || result.metadata?.rows),
            nextCursor: result.nextCursor,
          }]

        for (const batch of batches) {
          const batchRows = normalizeRows(batch.rows)
          if (batchRows.length) {
            const write = await writeRowsToDestination({
              tenantId: input.tenantId,
              connectionId: connection.id,
              pipelineId: pipeline?.id || null,
              destination,
              provider: connection.provider,
              resource: batch.resource || resource,
              runId: run.id,
              table: `${connection.provider}_${batch.resource || resource}`,
              rows: batchRows,
            })
            rowsWritten += write.insertedRows
          }
          if (batch.nextCursor) {
            await writeIntegrationCursor({
              tenantId: input.tenantId,
              connectionId: connection.id,
              resource: batch.resource || resource,
              cursor: batch.nextCursor,
            })
          }
        }

        recordsIn += result.recordsIn
        recordsUpdated += result.recordsUpdated || rowsWritten
        recordsFailed += result.recordsFailed
        status = aggregateStatus(status, result.status)
        resourceSummaries.push({
          resource,
          status: result.status,
          recordsIn: result.recordsIn,
          recordsUpdated: result.recordsUpdated || rowsWritten,
          recordsFailed: result.recordsFailed,
          rowsWritten,
          errorMessage: result.errorMessage || null,
        })

        await createIntegrationEvent({
          tenantId: input.tenantId,
          connectionId: connection.id,
          eventType: 'sync.resource.completed',
          severity: result.status === 'error' ? 'error' : result.status === 'warning' ? 'warning' : 'info',
          actor: 'integrations-worker',
          message: `Sincronizacao do recurso ${resource} concluida.`,
          metadata: { runId: run.id, resource, rowsWritten, status: result.status },
        })
      } catch (error) {
        recordsFailed += 1
        status = 'error'
        const errorMessage = error instanceof Error ? error.message : String(error)
        resourceSummaries.push({
          resource,
          status: 'error',
          recordsIn: 0,
          recordsUpdated: 0,
          recordsFailed: 1,
          rowsWritten: 0,
          errorMessage,
        })
        await createIntegrationEvent({
          tenantId: input.tenantId,
          connectionId: connection.id,
          eventType: 'sync.resource.failed',
          severity: 'error',
          actor: 'integrations-worker',
          message: `Sincronizacao do recurso ${resource} falhou.`,
          metadata: { runId: run.id, resource, errorMessage },
        })
      }
    }

    await finishCloudSyncRun({
      tenantId: input.tenantId,
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      status,
      recordsIn,
      recordsUpdated,
      recordsFailed,
      metadata: { resources: resourceSummaries },
    })

    return {
      ok: status !== 'error',
      mode: 'gcp_worker',
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      provider: connection.provider,
      resources,
      recordsIn,
      recordsUpdated,
      recordsFailed,
      status,
      message: 'Worker GCP executou a sincronizacao.',
    }
  } catch (error) {
    recordsFailed = Math.max(recordsFailed, 1)
    await finishCloudSyncRun({
      tenantId: input.tenantId,
      connectionId: connection.id,
      pipelineId: pipeline?.id || null,
      destinationId: destination.id === 'default-bigquery' ? null : destination.id,
      runId: run.id,
      status: 'error',
      recordsIn,
      recordsUpdated,
      recordsFailed,
      errorMessage: error instanceof Error ? error.message : String(error),
      metadata: { resources: resourceSummaries },
    })
    throw error
  }
}
