#!/usr/bin/env node

import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const strictTemplates = process.argv.includes('--strict-templates')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function source(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

async function pathExists(relativePath) {
  try {
    await access(path.join(root, relativePath))
    return true
  } catch {
    return false
  }
}

async function listFiles(dir, output = []) {
  const entries = await readdir(path.join(root, dir), { withFileTypes: true })
  for (const entry of entries) {
    const relativePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await listFiles(relativePath, output)
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      output.push(relativePath)
    }
  }
  return output
}

function unique(values) {
  return [...new Set(values)].sort()
}

const queryService = await source('src/products/artifacts/dashboard/query/dashboardQueryService.ts')
const dashboardManifest = await source('src/products/artifacts/dashboard/language/dashboardLanguageManifest.ts')
assert(!dashboardManifest.includes("'Theme'"), 'dashboard DSL must not expose Theme component')
assert(!dashboardManifest.includes("'Horizontal'"), 'dashboard DSL must not expose Horizontal component')
assert(!dashboardManifest.includes("'Insights'"), 'dashboard DSL must not expose Insights component')

const removedDashboardComponentFiles = [
  'src/products/artifacts/dashboard/runtime/components/insights/DashboardInsights.tsx',
  'src/products/artifacts/dashboard/runtime/components/insights/InsightsEditorModal.tsx',
  'src/products/artifacts/dashboard/runtime/components/layout/DashboardLayout.tsx',
  'src/products/artifacts/dashboard/renderer/components/DashboardInsights.tsx',
  'src/products/artifacts/dashboard/renderer/components/DashboardLayout.tsx',
]
for (const file of removedDashboardComponentFiles) {
  assert(!(await pathExists(file)), `removed dashboard component file must not return: ${file}`)
}

const dashboardRegistry = await source('src/products/artifacts/dashboard/runtime/registry/dashboardRegistry.tsx')
assert(!dashboardRegistry.includes('DashboardInsights'), 'dashboard registry must not import/register DashboardInsights')
assert(!dashboardRegistry.includes('DashboardHorizontal'), 'dashboard registry must not import/register DashboardHorizontal')
assert(!dashboardRegistry.includes('DashboardLayout'), 'dashboard registry must not import/register DashboardLayout')
assert(queryService.includes('compileDashboardQuery'), 'dashboard query compiler missing')
assert(queryService.includes('buildDashboardFilterSql'), 'dashboard filter SQL compiler missing')
assert(queryService.includes('dashboard_query_placeholder_not_supported'), 'unknown placeholders must be rejected')
assert(queryService.includes('DATE(@de)') && queryService.includes('DATE(@ate)'), 'date-range filter params must be supported')
assert(queryService.includes('UNNEST(@'), 'array filter params must be supported')
assert(queryService.includes('defaultDataset'), 'dashboard query must rely on tenant defaultDataset')
assert(queryService.includes('const datasetId = datasets.normalizedDataset'), 'dashboard query defaultDataset must be tenant normalized dataset')
assert(!queryService.includes('const datasetId = datasets.analyticsDataset'), 'dashboard query must not default to analytics dataset')
assert(queryService.includes('referencedTables'), 'dashboard query must validate resolved BigQuery references')
assert(queryService.includes('dryRun: true'), 'dashboard query must dry-run before execution')

const queryClient = await source('src/products/artifacts/dashboard/query/dashboardQueryClient.ts')
assert(queryClient.includes("export type DashboardQueryStatus"), 'dashboard query client must expose structured status')
assert(queryClient.includes("code: status === 'empty' ? 'dashboard_query_empty'"), 'dashboard query client must classify empty results')
assert(queryClient.includes('class DashboardQueryError'), 'dashboard query client must preserve error code/details')
assert(queryClient.includes('details: payload.details'), 'dashboard query client must preserve error details')

const queryPreflight = await source('src/products/artifacts/dashboard/query/dashboardQueryPreflight.ts')
assert(queryPreflight.includes('extractDashboardDataQueries'), 'dashboard query preflight extractor missing')
assert(queryPreflight.includes('preflightDashboardQueries'), 'dashboard query preflight runner missing')
assert(queryPreflight.includes("code: status === 'empty' ? 'dashboard_query_empty' : 'dashboard_query_ok'"), 'dashboard query preflight must return stable success/empty codes')
assert(queryPreflight.includes("artifactError?.code || 'dashboard_query_unknown_error'"), 'dashboard query preflight must return stable error codes')
assert(!queryPreflight.includes('sampleRows'), 'dashboard query preflight must not return sample rows')

const queryPreview = await source('src/products/artifacts/dashboard/query/dashboardQueryPreview.ts')
assert(queryPreview.includes('previewDashboardQuery'), 'dashboard query preview service missing')
assert(queryPreview.includes('MAX_SAMPLE_LIMIT = 20'), 'dashboard query preview must cap sample rows')
assert(queryPreview.includes('sampleRows'), 'dashboard query preview must return sample rows')
assert(queryPreview.includes('buildProfile'), 'dashboard query preview must return profile')
assert(queryPreview.includes('SENSITIVE_FIELD_PATTERN'), 'dashboard query preview must mask sensitive fields')
assert(queryPreview.includes('dashboard_query_component_not_found'), 'dashboard query preview must report missing component')
assert(queryPreview.includes('dashboard_query_component_without_query'), 'dashboard query preview must report component without query')

const artifactsAdapter = await source('src/products/mcp/adapters/artifactsAdapter.ts')
assert(artifactsAdapter.includes('query_preflight'), 'dashboard MCP create/update must return query preflight report')
assert(artifactsAdapter.includes('withDashboardQueryPreflight'), 'dashboard MCP adapter must attach query preflight report')
assert(artifactsAdapter.includes('previewMcpDashboardQuery'), 'dashboard MCP adapter must expose query preview')

const dashboardTools = await source('src/products/mcp/tools/dashboardTools.ts')
assert(dashboardTools.includes('dataset normalized'), 'dashboard authoring contract must point dataQuery to normalized dataset')
assert(dashboardTools.includes('query_preflight'), 'dashboard authoring contract must document query preflight')
assert(dashboardTools.includes('query_preview'), 'dashboard authoring contract must document query preview')
assert(!dashboardTools.includes('Horizontal: {'), 'dashboard authoring contract must not expose Horizontal')
assert(!dashboardTools.includes('Insights: {'), 'dashboard authoring contract must not expose Insights')
assert(!dashboardTools.includes("'Theme',"), 'dashboard authoring contract must not expose Theme')

const templateFiles = await listFiles('src/products/artifacts/dashboard/templates')
const qualifiedRefs = []
const unknownPlaceholders = []
const backtickRefs = []
const legacyCasts = []

for (const file of templateFiles) {
  const text = await source(file)
  for (const match of text.matchAll(/\b(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)/gi)) {
    qualifiedRefs.push(`${file}: ${match[1]}`)
  }
  for (const match of text.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)) {
    if (match[1] !== 'filters') unknownPlaceholders.push(`${file}: ${match[0]}`)
  }
  for (const match of text.matchAll(/`[^`]*(?:FROM|JOIN)\s+`?[a-z0-9_-]+\.[a-z0-9_-]+\.[a-z0-9_-]+/gi)) {
    backtickRefs.push(`${file}: ${match[0].slice(0, 160)}`)
  }
  for (const match of text.matchAll(/::(?:float|int|text|numeric|date|timestamp)\b/gi)) {
    legacyCasts.push(`${file}: ${match[0]}`)
  }
}

assert(!unknownPlaceholders.length, `unsupported dashboard placeholders:\n${unique(unknownPlaceholders).join('\n')}`)
assert(!backtickRefs.length, `project-qualified dashboard queries are forbidden:\n${unique(backtickRefs).join('\n')}`)

const uniqueQualifiedRefs = unique(qualifiedRefs)
if (uniqueQualifiedRefs.length) {
  const report = uniqueQualifiedRefs.slice(0, 40).join('\n')
  const suffix = uniqueQualifiedRefs.length > 40 ? `\n... +${uniqueQualifiedRefs.length - 40} refs` : ''
  if (strictTemplates) {
    throw new Error(`legacy dataset-qualified dashboard template refs:\n${report}${suffix}`)
  }
  console.warn(`dashboard template legacy refs detected (${uniqueQualifiedRefs.length}); run with --strict-templates to fail:\n${report}${suffix}`)
}

const uniqueLegacyCasts = unique(legacyCasts)
if (uniqueLegacyCasts.length) {
  const report = uniqueLegacyCasts.slice(0, 40).join('\n')
  const suffix = uniqueLegacyCasts.length > 40 ? `\n... +${uniqueLegacyCasts.length - 40} casts` : ''
  if (strictTemplates) {
    throw new Error(`legacy postgres casts in dashboard templates:\n${report}${suffix}`)
  }
  console.warn(`dashboard template legacy casts detected (${uniqueLegacyCasts.length}); run with --strict-templates to fail:\n${report}${suffix}`)
}

console.log('dashboard query smoke ok')
