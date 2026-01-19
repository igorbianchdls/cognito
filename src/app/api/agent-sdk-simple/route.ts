import { query } from '@anthropic-ai/claude-agent-sdk'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const prompt = searchParams.get('prompt') ?? 'Your prompt here'

    const q = query({
      prompt,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        executable: 'node'
      }
    })

    for await (const message of q) {
      if (message.type === 'result' && message.subtype === 'success') {
        return Response.json({ text: message.result ?? '' })
      }
      if (message.type === 'result' && message.is_error) {
        const errText = Array.isArray((message as any).errors) ? (message as any).errors.join('\n') : 'Falha ao gerar resposta.'
        return Response.json({ error: errText }, { status: 500 })
      }
    }

    return Response.json({ error: 'Sem resultado.' }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}

