import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { chromium } from 'playwright-core'
import { Pool } from 'pg'
import { runWithErpDatabaseContext, getErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { closePool, type SQLClient } from '../src/lib/postgres'
import { chatDashboardSchema, resolveChatDashboardPeriod } from '../src/products/erp/shared/chatDashboard'
import { dashboardRecordsSchema, previousDashboardPeriod } from '../src/products/erp/shared/dashboardContracts'
import { loadDashboard, type DashboardAccess } from '../src/products/erp/server/dashboards/dashboardService'
import { resultadosQueries } from '../src/products/erp/server/dashboards/resultadosQueries'
import { attachDrilldownLinks } from '../src/products/erp/server/dashboards/drilldownLinks'
import { loadDashboardRecords } from '../src/products/erp/server/dashboards/drilldownQueries'
import { erpReadService } from '../src/products/erp/server/erpReadService'
import { executeTool, type ExecutionDependencies } from '../src/products/mcpcore/domains/erp/executeTool'
import { outputs } from '../src/products/mcpcore/domains/erp/schemas/outputs'
import { tools } from '../src/products/mcpcore/domains/erp/tools/catalog'
import type { PluginPrincipal } from '../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../src/products/mcpcore/shared/config'
import { renderCardsHtml } from '../src/products/mcpcore/ui/resource'

type Row = Record<string, unknown>
type Call = { name: string; arguments: Row }
const checks: string[] = [], calls: Call[] = [], sqlCalls: { sql: string; params?: unknown[] }[] = []
const session: DashboardAccess = { tenantId: 2, sharedUserId: 1, capabilities: ['erp.financeiro.visualizar', 'erp.relatorios.visualizar'], timeZone: 'America/Fortaleza' }
const principal: PluginPrincipal = { userId: 1, clerkUserId: 'fixture', clientId: 'fixture', scopes: ['erp:read'], companies: [{ id: 2, name: 'Empresa dois', profile: 'consulta', capabilities: session.capabilities, timeZone: session.timeZone }] }
const config: PluginConfig = { integration: 'chatgpt', resource: 'https://erp.example.invalid/api/mcp', metadataUrl: 'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp', issuer: 'https://fixture.clerk.accounts.dev', scope: 'erp:read', clientIds: ['fixture'], origins: ['https://chatgpt.com'], toolTimeoutMs: 10000, requestsPerMinute: 60 }
const financeData = { saldo: 64280, receber: 12480, pagar: 8920, receber_vencido: 3200, pagar_vencido: 40, proximos: 100, previsoes: 30,
  realizado: [{ label: '2026-10-01', entradas: 200, saidas: null }, { label: '2026-10-02', entradas: null, saidas: 50 }],
  projecao: [{ label: '2026-10-20', saldo: 64280 }, { label: '2026-11-19', saldo: -400 }], contas: [{ id: 1, label: 'Conta principal', detail: 'Posição atual', value: 64280 }], pendencias: [] }
const resultsData = { entradas: 100, saidas: 30, evolucao: [{ label: '2026-10-01', entradas: 100, saidas: 30, resultado: 70 }], categorias: [], centros: [], despesas: Array.from({ length: 8 }, (_, index) => ({ id: String(index + 1), label: 'Categoria ' + (index + 1), detail: 'Pagamentos líquidos de estornos', value: index + 1 })) }
const client: SQLClient = { release() {}, async query(sql, params) {
  if (!sql.startsWith('SET TRANSACTION') && !/\berp\./i.test(sql)) return { rows: [] }
  sqlCalls.push({ sql, params }); if (sql.startsWith('SET TRANSACTION')) return { rows: [] }
  assert.equal(params?.[0], getErpDatabaseContext()?.tenantId)
  if (sql.includes('filtered AS MATERIALIZED')) return { rows: [{ total: 6, total_value: 600, records: Array.from({ length: Number(params?.at(-2)) === 0 ? 5 : 1 }, (_, index) => ({ id: String(index + 1), label: 'Registro ' + (index + 1), detail: 'Parcela', date: '2026-10-01', value: 100, status: 'vencido' })) }] }
  if (sql.includes('accounts AS MATERIALIZED')) return { rows: [financeData] }
  if (sql.includes('FROM signed')) return { rows: [resultsData] }
  if (sql.includes('SELECT p.id::text,p.descricao label')) return { rows: [] }
  throw new Error('Consulta inesperada no teste: ' + sql.slice(0, 150))
} }
const execution: ExecutionDependencies = { queries: erpReadService, reserve: async () => randomUUID(), finish: async () => {} }
let activeClient = client
const scoped = <T>(fn: () => Promise<T>) => runWithErpDatabaseContext({ tenantId: 2, userId: 1, readOnly: true, timeZone: session.timeZone }, fn)
async function invoke(input: Row, identity = principal) { return executeTool(identity, 'consultar_dashboard', input, config, execution) }
const periodInput = { periodo: 'personalizado', inicio: '2026-10-01', fim: '2026-10-20' }

async function backend() {
  const date = new Date('2024-03-01T01:00:00Z'), parse = (raw: Row) => chatDashboardSchema.parse(raw)
  assert.equal(resolveChatDashboardPeriod(parse({}), 'America/Fortaleza', date).to, '2024-02-29')
  assert.deepEqual(resolveChatDashboardPeriod(parse({ periodo: 'ultimos_7_dias' }), 'America/Fortaleza', date), { from: '2024-02-23', to: '2024-02-29', compare: true, includeForecast: false })
  assert.equal(resolveChatDashboardPeriod(parse({ periodo: 'mes_passado' }), 'UTC', date).to, '2024-02-29')
  assert.equal(resolveChatDashboardPeriod(parse({ periodo: 'este_mes' }), 'America/Fortaleza', date).from, '2024-02-01')
  assert.equal(resolveChatDashboardPeriod(parse({ periodo: 'mes_passado' }), 'UTC', new Date('2026-01-01T12:00:00Z')).from, '2025-12-01')
  for (const raw of [{ periodo: 'personalizado' }, { inicio: '2026-10-01' }, { periodo: 'personalizado', inicio: '2026-02-29', fim: '2026-03-01' }, { periodo: 'personalizado', inicio: '2026-10-20', fim: '2026-10-01' }, { periodo: 'personalizado', inicio: '2025-01-01', fim: '2026-01-02' }]) assert.equal(chatDashboardSchema.safeParse(raw).success, false)
  assert.equal(chatDashboardSchema.safeParse({ periodo: 'personalizado', inicio: '2024-01-01', fim: '2024-12-31' }).success, true)
  checks.push('periods_company_timezone_leap_year_year_boundary_and_inclusive_366_day_validation')

  sqlCalls.length = 0
  const result = await invoke(periodInput)
  assert.equal(result.isError, undefined)
  const payload = result.structuredContent as { empresa_id: number; data: Row }
  assert.equal(payload.empresa_id, 2); outputs.dashboard.parse(payload.data)
  const data = payload.data as Awaited<ReturnType<typeof erpReadService.dashboard>> & { empresa: string }
  assert.equal(data.kind, 'dashboard'); if (data.kind !== 'dashboard') throw new Error('Expected dashboard')
  const filters = resolveChatDashboardPeriod(parse(periodInput), session.timeZone)
  const callsInSnapshot = [...sqlCalls]
  assert.equal(callsInSnapshot.filter(call => call.sql.includes('accounts AS MATERIALIZED')).length, 1)
  assert.equal(callsInSnapshot.filter(call => call.sql.includes('FROM signed')).length, 2)
  assert.equal(callsInSnapshot[0].sql, 'SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
  const overview = await scoped(() => loadDashboard(session, 'visao-geral', filters))
  for (const key of ['metrics', 'charts', 'lists', 'period', 'previousPeriod', 'reference', 'timezone', 'availableDashboards', 'notes'] as const) assert.deepEqual(data[key], JSON.parse(JSON.stringify(overview[key])))
  assert.equal(data.sections?.financeiro?.charts[0].records[0].saidas, 0)
  assert.equal(data.sections?.resultados?.metrics.find(metric => metric.key === 'resultado')?.value, 70)
  assert.equal(data.sections?.resultados?.lists.find(list => list.key === 'despesas')?.rows[0].href?.includes('status=pagar'), true)
  checks.push('same_overview_values_and_criteria_one_readonly_snapshot_no_duplicate_finance_or_results_queries')

  const limited = { ...principal, companies: [{ ...principal.companies[0], capabilities: ['erp.financeiro.visualizar'] as DashboardAccess['capabilities'] }] }
  sqlCalls.length = 0
  const limitedResult = await invoke(periodInput, limited)
  const limitedData = (limitedResult.structuredContent as { data: Row }).data
  outputs.dashboard.parse(limitedData)
  assert.equal((limitedData.sections as Row).resultados, undefined)
  assert.equal(sqlCalls.some(call => call.sql.includes('FROM signed')), false)
  assert.equal((limitedData.metrics as Row[]).some(metric => String(metric.key).includes('resultado')), false)
  const noAreas = await invoke({}, { ...principal, companies: [{ ...principal.companies[0], capabilities: [] }] })
  assert.deepEqual((noAreas.structuredContent as { data: Row }).data.metrics, [])
  const multi = { ...principal, companies: [...principal.companies, { ...principal.companies[0], id: 3 }] }
  for (const [input, identity, code] of [[{}, multi, 'COMPANY_REQUIRED'], [{ empresa_id: 3 }, principal, 'ACCESS_DENIED'], [{ periodo: 'personalizado' }, principal, 'INVALID_INPUT'], [{ detalhes: { painel: 'resultados', filtros: { source: 'pagamentos' } } }, limited, 'ACCESS_DENIED']] as const) {
    sqlCalls.length = 0; const denied = await invoke(input, identity); assert.equal(denied.isError, true); assert.match(JSON.stringify(denied.content), new RegExp(code)); assert.equal(sqlCalls.length, 0)
  }
  await assert.rejects(scoped(() => loadDashboard({ ...session, tenantId: 3 }, 'visao-geral', filters)), /Contexto de empresa inválido/)
  assert.equal(tools.find(tool => tool.name === 'consultar_dashboard')?.schema.safeParse({ capabilities: ['erp.financeiro.visualizar'] }).success, false)
  checks.push('single_company_direct_multi_company_choice_no_cross_tenant_data_and_partial_permissions_without_fake_zeroes')
  const detail = await invoke({ detalhes: { painel: 'financeiro', filtros: { source: 'pagar', status: 'vencido', includeForecast: false, page: 1, pageSize: 100 } } })
  const records = (detail.structuredContent as { data: Row }).data; outputs.dashboard.parse(records)
  assert.equal((records.records as Row[]).length, 5); assert.equal((records.filters as Row).pageSize, 5)
  checks.push('dashboard_drilldown_revalidates_permissions_and_forces_server_pages_of_five')
  return payload.data
}

async function sqlIntegration() {
  const db = new PGlite()
  try {
    await db.exec(`CREATE SCHEMA erp;
      CREATE TABLE erp.categorias(id bigint,empresa_id int,nome text);
      CREATE TABLE erp.centros_custo(id bigint,empresa_id int,nome text);
      CREATE TABLE erp.contas_receber(id bigint,empresa_id int,categoria_id bigint,centro_custo_id bigint,valor_total numeric);
      CREATE TABLE erp.contas_pagar(LIKE erp.contas_receber);
      CREATE TABLE erp.contas_receber_parcelas(id bigint,empresa_id int,conta_receber_id bigint);
      CREATE TABLE erp.contas_pagar_parcelas(id bigint,empresa_id int,conta_pagar_id bigint);
      CREATE TABLE erp.rateios_financeiros(id bigint,empresa_id int,conta_receber_id bigint,conta_pagar_id bigint,categoria_id bigint,centro_custo_id bigint,valor numeric,excluido_em timestamptz);
      CREATE TABLE erp.pagamentos(id bigint,empresa_id int,tipo text,data_pagamento date,valor_liquido numeric,estorno_de_pagamento_id bigint,conta_receber_parcela_id bigint,conta_pagar_parcela_id bigint,excluido_em timestamptz);
      INSERT INTO erp.categorias VALUES(1,2,'Receitas'),(2,2,'Serviços'),(3,2,'Taxas'),(2,3,'Outra empresa');
      INSERT INTO erp.contas_receber VALUES(1,2,1,NULL,100),(1,3,1,NULL,9000);
      INSERT INTO erp.contas_pagar VALUES(2,2,2,NULL,100);
      INSERT INTO erp.contas_receber_parcelas VALUES(1,2,1),(1,3,1);
      INSERT INTO erp.contas_pagar_parcelas VALUES(2,2,2);
      INSERT INTO erp.rateios_financeiros VALUES(1,2,NULL,2,2,NULL,33.33,NULL),(2,2,NULL,2,3,NULL,66.67,NULL);
      INSERT INTO erp.pagamentos VALUES(1,2,'receber','2026-10-01',100,NULL,1,NULL,NULL),(2,2,'pagar','2026-10-02',10.01,NULL,NULL,2,NULL),(3,2,'pagar','2026-10-03',1.01,2,NULL,2,NULL),(4,2,'receber','2026-10-04',150,1,1,NULL,NULL),(5,3,'receber','2026-10-01',9000,NULL,1,NULL,NULL),(6,2,'pagar','2026-09-30',500,NULL,NULL,2,NULL);`)
    const sqlClient: SQLClient = { release() {}, query: async (sql, params) => sql.includes("set_config(") || sql === 'RESET ROLE' ? { rows: [] } : ({ rows: (await db.query<Row>(sql, params)).rows }) }
    activeClient = sqlClient
    const filters = resolveChatDashboardPeriod(chatDashboardSchema.parse(periodInput), session.timeZone)
    const ctx = { tenantId: 2, capabilities: session.capabilities, client: sqlClient, filters, previous: previousDashboardPeriod(filters), reference: '2026-10-20' }
    const result = attachDrilldownLinks(await resultadosQueries({ ...ctx, filters: { ...filters, compare: false } }, true), filters)
    assert.equal(result.metrics.find(metric => metric.key === 'recebimentos')?.value, -50)
    assert.equal(result.metrics.find(metric => metric.key === 'pagamentos')?.value, 9)
    assert.equal(result.metrics.find(metric => metric.key === 'resultado')?.value, -59)
    const expenses = result.lists.find(list => list.key === 'despesas')!
    assert.equal(expenses.rows.length, 2); assert.equal(expenses.rows.reduce((sum, row) => sum + row.value, 0), 9)
    assert.equal(expenses.rows.some(row => row.label === 'Receitas'), false)
    for (const row of expenses.rows) {
      const url = new URL(row.href!, 'https://erp.local'), raw = Object.fromEntries(url.searchParams)
      const input = dashboardRecordsSchema.parse(raw)
      const detail = await scoped(() => loadDashboardRecords(session, 'resultados', input))
      assert.equal(Math.round((row.value + detail.totalValue) * 100), 0)
    }
    const empty = await resultadosQueries({ ...ctx, filters: { ...filters, from: '2026-08-01', to: '2026-08-31', compare: false } }, true)
    assert.equal(empty.metrics.find(metric => metric.key === 'pagamentos')?.value, 0); assert.equal(empty.lists.find(list => list.key === 'despesas')?.rows.length, 0)
    checks.push('real_postgres_expense_allocation_rounding_reversals_negative_receipts_company_period_isolation_and_drilldown_reconciliation')
  } finally { activeClient = client; await db.close() }
}

let initial: Row, variant: 'chatgpt' | 'claude' = 'chatgpt', theme = 'light', failing = false
const encode = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c')
const envelope = (data: Row) => ({ structuredContent: { ok: true, empresa_id: 2, data } })
function host() { return `<!doctype html><html><head><style>body{margin:0;background:${theme === 'dark' ? '#1a1c1f' : '#fff'}}iframe{width:100%;border:0;box-sizing:border-box}</style></head><body><iframe id="card" title="Dashboard" style="height:1200px"></iframe><script>
const frame=document.getElementById('card');frame.srcdoc=${encode(renderCardsHtml({ name: 'dashboard-test', version: '1', host: variant }))};addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;if(message.method==='ui/notifications/size-changed'){frame.style.height=message.params.height+2+'px';return}if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{empresa_id:2}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{...${encode(envelope(initial))},_meta:{'cognito/tool':'consultar_dashboard'}}},'*');return}if(message.id===undefined)return;let result={};if(message.method==='ui/initialize')result={hostContext:{theme:${encode(theme)},displayMode:'inline'},hostCapabilities:{}};if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();if(message.method==='ui/request-display-mode')result={mode:message.params.mode};frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>` }
async function browserTests(data: Row) {
  initial = data
  const server = createServer(async (request, response) => {
    if (request.url === '/call') {
      const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const call: Call = JSON.parse(Buffer.concat(chunks).toString()); calls.push(call)
      response.setHeader('Content-Type', 'application/json')
      if (failing) { response.end(JSON.stringify({ isError: true, content: [{ type: 'text', text: JSON.stringify({ code: 'ERP_UNAVAILABLE', message: 'Falha simulada.' }) }] })); return }
      const result = await invoke(call.arguments); response.end(JSON.stringify(result)); return
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(host())
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const executable = process.env.CHATGPTPLUGIN_TEST_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync); assert(executable)
  const browser = await chromium.launch({ executablePath: executable, headless: true, args: ['--disable-extensions', '--disable-background-networking'] })
  const page = await browser.newPage({ viewport: { width: 390, height: 1000 } }), frame = page.frameLocator('#card'), errors: string[] = [], url = 'http://127.0.0.1:' + (server.address() as { port: number }).port
  page.on('pageerror', error => errors.push(error.message))
  const open = async () => { calls.length = 0; await page.goto(url); await frame.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor() }
  const fit = async () => assert.equal(await frame.locator('html').evaluate(root => root.scrollWidth <= root.clientWidth), true)
  const shot = async (name: string) => { if (process.env.CHATGPTPLUGIN_SKIP_SCREENSHOTS !== '1') { mkdirSync('.cache/chatgptplugin-dashboard', { recursive: true }); await page.screenshot({ path: resolve('.cache/chatgptplugin-dashboard', name + '.png'), fullPage: true }) } }
  try {
    await open(); assert.equal(calls.length, 0); assert.equal(await frame.locator('.dashboard-tile').count(), 4); await fit(); await shot('resumo-mobile')
    await frame.getByRole('tab', { name: 'Fluxo de caixa', exact: true }).click(); await frame.getByRole('heading', { name: 'Projeção dos próximos 30 dias', exact: true }).waitFor(); await fit(); await shot('fluxo-mobile')
    await frame.getByRole('tab', { name: 'Despesas', exact: true }).click(); assert.equal(await frame.locator('.dashboard-rows>li').count(), 5)
    await frame.getByRole('button', { name: 'Próxima página: principais categorias de despesas', exact: true }).click(); await frame.getByText('Categoria 6', { exact: true }).waitFor(); assert.equal(await frame.locator('.dashboard-rows>li').count(), 3); assert.equal(calls.length, 0)
    await frame.getByRole('tab', { name: 'Despesas', exact: true }).press('Home'); await frame.getByRole('tab', { name: 'Resumo', exact: true }).waitFor(); assert.equal(await frame.getByRole('tab', { name: 'Resumo', exact: true }).getAttribute('aria-selected'), 'true')
    checks.push('mobile_render_local_tabs_keyboard_and_rankings_without_extra_calls')
    await frame.getByRole('combobox', { name: 'Período', exact: true }).selectOption('ultimos_7_dias'); await frame.getByText('Sem 1', { exact: false }).first().waitFor(); assert.equal(calls.length, 1); assert.equal(calls[0].arguments.empresa_id, 2); assert.equal(calls[0].arguments.periodo, 'ultimos_7_dias')
    await frame.getByLabel('Incluir previsões', { exact: true }).check(); await frame.getByLabel('Incluir previsões', { exact: true }).waitFor(); await page.waitForFunction(() => !document.querySelector('iframe')?.contentDocument?.querySelector('[aria-busy="true"]')); assert.equal(calls.length, 2)
    await frame.getByRole('combobox', { name: 'Período', exact: true }).selectOption('personalizado'); await frame.getByLabel('De', { exact: true }).fill('2026-10-01'); await frame.getByLabel('Até', { exact: true }).fill('2026-10-20'); await frame.getByRole('button', { name: 'Aplicar período', exact: true }).click(); await frame.getByText('01/10/2026 a 20/10/2026', { exact: true }).waitFor(); assert.equal(calls.length, 3)
    failing = true; await frame.getByRole('combobox', { name: 'Período', exact: true }).selectOption('este_mes'); await frame.getByText('Falha simulada.', { exact: true }).waitFor(); assert.equal(await frame.getByRole('combobox', { name: 'Período', exact: true }).inputValue(), 'personalizado'); await frame.getByText('01/10/2026 a 20/10/2026', { exact: true }).waitFor(); failing = false
    await frame.getByRole('button', { name: 'Atualizar dashboard', exact: true }).click(); await frame.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor(); await page.waitForFunction(() => !document.querySelector('iframe')?.contentDocument?.querySelector('[aria-busy="true"]')); assert.equal(calls.length, 5)
    checks.push('period_custom_forecast_and_refresh_server_calls_preserve_company_and_failed_filter_keeps_previous_snapshot')
    const alerts = frame.locator('.dashboard-alerts'); await alerts.getByRole('button').filter({ hasText: 'Recebimentos vencidos' }).click(); await frame.getByRole('heading', { name: 'Contas a receber', exact: true }).waitFor(); const detailArgs = calls.at(-1)!.arguments.detalhes as { painel: string; filtros: Row }; assert.equal(detailArgs.painel, 'financeiro'); assert.equal(detailArgs.filtros.source, 'receber'); assert.equal(detailArgs.filtros.status, 'vencido'); assert.equal(detailArgs.filtros.from, undefined); assert.equal(detailArgs.filtros.includeForecast, true)
    assert.equal(await frame.locator('.dashboard-rows>li').count(), 5); await frame.getByRole('button', { name: 'Próxima página: registros', exact: true }).click(); await frame.getByText('6–6 de 6 registros', { exact: true }).waitFor(); assert.equal(calls.length, 7)
    await frame.getByRole('button', { name: 'Voltar ao dashboard', exact: true }).click(); await frame.getByRole('heading', { name: 'Visão geral', exact: true }).waitFor(); assert.equal(calls.length, 7)
    checks.push('alert_exact_source_status_forecast_unbounded_overdue_dates_and_server_pagination_return_without_query')
    theme = 'dark'; await open(); await fit(); await shot('resumo-dark'); await page.setViewportSize({ width: 320, height: 1000 }); await fit(); await page.setViewportSize({ width: 1000, height: 1000 }); await fit(); await shot('resumo-desktop')
    initial = { ...data, sections: {}, metrics: [], charts: [], lists: [] }; await open(); assert.equal(await frame.getByRole('tab').count(), 1); await frame.getByText('Seu perfil não possui áreas autorizadas para este dashboard.', { exact: true }).waitFor()
    initial = { ...initial, metrics: [{ key: 'erp.estoque.visualizar-repor', label: 'Produtos para repor', value: 2, format: 'number', scope: 'atual', description: 'Posição atual de estoque.' }] }; await open(); assert.equal(await frame.locator('.dashboard-tile').count(), 1); assert.equal(await frame.getByText('Seu perfil não possui áreas autorizadas para este dashboard.', { exact: true }).count(), 0)
    initial = data; variant = 'claude'; await page.setViewportSize({ width: 390, height: 1000 }); await open(); assert.equal(await frame.getByRole('combobox').count(), 0); assert.equal(await frame.getByRole('tab').count(), 0); assert.equal(await frame.locator('.dashboard-tile').count(), 4); await frame.getByRole('button', { name: 'Ver dashboard', exact: true }).click(); await frame.getByRole('tab', { name: 'Fluxo de caixa', exact: true }).waitFor(); assert.equal(calls.length, 0); await fit(); await shot('claude-fullscreen')
    assert.deepEqual(errors, []); checks.push('light_dark_mobile_320_desktop_empty_permissions_and_claude_compact_fullscreen_no_browser_errors')
  } finally { await browser.close(); await new Promise<void>(done => server.close(() => done())) }
}

async function main() {
  const connect = Object.getOwnPropertyDescriptor(Pool.prototype, 'connect'), databaseUrl = process.env.SUPABASE_DB_URL
  process.env.SUPABASE_DB_URL = 'postgresql://fixture:fixture@127.0.0.1:1/dashboard_fixture'
  Object.defineProperty(Pool.prototype, 'connect', { configurable: true, writable: true, value: async () => activeClient })
  try { const data = await backend(); await sqlIntegration(); await browserTests(data); console.log(JSON.stringify({ ok: true, checks: checks.length, details: checks }, null, 2)) }
  finally { await closePool(); if (connect) Object.defineProperty(Pool.prototype, 'connect', connect); else Reflect.deleteProperty(Pool.prototype, 'connect'); if (databaseUrl === undefined) delete process.env.SUPABASE_DB_URL; else process.env.SUPABASE_DB_URL = databaseUrl }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
