// Visual agents legacy mapping disabled.
// O produto agora usa /chat com tools CRUD/drive/email.

export type ToolImportSpec = {
  // Visual ID used in the builder (what the user types/selects)
  id: string
  // TS import path where the concrete tool is exported from
  importPath: string
  // The exported variable/function name in that module
  exportName: string
}

export const TOOL_IMPORTS: Record<string, ToolImportSpec> = {}

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
