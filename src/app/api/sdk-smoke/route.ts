import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk'

export async function GET() {
  const result: any = await unstable_v2_prompt('What is 2 + 2?', {
    model: 'claude-sonnet-4-5-20250929'
  })
  return Response.json({ text: result.result })
}
