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

type Result = { records: Record<string, unknown>[]; total: number; page: number; pageSize: number; hasMore?: boolean; summary: Record<string, unknown>; selecao?: { limite: number; total_disponivel: number }; paginacao?: { modo: 'local'|'servidor'; por_pagina: 5 } }
const checks: string[] = []
const db = new PGlite()
let databaseClosed=false
const client: SQLClient = { release() {}, query: async (sql, params) => ({ rows: (await db.query<Record<string, unknown>>(sql, params)).rows }) }
async function execute(name: string, args: Record<string, unknown>): Promise<Result> {
  const tool = tools.find(candidate => candidate.name === name)!
  const input = tool.schema.parse({ empresa_id: 2, ...args })
  return runWithErpDatabaseContext({ tenantId: 2, userId: 1 }, () => runWithErpTransactionClient(client, async () => tool.output.parse(await tool.execute(erpReadService, 2, input, { origin: 'https://erp.example.invalid', userId: 1 })) as Result))
}
const ids = (result: Result) => result.records.map(record => String(record.id))
async function main() {
  let selected: Result, all: Result
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
    assert.deepEqual(selected.paginacao, { modo: 'local', por_pagina: 5 })
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
    await db.exec(`INSERT INTO erp.vendas(id,empresa_id,cliente_id,numero,data_venda,total,status,tipo_documento)
      SELECT item,2,1,'VEN-'||item,'2026-09-01',1,'confirmada','venda' FROM generate_series(100,145) item;
      INSERT INTO erp.compras(id,empresa_id,fornecedor_id,numero,data_compra,total,status,tipo_movimento)
      SELECT item,2,1,'COM-'||item,'2026-09-01',1,'confirmada','compra' FROM generate_series(100,139) item;
      UPDATE erp.vendas SET numero='QA-OTTO-'||repeat('LONG-',40) WHERE id=145;`)
    const expectedIds=['4','3','5','2','6','1',...Array.from({length:46},(_,index)=>String(145-index))]
    for(const limite of [30,39,40,41,50]){
      const result=await execute('listar_vendas',{limite,ordenar:'-data',por_pagina:50})
      assert.equal(result.total,limite); assert.equal(Number(result.summary.valor_total),212.10+limite-6)
      assert.deepEqual(ids(result),expectedIds.slice(0,limite<40?limite:5))
      assert.equal(result.paginacao?.modo,limite<40?'local':'servidor')
      if(limite>=40){
        const collected:string[]=[]
        for(let pagina=1;pagina<=Math.ceil(limite/5);pagina++){
          const current=await execute('listar_vendas',{limite,ordenar:'-data',pagina,por_pagina:50})
          assert(current.records.length<=5);assert.equal(current.pageSize,5);assert.equal(current.page,pagina)
          assert.equal(current.hasMore,pagina*5<limite);assert.deepEqual(current.summary,result.summary)
          collected.push(...ids(current))
        }
        assert.deepEqual(collected,expectedIds.slice(0,limite));assert.equal(new Set(collected).size,limite)
        const pastEnd=await execute('listar_vendas',{limite,ordenar:'-data',pagina:Math.ceil(limite/5)+1})
        assert.deepEqual(pastEnd.records,[]);assert.equal(pastEnd.total,limite);assert.equal(pastEnd.hasMore,false)
      }
    }
    const ordinary=await execute('listar_vendas',{ordenar:'-data',pagina:2})
    assert.equal(ordinary.total,52);assert.equal(ordinary.records.length,5);assert.deepEqual(ids(ordinary),expectedIds.slice(5,10))
    const purchasePage=await execute('listar_compras',{limite:40,ordenar:'-data',pagina:8})
    assert.equal(purchasePage.records.length,5);assert.equal(purchasePage.total,40);assert.equal(purchasePage.hasMore,false)
    const unchanged=await runWithErpDatabaseContext({tenantId:2,userId:1},()=>runWithErpTransactionClient(client,()=>commercialPage(2,'vendas',{page:2,pageSize:20})))
    assert.equal(unchanged.pageSize,20);assert.equal(unchanged.records.length,20);assert.equal('paginacao' in unchanged,false)
    checks.push('39_is_local_40_is_remote_and_pages_preserve_selection_totals_order_and_erp_contract')
  const browserResults=new Map<string,Result>()
  for(const limite of [undefined,3,30,39,40,41]){
    const args={limite,ordenar:'-data',busca:'Cliente',inicio:'2026-09-01',fim:'2026-10-14'}
    const first=await execute('listar_vendas',args)
    browserResults.set((limite||'all')+':1',first)
    if(first.paginacao?.modo==='servidor')for(let pagina=2;pagina<=Math.ceil(first.total/5);pagina++)browserResults.set((limite||'all')+':'+pagina,await execute('listar_vendas',{...args,pagina}))
  }
  await db.close()
  databaseClosed=true
  const encode = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c')
  const calls: { name: string; arguments: Record<string, unknown> }[] = []
  let failNext=false
  function host(args:Record<string,unknown>,data:Result,variant:'chatgpt'|'claude'){
    const html=renderCardsHtml({name:'selection-test',version:'1',host:variant})
    return `<!doctype html><html><head><style>body{margin:0;background:#fff}iframe{box-sizing:border-box;border:1px solid #e6e8eb;border-radius:18px}@media(prefers-color-scheme:dark){body{background:#1a1c1f}iframe{border-color:#34383d}}</style></head><body><iframe id="card" style="width:100%;height:1000px"></iframe><script>
    const frame=document.getElementById('card');frame.srcdoc=${encode(html)};
    window.expand=()=>frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/host-context-changed',params:{displayMode:'fullscreen'}},'*');
    addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;
      if(message.method==='ui/notifications/size-changed'){frame.style.height=Math.ceil(message.params.height)+2+'px';return}
      if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:${encode(args)}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:${encode({ok:true,empresa_id:2,data})},_meta:{'cognito/tool':'listar_vendas'}}},'*');return}
      if(message.id===undefined)return;let result={};
      if(message.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostContext:{displayMode:'inline',toolInfo:{tool:{name:'listar_vendas'}}},hostCapabilities:{}};
      if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();
      if(message.method==='ui/request-display-mode')result={mode:message.params.mode};
      frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>`}
  const server = createServer(async (request, response) => {
    if (request.url === '/call') {
      const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const call=JSON.parse(Buffer.concat(chunks).toString());calls.push(call)
      response.setHeader('Content-Type', 'application/json')
      if(failNext){failNext=false;response.end(JSON.stringify({isError:true,content:[{type:'text',text:JSON.stringify({message:'Falha temporária de teste.'})}]}));return}
      if(call.name==='obter_venda'){
        const sale=browserResults.get('30:1')!.records.find(row=>String(row.id)===String(call.arguments.venda_id))!
        response.end(JSON.stringify({structuredContent:{ok:true,empresa_id:2,data:{sale:{...sale,data_venda:sale.data,tipo_documento:'venda'},items:[],totalItems:0,itemsTruncated:false}}}));return
      }
      const data=browserResults.get((call.arguments.limite||'all')+':'+(call.arguments.pagina||1))
      assert(data)
      response.end(JSON.stringify({ structuredContent: { ok: true, empresa_id: 2, data } })); return
    }
    const url=new URL(request.url!,'http://localhost'),limite=Number(url.searchParams.get('limite')||3)||undefined
    const args={empresa_id:2,limite,ordenar:'-data',busca:'Cliente',inicio:'2026-09-01',fim:'2026-10-14'}
    const data=browserResults.get((limite||'all')+':1')!
    response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(host(args,data,url.searchParams.get('host')==='claude'?'claude':'chatgpt'))
  })
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done))
  const executablePath = process.env.CHATGPTPLUGIN_TEST_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executablePath)
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-features=BackForwardCache','--disable-extensions','--disable-background-networking'] })
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 } }), errors: string[] = []
  try {
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:' + (server.address() as { port: number }).port)
    const frame = page.frameLocator('#card')
    await frame.getByText('1–3 de 3 vendas', { exact: true }).waitFor()
    assert.equal(await frame.locator('.commercial-row').count(), 3)
    assert.equal(await frame.locator('.metrics,table,.chip').count(), 0)
    await frame.getByText('3 vendas encontradas',{exact:true}).waitFor()
    await frame.getByRole('button',{name:'Abrir Venda #4',exact:true}).waitFor()
    assert.equal(await frame.getByRole('button',{name:'Anterior',exact:true}).isEnabled(),false)
    assert.equal(await frame.getByRole('button',{name:'Próxima',exact:true}).isEnabled(),false)
    await page.evaluate(() => (window as unknown as { expand: () => void }).expand())
    await frame.locator('.commercial-row').first().waitFor()
    assert.equal(await frame.locator('.commercial-row').count(), 3); assert.equal(await frame.locator('.toolbar').count(), 0)
    mkdirSync('.cache/chatgptplugin-selection', { recursive: true })
    await frame.locator('main').screenshot({ path: resolve('.cache/chatgptplugin-selection/three-sales.png') })
    const expectedArgs={empresa_id:2,ordenar:'-data',busca:'Cliente',inicio:'2026-09-01',fim:'2026-10-14',pagina:1,por_pagina:5}
    await page.goto('http://127.0.0.1:'+(server.address() as {port:number}).port+'/?limite=0')
    await frame.getByText('1–5 de 52 vendas',{exact:true}).waitFor()
    assert.equal(await frame.locator('.commercial-row').count(), 5)
    assert.deepEqual(calls,[])
    assert.equal(await frame.getByRole('button',{name:'Anterior',exact:true}).isEnabled(),false)
    await frame.getByRole('button',{name:'Próxima',exact:true}).click()
    await frame.getByText('6–10 de 52 vendas',{exact:true}).waitFor()
    assert.deepEqual(calls[0],{name:'listar_vendas',arguments:{...expectedArgs,pagina:2}})
    for(const limite of [30,39]){
      calls.length=0
      await page.goto('http://127.0.0.1:'+(server.address() as {port:number}).port+'/?limite='+limite)
      await frame.getByText('1–5 de '+limite+' vendas',{exact:true}).waitFor()
      for(let current=1;current<=Math.ceil(limite/5);current++){
        await frame.getByText(current+' / '+Math.ceil(limite/5),{exact:true}).waitFor()
        assert.equal(await frame.locator('.commercial-row').count(),Math.min(5,limite-(current-1)*5))
        if(current<Math.ceil(limite/5))await frame.getByRole('button',{name:'Próxima',exact:true}).click()
      }
      assert.equal(await frame.getByRole('button',{name:'Próxima',exact:true}).isEnabled(),false)
      assert.deepEqual(calls,[])
      await page.evaluate(()=>(window as unknown as {expand:()=>void}).expand())
      await frame.getByText(Math.ceil(limite/5)+' / '+Math.ceil(limite/5),{exact:true}).waitFor()
      assert.equal(await frame.locator('.commercial-row').count(),limite===39?4:5)
      await frame.getByRole('button',{name:'Anterior',exact:true}).click()
      assert.equal(await frame.locator('.commercial-row').count(),5);assert.deepEqual(calls,[])
    }
    checks.push('local_pages_of_five_in_inline_and_fullscreen_without_server_calls')
    for(const limite of [40,41]){
      calls.length=0
      await page.goto('http://127.0.0.1:'+(server.address() as {port:number}).port+'/?limite='+limite)
      await frame.getByText('1–5 de '+limite+' vendas',{exact:true}).waitFor()
      if(limite===40){
        failNext=true
        await frame.getByRole('button',{name:'Próxima',exact:true}).click()
        await frame.getByRole('alert').getByText('Falha temporária de teste.',{exact:true}).waitFor()
        assert.equal(await frame.getByRole('button',{name:'Anterior',exact:true}).isEnabled(),false)
        calls.length=0
      }
      for(let current=2;current<=Math.ceil(limite/5);current++){
        await frame.getByRole('button',{name:'Próxima',exact:true}).click()
        await frame.getByText(current+' / '+Math.ceil(limite/5),{exact:true}).waitFor()
        assert.equal(await frame.locator('.commercial-row').count(),Math.min(5,limite-(current-1)*5))
        assert.deepEqual(calls.at(-1),{name:'listar_vendas',arguments:{...expectedArgs,limite,pagina:current}})
      }
      assert.equal(calls.length,Math.ceil(limite/5)-1)
      assert.equal(await frame.getByRole('button',{name:'Próxima',exact:true}).isEnabled(),false)
      await frame.getByRole('button',{name:'Anterior',exact:true}).click()
      await frame.getByText((Math.ceil(limite/5)-1)+' / '+Math.ceil(limite/5),{exact:true}).waitFor()
      await frame.locator('main').screenshot({path:resolve('.cache/chatgptplugin-selection/pagination-'+limite+'.png')})
    }
    for(const variant of ['chatgpt','claude']){
      calls.length=0
      await page.setViewportSize({width:390,height:1000})
      await page.goto('http://127.0.0.1:'+(server.address() as {port:number}).port+'/?limite=30&host='+variant)
      await frame.getByText('1–5 de 30 vendas',{exact:true}).waitFor()
      await frame.getByRole('button',{name:'Próxima',exact:true}).click()
      await frame.getByText('6–10 de 30 vendas',{exact:true}).waitFor()
      assert.equal(await frame.locator('.commercial-row:visible').count(),5);assert.deepEqual(calls,[])
      await frame.getByRole('button',{name:'Abrir Venda #145',exact:true}).waitFor()
      for(const width of [320,390,768]){
        await page.setViewportSize({width,height:1000})
        assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)
        assert.equal(await frame.locator('.commercial-row:visible').count(),5)
      }
      await page.setViewportSize({width:390,height:1000})
      await page.locator('#card').screenshot({path:resolve('.cache/chatgptplugin-selection/reference-'+variant+'-mobile.png')})
      await frame.getByRole('button',{name:'Abrir Venda #145',exact:true}).click()
      await frame.getByRole('button',{name:'Voltar às vendas',exact:true}).click()
      await frame.getByText('6–10 de 30 vendas',{exact:true}).waitFor()
      assert.deepEqual(calls,[{name:'obter_venda',arguments:{empresa_id:2,venda_id:145}}])
    }
    await page.emulateMedia({colorScheme:'dark'})
    await page.locator('#card').screenshot({path:resolve('.cache/chatgptplugin-selection/reference-dark-mobile.png')})
    assert.deepEqual(errors, [])
    checks.push('remote_pages_preserve_filters_limit_and_order_with_partial_last_page_error_recovery_and_mobile')
    checks.push('reference_layout_short_ids_no_metrics_accessible_details_mobile_overflow_and_return_to_same_page')
    console.log(JSON.stringify({ status: 'passed', checks, realDatabase: false, realChatGPT: false }))
  } catch(error){
    console.error(JSON.stringify({url:page.url(),errors,frames:await Promise.all(page.frames().map(async frame=>({url:frame.url(),text:(await frame.locator('body').innerText({timeout:2000}).catch(()=>'' )).slice(0,1600)})))}))
    throw error
  } finally { await browser.close(); await new Promise<void>(done => server.close(() => done())) }
}
void main().catch(error => { console.error(error); process.exitCode = 1 }).finally(()=>databaseClosed?undefined:db.close())
