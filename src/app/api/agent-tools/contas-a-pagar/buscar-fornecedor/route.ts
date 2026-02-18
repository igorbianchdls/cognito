import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  return Response.json(
    {
      ok: false,
      error: 'Rota desativada. Use somente a tool CRUD (resource: financeiro/fornecedores).',
    },
    { status: 410 }
  )
}
