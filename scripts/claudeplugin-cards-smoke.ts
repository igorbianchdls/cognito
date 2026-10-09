import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { existsSync,mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium,type Page } from 'playwright-core'
import { executeTool,type ExecutionDependencies } from '../src/products/mcpcore/application/executeTool'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import type { PluginPrincipal } from '../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../src/products/mcpcore/shared/config'
import { renderCardsHtml } from '../src/products/mcpcore/ui/resource'
import { CLAUDEPLUGIN_VERSION } from '../src/products/claudeplugin/shared/version'

// Cards com as regras de UI do Claude, em navegador real com host MCP Apps simulado (sem Claude, banco ou rede).
const settings:PluginConfig={integration:'claude',resource:'https://erp.example.invalid/api/claude/mcp',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/claude/mcp',
  issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['*'],origins:['https://claude.ai'],toolTimeoutMs:5000,requestsPerMinute:60}
const company={id:2,name:'Empresa Teste',profile:'administrador' as const,capabilities:[...ERP_CAPABILITIES]}
const principal:PluginPrincipal={userId:1,clerkUserId:'user_1',clientId:'dcr_1',scopes:['erp:read','erp:write'],companies:[company]}
const rows=Array.from({length:7},(_,i)=>({id:String(i+1),descricao:'Conta '+(i+1),fornecedor:'Fornecedor '+(i+1),
  vencimento:i<2?'2026-10-0'+(i+1):'2026-10-1'+i,valor:100*(i+1),saldo:100*(i+1),status:i<2?'vencido':'aberto'}))
const summary={referencia:'2026-10-07',quantidade:7,em_aberto:2800,vencidas:300,vence_em_7_dias:500,valor_total:2800}
const items=Array.from({length:5},(_,i)=>({tipo:'produto',item_id:9,quantidade:i+1,valor_unitario:10}))
const drafts=new Map<string,{tipo:string;dados:Record<string,unknown>}>()
function draft(tipo:string,dados:Record<string,unknown>){const id=randomUUID();drafts.set(id,{tipo,dados})
  return {rascunho_id:id,empresa_id:2,status:'pending',registro_id:null,criado_em:'2026-10-07T10:00:00Z',expira_em:'2026-10-08T10:00:00Z',alvo:null,
    referencias:{cliente:{id:'5',nome:'Padaria Central'},fornecedor:null,itens:[{tipo:'produto',id:'9',nome:'Farinha 25kg'}]},
    proposta:{tipo,dados,...(Array.isArray(dados.itens)?{total:(dados.itens as {quantidade:number;valor_unitario:number}[]).reduce((s,i)=>s+i.quantidade*i.valor_unitario,0)}:{})}}}
const deps:ExecutionDependencies={reserve:async()=>randomUUID(),finish:async()=>{},queries:({
  page:async(_c:number,_type:string,input:{page?:number;pageSize?:number})=>({records:rows,total:7,page:input.page||1,pageSize:input.pageSize||20,summary}),
  installment:async(_c:number,_side:string,id:number)=>({record:{id:String(id),conta_id:'100',descricao:'Aluguel',fornecedor:'Imobiliária Centro',parcela:1,vencimento:'2026-10-01',valor:1200,valor_pago:0,saldo:1200,status:'vencido',lado:'pagar',conta_financeira_sugerida:{id:'9',nome:'Itaú'}},history:[],historyTruncated:false}),
  sale:async(_c:number,id:number)=>({sale:{id:String(id),numero:'VEN-001',cliente_nome:'Padaria Central',status:'rascunho',tipo_documento:'venda',total:150,subtotal:150,data_venda:'2026-10-01',data_vencimento:'2026-10-31',observacoes:'Entregar cedo',vendedor_nome:'Ana',condicao:'30 dias'},
    items:[{descricao:'Farinha',quantidade:2,valor_unitario:75,total:150}],totalItems:1,itemsTruncated:false,installments:[{data_vencimento:'2026-10-31',valor:150}],installmentsTruncated:false}),
} as Partial<ExecutionDependencies['queries']>) as ExecutionDependencies['queries'],actions:{
  prepare:async(_p,_c,_k,proposal)=>draft(proposal.tipo,proposal.dados as Record<string,unknown>) as never,
  execute:async(_p,_c,id)=>{const d=drafts.get(id)!;return {...draft(d.tipo,d.dados),rascunho_id:id,status:'saved',registro_id:'321',referencias:undefined} as never}}}
const encoded=JSON.stringify(renderCardsHtml({name:'claudeplugin-cards',version:CLAUDEPLUGIN_VERSION,host:'claude'})).replaceAll('<','\\u003c')
function host(tool:string){return `<!doctype html><html><body style="margin:0"><iframe id="app" title="ERP" style="width:100%;height:1400px;border:0"></iframe><script>
window.calls=[];window.messages=[];window.modes=[];window.ready=false;const frame=document.getElementById('app');frame.srcdoc=${encoded};
window.deliver=(input,result)=>{frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:input}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:result},'*')};
addEventListener('message',async e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.method==='ui/notifications/initialized'){window.ready=true;return}if(m.id===undefined)return;let result={};
 if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'claude-test',version:'1'},hostCapabilities:{},hostContext:{theme:'light',displayMode:'inline',timeZone:'America/Sao_Paulo',safeAreaInsets:{top:0,right:0,bottom:34,left:0},toolInfo:{tool:{name:'${tool}'}}}};
 if(m.method==='tools/call'){calls.push(m.params);result=await(await fetch('/call',{method:'POST',body:JSON.stringify(m.params)})).json()}
 if(m.method==='ui/request-display-mode'){modes.push(m.params.mode);result={mode:m.params.mode}}
 if(m.method==='ui/message')messages.push(Array.isArray(m.params.content)?m.params.content.map(c=>c.text).join(''):'CONTENT_NAO_E_LISTA');
 frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*')});</script></body></html>`}
type Call={name:string;arguments:Record<string,unknown>}
type Win={calls:Call[];messages:string[];modes:string[];ready:boolean;deliver:(i:unknown,r:unknown)=>void}
async function main(){
  let currentHost=''
  const server=createServer(async(req,res)=>{
    if(req.url==='/call'){const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));const call=JSON.parse(Buffer.concat(chunks).toString())
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify(await executeTool(principal,call.name,call.arguments,settings,deps)));return}
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(currentHost)})
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r))
  const url='http://127.0.0.1:'+(server.address() as {port:number}).port
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executable,'Navegador necessário para verificar os cards')
  const browser=await chromium.launch({executablePath:executable,headless:true}),checks:string[]=[]
  mkdirSync('.cache/claudeplugin-cards',{recursive:true})
  async function open(tool:string,args:Record<string,unknown>):Promise<Page>{
    currentHost=host(tool);const page=await browser.newPage({viewport:{width:900,height:1100}}),errors:string[]=[]
    page.on('pageerror',error=>errors.push(error.message));(page as Page&{errors:string[]}).errors=errors
    await page.goto(url);await page.waitForFunction(()=>(window as unknown as Win).ready)
    const result=await executeTool(principal,tool,args,settings,deps)
    await page.evaluate(([a,r])=>(window as unknown as Win).deliver(a,r),[args,{...result,_meta:{'cognito/tool':tool}}] as const);return page}
  const win=(page:Page)=>page.evaluate(()=>{const w=window as unknown as Win;return {calls:w.calls,messages:w.messages,modes:w.modes}})
  const frame=(page:Page)=>page.frameLocator('#app')
  const lastCall=async(page:Page)=>(await win(page)).calls.at(-1)!
  // Regras inline do Claude: no máximo 2 ações, nenhuma lista suspensa, alvos de toque de 44 px.
  async function inlineRules(page:Page){const f=frame(page)
    assert.equal(await f.locator('select').count(),0,'sem listas suspensas')
    assert(await f.locator('.actions button').count()<=2,'no máximo 2 ações')
    for(const box of await f.locator('button').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().height)))assert(box>=44,'alvo de toque '+box)}
  const done=async(page:Page,name:string)=>{assert.deepEqual((page as Page&{errors:string[]}).errors,[],name);await frame(page).locator('main').screenshot({path:resolve('.cache/claudeplugin-cards/'+name+'.png')});await page.close();checks.push(name)}
  try{
    // Lista inline: duas linhas por item, 3 itens, 2 indicadores, sem navegação por linha.
    let page=await open('consultar_financeiro',{empresa_id:2,tipo:'pagar'});let f=frame(page)
    await f.getByRole('heading',{name:'Contas a pagar'}).waitFor()
    assert.equal(await f.locator('table.wide').isVisible(),false);assert.equal(await f.locator('.narrow .item').count(),3)
    assert.equal(await f.locator('.metric').count(),2);assert.equal(await f.locator('.clickable').count(),0)
    assert.equal(await f.locator('html').evaluate(()=>getComputedStyle(document.body).paddingBottom),'38px')
    await inlineRules(page)
    // Tela cheia: situação e ordem como botões de escolha; linha abre detalhes.
    await f.getByRole('button',{name:'Ver tudo'}).click();await page.waitForFunction(()=>(window as unknown as Win).modes.length===1)
    assert.equal(await f.locator('select').count(),0)
    await f.getByRole('group',{name:'Situação'}).getByRole('button',{name:'Vencidas'}).click()
    await f.getByRole('group',{name:'Ordenar por'}).getByRole('button',{name:'Maior saldo'}).click()
    assert.equal(await f.getByRole('button',{name:'Maior saldo'}).getAttribute('aria-pressed'),'true')
    await f.getByRole('button',{name:'Aplicar'}).click()
    await page.waitForFunction(()=>(window as unknown as Win).calls.at(-1)?.arguments.ordenar==='-saldo')
    assert.deepEqual((await lastCall(page)).arguments,{empresa_id:2,tipo:'pagar',status:'vencido',ordenar:'-saldo',pagina:1})
    await f.locator('table.wide tbody tr').first().click();await f.getByRole('heading',{name:'Parcela Aluguel'}).waitFor()
    await done(page,'lista-filtros')
    // Detalhes inline: até 5 campos, sem tabelas, ação principal + "Ver detalhes".
    page=await open('obter_venda',{empresa_id:2,venda_id:1});f=frame(page);await f.getByText('Venda VEN-001').waitFor()
    assert(await f.locator('.fields dt').count()<=5);assert.equal(await f.locator('table').count(),0)
    assert.deepEqual(await f.locator('.actions button').allInnerTexts(),['Confirmar venda','Ver detalhes']);await inlineRules(page)
    // Ação inline abre a prévia em tela cheia (sem navegação dentro do card inline).
    await f.getByRole('button',{name:'Confirmar venda'}).click();await f.getByText('Prévia — nada foi salvo ainda.').waitFor()
    assert.equal((await lastCall(page)).name,'confirmar_venda');assert.deepEqual((await win(page)).modes,['fullscreen'])
    await done(page,'detalhes-acao')
    // Prévia inline com muitos itens: essencial + "Ver prévia completa"; em tela cheia, Confirmar e Ajustar.
    const sale={empresa_id:2,tipo:'venda',chave_operacao:randomUUID(),dados:{cliente_id:5,data_venda:'2026-10-07',data_vencimento:'2026-10-31',itens:items}}
    page=await open('criar_venda',sale);f=frame(page);await f.getByRole('heading',{name:'Criar venda · Padaria Central'}).waitFor()
    assert.equal(await f.locator('table:has(caption) tbody tr').count(),3);await f.getByText('2 itens na prévia completa.').waitFor()
    assert.deepEqual(await f.locator('.actions button').allInnerTexts(),['Confirmar','Ver prévia completa']);await inlineRules(page)
    await f.getByRole('button',{name:'Ver prévia completa'}).click();await f.getByRole('button',{name:'Ajustar'}).waitFor()
    assert.equal(await f.locator('table:has(caption) tbody tr').count(),5)
    await f.getByRole('button',{name:'Confirmar',exact:true}).click();await f.getByText('Salvo no ERP.').waitFor()
    assert.deepEqual(Object.keys((await lastCall(page)).arguments).sort(),['empresa_id','rascunho_id']);await done(page,'previa-completa')
    // Prévia curta: Confirmar e Ajustar inline; Ajustar leva à tela cheia para editar.
    page=await open('criar_venda',{...sale,chave_operacao:randomUUID(),dados:{...sale.dados,itens:items.slice(0,1)}});f=frame(page)
    assert.deepEqual(await f.locator('.actions button').allInnerTexts(),['Confirmar','Ajustar'])
    await f.getByRole('button',{name:'Ajustar'}).click();await f.getByLabel('Quantidade de Farinha 25kg').waitFor()
    assert.deepEqual((await win(page)).modes,['fullscreen']);await done(page,'ajustar-tela-cheia')
    console.log(JSON.stringify({status:'passed',checks,screenshots:'.cache/claudeplugin-cards',realClaude:false,realDatabase:false}))
  } finally {await browser.close();await new Promise<void>(r=>server.close(()=>r()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
