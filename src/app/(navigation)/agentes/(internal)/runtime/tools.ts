import type { Tool } from 'ai'

// Runtime legado de "agentes visuais" foi desativado.
// O produto usa apenas /chat com tools CRUD + drive + email.

export const TEST_TOOLS_MODE = false

export function getToolsByIds(_ids: string[]): Record<string, Tool> {
  return {}
}

export function getTestToolsByIds(_ids: string[]): Record<string, Tool> {
  return {}
}

export function getToolsForIds(_ids: string[]): Record<string, Tool> {
  return {}
}

export function buildBuilderToolGuide(_ids: string[]): string {
  return 'Visual Agents desativado. Use /chat com as tools crud, drive e email.'
}
