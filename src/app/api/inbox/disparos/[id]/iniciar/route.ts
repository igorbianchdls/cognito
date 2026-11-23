import { appDb } from '@/products/inbox/server/db'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { startBroadcast } from '@/products/inbox/server/broadcasts'

/** POST: starts the broadcast now, or schedules it when it has a future date. */
export function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('disparo-iniciar', async who => json(200, await startBroadcast(who, (await ctx.params).id, appDb, { service: appDb.service })))
}
