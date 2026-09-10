#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function source(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8')
}

const compiler = await source('src/products/artifacts/core/language/compileArtifactJsx.tsx')
assert(!compiler.includes('/dashboard/'), 'core language compiler must not depend on dashboard')
assert(compiler.includes('ArtifactLanguageDefinition'), 'language definition contract missing')
assert(compiler.includes('compileArtifactJsxToTree'), 'generic artifact compiler missing')

const manifest = await source('src/products/artifacts/dashboard/language/dashboardLanguageManifest.ts')
const definition = await source('src/products/artifacts/dashboard/language/dashboardLanguageDefinition.tsx')
const dashboardTools = await source('src/products/plugin/server/dashboardTools.ts')
const chartPalettes = await source('src/products/artifacts/dashboard/chartPalettes.ts')
assert(manifest.includes("DASHBOARD_DSL_VERSION = 'dashboard.v1'"), 'dashboard DSL version missing')
assert(definition.includes('dashboardLanguageManifest'), 'dashboard language definition must derive from manifest')
assert(dashboardTools.includes('dashboardLanguageManifest') || dashboardTools.includes('DASHBOARD_SUPPORTED_COMPONENTS'), 'MCP contract must derive from dashboard manifest')
assert(!chartPalettes.startsWith("'use client'") && !chartPalettes.startsWith('"use client"'), 'server language manifest dependencies must not be client modules')

const registry = await source('src/products/artifacts/dashboard/runtime/registry/dashboardRegistry.tsx')
for (const registryName of [
  'dashboardShellRegistry',
  'dashboardLayoutRegistry',
  'dashboardChartRegistry',
  'dashboardDataRegistry',
  'dashboardContentRegistry',
]) {
  assert(registry.includes(registryName), `registry group missing: ${registryName}`)
}

const genericService = await source('src/products/artifacts/backend/artifactService.ts')
assert(genericService.includes('readArtifactByType'), 'generic artifact service must delegate typed reads')
assert(genericService.includes('writeArtifactByType'), 'generic artifact service must delegate typed writes')
assert(!genericService.includes('SELECT '), 'generic artifact service must not duplicate SQL persistence')

const documentManifest = await source('src/products/artifacts/document/language/documentLanguageManifest.ts')
assert(documentManifest.includes("REPORT_DSL_VERSION = 'report.v1'"), 'report DSL version missing')
assert(documentManifest.includes("SLIDE_DSL_VERSION = 'slide.v1'"), 'slide DSL version missing')
assert(documentManifest.includes('DOCUMENT_SUPPORTED_HTML_TAGS'), 'document HTML-like manifest missing')

const queryService = await source('src/products/artifacts/dashboard/query/dashboardQueryService.ts')
assert(queryService.includes('readDashboardArtifact'), 'legacy query endpoint must preserve ownership checks')
assert(queryService.includes('410'), 'legacy query endpoint must report retirement')
assert(!/bigquery|products\/integracoes|createQueryJob/i.test(queryService), 'dashboard must not import an external query engine')
console.log('artifacts architecture smoke ok')
