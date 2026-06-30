import {
  readIntegrationCursor,
  writeIntegrationCursor,
} from '@/products/integracoes/cloud/src/lib/postgresStatus'

import type { SyncCursor } from '@/products/integracoes/cloud/src/sync-engine/chunkTypes'

const STATS_KEY = '__syncStats'

export function readStats(cursor?: SyncCursor) {
  const value = cursor?.[STATS_KEY]
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      recordsIn: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      chunksProcessed: 0,
    }
  }
  const stats = value as Record<string, unknown>
  return {
    recordsIn: Number(stats.recordsIn || 0),
    recordsUpdated: Number(stats.recordsUpdated || 0),
    recordsFailed: Number(stats.recordsFailed || 0),
    chunksProcessed: Number(stats.chunksProcessed || 0),
  }
}

export function withStats(cursor: SyncCursor, stats: ReturnType<typeof readStats>): SyncCursor {
  return {
    ...cursor,
    [STATS_KEY]: stats,
  }
}

export function withoutStats(cursor?: SyncCursor): SyncCursor | undefined {
  if (!cursor) return undefined
  const nextCursor = { ...cursor }
  delete nextCursor[STATS_KEY]
  return nextCursor
}

export async function readCheckpoint(input: {
  tenantId: number
  connectionId: string
  resource: string
  cursorKey?: string
}) {
  return readIntegrationCursor(input)
}

export async function writeCheckpoint(input: {
  tenantId: number
  connectionId: string
  resource: string
  cursor: SyncCursor
  cursorKey?: string
}) {
  await writeIntegrationCursor(input)
}
