import { appDb, InboxError } from '@/products/inbox/server/db'
import { connectWhatsApp, createTestChannel } from '@/products/inbox/server/actions'
import { body, handle, json } from '@/products/inbox/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST { tipo: 'teste', nome } or { tipo: 'whatsapp', nome, phoneNumberId, businessAccountId, token }. */
export function POST(request: Request) {
  return handle('canais', async who => {
    const input = await body(request)
    if (input.tipo === 'teste') return json(201, await createTestChannel(who, input.nome, { db: appDb }))
    if (input.tipo === 'whatsapp') return json(201, await connectWhatsApp(who, input, { db: appDb }))
    throw new InboxError('INVALID', 'Tipo de canal inválido.')
  })
}
