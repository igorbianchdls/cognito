import type { AgentConfig } from "@/lib/agents/mappers/config"

// MVP stub: echoes back a simple reply using provided config
export async function runVisualAgent(config: AgentConfig, message: string): Promise<{ reply: string }> {
  const model = config.agent?.model || 'modelo-desconhecido'
  const sys = (config.agent?.systemPrompt || '').slice(0, 60)
  const hasTools = (config.tools?.length || 0) > 0
  const template = config.output?.template || '{{output}}'
  const base = `Agente (${model})${hasTools ? ' c/ ferramentas' : ''}: `
  const reply = `${base}${message}${sys ? ` | sys: ${sys}…` : ''}`
  // Apply template (very naive)
  return { reply: template.replace('{{output}}', reply) }
}

