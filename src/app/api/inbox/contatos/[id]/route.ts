import { removeObjects } from '@/products/mcpcore/domains/editor/server/media'
import { appDb, InboxError } from '@/products/inbox/server/db'
import { deleteContact } from '@/products/inbox/server/actions'
import { handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** DELETE: the contact, their conversations and notes, and the files they sent. */
export function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('excluir-contato', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Contato não encontrado.', 404)
    return json(200, await deleteContact(who, id, { db: appDb, removeMedia: paths => removeObjects(paths) }))
  })
}
