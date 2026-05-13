#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const tmpDir = path.join(root, '.next/cache/mcp-apps-smoke')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function compileTsModule(sourceFile, outputName) {
  mkdirSync(tmpDir, { recursive: true })
  const source = readFileSync(path.join(root, sourceFile), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.Preserve,
    },
    fileName: sourceFile,
    reportDiagnostics: true,
  })

  const diagnostics = output.diagnostics || []
  if (diagnostics.length) {
    const text = diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      .join('\n')
    throw new Error(`TypeScript diagnostics in ${sourceFile}:\n${text}`)
  }

  const outputPath = path.join(tmpDir, outputName)
  writeFileSync(outputPath, output.outputText)
  return outputPath
}

async function main() {
  console.log('Testing MCP Apps shared layer')

  const widgetHtmlPath = path.join(root, 'src/products/mcp-apps/web/dist/widget.html')
  assert(existsSync(widgetHtmlPath), 'widget.html missing; run pnpm mcp-apps:build')
  const widgetHtml = await readFile(widgetHtmlPath, 'utf8')
  assert(widgetHtml.includes('Cognito Dashboards'), 'widget HTML missing title')
  assert(widgetHtml.includes('CognitoMcpApp'), 'widget HTML missing MCP Apps runtime')
  assert(widgetHtml.includes('CognitoChatGptApp'), 'widget HTML missing ChatGPT compatibility alias')
  assert(widgetHtml.includes('<iframe'), 'widget HTML missing iframe renderer')
  assert(widgetHtml.includes('dashboard-embed-frame'), 'widget HTML missing embed frame styles')
  console.log('widget html ok')

  const resourcesPath = compileTsModule('src/products/mcp-apps/server/appResources.ts', 'appResources.cjs')
  const resources = await import(`file://${resourcesPath}`)
  const list = resources.listCognitoMcpAppResources()
  assert(list.resources.some((resource) => resource.uri === resources.DASHBOARD_WIDGET_RESOURCE_URI), 'resources/list missing dashboard widget')
  const read = resources.readCognitoMcpAppResource(resources.DASHBOARD_WIDGET_RESOURCE_URI)
  const content = read?.contents?.[0]
  assert(content?.mimeType === 'text/html;profile=mcp-app', 'resource mime type should be MCP App HTML')
  assert(content?._meta?.ui?.resourceUri === undefined, 'resource content should not declare tool resourceUri')
  assert(content?._meta?.ui?.csp?.resourceDomains?.length > 0, 'resource UI CSP missing resourceDomains')
  assert(!content?._meta?.['openai/widgetCSP'], 'mcp-apps resource should not include OpenAI CSP metadata')
  console.log('resources metadata ok')

  const toolsSource = await readFile(path.join(root, 'src/products/mcp-apps/server/appTools.ts'), 'utf8')
  assert(toolsSource.includes("dashboards: 'dashboards'"), 'dashboards public tool constant missing')
  assert(toolsSource.includes("openDashboard: 'open_dashboard'"), 'open_dashboard public tool constant missing')
  assert(toolsSource.includes('function callDashboards'), 'dashboards implementation missing')
  assert(toolsSource.includes('function callOpenDashboard'), 'open_dashboard implementation missing')
  assert(!toolsSource.includes('openai/outputTemplate'), 'mcp-apps tools should not include OpenAI outputTemplate')
  assert(!toolsSource.includes('openai/widgetAccessible'), 'mcp-apps tools should not include OpenAI widgetAccessible')
  console.log('tools source ok')

  const componentPath = path.join(root, 'src/products/mcp-apps/web/dist/component.js')
  const componentJs = await readFile(componentPath, 'utf8')
  assert(componentJs.includes('window.CognitoMcpApp'), 'component missing MCP Apps runtime')
  assert(componentJs.includes('window.CognitoChatGptApp = window.CognitoMcpApp'), 'component missing ChatGPT alias')
  console.log('component runtime ok')

  console.log('MCP Apps smoke test passed')
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error))
  process.exit(1)
})
