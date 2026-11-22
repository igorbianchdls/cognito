import { signObject } from '@/products/mcpcore/domains/editor/server/media'
import { appDb, InboxError } from '@/products/inbox/server/db'
import { mediaPath } from '@/products/inbox/server/actions'
import { handle, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET: redirects to a 10-minute link of a message attachment (?baixar=1 saves it with its name). */
export function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('midia', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Arquivo não encontrado.', 404)
    const row = await mediaPath(who, id, appDb)
    const download = new URL(request.url).searchParams.get('baixar') ? row.media_name ?? 'arquivo' : undefined
    return new Response(null, { status: 302, headers: { location: await signObject(row.media_path!, 600, download), 'cache-control': 'private, max-age=300' } })
  })
}
