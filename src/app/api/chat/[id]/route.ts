import { NextResponse, type NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const chatId = (id || '').toString().trim()
    if (!chatId) return NextResponse.json({ ok: false, error: 'id obrigatório' }, { status: 400 })
    const body = await req.json().catch(() => ({})) as { title?: string | null }
    const title = typeof body.title === 'string' ? body.title.trim() : null
    const rows = await runQuery<{ id: string; title: string | null }>(
      `UPDATE chat.chats SET title = $1, updated_at = now() WHERE id = $2 RETURNING id, title`,
      [title, chatId]
    )
    if (!rows || rows.length === 0) return NextResponse.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, item: rows[0] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const chatId = (id || '').toString().trim()
    if (!chatId) return NextResponse.json({ ok: false, error: 'id obrigatório' }, { status: 400 })
    const rows = await runQuery<{ id: string }>(`DELETE FROM chat.chats WHERE id = $1 RETURNING id`, [chatId])
    if (!rows || rows.length === 0) return NextResponse.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
