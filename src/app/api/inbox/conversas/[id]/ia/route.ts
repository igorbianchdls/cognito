import { appDb, InboxError } from '@/products/inbox/server/db'
import { suggestReply, summarize } from '@/products/inbox/server/ai'
import { body, handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** POST { acao: 'sugerir' | 'resumir' }: a reply for the team to review, or a summary of the conversation. */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('ia', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Conversa não encontrada.', 404)
    const { acao } = await body(request)
    if (acao === 'sugerir') return json(200, await suggestReply(who, id, appDb))
    if (acao === 'resumir') return json(200, await summarize(who, id, appDb))
    throw new InboxError('INVALID', 'Ação inválida.')
  })
}
