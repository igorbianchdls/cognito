import { appDb } from '@/products/inbox/server/db'
import { listSources } from '@/products/inbox/server/segments'
import { handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET: the lead sources seen in the company, most common first. */
export function GET() {
  return handle('segmentos/origens', async who => json(200, { origens: await listSources(who, appDb) }))
}
