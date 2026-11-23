import { appDb, InboxError } from '@/products/inbox/server/db'
import { updateSecret } from '@/products/inbox/server/sales'
import { body, handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { segredo }: replaces the platform secret of an integration. */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('integracao-segredo', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Integração não encontrada.', 404)
    const input = await body(request)
    await updateSecret(who, id, String(input.segredo ?? ''), appDb)
    return json(200, { ok: true })
  })
}
