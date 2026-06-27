#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const strictTemplates = process.argv.includes('--strict-templates')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function source(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
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
assert(queryService.includes('compileDashboardQuery'), 'dashboard query compiler missing')
assert(queryService.includes('buildDashboardFilterSql'), 'dashboard filter SQL compiler missing')
assert(queryService.includes('dashboard_query_placeholder_not_supported'), 'unknown placeholders must be rejected')
assert(queryService.includes('DATE(@de)') && queryService.includes('DATE(@ate)'), 'date-range filter params must be supported')
assert(queryService.includes('UNNEST(@'), 'array filter params must be supported')
assert(queryService.includes('defaultDataset'), 'dashboard query must rely on tenant defaultDataset')
assert(queryService.includes('referencedTables'), 'dashboard query must validate resolved BigQuery references')
assert(queryService.includes('dryRun: true'), 'dashboard query must dry-run before execution')

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
