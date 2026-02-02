import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

export async function DELETE(_req: Request, context: { params: { id?: string } }) {
  try {
    const id = (context?.params?.id || '').toString().trim()
    if (!id) return NextResponse.json({ ok: false, error: 'id obrigatório' }, { status: 400 })
    const rows = await runQuery<{ id: string }>(`DELETE FROM chat.chats WHERE id = $1 RETURNING id`, [id])
    if (!rows || rows.length === 0) return NextResponse.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}

