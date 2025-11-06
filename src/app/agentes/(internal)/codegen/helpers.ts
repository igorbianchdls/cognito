import type { Graph, Block, BlockKind, AgentBlockConfig, ToolBlockConfig, ResponseBlockConfig, ConditionBlockConfig, StepBlockConfig } from '@/types/agentes/builder'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'agente-visual'
}

export function collectTools(graph: Graph): string[] {
  const tools = new Set<string>()
  for (const b of graph.blocks) {
    if (b.kind === 'ferramenta') {
      const cfg = (b.config || {}) as Partial<ToolBlockConfig>
      if (Array.isArray(cfg.toolIds)) {
        for (const id of cfg.toolIds) {
          if (typeof id === 'string' && id.trim()) tools.add(id.trim())
        }
      }
    }
    if (b.kind === 'agente') {
      // Permite que o Agent armazene toolIds diretamente no config
      const acfg = (b.config || {}) as Record<string, unknown>
      const ids = Array.isArray(acfg.toolIds) ? acfg.toolIds : []
      for (const id of ids) {
        if (typeof id === 'string' && id.trim()) tools.add(id.trim())
      }
    }
  }
  return Array.from(tools)
}

export function getFirstAgent(graph: Graph): { model?: string; systemPrompt?: string; temperature?: number } | null {
  const block = graph.blocks.find(b => b.kind === 'agente')
  if (!block) return null
  const cfg = (block.config || {}) as Partial<AgentBlockConfig>
  return { model: cfg.model, systemPrompt: cfg.systemPrompt, temperature: cfg.temperature }
}

export function getResponseTemplate(graph: Graph): string {
  const block = graph.blocks.find(b => b.kind === 'resposta')
  const cfg = (block?.config || {}) as Partial<ResponseBlockConfig>
  return (cfg.template && String(cfg.template)) || '{{output}}'
}

export function validateGraph(graph: Graph): { warnings: string[]; hasAgent: boolean; hasResponse: boolean } {
  const warnings: string[] = []
  const hasAgent = graph.blocks.some(b => b.kind === 'agente')
  const hasResponse = graph.blocks.some(b => b.kind === 'resposta')
  if (!hasAgent) warnings.push('Nenhum bloco "Agente" encontrado — model/systemPrompt ausentes (usando defaults).')
  if (!hasResponse) warnings.push('Nenhum bloco "Resposta" encontrado — usando template padrão {{output}}.')
  const steps = graph.blocks.filter(b => b.kind === 'step').length
  if (steps === 0) warnings.push('Nenhum bloco "STEP" encontrado — execuções em passo único.')
  for (const b of graph.blocks) {
    if (b.kind === 'condicao') {
      const cfg = (b.config || {}) as Partial<ConditionBlockConfig>
      if (!cfg.expression) {
        warnings.push(`Condição ${b.id} sem expressão — será tratada como false.`)
      }
    }
  }
  return { warnings, hasAgent, hasResponse }
}

export function stringifyGraph(graph: Graph): string {
  // Serialize with stable order
  const replacer = (_key: string, value: unknown) => value
  return JSON.stringify(graph, replacer, 2)
}

export function getStepSettings(graph: Graph): { maxSteps?: number; toolChoice?: 'auto' | 'none' | 'required'; prepareStepEnabled?: boolean; count: number } {
  const steps = graph.blocks.filter(b => b.kind === 'step')
  const count = steps.length
  if (steps.length === 0) return { count }
  const cfg = (steps[0].config || {}) as Partial<StepBlockConfig>
  return {
    count,
    maxSteps: cfg.maxSteps,
    toolChoice: cfg.toolChoice,
    prepareStepEnabled: cfg.prepareStepEnabled,
  }
}

export function tsStringLiteral(value: string): string {
  // Escape backticks and ${ in template literals if needed; but we use regular strings
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"')
}
