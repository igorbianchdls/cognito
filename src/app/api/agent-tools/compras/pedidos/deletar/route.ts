import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const id = Number((payload as any)?.id)
    if (!Number.isFinite(id)) return Response.json({ ok: false, error: 'id inválido' }, { status: 400 })

    return Response.json(
      {
        ok: false,
        code: 'PEDIDO_COMPRA_DELETE_NOT_ALLOWED',
        error: 'Pedido de compra é uma transação e não pode ser excluído pela tool CRUD. Use atualizar com status=\"cancelado\".',
        result: {
          success: false,
          message: 'Exclusão de pedido de compra não permitida',
          data: {
            id,
            allowed_action: 'atualizar',
            suggested_status: 'cancelado',
          },
        },
      },
      { status: 409 },
    )
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
