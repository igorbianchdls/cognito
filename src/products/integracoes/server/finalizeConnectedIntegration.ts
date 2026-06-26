import { provisionTenantBigQuery } from '@/products/integracoes/datawarehouse/provisioning/tenantBigQueryProvisioning'
import {
  createIntegrationPipeline,
  createIntegrationSyncRun,
  listIntegrationPipelines,
  listIntegrationSyncRuns,
  updateIntegrationConnection,
  updateIntegrationPipeline,
} from '@/products/integracoes/server/integrationConnectionRepository'

export async function finalizeConnectedIntegration(input: {
  tenantId: number
  connectionId: string
  displayName: string
  resources: string[]
  syncFrequency?: string
  requestedBy?: string
}) {
  const requestedBy = input.requestedBy || 'post-auth-finalizer'
  await updateIntegrationConnection(input.connectionId, input.tenantId, {
    metadata: {
      dataReadiness: 'provisioning',
      dataReadinessUpdatedAt: new Date().toISOString(),
    },
  })

  const provision = await provisionTenantBigQuery({
    tenantId: input.tenantId,
    reason: 'connection_authenticated',
  })
  if (!provision.ok || !provision.destinationId) {
    await updateIntegrationConnection(input.connectionId, input.tenantId, {
      status: 'warning',
      metadata: {
        dataReadiness: 'error',
        dataReadinessError: provision.error || 'Falha ao provisionar BigQuery.',
        dataReadinessUpdatedAt: new Date().toISOString(),
      },
    })
    throw new Error(provision.error || 'Falha ao provisionar BigQuery.')
  }

  const existingPipelines = await listIntegrationPipelines({
    tenantId: input.tenantId,
    sourceConnectionId: input.connectionId,
    destinationId: provision.destinationId,
    limit: 20,
  })
  const existing = existingPipelines.find((pipeline) => pipeline.status !== 'disabled')
  const syncFrequency = input.syncFrequency || 'manual'
  let pipeline = existing
    ? await updateIntegrationPipeline(existing.id, input.tenantId, {
      status: 'active',
      selectedResources: input.resources,
      syncFrequency,
      syncEnabled: true,
      metadata: {
        postAuthManaged: true,
        postAuthUpdatedAt: new Date().toISOString(),
      },
    })
    : null
  if (!pipeline) {
    try {
      pipeline = await createIntegrationPipeline({
        tenantId: input.tenantId,
        sourceConnectionId: input.connectionId,
        destinationId: provision.destinationId,
        name: `${input.displayName} -> BigQuery padrao`,
        status: 'active',
        selectedResources: input.resources,
        syncFrequency,
        syncEnabled: true,
        metadata: {
          postAuthManaged: true,
          postAuthCreatedAt: new Date().toISOString(),
        },
      })
    } catch (error) {
      if ((error as { code?: string })?.code !== '23505') throw error
      const concurrentPipelines = await listIntegrationPipelines({
        tenantId: input.tenantId,
        sourceConnectionId: input.connectionId,
        destinationId: provision.destinationId,
        limit: 20,
      })
      const concurrent = concurrentPipelines.find((item) => item.status !== 'disabled')
      pipeline = concurrent
        ? await updateIntegrationPipeline(concurrent.id, input.tenantId, {
          status: 'active',
          selectedResources: input.resources,
          syncFrequency,
          syncEnabled: true,
          metadata: {
            postAuthManaged: true,
            postAuthUpdatedAt: new Date().toISOString(),
          },
        })
        : null
    }
  }
  if (!pipeline) throw new Error('Nao foi possivel criar o pipeline BigQuery.')

  const runs = await listIntegrationSyncRuns({
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    limit: 50,
  })
  const existingInitial = runs.find((run) => run.trigger === 'initial' && run.pipelineId === pipeline.id)
  if (existingInitial && ['running', 'success', 'warning'].includes(existingInitial.status)) {
    return { provision, pipeline, initialSync: existingInitial, published: false }
  }

  let run = existingInitial?.status === 'queued' ? existingInitial : null
  if (!run) {
    try {
      run = await createIntegrationSyncRun({
        tenantId: input.tenantId,
        connectionId: input.connectionId,
        pipelineId: pipeline.id,
        destinationId: provision.destinationId,
        trigger: 'initial',
        status: 'queued',
        resources: input.resources,
        metadata: {
          requestedBy,
          setupMode: 'cloud',
          postAuthInitialSync: true,
        },
      })
    } catch (error) {
      if ((error as { code?: string })?.code !== '23505') throw error
      const concurrentRuns = await listIntegrationSyncRuns({
        tenantId: input.tenantId,
        connectionId: input.connectionId,
        limit: 50,
      })
      run = concurrentRuns.find((item) =>
        item.trigger === 'initial'
        && item.pipelineId === pipeline.id
        && ['queued', 'running', 'success', 'warning'].includes(item.status),
      ) || null
      if (run && run.status !== 'queued') {
        return { provision, pipeline, initialSync: run, published: false }
      }
    }
  }
  if (!run) throw new Error('Nao foi possivel registrar o sync inicial.')

  await updateIntegrationConnection(input.connectionId, input.tenantId, {
    status: 'syncing',
    metadata: {
      dataReadiness: 'initial_sync',
      initialSyncRunId: run.id,
      dataReadinessUpdatedAt: new Date().toISOString(),
    },
  })

  return { provision, pipeline, initialSync: run, published: false, dispatchQueued: true }
}
