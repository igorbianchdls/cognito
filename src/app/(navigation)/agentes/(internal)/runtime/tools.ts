import type { Tool } from 'ai'
import { tool } from 'ai'
import { z } from 'zod'

// Import concrete tool implementations
import { getAnalyticsData } from '@/tools/analyticsTools'
import { createDashboardTool } from '@/tools/apps/createDashboardTool'
import { listarLancamentosContabeis, gerarDRE, gerarBalancoPatrimonial } from '@/tools/contabilidadeTools'
import { getNotasFiscais } from '@/tools/nfeTools'
import { avaliacaoCustoInventario, calculateInventoryMetrics, abcDetalhadaProduto, analiseDOS, abcResumoGerencial } from '@/tools/inventoryTools'
import { listarOrdensDeServico, listarTecnicos, listarAgendamentos, listarCatalogoDeServicos } from '@/tools/servicosTools'
import { listarFuncionariosRH, listarDepartamentosRH } from '@/tools/funcionariosV2Tools'

// Build a registry keyed by the visual "id" used in the builder
const REGISTRY: Record<string, Tool> = {
  // Web Analytics
  getAnalyticsData,
  createDashboardTool,

  // Contabilidade
  listarLancamentosContabeis,
  gerarDRE,
  gerarBalancoPatrimonial,

  // NF-e (alias id → concrete tool)
  listarNFe: getNotasFiscais,

  // Inventory
  avaliacaoCustoInventario,
  calculateInventoryMetrics,
  abcDetalhadaProduto,
  analiseDOS,
  abcResumoGerencial,

  // Serviços
  listarOrdensDeServico,
  listarTecnicos,
  listarAgendamentos,
  listarCatalogoDeServicos,

  // Funcionários
  listarFuncionarios: listarFuncionariosRH,
  listarDepartamentos: listarDepartamentosRH,
}

export function getToolsByIds(ids: string[]): Record<string, Tool> {
  const obj: Record<string, Tool> = {}
  for (const id of ids) {
    const t = REGISTRY[id]
    if (t) obj[id] = t
  }
  return obj
}

// Test mode (default ON). Set AGENTS_TEST_TOOLS=false to disable stubs.
export const TEST_TOOLS_MODE = process.env.AGENTS_TEST_TOOLS !== 'false'

function createTestTool(id: string): Tool {
  return tool({
    description: `TEST:${id}`,
    inputSchema: z.object({ payload: z.any().optional() }).optional(),
    execute: async (input) => ({ ok: true, test: true, id, input }),
  })
}

export function getTestToolsByIds(ids: string[]): Record<string, Tool> {
  const obj: Record<string, Tool> = {}
  for (const id of ids) obj[id] = createTestTool(id)
  return obj
}

export function getToolsForIds(ids: string[]): Record<string, Tool> {
  return TEST_TOOLS_MODE ? getTestToolsByIds(ids) : getToolsByIds(ids)
}

export function buildBuilderToolGuide(ids: string[]): string {
  const hasWeather = ids.includes('getWeather')
  const hasTime = ids.includes('getTime')
  if (!hasWeather && !hasTime) return ''
  const parts: string[] = []
  parts.push(
    'You can call the following tools to answer user questions. Prefer calling a tool when the user asks about these topics. Return concise, helpful answers using the tool results. '
  )
  if (hasWeather) {
    parts.push(
      `Tool: getWeather
Input JSON: { "location": "City or place name" }
Use when: the user asks about weather for a place.
Respond with: temperature and a short condition summary.`
    )
  }
  if (hasTime) {
    parts.push(
      `Tool: getTime
Input JSON: { "location"?: string, "timezone"?: string (IANA, e.g. "America/Sao_Paulo") }
Use when: the user asks for local time.
Respond with: local time and timezone.`
    )
  }
  parts.push('If input is ambiguous, ask a brief clarifying question before calling a tool.')
  return parts.join('\n\n')
}
