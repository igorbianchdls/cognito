import { inngest } from '@/lib/inngest'
import { runQuery } from '@/lib/postgres'

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

async function logEvent({ name, automationId, chatId, source, data }: { name: string; automationId?: string | null; chatId?: string | null; source?: string; data?: any }) {
  await ensureTable()
  const sql = `INSERT INTO dev.automacao_event_log (event_name, automation_id, chat_id, source, data)
               VALUES ($1, $2, $3, $4, COALESCE($5::jsonb, '{}'::jsonb))`
  await runQuery(sql, [name, automationId ?? null, chatId ?? null, source || 'api', JSON.stringify(data ?? {})])
}

export const automacaoScheduledFn = inngest.createFunction(
  { id: 'automacao.sandbox.scheduled.log' },
  { event: 'automacao/sandbox/scheduled' },
  async ({ event, step }) => {
    const data = (event.data || {}) as any
    await step.run('log', async () => {
      await logEvent({ name: 'automacao/sandbox/scheduled', automationId: data.automation_id, chatId: data.chat_id, source: 'inngest', data })
    })
    return { ok: true }
  }
)

export const automacaoStartedFn = inngest.createFunction(
  { id: 'automacao.sandbox.started.log' },
  { event: 'automacao/sandbox/started' },
  async ({ event, step }) => {
    const data = (event.data || {}) as any
    await step.run('log', async () => {
      await logEvent({ name: 'automacao/sandbox/started', automationId: data.automation_id, chatId: data.chat_id, source: 'inngest', data })
    })
    return { ok: true }
  }
)

export { logEvent }

