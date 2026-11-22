import { appDb, InboxError } from '@/products/inbox/server/db'
import { reply } from '@/products/inbox/server/actions'
import { body, handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { texto }: reply in the conversation through its channel. */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('responder', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Conversa não encontrada.', 404)
    const input = await body(request)
    const result = await reply(who, id, typeof input.texto === 'string' ? input.texto : '', { db: appDb })
    return json(result.status === 'falhou' ? 502 : 201, result)
  })
}
