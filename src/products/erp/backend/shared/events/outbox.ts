import { inngest } from '@/lib/inngest'
import { runQuery, type SQLClient } from '@/lib/postgres'

type DbClient = Pick<SQLClient, 'query'>

type OutboxStatus = 'pending' | 'failed' | 'sent' | 'dead'

export type OutboxRow = {
  id: number
  event_name: string
  payload: Record<string, unknown> | string | null
  status: OutboxStatus
  attempts: number
  max_attempts: number
  last_error: string | null
  origin: string | null
  origin_id: number | null
  created_at: string
  updated_at: string
  sent_at: string | null
  next_attempt_at: string
}

export type EnqueueOutboxInput = {
  eventName: string
  payload: Record<string, unknown>
  origin?: string | null
  originId?: number | null
  maxAttempts?: number
}

export type DispatchOutboxResult = {
  id: number
  eventName: string
  status: OutboxStatus | 'missing'
  sent: boolean
  attempts: number
  maxAttempts: number
  error?: string | null
}

export type EmitCriticalEventResult = {
  sent: boolean
  outboxId: number | null
  status: OutboxStatus
  error: string | null
}

let outboxEnsured = false

async function queryRows<T = Record<string, unknown>>(
  client: DbClient | undefined,
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  if (client) {
    const result = await client.query(sql, params)
    return result.rows as T[]
  }
  return runQuery<T>(sql, params)
}

async function ensureOutboxTable(client?: DbClient): Promise<void> {
  if (outboxEnsured) return
  await queryRows(
    client,
    `
      CREATE TABLE IF NOT EXISTS public.event_outbox (
        id BIGSERIAL PRIMARY KEY,
        event_name TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 10,
        last_error TEXT NULL,
        origin TEXT NULL,
        origin_id BIGINT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMPTZ NULL,
        next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS event_outbox_unique_origin_idx
        ON public.event_outbox (event_name, origin, origin_id);

      CREATE INDEX IF NOT EXISTS event_outbox_pending_idx
        ON public.event_outbox (status, next_attempt_at, created_at);
    `
  )
  outboxEnsured = true
}

function normalizePayload(value: OutboxRow['payload']): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
      return {}
    } catch {
      return {}
    }
  }
  return value
}

function calcNextAttemptAt(attempts: number): Date {
  const delayMinutes = Math.min(60, Math.pow(2, Math.max(1, Math.min(attempts, 6))))
  return new Date(Date.now() + delayMinutes * 60_000)
}

export async function enqueueOutboxEvent(
  input: EnqueueOutboxInput,
  client?: DbClient
): Promise<OutboxRow> {
  await ensureOutboxTable(client)
  const rows = await queryRows<OutboxRow>(
    client,
    `
      INSERT INTO public.event_outbox (
        event_name,
        payload,
        status,
        attempts,
        max_attempts,
        last_error,
        origin,
        origin_id,
        next_attempt_at,
        updated_at
      )
      VALUES ($1, $2::jsonb, 'pending', 0, $3, NULL, $4, $5, NOW(), NOW())
      ON CONFLICT (event_name, origin, origin_id)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        status = 'pending',
        last_error = NULL,
        max_attempts = EXCLUDED.max_attempts,
        next_attempt_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `,
    [
      input.eventName,
      JSON.stringify(input.payload || {}),
      Number.isFinite(input.maxAttempts as number) ? Number(input.maxAttempts) : 10,
      input.origin ?? null,
      Number.isFinite(input.originId as number) ? Number(input.originId) : null,
    ]
  )
  const row = rows[0]
  if (!row?.id) throw new Error('Falha ao enfileirar evento no outbox')
  return row
}

export async function dispatchOutboxEventById(id: number): Promise<DispatchOutboxResult> {
  await ensureOutboxTable()
  const list = await queryRows<OutboxRow>(
    undefined,
    `
      SELECT *
      FROM public.event_outbox
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  )
  const row = list[0]
  if (!row) {
    return {
      id,
      eventName: '',
      status: 'missing',
      sent: false,
      attempts: 0,
      maxAttempts: 0,
      error: 'Evento não encontrado no outbox',
    }
  }

  if (row.status === 'sent') {
    return {
      id: row.id,
      eventName: row.event_name,
      status: row.status,
      sent: true,
      attempts: Number(row.attempts || 0),
      maxAttempts: Number(row.max_attempts || 0),
      error: null,
    }
  }

  const payload = normalizePayload(row.payload)
  try {
    await inngest.send({
      name: row.event_name,
      data: payload,
    })

    const sentRows = await queryRows<OutboxRow>(
      undefined,
      `
        UPDATE public.event_outbox
           SET status = 'sent',
               attempts = attempts + 1,
               last_error = NULL,
               sent_at = NOW(),
               updated_at = NOW()
         WHERE id = $1
         RETURNING *
      `,
      [row.id]
    )
    const sentRow = sentRows[0] ?? row
    return {
      id: sentRow.id,
      eventName: sentRow.event_name,
      status: sentRow.status,
      sent: true,
      attempts: Number(sentRow.attempts || 0),
      maxAttempts: Number(sentRow.max_attempts || 0),
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const nextAttempts = Number(row.attempts || 0) + 1
    const maxAttempts = Number(row.max_attempts || 10)
    const nextStatus: OutboxStatus = nextAttempts >= maxAttempts ? 'dead' : 'failed'
    const nextAttemptAt = calcNextAttemptAt(nextAttempts).toISOString()

    const failedRows = await queryRows<OutboxRow>(
      undefined,
      `
        UPDATE public.event_outbox
           SET status = $2,
               attempts = $3,
               last_error = $4,
               next_attempt_at = $5::timestamptz,
               updated_at = NOW()
         WHERE id = $1
         RETURNING *
      `,
      [row.id, nextStatus, nextAttempts, message.slice(0, 4000), nextAttemptAt]
    )
    const failedRow = failedRows[0] ?? row
    return {
      id: failedRow.id,
      eventName: failedRow.event_name,
      status: failedRow.status,
      sent: false,
      attempts: Number(failedRow.attempts || nextAttempts),
      maxAttempts,
      error: message,
    }
  }
}

export async function processPendingOutbox(limit = 20): Promise<{
  processed: number
  sent: number
  failed: number
  dead: number
  results: DispatchOutboxResult[]
}> {
  await ensureOutboxTable()
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 20))
  const pending = await queryRows<{ id: number }>(
    undefined,
    `
      SELECT id
      FROM public.event_outbox
      WHERE status IN ('pending', 'failed')
        AND attempts < max_attempts
        AND next_attempt_at <= NOW()
      ORDER BY created_at ASC
      LIMIT $1
    `,
    [safeLimit]
  )

  const results: DispatchOutboxResult[] = []
  for (const item of pending) {
    results.push(await dispatchOutboxEventById(Number(item.id)))
  }

  const sent = results.filter((r) => r.sent).length
  const failed = results.filter((r) => !r.sent && r.status === 'failed').length
  const dead = results.filter((r) => !r.sent && r.status === 'dead').length

  return {
    processed: results.length,
    sent,
    failed,
    dead,
    results,
  }
}

export async function emitCriticalEvent(
  input: EnqueueOutboxInput
): Promise<EmitCriticalEventResult> {
  try {
    await inngest.send({
      name: input.eventName,
      data: input.payload || {},
    })
    return { sent: true, outboxId: null, status: 'sent', error: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const row = await enqueueOutboxEvent(input)
    return { sent: false, outboxId: row.id, status: row.status, error: message }
  }
}
