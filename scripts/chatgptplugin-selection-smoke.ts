import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { chromium } from 'playwright-core'
import { runWithErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { runWithErpTransactionClient, type SQLClient } from '../src/lib/postgres'
import { erpReadService } from '../src/products/erp/server/erpReadService'
import { commercialPage } from '../src/products/erp/server/erpReadQueries'
import { tools } from '../src/products/mcpcore/domains/erp/tools/catalog'
import { renderCardsHtml } from '../src/products/mcpcore/ui/resource'

type Result = { records: Record<string, unknown>[]; total: number; page: number; pageSize: number; hasMore?: boolean; summary: Record<string, unknown>; selecao?: { limite: number; total_disponivel: number } }
const checks: string[] = []
const db = new PGlite()
const client: SQLClient = { release() {}, query: async (sql, params) => ({ rows: (await db.query<Record<string, unknown>>(sql, params)).rows }) }
async function execute(name: string, args: Record<string, unknown>): Promise<Result> {
  const tool = tools.find(candidate => candidate.name === name)!
  const input = tool.schema.parse({ empresa_id: 2, ...args })
  return runWithErpDatabaseContext({ tenantId: 2, userId: 1 }, () => runWithErpTransactionClient(client, async () => tool.output.parse(await tool.execute(erpReadService, 2, input, { origin: 'https://erp.example.invalid', userId: 1 })) as Result))
}
const ids = (result: Result) => result.records.map(record => record.id)
async function main() {
  let selected: Result, all: Result
  try {
    await db.exec(`CREATE SCHEMA erp;
      CREATE TABLE erp.entidades(id bigint,empresa_id integer,nome text,PRIMARY KEY(empresa_id,id));
      CREATE TABLE erp.vendas(id bigint PRIMARY KEY,empresa_id integer,cliente_id bigint,numero text,data_venda date,total numeric(15,2),status text,tipo_documento text,situacao text,validade_em date,atendimento_status text,fiscal_status text,excluido_em timestamptz);
      CREATE TABLE erp.compras(id bigint PRIMARY KEY,empresa_id integer,fornecedor_id bigint,numero text,data_compra date,total numeric(15,2),status text,tipo_movimento text,metadata jsonb DEFAULT '{}',excluido_em timestamptz);
      INSERT INTO erp.entidades VALUES(1,2,'Cliente da empresa'),(1,3,'Outra empresa');
      INSERT INTO erp.vendas(id,empresa_id,cliente_id,numero,data_venda,total,status,tipo_documento) VALUES
        (1,2,1,'VEN-001','2026-10-10',10.10,'confirmada','venda'),(2,2,1,'VEN-002','2026-10-12',20.20,'rascunho','venda'),
        (3,2,1,'VEN-003','2026-10-14',30.30,'cancelada','venda'),(4,2,1,'VEN-004','2026-10-14',40.40,'confirmada','venda'),
        (5,2,1,'VEN-005','2026-10-13',50.50,'faturada','venda'),(6,2,1,'VEN-006','2026-10-11',60.60,'confirmada','venda'),
        (7,2,1,'ORC-007','2026-10-18',70.70,'rascunho','orcamento'),(8,2,1,'VEN-008','2026-10-19',80.80,'confirmada','venda'),
        (9,3,1,'OUTRA-009','2026-10-19',9000.00,'confirmada','venda');
      UPDATE erp.vendas SET excluido_em=now() WHERE id=8;
      INSERT INTO erp.compras(id,empresa_id,fornecedor_id,numero,data_compra,total,status,tipo_movimento) VALUES
        (1,2,1,'COM-001','2026-10-10',10.10,'confirmada','compra'),(2,2,1,'COM-002','2026-10-12',20.20,'cancelada','compra'),(3,2,1,'COM-003','2026-10-13',30.30,'recebida','compra');`)
    selected = await execute('listar_vendas', { limite: 3, ordenar: '-data', pagina: 99 })
    assert.deepEqual(ids(selected), ['4', '3', '5'])
    assert.equal(selected.total, 3); assert.equal(selected.page, 1); assert.equal(selected.pageSize, 3); assert.equal(selected.hasMore, false)
    assert.deepEqual(selected.selecao, { limite: 3, total_disponivel: 6 })
    assert.equal(Number(selected.summary.valor_total), 121.20); assert.equal(Number(selected.summary.valor_confirmado), 90.90)
    checks.push('latest_three_and_summaries_share_the_selection_with_stable_order_and_tenant_filter')
    const filtered = await execute('listar_vendas', { limite: 2, ordenar: '-data', status: 'confirmada', inicio: '2026-10-11', fim: '2026-10-14', busca: 'Cliente' })
    assert.deepEqual(ids(filtered), ['4', '6']); assert.equal(filtered.selecao?.total_disponivel, 2); assert.equal(Number(filtered.summary.valor_total), 101)
    const few = await execute('listar_vendas', { limite: 50 })
    assert.equal(few.records.length, 6); assert.equal(few.total, 6); assert.equal(few.hasMore, false)
    const empty = await execute('listar_vendas', { limite: 3, busca: 'inexistente' })
    assert.equal(empty.total, 0); assert.equal(Number(empty.summary.valor_total), 0); assert.deepEqual(empty.records, [])
    assert.deepEqual(ids(await execute('listar_vendas', { limite: 1, ordenar: 'total' })), ['1'])
    assert.deepEqual(ids(await execute('listar_vendas', { limite: 1, tipo_documento: 'orcamento' })), ['7'])
    checks.push('filters_apply_before_the_limit_and_empty_short_ascending_and_quote_results_are_correct')
    const purchase = await execute('listar_compras', { limite: 2, ordenar: '-data' })
    assert.deepEqual(ids(purchase), ['3', '2']); assert.equal(Number(purchase.summary.valor_total), 50.50); assert.equal(Number(purchase.summary.valor_confirmado), 30.30)
    all = await execute('listar_vendas', { ordenar: '-data' })
    assert.equal(all.selecao, undefined); assert.equal(all.total, 6); assert.equal(Number(all.summary.valor_total), 212.10)
    const schema = tools.find(tool => tool.name === 'listar_vendas')!.schema
    for (const limite of [0, -1, 51, 1.5, '3']) assert.equal(schema.safeParse({ limite }).success, false)
    await assert.rejects(runWithErpDatabaseContext({ tenantId: 2, userId: 1 }, () => runWithErpTransactionClient(client, () => commercialPage(2, 'vendas', { limit: 0 }))))
    checks.push('purchases_ordinary_pagination_and_invalid_limits')
  } finally { await db.close() }
  const html = renderCardsHtml({ name: 'selection-test', version: '1', host: 'chatgpt' })
  const args = { empresa_id: 2, limite: 3, ordenar: '-data' }
  const payload = { ok: true, empresa_id: 2, data: selected! }
  const encode = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c')
  const calls: { name: string; arguments: Record<string, unknown> }[] = []
  const host = `<!doctype html><html><body><iframe id="card" style="width:100%;height:1000px;border:0"></iframe><script>
    const frame=document.getElementById('card');frame.srcdoc=${encode(html)};
    window.expand=()=>frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{displayMode:'fullscreen'}},'*');
    addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;
      if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:${encode(args)}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:${encode(payload)},_meta:{'cognito/tool':'listar_vendas'}}},'*');return}
      if(message.id===undefined)return;let result={};
      if(message.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostContext:{displayMode:'inline',toolInfo:{tool:{name:'listar_vendas'}}},hostCapabilities:{}};
      if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();
      if(message.method==='ui/request-display-mode')result={mode:message.params.mode};
      frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>`
  const server = createServer(async (request, response) => {
    if (request.url === '/call') {
      const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk))
      calls.push(JSON.parse(Buffer.concat(chunks).toString()))
      response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ structuredContent: { ok: true, empresa_id: 2, data: all! } })); return
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(host)
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const executablePath = process.env.CHATGPTPLUGIN_TEST_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executablePath)
  const browser = await chromium.launch({ executablePath, headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1000 } }), errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:' + (server.address() as { port: number }).port)
    const frame = page.frameLocator('#card')
    await frame.getByText('3 vendas · mais recentes', { exact: true }).waitFor()
    assert.equal(await frame.locator('table.wide tbody tr').count(), 3)
    await frame.locator('.metrics').getByText('R$ 121,20', { exact: true }).waitFor()
    assert.equal(await frame.getByText('R$ 212,10', { exact: true }).count(), 0)
    assert.equal(await frame.locator('.pager').count(), 0)
    await page.evaluate(() => (window as unknown as { expand: () => void }).expand())
    await frame.locator('tr[role="button"]').first().waitFor()
    assert.equal(await frame.locator('table.wide tbody tr').count(), 3); assert.equal(await frame.locator('.pager,.toolbar').count(), 0)
    mkdirSync('.cache/chatgptplugin-selection', { recursive: true })
    await frame.locator('main').screenshot({ path: resolve('.cache/chatgptplugin-selection/three-sales.png') })
    await frame.getByRole('button', { name: 'Ver todas as vendas', exact: true }).click()
    await frame.getByText('6 vendas · mais recentes', { exact: true }).waitFor()
    assert.equal(await frame.locator('table.wide tbody tr').count(), 6)
    await frame.locator('.metrics').getByText('R$ 212,10', { exact: true }).waitFor()
    assert.deepEqual(calls, [{ name: 'listar_vendas', arguments: { empresa_id: 2, ordenar: '-data', pagina: 1 } }])
    assert.deepEqual(errors, [])
    checks.push('real_browser_shows_only_three_in_both_modes_and_opens_all_only_after_explicit_action')
    console.log(JSON.stringify({ status: 'passed', checks, realDatabase: false, realChatGPT: false }))
  } finally { await browser.close(); await new Promise<void>(done => server.close(() => done())) }
}
void main().catch(error => { console.error(error); process.exitCode = 1 })
