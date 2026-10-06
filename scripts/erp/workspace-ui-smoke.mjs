import assert from 'node:assert/strict'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import Module from 'node:module'
import { build } from 'esbuild'
import { compile } from '@tailwindcss/node'

// Server rendering of real components; navigation, sidebar and access are fixtures.
// This does not replace a visual or interactive browser check.
const root = resolve('.')
const entry = `
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PayablesWorkspacePage} from '@/products/erp/frontend/modules/financeiro/PayablesWorkspacePage';
import {ReceivablesWorkspacePage} from '@/products/erp/frontend/modules/financeiro/ReceivablesWorkspacePage';
import {ErpDataTable} from '@/products/erp/frontend/components/ErpDataTable';
import {getErpColumnVisibility} from '@/products/erp/frontend/components/ErpTableColumns';
import {customersConfig} from '@/products/erp/frontend/modules/cadastros/customersConfig';
import {OverviewDashboardView} from '@/products/erp/frontend/modules/dashboards/visao-geral/OverviewDashboardView';
import {DashboardPage} from '@/products/erp/frontend/modules/dashboards/components/DashboardPage';
import {dashboardValue} from '@/products/erp/frontend/modules/dashboards/components/DashboardViews';
export {dashboardValue};
export function overview(data){return renderToStaticMarkup(<OverviewDashboardView data={data}/>)}
export function dashboardPage(id){return renderToStaticMarkup(<DashboardPage id={id}/>)}
export {getErpColumnVisibility};
export function financial(side) {return renderToStaticMarkup(side==='pagar'?<PayablesWorkspacePage/>:<ReceivablesWorkspacePage/>)}
export function customer(visibility) {return renderToStaticMarkup(<ErpDataTable config={customersConfig} columnVisibility={visibility} records={[{id:'fixture',nome:'Cliente de verificação',categoria:'Varejo',documento:'Documento de verificação',email:'cliente@example.invalid',cidade:'Fortaleza',tipo:'PJ',status:'ativo'}]}/>)}
`
const result = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
  alias: { '@': resolve(root, 'src') },
  plugins: [{ name: 'render-fixtures', setup(builder) {
    builder.onResolve({ filter: /^(next\/navigation|@clerk\/nextjs|@\/components\/ui\/sidebar|@\/products\/erp\/frontend\/hooks\/useErpAccess)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'tsx', resolveDir: root, contents:
      args.path === 'next/navigation' ? 'export function useRouter(){return {push(){},replace(){}}} export function useSearchParams(){return new URLSearchParams("from=2026-10-01&to=2026-10-06")} export function usePathname(){return "/erp/dashboards/visao-geral"}' :
      args.path === '@clerk/nextjs' ? 'export function useAuth(){return {orgId:"fixture-company",userId:"fixture-owner"}}' :
      args.path.endsWith('useErpAccess') ? 'export function useErpAccess(){return {can:()=>true}}' :
      'import React from "react";export function SidebarTrigger(){return <button aria-label="Menu"/>}' }))
  } }],
})
const filename = resolve('scripts/erp/workspace-render-fixture.cjs')
const renderedModule = new Module(filename)
renderedModule.filename = filename
renderedModule.paths = Module._nodeModulePaths(root)
renderedModule.require = createRequire(filename)
renderedModule._compile(result.outputFiles[0].text, filename)
const fixture = renderedModule.exports, checks = []
const options = [{ id: 'nome', label: 'Nome', locked: true }, { id: 'email', label: 'Email' }, { id: 'credito', label: 'Crédito', defaultVisible: false }]
assert.deepEqual(fixture.getErpColumnVisibility(options), { nome: true, email: true, credito: false })
assert.deepEqual(fixture.getErpColumnVisibility(options, { nome: false, email: false, credito: true }), { nome: true, email: false, credito: true })
checks.push('column_defaults_and_locked_identity')
for (const side of ['pagar', 'receber']) {
  const markup = fixture.financial(side), head = markup.match(/<thead[\s\S]*?<\/thead>/)[0]
  assert.equal((head.match(/<th(?=\s|>)/g) || []).length, 8)
  assert(markup.includes('colSpan="8"'))
  assert(!head.includes('Natureza') && !head.includes('Crédito') && !head.includes('Dinheiro'))
  assert(head.includes('Principal') && head.includes('Saldo') && head.includes('Situação'))
  assert(markup.includes('aria-label="Configurar colunas"'))
  assert(markup.includes('aria-label="Pesquisar lançamentos…"'))
  assert(markup.includes('erp-workspace-metric-value'))
  checks.push('financial_initial_render_' + side)
}
const full = fixture.customer(), hidden = fixture.customer({ email: false, cidade: false })
assert(full.includes('cliente@example.invalid') && full.includes('Fortaleza'))
assert(!hidden.includes('cliente@example.invalid') && !hidden.includes('Fortaleza'))
assert(hidden.includes('Cliente de verificação') && hidden.includes('Varejo'))
const headCount = html => (html.match(/<thead[\s\S]*?<\/thead>/)[0].match(/<th(?=\s|>)/g) || []).length
const cellCount = html => (html.match(/<tbody[\s\S]*?<\/tbody>/)[0].match(/<td(?=\s|>)/g) || []).length
assert.equal(headCount(full), cellCount(full))
assert.equal(headCount(hidden), cellCount(hidden))
assert.equal(headCount(full) - headCount(hidden), 2)
checks.push('customer_columns_preserve_row_alignment_and_category')
const data = JSON.parse(readFileSync('.cache/workspace-ui/dashboard-data.json'))
const overview = fixture.overview(data)
assert.equal((overview.match(/class="erp-dashboard-metric-card"/g) || []).length, 4)
for (const metric of data.metrics.filter(metric => ['erp.financeiro.visualizar-saldo', 'erp.vendas.visualizar-vendas', 'erp.compras.visualizar-compras', 'erp.relatorios.visualizar-resultado', 'erp.financeiro.visualizar-pagar-vencido', 'erp.financeiro.visualizar-proximos', 'erp.estoque.visualizar-repor', 'erp.vendas.visualizar-atrasadas'].includes(metric.key))) {
  assert(overview.includes(fixture.dashboardValue(metric.value, metric.format)), 'Missing value for ' + metric.key)
  if (metric.href) assert(overview.includes('href="' + metric.href.replaceAll('&', '&amp;') + '"'), 'Missing metric link')
}
for (const list of data.lists.filter(list => ['clientes', 'proximos-vencimentos'].includes(list.key))) {
  for (const row of list.rows.slice(0, 5)) assert(overview.includes(fixture.dashboardValue(row.value, row.format)))
}
assert(!overview.includes('Sem categoria'))
const restricted = fixture.overview({...data, metrics: [], charts: [], lists: []})
assert(restricted.includes('Seu perfil não tem áreas disponíveis'))
assert(!restricted.includes('<a') && !restricted.includes('erp-dashboard-metric-card'))
const page = fixture.dashboardPage('visao-geral'), otherPage = fixture.dashboardPage('vendas')
assert(page.includes('erp-dashboard-header-controls') && page.includes('aria-label="Período"') && page.includes('aria-label="Dashboard"'))
assert(!page.includes('erp-dashboard-toolbar'))
assert(page.indexOf('aria-label="Período"') < page.indexOf('erp-dashboard-content'))
assert.equal((page.match(/aria-label="Dashboard"/g) || []).length, 1)
assert(!otherPage.includes('erp-dashboard-header-controls'))
checks.push('overview_real_api_values_links_and_restricted_access', 'overview_header_controls_and_other_dashboard_render')
const css = await compile(readFileSync('src/app/globals.css', 'utf8') + '\n' + readFileSync('src/products/erp/frontend/styles/workspace.css', 'utf8') + '\n' + readFileSync('src/products/erp/frontend/styles/dashboards.css', 'utf8'), { base: resolve('src/app'), onDependency() {} })
const compiled = css.build(['pl-9', 'after:absolute', 'after:bottom-0', 'after:h-0.5', 'after:bg-[#111]'])
assert(compiled.includes('.erp-workspace-surface') && compiled.includes('.erp-workspace-metric-value'))
assert(compiled.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'))
assert(compiled.includes('.erp-workspace-surface .erp-workspace-table td'))
assert(compiled.includes('.after\\:bg-\\[\\#111\\]'))
assert(compiled.includes('.erp-dashboard-metric-card') && compiled.includes('.erp-dashboard-header-controls'))
checks.push('production_styles_compile_with_responsive_rules_and_tab_indicator')
mkdirSync('.cache/workspace-ui', { recursive: true })
const report = { status: 'passed', checks, browserVisualCheck: 'unavailable', browserInteractiveCheck: 'unavailable', businessDataWrites: 0 }
writeFileSync('.cache/workspace-ui/smoke.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
