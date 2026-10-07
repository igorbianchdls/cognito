import {serviceInvoiceQueryStubs} from './erp/service-invoice-query-stubs'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { existsSync,mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium,type Page } from 'playwright-core'
import { executeTool,type ExecutionDependencies } from '../src/products/chatgptplugin/application/executeTool'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import type { PluginPrincipal } from '../src/products/chatgptplugin/shared/contracts'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'
import { renderCardsHtml } from '../src/products/chatgptplugin/ui/resource'

// Cards em navegador real com host MCP Apps simulado; sem ChatGPT, banco ou rede externa.
const settings:PluginConfig={resource:'https://erp.example.invalid/api/mcp',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp',
  issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['test'],origins:['https://erp.example.invalid'],toolTimeoutMs:5000,requestsPerMinute:60}
const company={id:2,name:'Empresa Teste',profile:'administrador' as const,capabilities:[...ERP_CAPABILITIES]}
const principal:PluginPrincipal={userId:1,clerkUserId:'user_1',clientId:'test',scopes:['erp:read','erp:write'],companies:[company,{...company,id:3,name:'Filial Norte'}]}
const evil='<img src=x onerror="window.hacked=true">'
const rows=Array.from({length:7},(_,i)=>({id:String(i+1),conta_id:String(100+i),descricao:i===0?evil:'Conta '+(i+1),fornecedor:'Fornecedor '+(i+1),vencimento:'2026-10-1'+i,valor:100*(i+1),saldo:100*(i+1),status:'aberto'}))
const prepared:{tipo:string;dados:Record<string,unknown>}[]=[],executed:string[]=[]
const draft=(tipo:string,dados:Record<string,unknown>,extra:Record<string,unknown>={})=>({rascunho_id:randomUUID(),empresa_id:2,status:'pending',registro_id:null,criado_em:'2026-10-07T10:00:00Z',
  expira_em:'2026-10-08T10:00:00Z',etapa:'previa',alvo:null,referencias:{cliente:{id:'5',nome:'Padaria Central'},fornecedor:null,itens:[{tipo:'produto',id:'9',nome:'Farinha 25kg'}]},
  proposta:{tipo,dados,...(Array.isArray(dados.itens)?{total:(dados.itens as {quantidade:number;valor_unitario:number;desconto?:number}[]).reduce((s,i)=>s+i.quantidade*i.valor_unitario-(i.desconto||0),0)}:{})},...extra})
const deps:ExecutionDependencies={reserve:async()=>randomUUID(),finish:async()=>{},queries:{...serviceInvoiceQueryStubs,
  page:async(_c:number,_type:string,input:{page?:number;pageSize?:number})=>({records:input.page===2?rows.slice(5):rows,total:7,page:input.page||1,pageSize:input.pageSize||20,summary:{em_aberto:2800,vencidas:300}}),
  sale:async()=>({sale:{id:'1',numero:'VEN-001',cliente_nome:evil,status:'rascunho',total:150,data_venda:'2026-10-01'},items:[{descricao:'Farinha',quantidade:2,valor_unitario:75,total:150}],totalItems:1,itemsTruncated:false,installments:[{data_vencimento:'2026-10-31',valor:150}],installmentsTruncated:false}),
  analysis:async(_c:number,tipo:string,inicio:string,fim:string)=>({tipo,inicio,fim,criterio:'Confirmadas',summary:{quantidade:3,valor_total:900,valor_medio:300},records:[{periodo:'2026-08',quantidade:1,valor:200},{periodo:'2026-09',quantidade:2,valor:700}]}),
  overview:async()=>({saldoReceber:1200,saldoPagar:800,receberVencido:100,vendasRascunho:2,comprasAbertas:1,clientesAtivos:40}),
} as unknown as ExecutionDependencies['queries'],actions:{
  prepare:async(_p,_c,_k,proposal)=>{prepared.push(proposal as never);return draft(proposal.tipo,proposal.dados as Record<string,unknown>) as never},
  execute:async(_p,_c,id)=>{executed.push(id);return {...draft('venda',{cliente_id:5,data_venda:'2026-10-07',data_vencimento:'2026-10-31',itens:[{tipo:'produto',item_id:9,quantidade:2,valor_unitario:75,desconto:0}]}),rascunho_id:id,status:'saved',registro_id:'321',etapa:'executado',referencias:undefined} as never}}}
const html=renderCardsHtml(),encoded=JSON.stringify(html).replaceAll('<','\\u003c')
function host(tool:string,theme='light'){return `<!doctype html><html><body style="margin:0"><iframe id="app" title="ERP" style="width:100%;height:1200px;border:0"></iframe><script>
window.calls=[];window.messages=[];window.context=[];window.modes=[];window.ready=false;const frame=document.getElementById('app');frame.srcdoc=${encoded};
window.deliver=(input,result)=>{frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:input}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:result},'*')};
addEventListener('message',async e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.method==='ui/notifications/initialized'){window.ready=true;return}if(m.id===undefined)return;let result={};
 if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'test',version:'1'},hostCapabilities:{},hostContext:{theme:'${theme}',displayMode:'inline',toolInfo:{tool:{name:'${tool}'}},styles:{variables:{'--color-text-primary':'${theme==='dark'?'#f5f5f5':'#111111'}'}}}};
 if(m.method==='tools/call'){calls.push(m.params);result=await(await fetch('/call',{method:'POST',body:JSON.stringify(m.params)})).json()}
 if(m.method==='ui/request-display-mode'){modes.push(m.params.mode);result={mode:m.params.mode}}
 if(m.method==='ui/message')messages.push(m.params.content.text);if(m.method==='ui/update-model-context')context.push(m.params);
 frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*')});</script></body></html>`}
type Win={calls:{name:string;arguments:Record<string,unknown>}[];messages:string[];context:unknown[];modes:string[];hacked?:boolean;ready:boolean;deliver:(i:unknown,r:unknown)=>void}
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
  mkdirSync('.cache/chatgptplugin-cards',{recursive:true})
  async function open(tool:string,args:Record<string,unknown>,options:{theme?:string;width?:number}={}):Promise<Page>{
    currentHost=host(tool,options.theme);const page=await browser.newPage({viewport:{width:options.width||900,height:1100}}),errors:string[]=[]
    page.on('pageerror',error=>errors.push(error.message));(page as Page&{errors:string[]}).errors=errors
    await page.goto(url);await page.waitForFunction(()=>(window as unknown as Win).ready)
    const result=await executeTool(principal,tool,args,settings,deps)
    await page.evaluate(([a,r])=>(window as unknown as Win).deliver(a,r),[args,result] as const);return page}
  const win=(page:Page)=>page.evaluate(()=>{const w=window as unknown as Win;return {calls:w.calls,messages:w.messages,context:w.context,modes:w.modes,hacked:Boolean(w.hacked)}})
  const frame=(page:Page)=>page.frameLocator('#app')
  const shot=(page:Page,name:string)=>frame(page).locator('main').screenshot({path:resolve('.cache/chatgptplugin-cards/'+name+'.png')})
  const done=async(page:Page,name:string)=>{assert.deepEqual((page as Page&{errors:string[]}).errors,[],name);assert.equal((await win(page)).hacked,false);await shot(page,name);await page.close();checks.push(name)}
  try{
    // Lista inline: até 5 linhas e uma ação; tela cheia com paginação.
    let page=await open('consultar_financeiro',{empresa_id:2,tipo:'pagar'})
    const f=frame(page);await f.getByRole('heading',{name:'Contas a pagar'}).waitFor()
    assert.equal(await f.locator('tbody tr').count(),5);assert.equal(await f.locator('img').count(),0);assert.equal(await f.getByRole('button').count(),1)
    await f.getByRole('button',{name:'Ver tudo'}).click();await f.getByRole('button',{name:'Próxima'}).waitFor()
    assert.deepEqual((await win(page)).modes,['fullscreen']);assert.equal(await f.locator('tbody tr').count(),7)
    await f.getByRole('button',{name:'Próxima'}).click();await f.getByText('Página 2').waitFor()
    assert.deepEqual((await win(page)).calls.at(-1),{name:'consultar_financeiro',arguments:{empresa_id:2,tipo:'pagar',pagina:2}})
    await done(page,'lista-tela-cheia')
    // Detalhes, análise, resumo e empresas.
    page=await open('obter_venda',{empresa_id:2,venda_id:1});await frame(page).getByText('Venda VEN-001').waitFor();await frame(page).getByText('Itens').waitFor();await done(page,'detalhes')
    page=await open('analisar_periodo',{empresa_id:2,tipo:'vendas',inicio:'2026-08-01',fim:'2026-09-30'});await frame(page).locator('.bar').first().waitFor()
    assert.equal(await frame(page).locator('.bar').count(),2);await done(page,'analise')
    page=await open('resumo_erp',{empresa_id:2});await frame(page).getByText('Clientes ativos').waitFor();await done(page,'resumo')
    page=await open('meu_acesso',{});await frame(page).getByText('Filial Norte').waitFor()
    await frame(page).getByRole('button',{name:'Usar esta'}).nth(1).click();await page.waitForFunction(()=>(window as unknown as Win).messages.length===1)
    assert.match((await win(page)).messages[0],/empresa_id 3/);await done(page,'empresas')
    // Revisão: nomes no lugar de IDs, Confirmar executa pela mesma tool com rascunho_id.
    const sale={empresa_id:2,tipo:'venda',chave_operacao:randomUUID(),dados:{cliente_id:5,data_venda:'2026-10-07',data_vencimento:'2026-10-31',itens:[{tipo:'produto',item_id:9,quantidade:2,valor_unitario:75}]}}
    page=await open('criar_venda',sale);const r=frame(page)
    await r.getByText('Prévia — nada foi salvo ainda.').waitFor();await r.getByText('Padaria Central').waitFor();await r.getByText('Farinha 25kg').waitFor();assert.equal(await r.getByText('Cliente (ID)').count(),0)
    assert.equal(await r.getByRole('button').count(),2);await shot(page,'revisao')
    await r.getByRole('button',{name:'Confirmar'}).click();await r.getByText('Salvo no ERP.').waitFor()
    const confirmed=await win(page);assert.equal(confirmed.calls.length,1);assert.equal(confirmed.calls[0].name,'criar_venda')
    assert.deepEqual(Object.keys(confirmed.calls[0].arguments).sort(),['empresa_id','rascunho_id']);assert.equal(executed.length,1)
    assert.equal(confirmed.context.length,1);await done(page,'resultado')
    // Ajustar edita itens e gera nova prévia com outra chave, sem executar.
    page=await open('criar_venda',{...sale,chave_operacao:randomUUID()});const a=frame(page)
    await a.getByRole('button',{name:'Ajustar'}).click();await a.getByLabel('Quantidade de Farinha 25kg').fill('3')
    await a.getByRole('button',{name:'Atualizar prévia'}).click();await page.waitForFunction(()=>(window as unknown as Win).context.length===1)
    const adjusted=(await win(page)).calls[0];assert.equal(adjusted.name,'criar_venda');assert.equal(adjusted.arguments.tipo,'venda');assert.notEqual(adjusted.arguments.chave_operacao,sale.chave_operacao)
    assert.equal((adjusted.arguments.dados as {itens:{quantidade:number}[]}).itens[0].quantidade,3);assert.equal(prepared.at(-1)!.tipo,'venda');assert.equal(executed.length,1)
    await a.getByText('R$ 225,00').waitFor();await done(page,'ajuste')
    // Operação de risco: aviso e confirmação explícita.
    page=await open('excluir_cadastro',{empresa_id:2,tipo:'cliente',chave_operacao:randomUUID(),dados:{registro_id:5,motivo:'Cadastro duplicado'}})
    await frame(page).getByText('Atenção: esta operação desfaz ou remove dados no ERP.').waitFor();await frame(page).getByRole('button',{name:'Confirmar mesmo assim'}).waitFor();await done(page,'risco')
    // Erro com campos, tema escuro e largura de celular.
    page=await open('registrar_baixa',{empresa_id:2,tipo:'pagar',chave_operacao:randomUUID(),dados:{registro_id:1,valor:10,data_pagamento:'2026-02-31',conta_financeira_id:1}},{theme:'dark',width:375})
    await frame(page).getByText('Não foi possível concluir').waitFor();await frame(page).getByText(/Data de pagamento/).first().waitFor();await done(page,'erro-escuro-celular')
    console.log(JSON.stringify({status:'passed',checks,screenshots:'.cache/chatgptplugin-cards',realChatGPT:false,realDatabase:false}))
  } finally {await browser.close();await new Promise<void>(r=>server.close(()=>r()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
