import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limitRaw = url.searchParams.get('limit') || '20'
    const offsetRaw = url.searchParams.get('offset') || '0'
    const q = (url.searchParams.get('q') || '').trim()

    let limit = Math.max(1, Math.min(100, parseInt(limitRaw, 10) || 20))
    let offset = Math.max(0, parseInt(offsetRaw, 10) || 0)

    const params: any[] = []
    let idx = 1
    let where = ''
    if (q) {
      where = `WHERE (title ILIKE $${idx} OR id ILIKE $${idx + 1})`
      params.push(`%${q}%`, `${q}%`)
      idx += 2
    }
    const sql = `
      SELECT id, title, model, composio_enabled, created_at, updated_at, last_message_at
      FROM chat.chats
      ${where}
      ORDER BY COALESCE(last_message_at, updated_at) DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `
    params.push(limit, offset)

    const rows = await runQuery<any>(sql, params)

    return NextResponse.json({ ok: true, items: rows, page: { limit, offset, count: rows.length } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

