import { appDb } from '@/products/inbox/server/db'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { cancelBroadcast } from '@/products/inbox/server/broadcasts'

/** POST: stops a scheduled or running broadcast (what was sent stays sent). */
export function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('disparo-cancelar', async who => json(200, await cancelBroadcast(who, (await ctx.params).id, appDb, { service: appDb.service })))
}
