import { inngest } from '@/app/workflows/inngest/client'

// Demo workflow function (artificial) for bigquery-test
export const bigqueryTestDemo = inngest.createFunction(
  { id: 'bigquery-test-demo' },
  { event: 'app/bigquery-test/demo' },
  async ({ step, event }) => {
    const payload = event.data as Record<string, unknown> | undefined

    await step.run('Validar payload', async () => {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload ausente ou inválido')
      }
    })

    const transformed = await step.run('Transformar dados', async () => {
      const email = String(payload?.email ?? 'unknown@example.com').toLowerCase()
      const message = String(payload?.message ?? 'Hello from demo')
      const nonce = String(payload?.nonce ?? Math.random().toString(36).slice(2))
      return { email, message, nonce }
    })

    await step.run('Persistir mock (log)', async () => {
      console.log('[bigquery-test-demo] transformed:', transformed)
    })

    return {
      ok: true,
      receivedAt: new Date().toISOString(),
      received: payload ?? null,
      transformed,
    }
  }
)

