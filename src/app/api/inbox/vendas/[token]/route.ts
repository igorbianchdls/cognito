import { appDb } from '@/products/inbox/server/db'
import { receiveSale } from '@/products/inbox/server/sales'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public: Hotmart, Kiwify, Eduzz and Stripe send sales here; the token in the address says which integration. */
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params
  if (!/^[0-9a-f]{64}$/.test(token)) return new Response('not found', { status: 404 })
  const raw = await request.text()
  if (raw.length > 512 * 1024) return new Response('too large', { status: 413 })
  const result = await receiveSale(appDb.service, token, raw, request.headers, new URL(request.url).searchParams)
  return Response.json({ ok: result.status === 200, eventos: result.done }, { status: result.status })
}
