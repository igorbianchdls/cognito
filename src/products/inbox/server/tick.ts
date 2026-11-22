// What the Inbox does every minute (called by the database through pg_cron, and once a day by Vercel as a fallback).
// Each part is independent: one failing does not stop the others.
import { appDb } from './db'
import { mediaStore } from './media'
import { retryPending } from './webhooks'
import { wakeRuns } from './flows'

type Part = { name: string; run: () => Promise<unknown> }
const parts: Part[] = [
  { name: 'automacoes', run: () => wakeRuns({ service: appDb.service }) },
  { name: 'avisos_meta', run: () => retryPending({ service: appDb.service, storeMedia: mediaStore(appDb.service) }, 20) },
]
/** Later stages add their own minute work here (broadcasts, response times…). */
export function addTickPart(part: Part) { if (!parts.some(p => p.name === part.name)) parts.push(part) }

export async function runTick() {
  const out: Record<string, unknown> = {}
  for (const p of parts) {
    try { out[p.name] = await p.run() } catch (error) {
      out[p.name] = { erro: true }
      console.error(JSON.stringify({ scope: 'inbox', code: 'TICK_PART_FAILED', part: p.name, message: (error as Error).message }))
    }
  }
  return out
}

/** The tick secret (pg_cron) or Vercel's cron secret. */
export function tickAllowed(header: string | null) {
  const secrets = [process.env.INBOX_TICK_SECRET, process.env.CRON_SECRET].filter((s): s is string => !!s && s.length >= 16)
  return !!header && secrets.some(s => header === `Bearer ${s}`)
}
