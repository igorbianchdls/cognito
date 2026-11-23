import { appDb } from '@/products/inbox/server/db'
import { reportFor } from '@/products/inbox/server/reports'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?de=AAAA-MM-DD&ate=AAAA-MM-DD: the Inbox report for the period (default: last 30 days). */
export function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  return handle('relatorios', async who => json(200, await reportFor(who, { de: sp.get('de') ?? undefined, ate: sp.get('ate') ?? undefined }, appDb)))
}
