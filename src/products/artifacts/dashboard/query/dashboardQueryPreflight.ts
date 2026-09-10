import ts from 'typescript'
import { DASHBOARD_QUERY_RETIRED_CODE, DASHBOARD_QUERY_RETIRED_MESSAGE } from '@/products/artifacts/dashboard/query/dashboardQueryPolicy'
export type DashboardQueryPreflightItem = {
  componentId: string | null; componentType: string; queryName: string
  ok: boolean; status: 'error'; code: string; message: string; rowCount: number; columns: string[]
}
export type DashboardQueryPreflightReport = {
  ok: boolean; status: 'success' | 'error'; total: number; success: number
  empty: number; error: number; skipped: number; items: DashboardQueryPreflightItem[]
}
// Static validation only; query expressions are never evaluated.
export function extractDashboardDataQueries(source: string) {
  const file = ts.createSourceFile('dashboard.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const items: DashboardQueryPreflightItem[] = []
  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const componentType = node.tagName.getText(file)
      const properties = node.attributes.properties
      const hasQuery = properties.some(p => ts.isJsxAttribute(p) && ['query', 'dataQuery'].includes(p.name.getText(file)))
      if (hasQuery || componentType === 'Query' || componentType.endsWith('.Query')) {
        const id = properties.find(p => ts.isJsxAttribute(p) && p.name.getText(file) === 'id')
        const componentId = id && ts.isJsxAttribute(id) && id.initializer && ts.isStringLiteral(id.initializer) ? id.initializer.text : null
        items.push({ componentId, componentType, queryName: componentId || componentType,
          ok: false, status: 'error', code: DASHBOARD_QUERY_RETIRED_CODE,
          message: DASHBOARD_QUERY_RETIRED_MESSAGE, rowCount: 0, columns: [] })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(file)
  return items
}
export function preflightDashboardQueries(input: { source: string; artifactId?: string; tenantId?: number; actorId?: number | null }): DashboardQueryPreflightReport {
  const items = extractDashboardDataQueries(input.source)
  return { ok: items.length === 0, status: items.length ? 'error' : 'success', total: items.length,
    success: 0, empty: 0, error: items.length, skipped: 0, items }
}
