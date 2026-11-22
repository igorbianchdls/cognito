import { removeObjects } from '@/products/mcpcore/domains/editor/server/media'
import { appDb, InboxError } from '@/products/inbox/server/db'
import { deleteChannel, setChannelState } from '@/products/inbox/server/actions'
import { body, handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { acao: 'desconectar' | 'reconectar' }: stops the channel keeping its history (reconectar: test channel only). */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('canal', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Canal não encontrado.', 404)
    const { acao } = await body(request)
    if (acao !== 'desconectar' && acao !== 'reconectar') throw new InboxError('INVALID', 'Ação inválida.')
    return json(200, await setChannelState(who, id, acao, { db: appDb }))
  })
}

/** DELETE: the channel, its conversations and messages, and the files received through it. */
export function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('excluir-canal', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Canal não encontrado.', 404)
    return json(200, await deleteChannel(who, id, { db: appDb, removeMedia: paths => removeObjects(paths) }))
  })
}
