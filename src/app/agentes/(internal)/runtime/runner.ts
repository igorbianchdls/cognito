import { generateText, type PrepareStepFunction } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import type { Graph, AgentBlockConfig, StepBlockConfig } from '@/types/agentes/builder'

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

export async function execute(graph: Graph, input: string, opts?: ExecOptions): Promise<{ reply: string }> {
  const agent = getAgent(graph)
  const step = getStep(graph)
  const temperature = typeof opts?.temperature === 'number' ? opts!.temperature : (typeof agent.temperature === 'number' ? agent.temperature : 0.2)

  const prepareStep: PrepareStepFunction | undefined = step.prepareStepEnabled
    ? (() => undefined)
    : undefined

  const { text } = await generateText({
    model: selectModel(agent.model),
    system: String(agent.systemPrompt || ''),
    prompt: input,
    temperature,
    ...(step.count > 0 ? { maxToolRoundtrips: step.maxSteps ?? step.count } : {}),
    ...(step.toolChoice && step.toolChoice !== 'auto' ? { toolChoice: step.toolChoice } : {}),
    ...(prepareStep ? { prepareStep } : {}),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 8000 },
      },
    },
  })

  return { reply: text }
}

