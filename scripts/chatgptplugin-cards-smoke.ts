import {serviceInvoiceQueryStubs} from './erp/service-invoice-query-stubs'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { existsSync,mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium,type Page } from 'playwright-core'
import { executeTool,type ExecutionDependencies } from '../src/products/mcpcore/application/executeTool'
import { ERP_CAPABILITIES } from '../src/products/erp/shared/professionalContracts'
import type { PluginPrincipal } from '../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../src/products/chatgptplugin/shared/config'
import { renderCardsHtml } from '../src/products/mcpcore/ui/resource'
import { CHATGPTPLUGIN_VERSION } from '../src/products/chatgptplugin/shared/version'

// Cards em navegador real com host MCP Apps simulado; sem ChatGPT, banco ou rede externa.
const settings:PluginConfig={integration:'chatgpt',resource:'https://erp.example.invalid/api/mcp',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp',
  issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['test'],origins:['https://erp.example.invalid'],toolTimeoutMs:5000,requestsPerMinute:60}
const company={id:2,name:'Empresa Teste',profile:'administrador' as const,capabilities:[...ERP_CAPABILITIES]}
const principal:PluginPrincipal={userId:1,clerkUserId:'user_1',clientId:'test',scopes:['erp:read','erp:write'],companies:[company,{...company,id:3,name:'Filial Norte'}]}
const evil='<img src=x onerror="window.hacked=true">'
// Referência do teste: 07/10/2026. As duas primeiras parcelas estão vencidas.
const rows=Array.from({length:7},(_,i)=>({id:String(i+1),conta_id:String(100+i),descricao:i===0?evil:'Conta '+(i+1),fornecedor:'Fornecedor '+(i+1),
  vencimento:i<2?'2026-10-0'+(i+1):'2026-10-1'+i,valor:100*(i+1),saldo:100*(i+1),status:i<2?'vencido':'aberto'}))
const summary={referencia:'2026-10-07',quantidade:7,em_aberto:2800,vencidas:300,vence_em_7_dias:500,valor_total:2800}
const executed:string[]=[]
const drafts=new Map<string,{tipo:string;dados:Record<string,unknown>}>()
function draft(tipo:string,dados:Record<string,unknown>){const id=randomUUID();drafts.set(id,{tipo,dados})
  return {rascunho_id:id,empresa_id:2,status:'pending',registro_id:null,criado_em:'2026-10-07T10:00:00Z',expira_em:'2026-10-08T10:00:00Z',
    alvo:dados.registro_id?{registro_id:dados.registro_id,nome:'Padaria Central',status:'ativo',campos:{}}:null,
    referencias:{cliente:{id:'5',nome:'Padaria Central'},fornecedor:null,itens:[{tipo:'produto',id:'9',nome:'Farinha 25kg'}]},
    proposta:{tipo,dados,...(Array.isArray(dados.itens)?{total:(dados.itens as {quantidade:number;valor_unitario:number;desconto?:number}[]).reduce((s,i)=>s+i.quantidade*i.valor_unitario-(i.desconto||0),0)}:{})}}}
const clients=[{id:'5',nome:'Padaria Central',documento:'12.345.678/0001-90',cidade:'Fortaleza',status:'ativo'},{id:'6',nome:'Padaria Sol',documento:'98.765.432/0001-10',cidade:'Recife',status:'ativo'},{id:'7',nome:'Padaria Nova',cidade:'Natal',status:'ativo'}]
const deps:ExecutionDependencies={reserve:async()=>randomUUID(),finish:async()=>{},queries:{...serviceInvoiceQueryStubs,
  page:async(_c:number,type:string,input:{page?:number;pageSize?:number;query?:string})=>type==='clientes'?{records:input.query==='Padaria'?clients:[clients[0]],total:input.query==='Padaria'?3:1,page:1,pageSize:20}
    :{records:input.page===2?rows.slice(5):rows,total:7,page:input.page||1,pageSize:input.pageSize||20,summary},
  installment:async(_c:number,_side:string,id:number)=>({record:{id:String(id),conta_id:'100',descricao:'Aluguel',fornecedor:'Imobiliária Centro',parcela:1,vencimento:'2026-10-01',valor:1200,valor_pago:0,saldo:1200,status:'vencido',lado:'pagar',conta_financeira_sugerida:{id:'9',nome:'Itaú'}},history:[],historyTruncated:false}),
  financialTitle:async()=>({record:{id:'100',descricao:'Aluguel',valor_total:1200},installments:[{id:'1',parcela:1,vencimento:'2026-10-01',valor:1200,saldo:1200,status:'vencido'}],installmentsTruncated:false,history:[],historyTruncated:false}),
  sale:async(_c:number,id:number)=>({sale:{id:String(id),numero:id===2?'ORC-002':'VEN-001',cliente_nome:evil,status:'rascunho',tipo_documento:id===2?'orcamento':'venda',total:150,data_venda:'2026-10-01'},items:[{descricao:'Farinha',quantidade:2,valor_unitario:75,total:150}],totalItems:1,itemsTruncated:false,installments:[{data_vencimento:'2026-10-31',valor:150}],installmentsTruncated:false}),
  registration:async(_c:number,_t:string,id:number)=>({record:{id:String(id),nome:'Padaria Central',documento:'12.345.678/0001-90'}}),
  analysis:async(_c:number,tipo:string,inicio:string,fim:string)=>({tipo,inicio,fim,criterio:'Confirmadas',summary:{quantidade:3,valor_total:900,valor_medio:300},records:[{periodo:'2026-08',quantidade:1,valor:200},{periodo:'2026-09',quantidade:2,valor:700}]}),
  overview:async()=>({saldoReceber:1200,saldoPagar:800,receberVencido:100,vendasRascunho:2,comprasAbertas:1,clientesAtivos:40}),
  report:async(_c:number,report:string,from:string,to:string)=>({report,from,to,page:1,pageSize:20,hasMore:false,records:report==='fluxo-de-caixa'
    ?[{competencia:'2026-10-01',entradas_realizadas:500,saidas_realizadas:300,entradas_previstas:200,saidas_previstas:900,saldo_inicial_contas:0,saldo_mes:-500,saldo_acumulado:-200}]
    :[{cliente:'Padaria Central',parcelas:2,a_vencer:100,vencido_1_30:50,vencido_31_60:0,vencido_61_90:0,vencido_mais_90:25,vencido:75,total:175}]}),
} as unknown as ExecutionDependencies['queries'],actions:{
  prepare:async(_p,_c,_k,proposal)=>draft(proposal.tipo,proposal.dados as Record<string,unknown>) as never,
  execute:async(_p,_c,id)=>{executed.push(id);const d=drafts.get(id)!;return {...draft(d.tipo,d.dados),rascunho_id:id,status:'saved',registro_id:'321',referencias:undefined} as never}}}
const html=renderCardsHtml({name:'chatgptplugin-cards',version:CHATGPTPLUGIN_VERSION,host:'chatgpt'}),encoded=JSON.stringify(html).replaceAll('<','\\u003c')
function host(tool:string,theme='light'){return `<!doctype html><html><body style="margin:0"><iframe id="app" title="ERP" style="width:100%;height:1400px;border:0"></iframe><script>
window.calls=[];window.messages=[];window.context=[];window.modes=[];window.ready=false;const frame=document.getElementById('app');frame.srcdoc=${encoded};
window.deliver=(input,result)=>{frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:input}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:result},'*')};
addEventListener('message',async e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.method==='ui/notifications/initialized'){window.ready=true;return}if(m.id===undefined)return;let result={};
 if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'test',version:'1'},hostCapabilities:{},hostContext:{theme:'${theme}',displayMode:'inline',timeZone:'America/Sao_Paulo',toolInfo:{tool:{name:'${tool}'}},styles:{variables:{'--color-text-primary':'${theme==='dark'?'#f5f5f5':'#111111'}'}}}};
 if(m.method==='tools/call'){calls.push(m.params);result=await(await fetch('/call',{method:'POST',body:JSON.stringify(m.params)})).json()}
 if(m.method==='ui/request-display-mode'){modes.push(m.params.mode);result={mode:m.params.mode}}
 if(m.method==='ui/message')messages.push(Array.isArray(m.params.content)?m.params.content.map(c=>c.text).join(''):'CONTENT_NAO_E_LISTA');if(m.method==='ui/update-model-context')context.push(m.params);
 frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*')});</script></body></html>`}
type Call={name:string;arguments:Record<string,unknown>}
type Win={calls:Call[];messages:string[];context:unknown[];modes:string[];hacked?:boolean;ready:boolean;deliver:(i:unknown,r:unknown)=>void}
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
    await page.evaluate(([a,r])=>(window as unknown as Win).deliver(a,r),[args,{...result,_meta:{'cognito/tool':tool}}] as const);return page}
  const win=(page:Page)=>page.evaluate(()=>{const w=window as unknown as Win;return {calls:w.calls,messages:w.messages,context:w.context,modes:w.modes,hacked:Boolean(w.hacked)}})
  const frame=(page:Page)=>page.frameLocator('#app')
  const shot=(page:Page,name:string)=>frame(page).locator('main').screenshot({path:resolve('.cache/chatgptplugin-cards/'+name+'.png')})
  const lastCall=async(page:Page)=>(await win(page)).calls.at(-1)!
  const done=async(page:Page,name:string)=>{assert.deepEqual((page as Page&{errors:string[]}).errors,[],name);assert.equal((await win(page)).hacked,false);await shot(page,name);await page.close();checks.push(name)}
  try{
    // A1/A2: colunas de contas, vencidas em destaque, contexto e até duas ações inline.
    let page=await open('consultar_financeiro',{empresa_id:2,tipo:'pagar'});let f=frame(page)
    await f.getByRole('heading',{name:'Contas a pagar'}).waitFor();await f.getByText('7 contas · vencimento mais próximo').waitFor()
    assert.deepEqual(await f.locator('table.wide thead th').allInnerTexts(),['Vencimento','Descrição','Fornecedor','Saldo','Situação'])
    assert.equal(await f.locator('table.wide tbody tr').count(),5);assert.equal(await f.locator('table.wide tr.overdue').count(),2)
    await f.locator('table.wide').getByText('venceu há 6 dias').waitFor();await f.getByText('Vence em 7 dias',{exact:true}).waitFor();await f.locator('table.wide small.soon').first().waitFor()
    assert.deepEqual(await f.locator('.actions button').allInnerTexts(),['Ver vencidas','Ver tudo']);assert.equal(await f.locator('img').count(),0)
    await shot(page,'lista-inline')
    await f.getByRole('button',{name:'Ver vencidas'}).click();await page.waitForFunction(()=>(window as unknown as Win).modes.length===1)
    assert.deepEqual((await lastCall(page)).arguments,{empresa_id:2,tipo:'pagar',status:'vencido',pagina:1})
    // A3: tela cheia com filtros, ordenação no servidor e clique na linha.
    await f.getByLabel('Ordenar por').selectOption('-saldo');await f.getByRole('button',{name:'Aplicar'}).click()
    await page.waitForFunction(()=>(window as unknown as Win).calls.at(-1)?.arguments.ordenar==='-saldo')
    assert.equal((await lastCall(page)).arguments.status,'vencido');await f.getByText(/maior saldo/).first().waitFor();await shot(page,'lista-tela-cheia')
    // C: detalhes da parcela → Registrar pagamento (prévia já preenchida) → Confirmar → próximo passo.
    await f.locator('table.wide tbody tr').nth(1).click();await f.getByRole('heading',{name:'Parcela Aluguel'}).waitFor()
    assert.deepEqual((await lastCall(page)),{name:'obter_parcela_financeira',arguments:{empresa_id:2,tipo:'pagar',parcela_id:2}})
    await f.getByText('venceu há 6 dias').first().waitFor();await f.getByRole('button',{name:'← Voltar'}).waitFor();await shot(page,'detalhes-parcela')
    await f.getByRole('button',{name:'Registrar pagamento'}).click();await f.getByText('Prévia — nada foi salvo ainda.').waitFor()
    const baixa=await lastCall(page);assert.equal(baixa.name,'registrar_baixa');assert.equal(baixa.arguments.tipo,'pagar')
    assert.deepEqual(baixa.arguments.dados,{registro_id:2,valor:1200,data_pagamento:'2026-10-07',conta_financeira_id:9})
    await f.getByRole('button',{name:'Confirmar'}).click();await f.getByText('Salvo no ERP.').waitFor()
    assert.deepEqual(Object.keys((await lastCall(page)).arguments).sort(),['empresa_id','rascunho_id']);assert.equal(await f.getByRole('button',{name:'← Voltar'}).count(),0)
    await shot(page,'resultado-baixa');await f.getByRole('button',{name:'Ver registro'}).click();await f.getByRole('heading',{name:'Parcela Aluguel'}).waitFor()
    assert.deepEqual((await lastCall(page)).arguments,{empresa_id:2,tipo:'pagar',parcela_id:2});await done(page,'fluxo-pagamento')
    // A2 no celular: lista em duas linhas, valor sempre visível.
    page=await open('consultar_financeiro',{empresa_id:2,tipo:'pagar'},{width:375});f=frame(page)
    await f.getByRole('heading',{name:'Contas a pagar'}).waitFor();assert.equal(await f.locator('table.wide').isVisible(),false)
    assert.equal(await f.locator('.narrow .item').count(),5);assert(await f.locator('.narrow .item-amount').first().isVisible());await done(page,'lista-celular')
    // C: venda em rascunho → Confirmar venda gera a prévia.
    page=await open('obter_venda',{empresa_id:2,venda_id:1});f=frame(page);await f.getByText('Venda VEN-001').waitFor()
    assert.deepEqual(await f.locator('table thead th').allInnerTexts(),['Descrição','Quantidade','Valor unitário','Total'])
    await f.getByRole('button',{name:'Confirmar venda'}).click();await f.getByText('Prévia — nada foi salvo ainda.').waitFor()
    assert.equal((await lastCall(page)).name,'confirmar_venda');assert.deepEqual((await lastCall(page)).arguments.dados,{registro_id:1});await done(page,'detalhes-venda')
    page=await open('obter_venda',{empresa_id:2,venda_id:2});f=frame(page);await f.getByText('Venda ORC-002').waitFor()
    await f.getByRole('button',{name:'Converter em venda'}).click();await f.getByRole('heading',{name:/Converter orçamento em venda/}).waitFor()
    assert.equal((await lastCall(page)).name,'converter_orcamento');await f.getByRole('button',{name:'Confirmar',exact:true}).click()
    await f.getByText('Salvo no ERP.').waitFor();await f.getByRole('button',{name:'Confirmar venda'}).waitFor();await done(page,'converter-orcamento')
    // B: escolha entre clientes parecidos.
    page=await open('buscar_cadastros',{empresa_id:2,tipo:'clientes',busca:'Padaria'});f=frame(page);await f.getByText('Padaria Sol').waitFor()
    assert.equal(await f.getByRole('button',{name:'Usar este'}).count(),3);await f.getByRole('button',{name:'Usar este'}).first().click()
    await page.waitForFunction(()=>(window as unknown as Win).messages.length===1);assert.equal((await win(page)).messages[0],'Usar cliente: Padaria Central (ID 5).');await done(page,'escolha-cliente')
    // E: indicadores do resumo abrem a lista; fluxo de caixa e inadimplência.
    page=await open('resumo_erp',{empresa_id:2});f=frame(page);await f.getByText('A receber vencido').click()
    await f.getByRole('heading',{name:'Contas a receber'}).waitFor();assert.deepEqual((await lastCall(page)).arguments,{empresa_id:2,tipo:'receber',status:'vencido'});await done(page,'resumo-para-lista')
    page=await open('consultar_relatorio',{empresa_id:2,tipo:'fluxo-de-caixa',inicio:'2026-10-01',fim:'2026-12-31'});f=frame(page)
    await f.getByText('out/2026',{exact:true}).waitFor();await f.getByText('O saldo previsto fica negativo em out/2026.').waitFor();await done(page,'fluxo-de-caixa')
    page=await open('consultar_relatorio',{empresa_id:2,tipo:'aging-receber',inicio:'2026-01-01',fim:'2026-10-07'});f=frame(page)
    await f.getByText('Padaria Central').waitFor();assert.equal(await f.locator('.track.stack i').count(),3);await done(page,'aging')
    page=await open('analisar_periodo',{empresa_id:2,tipo:'vendas',inicio:'2026-08-01',fim:'2026-09-30'});f=frame(page);await f.getByText('set/2026').waitFor();await f.getByText(/\(\+250%\)/).waitFor();await done(page,'analise')
    // D: risco com o nome do alvo; ajuste de itens; resultado com próximo passo.
    page=await open('excluir_cadastro',{empresa_id:2,tipo:'cliente',chave_operacao:randomUUID(),dados:{registro_id:5,motivo:'Cadastro duplicado'}});f=frame(page)
    await f.getByRole('heading',{name:'Excluir cliente · Padaria Central'}).waitFor();await f.getByRole('button',{name:'Confirmar mesmo assim'}).waitFor();await done(page,'risco')
    const sale={empresa_id:2,tipo:'venda',chave_operacao:randomUUID(),dados:{cliente_id:5,data_venda:'2026-10-07',data_vencimento:'2026-10-31',itens:[{tipo:'produto',item_id:9,quantidade:2,valor_unitario:75}]}}
    page=await open('criar_venda',sale);f=frame(page);await f.getByRole('heading',{name:'Criar venda · Padaria Central'}).waitFor();assert.equal(await f.getByText('Cliente (ID)').count(),0)
    await f.getByRole('button',{name:'Ajustar'}).click();await f.getByLabel('Quantidade de Farinha 25kg').fill('3');await f.getByRole('button',{name:'Atualizar prévia'}).click()
    await page.waitForFunction(()=>(window as unknown as Win).context.length===1);await f.getByText('R$ 225,00').waitFor()
    await f.getByRole('button',{name:'Confirmar',exact:true}).click();await f.getByText('Salvo no ERP.').waitFor();await f.getByRole('button',{name:'Confirmar venda'}).waitFor();await done(page,'resultado-venda')
    // F: erro com campos, tema escuro e celular.
    page=await open('registrar_baixa',{empresa_id:2,tipo:'pagar',chave_operacao:randomUUID(),dados:{registro_id:1,valor:10,data_pagamento:'2026-02-31',conta_financeira_id:1}},{theme:'dark',width:375})
    await frame(page).getByText('Não foi possível concluir').waitFor();await frame(page).getByText(/Data de pagamento/).first().waitFor();await done(page,'erro-escuro-celular')
    assert(executed.length>=2)
    console.log(JSON.stringify({status:'passed',checks,screenshots:'.cache/chatgptplugin-cards',realChatGPT:false,realDatabase:false}))
  } finally {await browser.close();await new Promise<void>(r=>server.close(()=>r()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
