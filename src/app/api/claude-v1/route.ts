import { query } from '@anthropic-ai/claude-agent-sdk'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const prompt = searchParams.get('prompt') ?? 'What is 2 + 2?'

  const q = query({
    prompt,
    options: { model: 'claude-sonnet-4-5-20250929' }
  })

  for await (const msg of q) {
    if (msg.type === 'result' && msg.subtype === 'success') {
      return Response.json({ text: msg.result })
    }
  }
  return Response.json({ error: 'Sem resultado.' }, { status: 500 })
}

