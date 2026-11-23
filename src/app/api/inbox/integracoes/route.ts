import { appDb } from '@/products/inbox/server/db'
import { createIntegration } from '@/products/inbox/server/sales'
import { body, handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { provider, nome, segredo }: connects a sales platform; answers with the webhook path to paste there. */
export function POST(request: Request) {
  return handle('integracoes', async who => json(201, await createIntegration(who, await body(request), appDb)))
}
