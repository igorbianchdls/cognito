import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk'

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({})) as { prompt?: string }
    const prompt = (body?.prompt ?? '').toString().trim()
    if (!prompt) {
      return Response.json({ error: 'prompt é obrigatório' }, { status: 400 })
    }

    const result = await unstable_v2_prompt(prompt, {
      model: 'claude-sonnet-4-20250514'
    })

    return Response.json({ text: result.result ?? '' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ /api/bigquery-test/ia-chat error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

