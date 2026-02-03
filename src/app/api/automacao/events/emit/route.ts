import { inngest } from '@/lib/inngest'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function ensureTable() {
  await runQuery(`
    CREATE SCHEMA IF NOT EXISTS dev;
    CREATE TABLE IF NOT EXISTS dev.automacao_event_log (
      id BIGSERIAL PRIMARY KEY,
      ts TIMESTAMPTZ NOT NULL DEFAULT now(),
      event_name TEXT NOT NULL,
      automation_id TEXT NULL,
      chat_id TEXT NULL,
      source TEXT NOT NULL DEFAULT 'api',
      data JSONB NULL
    );
  `)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const name = String(body?.name || '').trim()
    if (!name) return Response.json({ ok: false, error: 'name é obrigatório' }, { status: 400 })
    const automationId = body?.automationId ? String(body.automationId) : null
    const chatId = body?.chatId ? String(body.chatId) : null
    const data = body?.data && typeof body.data === 'object' ? body.data : {}

    await ensureTable()
    await runQuery(
      `INSERT INTO dev.automacao_event_log (event_name, automation_id, chat_id, source, data)
       VALUES ($1,$2,$3,'api',COALESCE($4::jsonb,'{}'::jsonb))`,
      [name, automationId, chatId, JSON.stringify(data)]
    )

    // best effort: enviar para o Inngest também
    try {
      await inngest.send({ name, data: { ...data, automation_id: automationId, chat_id: chatId } })
    } catch {}

    return Response.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return Response.json({ ok: false, error: msg }, { status: 500 })
  }
}

