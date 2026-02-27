import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const chatId = (url.searchParams.get('chatId') || '').trim()
    const limitRaw = url.searchParams.get('limit') || '50'
    let limit = Math.max(1, Math.min(200, parseInt(limitRaw, 10) || 50))
    if (!chatId) return NextResponse.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })

    const rows = await runQuery<any>(
      `SELECT id, role, content, parts, created_at
         FROM (
           SELECT id, role, content, parts, created_at
             FROM chat.chat_messages
            WHERE chat_id = $1
            ORDER BY created_at DESC, id DESC
            LIMIT $2
         ) recent
        ORDER BY created_at ASC, id ASC`,
      [chatId, limit]
    )

    return NextResponse.json({ ok: true, items: rows })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
