import type { Graph } from '@/types/agentes/builder'
import { getFirstAgent, stringifyGraph, tsStringLiteral, getStepSettings, collectTools, getPrepareStepSettings, getStopWhenSettings, getOrderedSteps } from './helpers'

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
  const stopCfg = getStopWhenSettings(graph)
  const needsStopWhen = !!stopCfg && ((typeof stopCfg.stepLimit === 'number') || (stopCfg.stopOnTools && stopCfg.stopOnTools.length > 0))

  const imports = `import { NextResponse } from 'next/server'
import { generateText${needsStub ? ', tool' : ''}${needsStopWhen ? ', stepCountIs, hasToolCall' : ''} } from 'ai'
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

  const sysFinal = [sys, tsStringLiteral(builderGuide)].filter(Boolean).join('\\n\\n')

  // PrepareStep node mapping → inline prepareStep function
  const prepCfg = getPrepareStepSettings(graph)
  const hasPrepareStep = !!prepCfg
  const compressAfter = (prepCfg && typeof prepCfg.compressAfterMessages === 'number') ? prepCfg.compressAfterMessages : undefined
  const keepLast = (prepCfg && typeof prepCfg.keepLastMessages === 'number') ? prepCfg.keepLastMessages : undefined
  const defaultTC = prepCfg?.defaultToolChoice === 'none' ? 'none' : 'auto'
  const BASE_SYSTEM_DECL = `const BASE_SYSTEM = "${sysFinal}"`
  const orderedSteps = getOrderedSteps(graph)
  const stepSystemDecls = orderedSteps.map((cfg, idx) => {
    const sysText = cfg.systemText
    const sysMode = cfg.systemMode
    if (!sysText || !sysText.trim()) return ''
    const escaped = tsStringLiteral(sysText)
    if (sysMode === 'replace') return `const STEP_BASE_SYSTEM_${idx} = "${escaped}"`
    return `const STEP_APPEND_SYSTEM_${idx} = "${escaped}"`
  }).filter(Boolean).join('\n')

  // Step-specific tools subsets
  const stepToolDecls = orderedSteps.map((cfg, idx) => {
    const ids = Array.isArray((cfg as any).stepTools) ? (cfg as any).stepTools as string[] : []
    if (!ids.length) return ''
    const entries = ids.map(id => {
      const isBuilder = BUILDER_SET.has(id)
      const varName = isBuilder ? id : `t_${sanitize(id)}`
      return (isBuilder ? `${id}` : `${id}: ${varName}`)
    }).join(', ')
    return `const STEP_TOOLS_${idx} = { ${entries} }`
  }).filter(Boolean).join('\n')

  const stepCases = orderedSteps.map((cfg, idx) => {
    const cases: string[] = []
    const tc = cfg.toolChoice
    const forced = cfg.forcedToolName
    if (forced && forced.trim()) {
      cases.push(`return { toolChoice: { type: 'tool', toolName: '${tsStringLiteral(forced.trim())}' } }`)
    } else if (tc && tc !== 'auto') {
      cases.push(`return { toolChoice: '${tc}' }`)
    }
    const sysText = cfg.systemText
    const sysMode = cfg.systemMode
    if (sysText && sysText.trim()) {
      if (sysMode === 'replace') cases.push(`return { system: STEP_BASE_SYSTEM_${idx} }`)
      else cases.push(`return { system: BASE_SYSTEM + "\\n\\n" + STEP_APPEND_SYSTEM_${idx} }`)
    }
    if (cases.length === 0) return ''
    return `if (stepNumber === ${idx}) { ${cases[0]} }`
  }).filter(Boolean).join('\n      ')

  const needPrepareFunc = hasPrepareStep || stepCases.length > 0 || stepToolDecls.length > 0
  const prepareStepDecl = needPrepareFunc ? `const prepareStep = async ({ stepNumber, messages }) => {
      // Generated from PrepareStep + Step nodes
      ${typeof compressAfter === 'number' ? `if (Array.isArray(messages) && messages.length > ${compressAfter}) {
        ${typeof keepLast === 'number' ? `return { messages: messages.slice(-${keepLast}) }` : `return { messages: messages.slice(-${compressAfter}) }`}
      }` : ''}
      const r = {};
      // Per-step overrides from Step nodes
      ${orderedSteps.map((cfg, idx) => {
        const parts: string[] = []
        const forced = cfg.forcedToolName
        const tc = cfg.toolChoice
        const sysText = cfg.systemText
        const sysMode = cfg.systemMode
        const hasTools = Array.isArray((cfg as any).stepTools) && ((cfg as any).stepTools as string[]).length > 0
        const body: string[] = []
        if (forced && forced.trim()) body.push(`r.toolChoice = { type: 'tool', toolName: '${tsStringLiteral(forced.trim())}' }`)
        else if (tc && tc !== 'auto') body.push(`r.toolChoice = '${tc}'`)
        if (sysText && sysText.trim()) body.push(sysMode === 'replace' ? `r.system = STEP_BASE_SYSTEM_${idx}` : `r.system = BASE_SYSTEM + "\\n\\n" + STEP_APPEND_SYSTEM_${idx}`)
        if (hasTools) body.push(`r.tools = STEP_TOOLS_${idx}`)
        if (body.length === 0) return ''
        return `if (stepNumber === ${idx}) { ${body.join('; ')} }`
      }).filter(Boolean).join('\n      ')}
      ${defaultTC === 'none' ? `if (!('toolChoice' in r)) { r.toolChoice = 'none' }` : ''}
      if (Object.keys(r).length) return r
      return undefined
    }` : ''

  // Build stopWhen from StopWhen node
  const stopParts: string[] = []
  if (stopCfg) {
    if (typeof stopCfg.stepLimit === 'number' && stopCfg.stepLimit > 0) {
      stopParts.push(`stepCountIs(${stopCfg.stepLimit})`)
    }
    if (Array.isArray(stopCfg.stopOnTools)) {
      for (const t of stopCfg.stopOnTools) {
        if (t && typeof t === 'string') stopParts.push(`hasToolCall('${t}')`)
      }
    }
  }
  const stopWhenLine = stopParts.length ? `stopWhen: [${stopParts.join(', ')}],` : ''

  // stepCases defined above

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
    // Base system and per-step systems
    ${BASE_SYSTEM_DECL}
    ${stepSystemDecls}
    ${stepToolDecls}
    ${needPrepareFunc ? prepareStepDecl : ''}
    const { text } = await generateText({
      model: selectModel(),
      system: BASE_SYSTEM,
      prompt,
      temperature,
      ${toolEntries.length ? `tools: ${toolsObjectLiteral},` : ''}
      ${stopWhenLine}
      ${step.toolChoice && step.toolChoice !== 'auto' ? `toolChoice: '${step.toolChoice}',` : ''}
      ${needPrepareFunc ? `prepareStep,` : ''}
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
