import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk'

export async function GET() {
  try {
    const result: any = await unstable_v2_prompt('What is 2 + 2?', {
      model: 'claude-sonnet-4-5-20250929'
    })
    return Response.json({ text: result.result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sdk-smoke] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
