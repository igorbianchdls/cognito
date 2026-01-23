import { NextRequest } from 'next/server'
import { criarFornecedor } from '@/tools/contasPagarWorkflowTools'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}))
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const tool: any = criarFornecedor as unknown as { execute: (input: unknown) => Promise<unknown> }
    if (!tool || typeof tool.execute !== 'function') {
      return Response.json({ ok: false, error: 'Tool not executable' }, { status: 500 })
    }
    const result = await tool.execute(payload)
    return Response.json({ ok: true, result })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

