import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk'
import { createRequire } from 'module'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const require = createRequire(import.meta.url)
    const cli = require.resolve('@anthropic-ai/claude-code/cli.js')

    const result: any = await unstable_v2_prompt('What is 2 + 2?', {
      model: 'claude-sonnet-4-5-20250929',
      pathToClaudeCodeExecutable: cli
    })

    return Response.json({ text: result.result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sdk-smoke] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
