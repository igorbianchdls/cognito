import { after } from 'next/server'
import { appDb } from '@/products/inbox/server/db'
import { mediaStore } from '@/products/inbox/server/media'
import { validSignature } from '@/products/inbox/server/meta'
import { processWebhook, retryPending, storeWebhook } from '@/products/inbox/server/webhooks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Meta checks the webhook once when it's configured in the app: answer the challenge if the verify token matches. */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams
  const expected = process.env.INBOX_META_VERIFY_TOKEN
  if (expected && q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === expected) return new Response(q.get('hub.challenge') ?? '', { status: 200 })
  return new Response('forbidden', { status: 403 })
}

/**
 * Messages and statuses from WhatsApp, Instagram and Messenger. Signed by Meta. Stored first (if that fails Meta gets
 * an error and sends again), answered, then processed; earlier failures are retried along the way.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  if (raw.length > 1024 * 1024) return new Response('too large', { status: 413 })
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'), process.env.INBOX_META_APP_SECRET ?? '')) return new Response('invalid signature', { status: 401 })
  let payload: unknown
  try { payload = JSON.parse(raw) } catch { return new Response('invalid', { status: 400 }) }
  let id: string
  try {
    id = await storeWebhook(appDb.service, payload)
  } catch (error) {
    console.error(JSON.stringify({ scope: 'inbox', code: 'WEBHOOK_NOT_STORED', message: (error as Error).message }))
    return new Response('try again', { status: 503 })
  }
  after(async () => {
    const deps = { service: appDb.service, storeMedia: mediaStore(appDb.service) }
    await processWebhook(id, deps)
    await retryPending(deps, 5).catch(() => undefined)
  })
  return new Response('ok', { status: 200 })
}
