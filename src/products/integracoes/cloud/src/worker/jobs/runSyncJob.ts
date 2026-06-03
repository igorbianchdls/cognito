import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'
import { getCloudConnector } from '@/products/integracoes/cloud/src/providers/providerRegistry'
import { readSecret } from '@/products/integracoes/cloud/src/lib/secretManager'
import { writeRowsToBigQuery } from '@/products/integracoes/cloud/src/lib/bigquery'
import {
  createIntegrationEvent,
  createCloudSyncRun,
  finishCloudSyncRun,
  getCloudIntegrationConnection,
  readIntegrationCursor,
  writeIntegrationCursor,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'

export type RunSyncJobInput = {
  tenantId: number
  connectionId: string
  trigger: IntegrationSyncTrigger
  resources?: string[]
  requestedBy?: string
}

export type RunSyncJobOutput = {
  ok: boolean
  mode: 'gcp_worker'
  connectionId: string
  runId: string
  provider: string
  resources: string[]
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  status: 'success' | 'warning' | 'error'
  message: string
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
  const connection = await getCloudIntegrationConnection({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
  })
  if (!connection) {
    throw new Error(`Conexao ${input.connectionId} nao encontrada para tenant ${input.tenantId}`)
  }

  const connector = getCloudConnector(connection.provider)
  if (!connector) {
    throw new Error(`Connector cloud nao registrado para provider ${connection.provider}`)
  }

  const resources = input.resources?.length ? input.resources : connection.selectedResources
  if (!resources.length) {
    throw new Error(`Conexao ${input.connectionId} nao possui resources selecionados`)
  }

  const run = await createCloudSyncRun({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
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
    const credentials = parseCredentials(connection.secretRef ? await readSecret(connection.secretRef) : null)

    for (const resource of resources) {
      await createIntegrationEvent({
        tenantId: input.tenantId,
        connectionId: input.connectionId,
        eventType: 'sync.resource.started',
        actor: 'integrations-worker',
        message: `Sincronizacao do recurso ${resource} iniciada.`,
        metadata: { runId: run.id, resource, provider: connection.provider },
      })

      try {
        const cursor = await readIntegrationCursor({
          tenantId: input.tenantId,
          connectionId: input.connectionId,
          resource,
        })
        const result = await connector.syncResource({
          tenantId: input.tenantId,
          connectionId: input.connectionId,
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
            const write = await writeRowsToBigQuery({
              tenantId: input.tenantId,
              connectionId: input.connectionId,
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
              connectionId: input.connectionId,
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
          connectionId: input.connectionId,
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
          connectionId: input.connectionId,
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
      connectionId: input.connectionId,
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
      connectionId: input.connectionId,
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
      connectionId: input.connectionId,
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
