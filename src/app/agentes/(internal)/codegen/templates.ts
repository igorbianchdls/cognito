import type { Graph } from '@/types/agentes/builder'
import { getFirstAgent, stringifyGraph, tsStringLiteral, getStepSettings } from './helpers'

export function genRouteTs(graph: Graph, slug: string): string {
  const agent = getFirstAgent(graph) || {}
  const model = String(agent.model || 'anthropic/claude-3-5-sonnet-latest')
  const sys = tsStringLiteral(agent.systemPrompt || '')
  const defaultTemp = (typeof agent.temperature === 'number' && !Number.isNaN(agent.temperature)) ? agent.temperature : 0.2

  const provider = model.includes('/') ? model.split('/')[0] : 'anthropic'
  const modelName = model.includes('/') ? model.split('/').slice(1).join('/') : model
  const importOpenAI = provider === 'openai'
  const step = getStepSettings(graph)

  const imports = `import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'${importOpenAI ? "\nimport { openai } from '@ai-sdk/openai'" : ''}`

  return `// Arquivo gerado automaticamente pelo Agent Builder (não editar manualmente)
// slug: ${slug}
${imports}
import type { PrepareStepFunction } from 'ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

function selectModel() {
  ${importOpenAI ? `if ('${provider}' === 'openai') return openai('${modelName}')` : ''}
  return anthropic('${provider === 'anthropic' ? modelName : 'claude-3-5-sonnet-latest'}')
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { message?: string; temperature?: number }
    const prompt = String(body?.message ?? '')
    const temperature = typeof body?.temperature === 'number' ? body.temperature : ${defaultTemp}
    ${step.prepareStepEnabled ? `const prepareStep: PrepareStepFunction = ({ steps, stepNumber, model, messages }) => { /* TODO: customize step */ return undefined }` : ''}
    const { text } = await generateText({
      model: selectModel(),
      system: "${sys}",
      prompt,
      temperature,
      // Passo-a-passo gerado pelo builder (STEP nodes): ${'${'}String(${step.count})${'}'}
      ${step.count > 0 ? `maxToolRoundtrips: ${step.maxSteps ?? step.count},` : ''}
      ${step.toolChoice && step.toolChoice !== 'auto' ? `toolChoice: '${step.toolChoice}',` : ''}
      ${step.prepareStepEnabled ? `prepareStep,` : ''}
      ${provider === 'anthropic' ? `providerOptions: { anthropic: { thinking: { type: 'enabled', budgetTokens: 8000 } } },` : ''}
    })
    return NextResponse.json({ reply: text })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
`
}

export function genDefinitionJson(graph: Graph): string {
  return stringifyGraph(graph)
}
