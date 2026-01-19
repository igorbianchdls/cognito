import { query } from '@anthropic-ai/claude-agent-sdk'
import { createRequire } from 'module'

export const runtime = 'nodejs'

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

    const require = createRequire(import.meta.url)
    const pathToCli = require.resolve('@anthropic-ai/claude-agent-sdk/cli.js')

    const q = query({
      prompt,
      options: {
        model: 'claude-sonnet-4-20250514',
        pathToClaudeCodeExecutable: pathToCli
      }
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
    return Response.json({ error: 'Sessão terminou sem resultado.' }, { status: 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('❌ /api/bigquery-test/ia-chat error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
