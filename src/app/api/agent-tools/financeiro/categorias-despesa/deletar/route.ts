import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
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

    // Soft delete se possível, senão delete
    try {
      const up = await runQuery(`UPDATE financeiro.categorias_despesa SET ativo = FALSE WHERE id = $1`, [id])
      if (Array.isArray(up) && up.length >= 0) {
        return Response.json({ ok: true, result: { success: true, message: 'Categoria de despesa desativada', data: { id } } })
      }
    } catch {}
    await runQuery(`DELETE FROM financeiro.categorias_despesa WHERE id = $1`, [id])
    return Response.json({ ok: true, result: { success: true, message: 'Categoria de despesa deletada', data: { id } } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

