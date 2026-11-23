import { appDb } from '@/products/inbox/server/db'
import { body, handle, json } from '@/products/inbox/server/http'
import { syncTemplatesFor } from '@/products/inbox/server/broadcasts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { canal_id }: brings the review results of the number's templates from Meta. */
export function POST(request: Request) {
  return handle('modelos-sincronizar', async who => json(200, await syncTemplatesFor(who, String((await body(request)).canal_id ?? ''), appDb, { service: appDb.service })))
}
