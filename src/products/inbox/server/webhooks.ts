// Meta webhooks are stored before Meta hears "received", then processed. A failure leaves the event pending: it is
// tried again on the next webhook and by the daily job, instead of being lost (Meta does not resend after a 200).
import type { Query } from './db'
import { ingest, type IngestDeps } from './ingest'
import { parseWebhook } from './meta'

export const MAX_ATTEMPTS = 8

export async function storeWebhook(service: Query, payload: unknown) {
  const [row] = await service<{ id: string }>(`INSERT INTO inbox_private.webhook_events (payload) VALUES ($1) RETURNING id::text`, [JSON.stringify(payload)])
  return row.id
}

/** Processes one stored event if nobody else is on it. Returns false when it failed (it stays pending). */
export async function processWebhook(id: string, deps: IngestDeps) {
  // Claim: one processor at a time; a claim older than 5 minutes is considered abandoned.
  const [claimed] = await deps.service<{ payload: unknown }>(`UPDATE inbox_private.webhook_events SET claimed_at = now(), attempts = attempts + 1
    WHERE id = $1 AND processed_at IS NULL AND (claimed_at IS NULL OR claimed_at < now() - interval '5 minutes') RETURNING payload`, [id])
  if (!claimed) return true
  try {
    const result = await ingest(parseWebhook(claimed.payload), deps)
    await deps.service(`UPDATE inbox_private.webhook_events SET processed_at = now(), claimed_at = NULL, last_error = NULL WHERE id = $1`, [id])
    if (result.ignored) console.log(JSON.stringify({ scope: 'inbox', code: 'WEBHOOK_IGNORED', id, ...result }))
    return true
  } catch (error) {
    const message = (error as Error).message?.slice(0, 500) ?? 'erro'
    await deps.service(`UPDATE inbox_private.webhook_events SET claimed_at = NULL, last_error = $2 WHERE id = $1`, [id, message]).catch(() => undefined)
    console.error(JSON.stringify({ scope: 'inbox', code: 'WEBHOOK_FAILED', id, message }))
    return false
  }
}

/** Tries pending events again (oldest first, after a minute) and forgets processed ones after 7 days. */
export async function retryPending(deps: IngestDeps, limit = 20) {
  const rows = await deps.service<{ id: string }>(`SELECT id::text FROM inbox_private.webhook_events
    WHERE processed_at IS NULL AND attempts < $1 AND received_at < now() - interval '1 minute' ORDER BY id LIMIT $2`, [MAX_ATTEMPTS, limit])
  let ok = 0, failed = 0
  for (const r of rows) if (await processWebhook(r.id, deps)) ok++; else failed++
  const cleaned = await deps.service(`DELETE FROM inbox_private.webhook_events WHERE processed_at < now() - interval '7 days' RETURNING id`)
  const [stuck] = await deps.service<{ n: string }>(`SELECT count(*)::text AS n FROM inbox_private.webhook_events WHERE processed_at IS NULL AND attempts >= $1`, [MAX_ATTEMPTS])
  if (Number(stuck.n)) console.error(JSON.stringify({ scope: 'inbox', code: 'WEBHOOK_GAVE_UP', events: Number(stuck.n) }))
  return { reprocessados: ok, falharam: failed, apagados: cleaned.length, desistidos: Number(stuck.n) }
}
