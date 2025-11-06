import { convertToModelMessages, streamText, type UIMessage, type Tool } from 'ai'
import { NextResponse } from 'next/server'
import type { Graph, AgentBlockConfig, StepBlockConfig } from '@/types/agentes/builder'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { collectTools } from '@/app/agentes/(internal)/codegen/helpers'
import { getToolsForIds, buildBuilderToolGuide } from '@/app/agentes/(internal)/runtime/tools'
import * as builderTools from '@/tools/agentbuilder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function selectModel(providerModel?: string) {
  const model = String(providerModel || 'anthropic/claude-3-5-sonnet-latest')
  const provider = model.includes('/') ? model.split('/')[0] : 'anthropic'
  const modelName = model.includes('/') ? model.split('/').slice(1).join('/') : model
  if (provider === 'openai') return openai(modelName)
  return anthropic(modelName)
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { graph: Graph; messages: UIMessage[] }
    const { graph, messages } = body
    if (!graph || !messages) return NextResponse.json({ error: 'Missing graph or messages' }, { status: 400 })

    const ag = graph.blocks.find(b => b.kind === 'agente')
    const agent = (ag?.config || {}) as Partial<AgentBlockConfig>
    const steps = graph.blocks.filter(b => b.kind === 'step')
    const stepCfg = (steps[0]?.config || {}) as Partial<StepBlockConfig>

    const toolIds = collectTools(graph)
    let tools: Record<string, Tool> | undefined = undefined
    if (toolIds.length) {
      const fromBuilder: Record<string, Tool> = {}
      const missing: string[] = []
      for (const id of toolIds) {
        const candidate = (builderTools as Record<string, Tool | undefined>)[id]
        if (candidate) fromBuilder[id] = candidate
        else missing.push(id)
      }
      const fallback = missing.length ? getToolsForIds(missing) : {}
      tools = { ...fromBuilder, ...fallback }
    }

    const system = [String(agent.systemPrompt || ''), buildBuilderToolGuide(toolIds)].filter(Boolean).join('\n\n')

    const result = streamText({
      model: selectModel(agent.model),
      system,
      messages: convertToModelMessages(messages),
      temperature: typeof agent.temperature === 'number' ? agent.temperature : 0.2,
      ...(tools ? { tools } : {}),
      ...(steps.length > 0 ? { maxToolRoundtrips: stepCfg.maxSteps ?? steps.length } : {}),
      ...(stepCfg.toolChoice && stepCfg.toolChoice !== 'auto' ? { toolChoice: stepCfg.toolChoice } : {}),
      ...(stepCfg.prepareStepEnabled ? { prepareStep: () => undefined } : {}),
      providerOptions: {
        anthropic: { thinking: { type: 'enabled', budgetTokens: 8000 } }
      }
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
