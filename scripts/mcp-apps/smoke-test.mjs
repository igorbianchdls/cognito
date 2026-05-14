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
  assert(widgetHtml.includes('createElement("iframe"') || widgetHtml.includes('iframe'), 'widget HTML missing iframe renderer')
  assert(widgetHtml.includes('dashboard-embed-frame'), 'widget HTML missing embed frame styles')
  console.log('widget html ok')

  const resourcesPath = compileTsModule('src/products/mcp-apps/server/appResources.ts', 'appResources.cjs')
  const resources = await import(`file://${resourcesPath}`)
  const list = resources.listCognitoMcpAppResources()
  assert(list.resources.some((resource) => resource.uri === resources.DASHBOARD_WIDGET_RESOURCE_URI), 'resources/list missing dashboard widget')
  assert(list.resources.some((resource) => resource.uri === resources.DASHBOARD_WIDGET_LEGACY_RESOURCE_URI), 'resources/list missing legacy dashboard widget')
  const read = resources.readCognitoMcpAppResource(resources.DASHBOARD_WIDGET_RESOURCE_URI)
  const content = read?.contents?.[0]
  assert(content?.mimeType === 'text/html;profile=mcp-app', 'resource mime type should be MCP App HTML')
  const legacyRead = resources.readCognitoMcpAppResource(resources.DASHBOARD_WIDGET_LEGACY_RESOURCE_URI)
  assert(legacyRead?.contents?.[0]?.uri === resources.DASHBOARD_WIDGET_LEGACY_RESOURCE_URI, 'legacy resource read should preserve requested uri')
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

  const domainToolsSource = await readFile(path.join(root, 'src/products/mcp-apps/server/domainTools.ts'), 'utf8')
  assert(domainToolsSource.includes('function buildFinancialAccountsPayableQuery'), 'contas-a-pagar semantic query missing')
  assert(domainToolsSource.includes('function buildFinancialAccountsReceivableQuery'), 'contas-a-receber semantic query missing')
  assert(domainToolsSource.includes('AS fornecedor'), 'contas-a-pagar should expose fornecedor name column')
  assert(domainToolsSource.includes('AS cliente'), 'contas-a-receber should expose cliente name column')
  assert(domainToolsSource.includes('LEFT JOIN entidades.fornecedores'), 'contas-a-pagar should join fornecedores')
  assert(domainToolsSource.includes('LEFT JOIN entidades.clientes'), 'contas-a-receber should join clientes')
  assert(domainToolsSource.includes('function buildSalesOrdersQuery'), 'vendas/pedidos semantic query missing')
  assert(domainToolsSource.includes('function buildPurchaseOrdersQuery'), 'compras/pedidos semantic query missing')
  assert(domainToolsSource.includes("crm: 'crm'"), 'crm domain tool constant missing')
  assert(domainToolsSource.includes('const CRM_DOMAIN_TOOL_DEFINITION'), 'crm domain tool definition missing')
  assert(domainToolsSource.includes('CRM_ALLOWED_RESOURCES'), 'crm allowed resources missing')
  assert(domainToolsSource.includes('case MCP_APP_DOMAIN_TOOL_NAMES.crm'), 'crm dispatch missing')
  assert(!domainToolsSource.includes('Use para financeiro, vendas, compras, CRM e estoque'), 'erp description should not include CRM')
  assert(domainToolsSource.includes('function buildCrmAccountsQuery'), 'crm/contas semantic query missing')
  assert(domainToolsSource.includes('function buildCrmContactsQuery'), 'crm/contatos semantic query missing')
  assert(domainToolsSource.includes('function buildCrmLeadsQuery'), 'crm/leads semantic query missing')
  assert(domainToolsSource.includes('function buildCrmOpportunitiesQuery'), 'crm/oportunidades semantic query missing')
  assert(domainToolsSource.includes('function buildCrmActivitiesQuery'), 'crm/atividades semantic query missing')
  assert(domainToolsSource.includes('function buildStockCurrentQuery'), 'estoque/estoque-atual semantic query missing')
  assert(domainToolsSource.includes('function buildStockMovementsQuery'), 'estoque/movimentacoes semantic query missing')
  assert(domainToolsSource.includes('LEFT JOIN vendas.canais_venda'), 'vendas/pedidos should resolve canal name')
  assert(domainToolsSource.includes('LEFT JOIN comercial.vendedores'), 'sales/crm queries should resolve vendedor/responsavel name')
  assert(domainToolsSource.includes('LEFT JOIN crm.contatos'), 'crm/atividades should resolve contato name')
  assert(domainToolsSource.includes('LEFT JOIN crm.fases_pipeline'), 'crm/oportunidades should resolve fase name')
  assert(domainToolsSource.includes('LEFT JOIN produtos.produto'), 'estoque queries should resolve produto name')
  assert(domainToolsSource.includes("'compras/pedidos': 'compras.compras'"), 'compras/pedidos should map to compras.compras')
  assert(domainToolsSource.includes("'estoque/estoque-atual': 'estoque.estoques_atual'"), 'estoque/estoque-atual should map to estoque.estoques_atual')
  console.log('domain tools source ok')

  const appSource = await readFile(path.join(root, 'src/products/mcp-apps/web/src/App.tsx'), 'utf8')
  const formatSource = await readFile(path.join(root, 'src/products/mcp-apps/web/src/utils/format.ts'), 'utf8')
  const resultShellSource = await readFile(path.join(root, 'src/products/mcp-apps/web/src/components/ResultShell.tsx'), 'utf8')
  const stylesSource = await readFile(path.join(root, 'src/products/mcp-apps/web/src/styles.css'), 'utf8')
  assert(appSource.includes("tool === 'crm'"), 'crm results should render in data view')
  assert(formatSource.includes("tool === 'crm'"), 'crm tool label missing')
  assert(formatSource.includes('getToolVisual'), 'tool visual helper missing')
  assert(formatSource.includes('ContaAzulIcon'), 'erp Conta Azul icon missing')
  assert(formatSource.includes('SiHubspot'), 'crm HubSpot icon missing')
  assert(formatSource.includes("tone: 'erp'"), 'erp visual tone missing')
  assert(formatSource.includes("tone: 'crm'"), 'crm visual tone missing')
  assert(formatSource.includes("tone: 'ecommerce'"), 'ecommerce visual tone missing')
  assert(formatSource.includes("tone: 'marketing'"), 'marketing visual tone missing')
  assert(formatSource.includes("tone: 'sql'"), 'sql visual tone missing')
  assert(resultShellSource.includes('result-shell__icon'), 'result shell icon markup missing')
  assert(stylesSource.includes('.result-shell__icon--erp'), 'erp icon style missing')
  assert(stylesSource.includes('.result-shell__icon--crm'), 'crm icon style missing')
  console.log('web source ok')

  const componentPath = path.join(root, 'src/products/mcp-apps/web/dist/component.js')
  const componentJs = await readFile(componentPath, 'utf8')
  assert(componentJs.includes('CognitoMcpApp'), 'component missing MCP Apps runtime')
  assert(componentJs.includes('CognitoChatGptApp'), 'component missing ChatGPT alias')
  console.log('component runtime ok')

  console.log('MCP Apps smoke test passed')
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error))
  process.exit(1)
})
