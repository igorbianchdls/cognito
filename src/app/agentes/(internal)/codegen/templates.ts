import type { Graph } from '@/types/agentes/builder'
import { getFirstAgent, stringifyGraph, tsStringLiteral, getStepSettings, collectTools } from './helpers'
import { buildToolImports } from './tool-map'

export function genRouteTs(graph: Graph, slug: string): string {
  const agent = getFirstAgent(graph) || {}
  const model = String(agent.model || 'anthropic/claude-3-5-sonnet-latest')
  const sys = tsStringLiteral(agent.systemPrompt || '')
  const defaultTemp = (typeof agent.temperature === 'number' && !Number.isNaN(agent.temperature)) ? agent.temperature : 0.2

  const provider = model.includes('/') ? model.split('/')[0] : 'anthropic'
  const modelName = model.includes('/') ? model.split('/').slice(1).join('/') : model
  const importOpenAI = provider === 'openai'
  const step = getStepSettings(graph)

  const selectedToolIds = collectTools(graph)

  // Modo TESTE: gerar tools stub inline
  const sanitize = (id: string) => id.replace(/[^A-Za-z0-9_]/g, '_')
  const testToolDecls = selectedToolIds.map((id) => {
    const varName = `t_${sanitize(id)}`
    return `const ${varName} = tool({
  description: 'TEST:${id}',
  inputSchema: z.object({ payload: z.any().optional() }).optional(),
  execute: async (input) => ({ ok: true, test: true, id: '${id}', input }),
})`
  }).join('\n\n')
  const toolsObjectLiteral = selectedToolIds.length
    ? `{
        ${selectedToolIds.map((id) => `${id}: t_${sanitize(id)}`).join(',\n        ')}
      }`
    : '{}'

  const imports = `import { NextResponse } from 'next/server'
import { generateText, tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'${importOpenAI ? "\nimport { openai } from '@ai-sdk/openai'" : ''}`
    + (selectedToolIds.length ? `\nimport { z } from 'zod'` : '')

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
    ${step.prepareStepEnabled ? `const prepareStep: PrepareStepFunction = () => undefined` : ''}
    ${selectedToolIds.length ? `// TEST TOOLS (auto-generated)
    ${testToolDecls}
` : ''}
    const { text } = await generateText({
      model: selectModel(),
      system: "${sys}",
      prompt,
      temperature,
      ${selectedToolIds.length ? `tools: ${toolsObjectLiteral},` : ''}
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
