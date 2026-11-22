import { after } from 'next/server'
import { appDb } from '@/products/inbox/server/db'
import { ingest } from '@/products/inbox/server/ingest'
import { mediaStore } from '@/products/inbox/server/media'
import { parseWebhook, validSignature } from '@/products/inbox/server/meta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Meta checks the webhook once when it's configured in the app: answer the challenge if the verify token matches. */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams
  const expected = process.env.INBOX_META_VERIFY_TOKEN
  if (expected && q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === expected) return new Response(q.get('hub.challenge') ?? '', { status: 200 })
  return new Response('forbidden', { status: 403 })
}

/** Messages and statuses from WhatsApp, Instagram and Messenger. Signed by Meta; answered at once and stored after. */
export async function POST(request: Request) {
  const raw = await request.text()
  if (raw.length > 1024 * 1024) return new Response('too large', { status: 413 })
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'), process.env.INBOX_META_APP_SECRET ?? '')) return new Response('invalid signature', { status: 401 })
  let events
  try { events = parseWebhook(JSON.parse(raw)) } catch { return new Response('invalid', { status: 400 }) }
  if (events.length) after(async () => {
    try {
      const result = await ingest(events, { service: appDb.service, storeMedia: mediaStore(appDb.service) })
      if (result.ignored) console.log(JSON.stringify({ scope: 'inbox', code: 'WEBHOOK_IGNORED', ...result }))
    } catch (error) {
      console.error(JSON.stringify({ scope: 'inbox', code: 'WEBHOOK_FAILED', message: (error as Error).message }))
    }
  })
  return new Response('ok', { status: 200 })
}
