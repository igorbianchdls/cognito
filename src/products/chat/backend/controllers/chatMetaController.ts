import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const chatId = (url.searchParams.get('chatId') || '').trim()
    if (!chatId) return NextResponse.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const rows = await runQuery<any>(
      `SELECT id, title, model, composio_enabled, created_at, updated_at, last_message_at, snapshot_id, snapshot_at
         FROM chat.chats WHERE id = $1`,
      [chatId]
    )
    if (!rows || rows.length === 0) return NextResponse.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, chat: rows[0] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

