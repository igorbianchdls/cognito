import ts from 'typescript'

import { ArtifactToolError } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { executeDashboardQuery } from '@/products/artifacts/dashboard/query/dashboardQueryService'

type JsonRecord = Record<string, unknown>

export type DashboardQueryPreflightItem = {
  componentId: string | null
  componentType: string
  queryName: string
  ok: boolean
  status: 'success' | 'empty' | 'error'
  code: string
  message: string | null
  rowCount: number
  columns: string[]
  durationMs?: number
  bytesProcessed?: number
  details?: unknown
}

export type DashboardQueryPreflightReport = {
  ok: boolean
  status: 'success' | 'partial_error' | 'error'
  total: number
  success: number
  empty: number
  error: number
  skipped: number
  items: DashboardQueryPreflightItem[]
}

export type ExtractedDashboardQuery = {
  componentId: string | null
  componentType: string
  queryName: string
  query: string
  limit: number
  filters: JsonRecord
}

function literalText(node: ts.Expression | undefined): string | null {
  if (!node) return null
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  return null
}

function numericLiteral(node: ts.Expression | undefined): number | null {
  if (!node) return null
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text)
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value
  }
  return null
}

function getJsxTagName(tagName: ts.JsxTagNameExpression) {
  if (ts.isIdentifier(tagName)) return tagName.text
  if (ts.isPropertyAccessExpression(tagName)) return tagName.name.text
  return tagName.getText()
}

function getJsxAttribute(attributes: ts.JsxAttributes, name: string) {
  return attributes.properties.find(
    (property): property is ts.JsxAttribute => (
      ts.isJsxAttribute(property)
      && ts.isIdentifier(property.name)
      && property.name.text === name
    ),
  )
}

function jsxAttributeText(attributes: ts.JsxAttributes, name: string) {
  const attribute = getJsxAttribute(attributes, name)
  if (!attribute?.initializer) return null
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text
  if (ts.isJsxExpression(attribute.initializer)) return literalText(attribute.initializer.expression)
  return null
}

function expressionFromJsxAttribute(attribute: ts.JsxAttribute | undefined) {
  if (!attribute?.initializer) return null
  if (ts.isJsxExpression(attribute.initializer)) return attribute.initializer.expression || null
  return null
}

function objectPropertyExpression(objectLiteral: ts.ObjectLiteralExpression, name: string) {
  const property = objectLiteral.properties.find((candidate): candidate is ts.PropertyAssignment => {
    if (!ts.isPropertyAssignment(candidate)) return false
    const propertyName = candidate.name
    return (
      (ts.isIdentifier(propertyName) && propertyName.text === name) ||
      (ts.isStringLiteral(propertyName) && propertyName.text === name)
    )
  })
  return property?.initializer
}

function extractDataQuery(attributes: ts.JsxAttributes, componentType: string, ordinal: number): ExtractedDashboardQuery | null {
  const dataQueryExpression = expressionFromJsxAttribute(getJsxAttribute(attributes, 'dataQuery'))
  if (!dataQueryExpression || !ts.isObjectLiteralExpression(dataQueryExpression)) return null

  const query = literalText(objectPropertyExpression(dataQueryExpression, 'query'))?.trim()
  if (!query) return null

  const componentId = jsxAttributeText(attributes, 'id')
  const label = jsxAttributeText(attributes, 'label') || jsxAttributeText(attributes, 'title')
  const limit = numericLiteral(objectPropertyExpression(dataQueryExpression, 'limit')) || 1000

  return {
    componentId,
    componentType,
    queryName: componentId || label || `${componentType}_${ordinal}`,
    query,
    limit,
    filters: {},
  }
}

export function extractDashboardDataQueries(source: string): ExtractedDashboardQuery[] {
  const sourceFile = ts.createSourceFile('dashboard.tsx', String(source || ''), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const queries: ExtractedDashboardQuery[] = []

  function visit(node: ts.Node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const componentType = getJsxTagName(node.tagName)
      const query = extractDataQuery(node.attributes, componentType, queries.length + 1)
      if (query) queries.push(query)
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return queries
}

export function extractDashboardDataQueryByComponentId(source: string, componentId: string) {
  const cleanComponentId = String(componentId || '').trim()
  if (!cleanComponentId) return null
  return extractDashboardDataQueries(source).find((query) => query.componentId === cleanComponentId) || null
}

export function findDashboardComponentDataQuery(source: string, componentId: string) {
  const cleanComponentId = String(componentId || '').trim()
  if (!cleanComponentId) return { found: false, componentType: null, query: null }

  const sourceFile = ts.createSourceFile('dashboard.tsx', String(source || ''), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let result: { found: boolean; componentType: string | null; query: ExtractedDashboardQuery | null } = {
    found: false,
    componentType: null,
    query: null,
  }

  function visit(node: ts.Node) {
    if (result.found) return
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const id = jsxAttributeText(node.attributes, 'id')
      if (id === cleanComponentId) {
        const componentType = getJsxTagName(node.tagName)
        result = {
          found: true,
          componentType,
          query: extractDataQuery(node.attributes, componentType, 1),
        }
        return
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return result
}

export async function preflightDashboardQueries(input: {
  artifactId: string
  tenantId: number
  source: string
  actorId?: number | null
}): Promise<DashboardQueryPreflightReport> {
  const queries = extractDashboardDataQueries(input.source)
  const items: DashboardQueryPreflightItem[] = []

  for (const query of queries) {
    try {
      const result = await executeDashboardQuery({
        artifactId: input.artifactId,
        tenantId: input.tenantId,
        actorId: input.actorId,
        query: query.query,
        filters: query.filters,
        limit: query.limit,
      })
      const status = result.count > 0 ? 'success' : 'empty'
      items.push({
        componentId: query.componentId,
        componentType: query.componentType,
        queryName: query.queryName,
        ok: true,
        status,
        code: status === 'empty' ? 'dashboard_query_empty' : 'dashboard_query_ok',
        message: null,
        rowCount: result.count,
        columns: result.columns,
        durationMs: result.metadata.durationMs,
        bytesProcessed: result.metadata.bytesProcessed,
      })
    } catch (error) {
      const artifactError = error instanceof ArtifactToolError ? error : null
      items.push({
        componentId: query.componentId,
        componentType: query.componentType,
        queryName: query.queryName,
        ok: false,
        status: 'error',
        code: artifactError?.code || 'dashboard_query_unknown_error',
        message: error instanceof Error ? error.message : String(error),
        rowCount: 0,
        columns: [],
        details: artifactError?.details,
      })
    }
  }

  const error = items.filter((item) => item.status === 'error').length
  const empty = items.filter((item) => item.status === 'empty').length
  const success = items.filter((item) => item.status === 'success').length
  const total = queries.length

  return {
    ok: error === 0,
    status: error === 0 ? 'success' : success > 0 || empty > 0 ? 'partial_error' : 'error',
    total,
    success,
    empty,
    error,
    skipped: 0,
    items,
  }
}
