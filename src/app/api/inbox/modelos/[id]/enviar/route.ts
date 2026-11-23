import { appDb } from '@/products/inbox/server/db'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { submitTemplateFor } from '@/products/inbox/server/broadcasts'

/** POST: sends a WhatsApp template for Meta's review. */
export function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('modelo-enviar', async who => json(200, await submitTemplateFor(who, (await ctx.params).id, appDb, { service: appDb.service })))
}
