import type { Graph } from '@/types/agentes/builder'
import { getFirstAgent, stringifyGraph, tsStringLiteral, getStepSettings, collectTools, getPrepareStepSettings } from './helpers'

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
  const BUILDER_SET = new Set(['echoTool','sumTool','pickFieldsTool','getWeather','getTime'])
  const builderIds = selectedToolIds.filter(id => BUILDER_SET.has(id))
  const stubIds = selectedToolIds.filter(id => !BUILDER_SET.has(id))

  const sanitize = (id: string) => id.replace(/[^A-Za-z0-9_]/g, '_')
  const testToolDecls = stubIds.map((id) => {
    const varName = `t_${sanitize(id)}`
    return `const ${varName} = tool({
  description: 'TEST:${id}',
  inputSchema: z.object({ payload: z.any().optional() }).optional(),
  execute: async (input) => ({ ok: true, test: true, id: '${id}', input }),
})`
  }).join('\n\n')
  const toolEntries: string[] = []
  for (const id of builderIds) toolEntries.push(id)
  for (const id of stubIds) toolEntries.push(`${id}: t_${sanitize(id)}`)
  const toolsObjectLiteral = toolEntries.length
    ? `{
        ${toolEntries.join(',\n        ')}
      }`
    : '{}'

  const needsStub = stubIds.length > 0
  const imports = `import { NextResponse } from 'next/server'
import { generateText${needsStub ? ', tool' : ''} } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'${importOpenAI ? "\nimport { openai } from '@ai-sdk/openai'" : ''}`
    + (builderIds.length ? `\nimport { ${builderIds.join(', ')} } from '@/tools/agentbuilder'` : '')
    + (needsStub ? `\nimport { z } from 'zod'` : '')

  // No additional imports required for prepareStep generation

  // Build extra tool usage instructions for builder tools
  const builderGuide = (() => {
    const hasWeather = builderIds.includes('getWeather')
    const hasTime = builderIds.includes('getTime')
    if (!hasWeather && !hasTime) return ''
    const lines: string[] = []
    lines.push('You can call the following tools to answer user questions. Prefer calling a tool when the user asks about these topics. Return concise, helpful answers using the tool results.')
    if (hasWeather) {
      lines.push('Tool: getWeather\nInput JSON: { "location": "City or place name" }\nUse when: the user asks about weather for a place.\nRespond with: temperature and a short condition summary.')
    }
    if (hasTime) {
      lines.push('Tool: getTime\nInput JSON: { "location"?: string, "timezone"?: string (IANA, e.g. "America/Sao_Paulo") }\nUse when: the user asks for local time.\nRespond with: local time and timezone.')
    }
    lines.push('If input is ambiguous, ask a brief clarifying question before calling a tool.')
    return lines.join('\n\n')
  })()

  const sysFinal = ["${sys}", "${tsStringLiteral(builderGuide)}"].filter(Boolean).join('\\n\\n')

  // PrepareStep node mapping → inline prepareStep function
  const prepCfg = getPrepareStepSettings(graph)
  const hasPrepareStep = !!prepCfg
  const compressAfter = (prepCfg && typeof prepCfg.compressAfterMessages === 'number') ? prepCfg.compressAfterMessages : undefined
  const keepLast = (prepCfg && typeof prepCfg.keepLastMessages === 'number') ? prepCfg.keepLastMessages : undefined
  const defaultTC = prepCfg?.defaultToolChoice === 'none' ? 'none' : 'auto'
  const prepareStepDecl = hasPrepareStep ? `const prepareStep = async ({ stepNumber, messages }) => {
      // Generated from PrepareStep node
      ${typeof compressAfter === 'number' ? `if (Array.isArray(messages) && messages.length > ${compressAfter}) {
        ${typeof keepLast === 'number' ? `return { messages: messages.slice(-${keepLast}) }` : `return { messages: messages.slice(-${compressAfter}) }`}
      }` : ''}
      ${defaultTC === 'none' ? `// Default tool choice (can be overridden per step)
      return { toolChoice: 'none' }` : ''}
      // TODO: override per step
      // if (stepNumber === 0) return { toolChoice: { type: 'tool', toolName: 'getTime' } }
      // if (stepNumber === 1) return { toolChoice: { type: 'tool', toolName: 'getWeather' } }
      return undefined
    }` : ''

  return `// Arquivo gerado automaticamente pelo Agent Builder (não editar manualmente)
// slug: ${slug}
${imports}

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
    ${needsStub ? `// TEST TOOLS (auto-generated for unknown ids)\n    ${testToolDecls}\n` : ''}
    ${hasPrepareStep ? prepareStepDecl : ''}
    const { text } = await generateText({
      model: selectModel(),
      system: "${sysFinal}",
      prompt,
      temperature,
      ${toolEntries.length ? `tools: ${toolsObjectLiteral},` : ''}
      ${step.toolChoice && step.toolChoice !== 'auto' ? `toolChoice: '${step.toolChoice}',` : ''}
      ${hasPrepareStep ? `prepareStep,` : ''}
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
