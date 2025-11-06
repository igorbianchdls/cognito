import { generateText, type PrepareStepFunction, type Tool } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type { Graph, AgentBlockConfig, StepBlockConfig } from '@/types/agentes/builder'
import { collectTools } from '@/app/agentes/(internal)/codegen/helpers'
import { getToolsForIds, buildBuilderToolGuide } from '@/app/agentes/(internal)/runtime/tools'
import * as builderTools from '@/tools/agentbuilder'

export type ExecOptions = {
  temperature?: number
}

function getAgent(graph: Graph): Partial<AgentBlockConfig> {
  const ag = graph.blocks.find(b => b.kind === 'agente')
  const cfg = (ag?.config || {}) as Partial<AgentBlockConfig>
  return cfg
}

function getStep(graph: Graph): { count: number; maxSteps?: number; toolChoice?: 'auto' | 'none' | 'required'; prepareStepEnabled?: boolean } {
  const steps = graph.blocks.filter(b => b.kind === 'step')
  const first = steps[0]
  const cfg = (first?.config || {}) as Partial<StepBlockConfig>
  return {
    count: steps.length,
    maxSteps: cfg.maxSteps,
    toolChoice: cfg.toolChoice,
    prepareStepEnabled: cfg.prepareStepEnabled,
  }
}

function selectModel(providerModel: string | undefined) {
  const model = String(providerModel || 'anthropic/claude-3-5-sonnet-latest')
  const provider = model.includes('/') ? model.split('/')[0] : 'anthropic'
  const modelName = model.includes('/') ? model.split('/').slice(1).join('/') : model
  if (provider === 'openai') return openai(modelName)
  return anthropic(modelName)
}

function supportsAnthropicThinking(providerModel?: string) {
  const model = String(providerModel || '')
  const provider = model.includes('/') ? model.split('/')[0] : 'anthropic'
  const name = model.includes('/') ? model.split('/').slice(1).join('/') : model
  return provider === 'anthropic' && /(sonnet|opus)/i.test(name)
}

export async function execute(graph: Graph, input: string, opts?: ExecOptions): Promise<{ reply: string }> {
  const agent = getAgent(graph)
  const step = getStep(graph)
  const temperature = typeof opts?.temperature === 'number' ? opts!.temperature : (typeof agent.temperature === 'number' ? agent.temperature : 0.2)
  const toolsIds = collectTools(graph)
  let tools: Record<string, Tool> | undefined = undefined
  if (toolsIds.length) {
    const fromBuilder: Record<string, Tool> = {}
    const missing: string[] = []
    for (const id of toolsIds) {
      const candidate = (builderTools as Record<string, Tool | undefined>)[id]
      if (candidate) fromBuilder[id] = candidate
      else missing.push(id)
    }
    const fallback = missing.length ? getToolsForIds(missing) : {}
    tools = { ...fromBuilder, ...fallback }
  }

  const prepareStep: PrepareStepFunction | undefined = step.prepareStepEnabled
    ? (() => undefined)
    : undefined

  const system = [String(agent.systemPrompt || ''), buildBuilderToolGuide(toolsIds)].filter(Boolean).join('\n\n')

  const { text } = await generateText({
    model: selectModel(agent.model),
    system,
    prompt: input,
    temperature,
    ...(tools ? { tools } : {}),
    ...(step.count > 0 ? { maxToolRoundtrips: step.maxSteps ?? step.count } : {}),
    ...(step.toolChoice && step.toolChoice !== 'auto' ? { toolChoice: step.toolChoice } : {}),
    ...(prepareStep ? { prepareStep } : {}),
    ...(supportsAnthropicThinking(agent.model) ? { providerOptions: { anthropic: { thinking: { type: 'enabled', budgetTokens: 8000 } } } } : {}),
  })

  return { reply: text }
}
