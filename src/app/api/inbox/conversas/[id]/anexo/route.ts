import { appDb, InboxError } from '@/products/inbox/server/db'
import { MAX_ATTACHMENT, replyWithFile } from '@/products/inbox/server/actions'
import { handle, json, UUID } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST multipart { arquivo, legenda? }: sends a file in the conversation. */
export function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle('anexo', async who => {
    const { id } = await ctx.params
    if (!UUID.test(id)) throw new InboxError('NOT_FOUND', 'Conversa não encontrada.', 404)
    if (Number(request.headers.get('content-length') ?? 0) > MAX_ATTACHMENT + 64 * 1024) throw new InboxError('TOO_LARGE', 'Arquivos até 4 MB.', 413)
    const form = await request.formData().catch(() => null)
    const file = form?.get('arquivo')
    if (!(file instanceof File)) throw new InboxError('INVALID', 'Escolha um arquivo.')
    const caption = form?.get('legenda')
    const result = await replyWithFile(who, id, { bytes: Buffer.from(await file.arrayBuffer()), name: file.name, mime: file.type }, typeof caption === 'string' ? caption : '', { db: appDb })
    return json(result.status === 'falhou' ? 502 : 201, result)
  })
}
