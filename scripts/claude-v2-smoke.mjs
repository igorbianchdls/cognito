import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const cli = require.resolve('@anthropic-ai/claude-code/cli.js')

try {
  const result = await unstable_v2_prompt('What is 2 + 2?', {
    model: 'claude-sonnet-4-5-20250929',
    pathToClaudeCodeExecutable: cli
  })

  if (result.type === 'result' && result.subtype === 'success') {
    console.log(result.result ?? '')
  } else {
    console.error('Unexpected result')
    process.exit(1)
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
}

