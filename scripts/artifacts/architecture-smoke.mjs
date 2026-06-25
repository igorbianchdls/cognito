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
const dashboardTools = await source('src/products/mcp/tools/dashboardTools.ts')
assert(manifest.includes("DASHBOARD_DSL_VERSION = 'dashboard.v1'"), 'dashboard DSL version missing')
assert(definition.includes('dashboardLanguageManifest'), 'dashboard language definition must derive from manifest')
assert(dashboardTools.includes('dashboardLanguageManifest') || dashboardTools.includes('DASHBOARD_SUPPORTED_COMPONENTS'), 'MCP contract must derive from dashboard manifest')

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
assert(genericService.includes('readDashboardArtifact'), 'generic artifact service must delegate reads')
assert(genericService.includes('writeDashboardArtifact'), 'generic artifact service must delegate writes')
assert(!genericService.includes('SELECT '), 'generic artifact service must not duplicate SQL persistence')

console.log('artifacts architecture smoke ok')
