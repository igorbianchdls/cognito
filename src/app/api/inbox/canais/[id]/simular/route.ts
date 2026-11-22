import { appDb, InboxError } from '@/products/inbox/server/db'
import { simulateCustomer } from '@/products/inbox/server/actions'
import { body, handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { nome, texto }: a customer message in the test channel. */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('simular', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Canal não encontrado.', 404)
    await simulateCustomer(who, id, await body(request), { db: appDb })
    return json(201, { ok: true })
  })
}
