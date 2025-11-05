import type { Graph, AgentBlockConfig, ToolBlockConfig, ResponseBlockConfig } from "@/types/agentes/builder"

export type AgentConfig = {
  agent?: {
    model?: string
    systemPrompt?: string
  }
  tools?: string[]
  output?: { template?: string }
}

export function mapGraphToConfig(graph: Graph): AgentConfig {
  const cfg: AgentConfig = {}
  const byId = new Map(graph.blocks.map(b => [b.id, b] as const))

  // Find first agent block
  const agentBlock = graph.blocks.find(b => b.kind === 'agente')
  if (agentBlock) {
    const acfg = (agentBlock.config || {}) as Partial<AgentBlockConfig>
    cfg.agent = {
      model: acfg.model,
      systemPrompt: acfg.systemPrompt,
    }
  }

  // Gather tools
  const toolsBlock = graph.blocks.find(b => b.kind === 'ferramenta')
  if (toolsBlock) {
    const tcfg = (toolsBlock.config || {}) as Partial<ToolBlockConfig>
    cfg.tools = Array.isArray(tcfg.toolIds) ? tcfg.toolIds : []
  }

  // Response template
  const respBlock = graph.blocks.find(b => b.kind === 'resposta')
  if (respBlock) {
    const rcfg = (respBlock.config || {}) as Partial<ResponseBlockConfig>
    cfg.output = { template: rcfg.template }
  }

  return cfg
}
