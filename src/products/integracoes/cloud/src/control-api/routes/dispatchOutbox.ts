import { randomUUID } from 'node:crypto'

import type {
  ControlApiRequest,
  ControlApiResponse,
} from '@/products/integracoes/cloud/src/control-api/server'
import { publishSyncMessage } from '@/products/integracoes/cloud/src/lib/pubsub'
import {
  claimSyncDispatchOutbox,
  markSyncDispatchFailed,
  markSyncDispatchPublished,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'
import type { IntegrationSyncTrigger } from '@/products/integracoes/shared/contracts/syncContracts'

const validTriggers = new Set(['manual', 'scheduled', 'webhook', 'initial'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parsePositiveInteger(value: unknown, fallback: number, max: number) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : undefined
}

function optionalRunId(value: unknown) {
  const runId = String(value || '').trim()
  return /^\d+$/.test(runId) ? runId : null
}

export async function handleDispatchOutbox(request: ControlApiRequest): Promise<ControlApiResponse> {
  const body = isRecord(request.body) ? request.body : {}
  const lockToken = randomUUID()
  const items: Array<Record<string, unknown>> = []
  const limit = parsePositiveInteger(body.limit, 50, 200)
  const lockTtlSeconds = parsePositiveInteger(body.lockTtlSeconds, 300, 1800)
  const runId = optionalRunId(body.runId || body.run_id)

  try {
    const claimed = await claimSyncDispatchOutbox({ limit, lockToken, lockTtlSeconds, runId })
    let published = 0
    let failed = 0

    for (const item of claimed) {
      try {
        const trigger = validTriggers.has(item.trigger)
          ? item.trigger as IntegrationSyncTrigger
          : 'manual'
        const publish = await publishSyncMessage({
          tenantId: item.tenantId,
          connectionId: item.connectionId,
          pipelineId: item.pipelineId || undefined,
          destinationId: item.destinationId || undefined,
          runId: item.runId,
          trigger,
          resources: stringArray(item.payload.resources),
          requestedBy: typeof item.payload.requestedBy === 'string' ? item.payload.requestedBy : 'outbox-dispatcher',
        })
        await markSyncDispatchPublished({
          id: item.id,
          lockToken,
          messageId: publish.messageId,
        })
        published += 1
        items.push({
          id: item.id,
          runId: item.runId,
          ok: true,
          messageId: publish.messageId,
        })
      } catch (error) {
        failed += 1
        const errorMessage = error instanceof Error ? error.message : String(error)
        await markSyncDispatchFailed({
          id: item.id,
          lockToken,
          errorMessage,
        }).catch(() => undefined)
        items.push({
          id: item.id,
          runId: item.runId,
          ok: false,
          error: errorMessage,
        })
      }
    }

    return {
      status: 202,
      body: {
        ok: true,
        mode: 'sync_dispatch_outbox',
        runId,
        claimed: claimed.length,
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
        error: error instanceof Error ? error.message : 'Falha ao despachar outbox de sync.',
      },
    }
  }
}
