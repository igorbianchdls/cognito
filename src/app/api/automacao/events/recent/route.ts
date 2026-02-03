import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const automationId = searchParams.get('automationId') || undefined
    const chatId = searchParams.get('chatId') || undefined
    const after = searchParams.get('after') || undefined
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '50')))

    const conds: string[] = []
    const params: any[] = []
    let i = 1
    if (automationId) { conds.push(`automation_id = $${i++}`); params.push(automationId) }
    if (chatId) { conds.push(`chat_id = $${i++}`); params.push(chatId) }
    if (after) { conds.push(`ts > $${i++}`); params.push(after) }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
    const sql = `SELECT id, ts, event_name, automation_id, chat_id, source, data
                 FROM dev.automacao_event_log
                 ${where}
                 ORDER BY ts ASC, id ASC
                 LIMIT $${i}`
    params.push(limit)
    const rows = await runQuery<any>(sql, params)
    return Response.json({ ok: true, rows })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}

