// Static mapping between visual tool IDs and actual module exports.
// Used only for code generation (strings), not to import runtime values here.

export type ToolImportSpec = {
  // Visual ID used in the builder (what the user types/selects)
  id: string
  // TS import path where the concrete tool is exported from
  importPath: string
  // The exported variable/function name in that module
  exportName: string
}

// Minimal initial catalog. Extend as new tools are added.
export const TOOL_IMPORTS: Record<string, ToolImportSpec> = {
  // Web Analytics
  getAnalyticsData: { id: 'getAnalyticsData', importPath: "@/tools/analyticsTools", exportName: 'getAnalyticsData' },
  createDashboardTool: { id: 'createDashboardTool', importPath: "@/tools/apps/createDashboardTool", exportName: 'createDashboardTool' },

  // Contabilidade
  listarLancamentosContabeis: { id: 'listarLancamentosContabeis', importPath: "@/tools/contabilidadeTools", exportName: 'listarLancamentosContabeis' },
  gerarDRE: { id: 'gerarDRE', importPath: "@/tools/contabilidadeTools", exportName: 'gerarDRE' },
  gerarBalancoPatrimonial: { id: 'gerarBalancoPatrimonial', importPath: "@/tools/contabilidadeTools", exportName: 'gerarBalancoPatrimonial' },

  // NF-e (UI id → export name mapping)
  listarNFe: { id: 'listarNFe', importPath: "@/tools/nfeTools", exportName: 'getNotasFiscais' },

  // Inventory (selected analytical tools already present in agents)
  avaliacaoCustoInventario: { id: 'avaliacaoCustoInventario', importPath: "@/tools/inventoryTools", exportName: 'avaliacaoCustoInventario' },
  calculateInventoryMetrics: { id: 'calculateInventoryMetrics', importPath: "@/tools/inventoryTools", exportName: 'calculateInventoryMetrics' },
  abcDetalhadaProduto: { id: 'abcDetalhadaProduto', importPath: "@/tools/inventoryTools", exportName: 'abcDetalhadaProduto' },
  analiseDOS: { id: 'analiseDOS', importPath: "@/tools/inventoryTools", exportName: 'analiseDOS' },
  abcResumoGerencial: { id: 'abcResumoGerencial', importPath: "@/tools/inventoryTools", exportName: 'abcResumoGerencial' },

  // Serviços
  listarOrdensDeServico: { id: 'listarOrdensDeServico', importPath: "@/tools/servicosTools", exportName: 'listarOrdensDeServico' },
  listarTecnicos: { id: 'listarTecnicos', importPath: "@/tools/servicosTools", exportName: 'listarTecnicos' },
  listarAgendamentos: { id: 'listarAgendamentos', importPath: "@/tools/servicosTools", exportName: 'listarAgendamentos' },
  listarCatalogoDeServicos: { id: 'listarCatalogoDeServicos', importPath: "@/tools/servicosTools", exportName: 'listarCatalogoDeServicos' },

  // Funcionários (UI id → export name mapping)
  listarFuncionarios: { id: 'listarFuncionarios', importPath: "@/tools/funcionariosV2Tools", exportName: 'listarFuncionariosRH' },
  listarDepartamentos: { id: 'listarDepartamentos', importPath: "@/tools/funcionariosV2Tools", exportName: 'listarDepartamentosRH' },
}

export function resolveToolIds(ids: string[]) {
  const resolved: { [importPath: string]: string[] } = {}
  const missing: string[] = []
  for (const id of ids) {
    const spec = TOOL_IMPORTS[id]
    if (!spec) { missing.push(id); continue }
    if (!resolved[spec.importPath]) resolved[spec.importPath] = []
    resolved[spec.importPath].push(spec.exportName)
  }
  return { groups: resolved, missing }
}

export function buildToolImports(ids: string[]): { importLines: string; toolsObjectLiteral: string; missing: string[] } {
  const { groups, missing } = resolveToolIds(ids)
  const importLines: string[] = []
  const entries: string[] = []

  // Build import lines grouped by module
  for (const importPath of Object.keys(groups)) {
    const names = Array.from(new Set(groups[importPath])).sort()
    importLines.push(`import { ${names.join(', ')} } from '${importPath}'`)
  }

  // Build tools object literal entries
  for (const id of ids) {
    const spec = TOOL_IMPORTS[id]
    if (!spec) continue
    if (spec.exportName === id) entries.push(id)
    else entries.push(`${id}: ${spec.exportName}`)
  }

  const toolsObjectLiteral = entries.length ? `{
        ${entries.join(',\n        ')}
      }` : '{}'

  return { importLines: importLines.join('\n'), toolsObjectLiteral, missing }
}
