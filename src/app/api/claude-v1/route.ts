import { query } from '@anthropic-ai/claude-agent-sdk'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const prompt = searchParams.get('prompt') ?? 'What is 2 + 2?'

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    const q = query({
      prompt,
      options: { model: 'claude-sonnet-4-5-20250929' }
    })

    for await (const msg of q) {
      if (msg.type === 'result' && msg.subtype === 'success') {
        return Response.json({ text: msg.result ?? '' })
      }
      if (msg.type === 'result' && msg.is_error) {
        const errText = Array.isArray((msg as any).errors) ? (msg as any).errors.join('\n') : 'Falha ao gerar resposta.'
        return Response.json({ error: errText }, { status: 500 })
      }
    }
    return Response.json({ error: 'Sem resultado.' }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[claude-v1] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
