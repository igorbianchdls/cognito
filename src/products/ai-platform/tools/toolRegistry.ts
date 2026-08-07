import type { AiToolDefinition } from '@/products/ai-platform/shared/types'
import { ERP_AI_TOOLS } from '@/products/ai-platform/tools/erpTools'

const registry = new Map<string, AiToolDefinition<Record<string, unknown>>>()

for (const tool of ERP_AI_TOOLS) {
  if (registry.has(tool.name)) throw new Error(`Ferramenta duplicada: ${tool.name}`)
  if (/stock|estoque|fiscal|invoice|nota_fiscal/i.test(tool.name)) {
    throw new Error(`Ferramenta fora do escopo atual: ${tool.name}`)
  }
  registry.set(tool.name, tool)
}

export function getAiTool(name: string) {
  return registry.get(name)
}

export function listAiTools() {
  return [...registry.values()]
}
