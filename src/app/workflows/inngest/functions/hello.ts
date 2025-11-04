import { inngest } from '@/app/workflows/inngest/client'

// Simple function to validate Inngest integration
export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'app/hello' },
  async ({ step, event }) => {
    await step.run('Log incoming event', async () => {
      console.log('Inngest hello-world received:', JSON.stringify(event, null, 2))
    })

    return {
      ok: true,
      received: event.data ?? null,
      ts: new Date().toISOString(),
    }
  }
)

