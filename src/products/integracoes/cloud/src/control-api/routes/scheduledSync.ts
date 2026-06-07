import { randomUUID } from 'node:crypto'

import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { publishSyncMessage } from '@/products/integracoes/cloud/src/lib/pubsub'
import {
  claimDueScheduledConnections,
  claimDueScheduledPipelines,
  completeScheduledConnectionDispatch,
  completeScheduledPipelineDispatch,
  createQueuedCloudSyncRun,
  failQueuedCloudSyncRun,
  releaseScheduledConnectionLock,
  releaseScheduledPipelineLock,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'

type ScheduledSyncBody = {
  limit?: number
  lockTtlSeconds?: number
  requestedBy?: string
}

const supportedFrequencyMinutes: Record<string, number> = {
  hourly: 60,
  '1h': 60,
  every_2_hours: 120,
  '2h': 120,
  every_3_hours: 180,
  '3h': 180,
  every_6_hours: 360,
  '6h': 360,
  every_8_hours: 480,
  '8h': 480,
  every_12_hours: 720,
  '12h': 720,
  daily: 1440,
  '24h': 1440,
}

const supportedFrequencies = Object.keys(supportedFrequencyMinutes)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

function parseScheduledSyncBody(body: unknown): ScheduledSyncBody {
  if (!isRecord(body)) return {}

  return {
    limit: parsePositiveInteger(body.limit, 25, 100),
    lockTtlSeconds: parsePositiveInteger(body.lockTtlSeconds, 600, 3600),
    requestedBy: typeof body.requestedBy === 'string' ? body.requestedBy : undefined,
  }
}

function calculateNextSyncAt(syncFrequency: string, from = new Date()) {
  const minutes = supportedFrequencyMinutes[syncFrequency]
  if (!minutes) return null
  return new Date(from.getTime() + minutes * 60_000)
}

export async function handleScheduledSync(request: ControlApiRequest): Promise<ControlApiResponse> {
  const body = parseScheduledSyncBody(request.body)
  const lockToken = randomUUID()
  const requestedBy = body.requestedBy || 'scheduled-sync'
  const items: Array<Record<string, unknown>> = []

  try {
    const duePipelines = await claimDueScheduledPipelines({
      limit: body.limit || 25,
      lockToken,
      lockOwner: requestedBy,
      lockTtlSeconds: body.lockTtlSeconds || 600,
      syncFrequencies: supportedFrequencies,
    })

    let published = 0
    let failed = 0

    for (const pipeline of duePipelines) {
      let runId: string | null = null

      try {
        const nextSyncAt = calculateNextSyncAt(pipeline.syncFrequency)
        if (!nextSyncAt) {
          failed += 1
          await releaseScheduledPipelineLock({
            tenantId: pipeline.tenantId,
            pipelineId: pipeline.id,
            connectionId: pipeline.sourceConnectionId,
            lockToken,
            errorMessage: `Frequencia de sync nao suportada: ${pipeline.syncFrequency}`,
          })
          items.push({
            pipelineId: pipeline.id,
            connectionId: pipeline.sourceConnectionId,
            tenantId: pipeline.tenantId,
            ok: false,
            error: 'Frequencia de sync nao suportada.',
          })
          continue
        }

        const run = await createQueuedCloudSyncRun({
          tenantId: pipeline.tenantId,
          connectionId: pipeline.sourceConnectionId,
          pipelineId: pipeline.id,
          destinationId: pipeline.destinationId,
          resources: pipeline.selectedResources,
          requestedBy,
          metadata: {
            provider: pipeline.provider,
            syncFrequency: pipeline.syncFrequency,
            previousNextSyncAt: pipeline.nextSyncAt,
          },
        })
        runId = run.id

        const publish = await publishSyncMessage({
          tenantId: pipeline.tenantId,
          connectionId: pipeline.sourceConnectionId,
          pipelineId: pipeline.id,
          destinationId: pipeline.destinationId,
          runId,
          trigger: 'scheduled',
          resources: pipeline.selectedResources,
          requestedBy,
        })

        await completeScheduledPipelineDispatch({
          tenantId: pipeline.tenantId,
          pipelineId: pipeline.id,
          lockToken,
          nextSyncAt,
          messageId: publish.messageId,
          runId,
        })

        published += 1
        items.push({
          pipelineId: pipeline.id,
          connectionId: pipeline.sourceConnectionId,
          destinationId: pipeline.destinationId,
          tenantId: pipeline.tenantId,
          ok: true,
          runId,
          messageId: publish.messageId,
          nextSyncAt: nextSyncAt.toISOString(),
        })
      } catch (error) {
        failed += 1
        const errorMessage = error instanceof Error ? error.message : 'Falha ao publicar sync agendado.'
        if (runId) {
          await failQueuedCloudSyncRun({
            tenantId: pipeline.tenantId,
            connectionId: pipeline.sourceConnectionId,
            runId,
            errorMessage,
          })
        }
        await releaseScheduledPipelineLock({
          tenantId: pipeline.tenantId,
          pipelineId: pipeline.id,
          connectionId: pipeline.sourceConnectionId,
          lockToken,
          runId,
          errorMessage,
        })
        items.push({
          pipelineId: pipeline.id,
          connectionId: pipeline.sourceConnectionId,
          tenantId: pipeline.tenantId,
          ok: false,
          runId,
          error: errorMessage,
        })
      }
    }

    const remainingLimit = Math.max((body.limit || 25) - duePipelines.length, 0)
    const dueConnections = remainingLimit
      ? await claimDueScheduledConnections({
        limit: remainingLimit,
        lockToken,
        lockOwner: requestedBy,
        lockTtlSeconds: body.lockTtlSeconds || 600,
        syncFrequencies: supportedFrequencies,
      })
      : []

    for (const connection of dueConnections) {
      let runId: string | null = null

      try {
        const nextSyncAt = calculateNextSyncAt(connection.syncFrequency)
        if (!nextSyncAt) {
          failed += 1
          await releaseScheduledConnectionLock({
            tenantId: connection.tenantId,
            connectionId: connection.id,
            lockToken,
            errorMessage: `Frequencia de sync nao suportada: ${connection.syncFrequency}`,
          })
          items.push({ connectionId: connection.id, tenantId: connection.tenantId, ok: false, error: 'Frequencia de sync nao suportada.' })
          continue
        }

        const run = await createQueuedCloudSyncRun({
          tenantId: connection.tenantId,
          connectionId: connection.id,
          resources: connection.selectedResources,
          requestedBy,
          metadata: {
            provider: connection.provider,
            syncFrequency: connection.syncFrequency,
            previousNextSyncAt: connection.nextSyncAt,
            legacyConnectionSchedule: true,
          },
        })
        runId = run.id

        const publish = await publishSyncMessage({
          tenantId: connection.tenantId,
          connectionId: connection.id,
          runId,
          trigger: 'scheduled',
          resources: connection.selectedResources,
          requestedBy,
        })

        await completeScheduledConnectionDispatch({
          tenantId: connection.tenantId,
          connectionId: connection.id,
          lockToken,
          nextSyncAt,
          messageId: publish.messageId,
          runId,
        })

        published += 1
        items.push({ connectionId: connection.id, tenantId: connection.tenantId, ok: true, runId, messageId: publish.messageId, nextSyncAt: nextSyncAt.toISOString(), legacyConnectionSchedule: true })
      } catch (error) {
        failed += 1
        const errorMessage = error instanceof Error ? error.message : 'Falha ao publicar sync agendado.'
        if (runId) {
          await failQueuedCloudSyncRun({ tenantId: connection.tenantId, connectionId: connection.id, runId, errorMessage })
        }
        await releaseScheduledConnectionLock({ tenantId: connection.tenantId, connectionId: connection.id, lockToken, runId, errorMessage })
        items.push({ connectionId: connection.id, tenantId: connection.tenantId, ok: false, runId, error: errorMessage, legacyConnectionSchedule: true })
      }
    }

    return {
      status: 202,
      body: {
        ok: true,
        mode: 'scheduled_sync',
        claimed: duePipelines.length + dueConnections.length,
        claimedPipelines: duePipelines.length,
        claimedLegacyConnections: dueConnections.length,
        published,
        failed,
        items,
      },
    }
  } catch (error) {
    return {
      status: 500,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : 'Falha ao processar sync agendado.',
      },
    }
  }
}
