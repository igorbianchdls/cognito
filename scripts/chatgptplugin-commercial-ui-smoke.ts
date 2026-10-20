import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {existsSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {chromium} from 'playwright-core'
import {renderCardsHtml} from '../src/products/mcpcore/ui/resource'

type Row=Record<string,unknown>
type Call={name:string;arguments:Row}
const item={descricao:'Consultoria de marketing',quantidade:1,valor_unitario:100,total:100}
const record={id:'1094',numero:'VEN-1094',cliente_nome:'QA-OTTO Cliente Cenário',data_venda:'2026-10-14',tipo_documento:'venda',status:'cancelada',total:100}
const details=(fields:Row={},extra:Row={})=>({sale:{...record,...fields},items:[{...item}],totalItems:1,itemsTruncated:false,installments:[],installmentsTruncated:false,...extra})
const listing=(count=2)=>({records:Array.from({length:count},(_,index)=>({id:String(1094-index),numero:'QA-OTTO-'+index,cliente:record.cliente_nome,data:record.data_venda,total:100,status:index===0?'cancelada':index===1?'confirmada':'rascunho'})),total:count,page:1,pageSize:count,selecao:{limite:count,total_disponivel:168},paginacao:{modo:'local',por_pagina:5}})
const calls:Call[]=[],checks:string[]=[],screenshots=process.env.CHATGPTPLUGIN_SKIP_SCREENSHOTS!=='1'
let tool='listar_vendas',args:Row={empresa_id:2,limite:2,ordenar:'-data'},data:Row=listing(),theme='light',variant:'chatgpt'|'claude'='chatgpt'
const response=(payload:Row)=>({structuredContent:{ok:true,empresa_id:2,data:payload}})
const encode=(value:unknown)=>JSON.stringify(value).replaceAll('<','\\u003c')
function host(){return `<!doctype html><html><head><style>body{margin:0;background:${theme==='dark'?'#1a1c1f':'#fff'}}iframe{box-sizing:border-box;width:100%;border:1px solid ${theme==='dark'?'#34383d':'#e6e8eb'};border-radius:18px}</style></head><body><iframe id="card" title="ERP" style="height:1000px"></iframe><script>
const frame=document.getElementById('card');frame.srcdoc=${encode(renderCardsHtml({name:'commercial-test',version:'1',host:variant}))};
addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;
if(message.method==='ui/notifications/size-changed'){frame.style.height=Math.ceil(message.params.height)+2+'px';return}
if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:${encode(args)}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{...${encode(response(data))},_meta:{'cognito/tool':${encode(tool)}}}},'*');return}
if(message.id===undefined)return;let result={};if(message.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostContext:{theme:${encode(theme)},displayMode:'inline'},hostCapabilities:{}};
if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();
if(message.method==='ui/request-display-mode')result={mode:message.params.mode};frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>`}
async function main(){
  const server=createServer(async(request,res)=>{res.setHeader('Content-Type','application/json');if(request.url==='/call'){const chunks:Buffer[]=[];for await(const chunk of request)chunks.push(Buffer.from(chunk));const call:Call=JSON.parse(Buffer.concat(chunks).toString());calls.push(call);
    if(call.name==='obter_venda'){res.end(JSON.stringify(response(details({id:String(call.arguments.venda_id)}))));return}
    if(call.name==='listar_vendas'||call.name==='listar_compras'){res.end(JSON.stringify(response(listing(6))));return}
    if(call.name==='confirmar_venda'){res.end(JSON.stringify(response({etapa:'previa',empresa_id:2,rascunho_id:randomUUID(),status:'pending',registro_id:null,proposta:{tipo:'confirmar_venda',dados:call.arguments.dados},alvo:{registro_id:1094,nome:'Venda #1094',status:'rascunho',valor:'100'},confirmar:{tool:'confirmar_venda',argumentos:{empresa_id:2,rascunho_id:randomUUID()}}})));return}
    res.end(JSON.stringify({isError:true,content:[{type:'text',text:JSON.stringify({code:'UNEXPECTED_CALL',message:'Chamada inesperada no teste.'})}]}));return}
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host())})
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done))
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);assert(executable)
  const browser=await chromium.launch({executablePath:executable,headless:true,args:['--disable-extensions','--disable-background-networking']}),page=await browser.newPage({viewport:{width:390,height:1000}}),frame=page.frameLocator('#card'),errors:string[]=[],url='http://127.0.0.1:'+(server.address() as {port:number}).port
  page.on('pageerror',error=>errors.push(error.message))
  const open=async(name='obter_venda',payload:Row=details(),input:Row={empresa_id:2,venda_id:1094})=>{tool=name;data=payload;args=input;calls.length=0;await page.goto(url);await frame.locator(name.startsWith('listar_')?'.commercial-card':'.document-card').waitFor()}
  const section=(name:string)=>frame.locator('.document-section').filter({has:frame.getByRole('heading',{name,exact:true})})
  const fit=async()=>assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)
  const shot=async(name:string)=>{if(screenshots){mkdirSync('.cache/chatgptplugin-commercial',{recursive:true});await page.locator('#card').screenshot({path:resolve('.cache/chatgptplugin-commercial/'+name+'.png')})}}
  try{
    await open('listar_vendas',listing(),{empresa_id:2,limite:2,ordenar:'-data'});await frame.getByText('2 vendas encontradas',{exact:true}).waitFor()
    assert.equal(await frame.locator('.commercial-party').first().innerText(),record.cliente_nome);assert.equal(await frame.locator('.commercial-chevron').count(),2);assert.equal(await frame.locator('.commercial-row').count(),2)
    assert.equal(await frame.getByRole('button',{name:'Anterior',exact:true}).isEnabled(),false);assert.equal(await frame.getByRole('button',{name:'Próxima',exact:true}).isEnabled(),false)
    const colors=await frame.locator('.commercial-status').evaluateAll(nodes=>nodes.map(node=>({text:getComputedStyle(node).color,background:getComputedStyle(node).backgroundColor})))
    assert.notEqual(colors[0].text,colors[0].background);assert.notEqual(colors[0].background,colors[1].background);assert(!['transparent','rgba(0, 0, 0, 0)'].includes(colors[0].background));await shot('lista-vendas');assert.equal(calls.length,0)
    checks.push('reference_list_includes_party_arrow_colored_background_badges_and_disabled_single_page_controls')
    await frame.getByRole('button',{name:'Abrir Venda #1094',exact:true}).focus();await frame.getByRole('button',{name:'Abrir Venda #1094',exact:true}).press('Enter');await frame.getByRole('heading',{name:'Venda #1094',exact:true}).waitFor();await frame.getByRole('button',{name:'Voltar às vendas',exact:true}).click();await frame.getByText('1–2 de 2 vendas',{exact:true}).waitFor();assert.equal(calls.length,1)
    for(const [name,title,partyName,payload,input] of [
      ['listar_vendas','Orçamentos',record.cliente_nome,{...listing(),records:listing().records.map(row=>({...row,situacao:'enviada'}))},{empresa_id:2,tipo_documento:'orcamento',limite:2}],
      ['listar_compras','Compras','Fornecedor Norte',{...listing(),records:listing().records.map(row=>({...row,cliente:undefined,fornecedor:'Fornecedor Norte',status:'recebida'}))},{empresa_id:2,limite:2}]
    ] as const){await open(name,payload,input);await frame.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(await frame.locator('.commercial-party').first().innerText(),partyName);assert.equal(await frame.locator('.commercial-row').count(),2);assert.equal(calls.length,0);await fit()}
    checks.push('keyboard_navigation_and_shared_quote_purchase_list_layout_with_correct_party')
    await open('listar_vendas',listing(6),{empresa_id:2,limite:6,ordenar:'-data',busca:'Cliente'});await frame.getByRole('button',{name:'Próxima',exact:true}).click();await frame.getByText('6–6 de 6 vendas',{exact:true}).waitFor()
    await frame.getByRole('button',{name:'Abrir Venda #1089',exact:true}).click();await frame.getByRole('heading',{name:'Venda #1089',exact:true}).waitFor();assert.deepEqual([...calls],[{name:'obter_venda',arguments:{empresa_id:2,venda_id:1089}}])
    await frame.getByRole('button',{name:'Voltar às vendas',exact:true}).click();await frame.getByText('6–6 de 6 vendas',{exact:true}).waitFor();await frame.getByRole('button',{name:'Abrir Venda #1089',exact:true}).click();await frame.getByRole('button',{name:'Voltar à listagem',exact:true}).click();await frame.getByText('6–6 de 6 vendas',{exact:true}).waitFor();assert.equal(calls.length,2)
    checks.push('both_return_controls_preserve_local_page_filters_selection_and_company_without_requery')
    await open();await frame.getByRole('heading',{name:'Venda #1094',exact:true}).waitFor();await section('Informações gerais').getByText('Empresa #2',{exact:true}).waitFor();await section('Cliente').getByText(record.cliente_nome,{exact:true}).waitFor();await section('Itens da venda').getByText(item.descricao,{exact:true}).waitFor()
    assert.equal(await frame.locator('table').count(),0);assert.equal(await frame.getByRole('button',{name:'Confirmar venda',exact:true}).count(),0);assert.equal(await section('Resumo financeiro').locator('.document-fields>div').filter({hasText:'Pagamento'}).locator('dd').innerText(),'Não informado');await shot('detalhe-venda');assert.equal(calls.length,0)
    for(const [name,fields,heading,partyName] of [['obter_venda',{tipo_documento:'orcamento',situacao:'enviada'},'Orçamento #1094','Cliente'],['obter_compra',{fornecedor_nome:'Fornecedor Norte',data_compra:'2026-10-14',status:'recebida'},'Compra #1094','Fornecedor']] as const){const payload=name==='obter_compra'?{purchase:{...fields,id:'1094',total:100,numero:'COM-1094'},items:[],totalItems:0,itemsTruncated:false,installments:[]}:details(fields);await open(name,payload,{empresa_id:2,registro_id:1094});await frame.getByRole('heading',{name:heading,exact:true}).waitFor();await section(partyName).waitFor();assert.equal(calls.length,0)}
    checks.push('sale_quote_purchase_sections_real_values_and_no_inferred_payment_or_extra_access_call')
    const manyItems=Array.from({length:7},(_,index)=>({...item,descricao:'Serviço '+(index+1)})),installments=Array.from({length:7},(_,index)=>({numero_parcela:index+1,data_vencimento:'2026-11-'+String(index+1).padStart(2,'0'),valor:100}))
    await open('obter_venda',details({status:'confirmada',tipo_desconto:'percentual',desconto:10,observacoes:'Primeira linha\nSegunda linha'},{items:manyItems,totalItems:7,installments}));assert.equal(await section('Itens da venda').locator('.document-records>li').count(),5);assert.equal(await section('Parcelas previstas').locator('.document-records>li').count(),5);await section('Resumo financeiro').getByText('10%',{exact:true}).waitFor()
    await frame.getByRole('button',{name:'Próxima: itens',exact:true}).click();await section('Itens da venda').getByText('Serviço 6',{exact:true}).waitFor();assert.equal(await section('Itens da venda').locator('.document-records>li').count(),2)
    await frame.getByRole('button',{name:'Próxima: parcelas previstas',exact:true}).click();await section('Parcelas previstas').getByText('Parcela 6',{exact:true}).waitFor();await section('Itens da venda').getByText('Serviço 6',{exact:true}).waitFor();assert.equal(calls.length,0)
    await section('Observações').getByText('Primeira linha\nSegunda linha',{exact:true}).waitFor();await section('Parcelas previstas').getByText('As parcelas previstas não comprovam pagamento ou recebimento.',{exact:true}).waitFor()
    checks.push('items_and_forecast_installments_page_by_five_independently_without_network_or_payment_assumptions')
    await open('obter_venda',details({}, {items:undefined,totalItems:undefined}));await section('Itens da venda').getByText('Os dados desta seção não foram disponibilizados nesta consulta.',{exact:true}).waitFor()
    await open('obter_venda',details({}, {items:[],totalItems:0}));await section('Itens da venda').getByText('Nenhum item registrado.',{exact:true}).waitFor()
    await open('obter_venda',details({}, {items:manyItems,totalItems:120,itemsTruncated:true,installments:[],installmentsTruncated:true}));await section('Itens da venda').getByText(/7 itens carregados de 120/).waitFor();await frame.getByRole('button',{name:'Próxima: itens carregados',exact:true}).click();await section('Itens da venda').getByText('Serviço 6',{exact:true}).waitFor();await section('Parcelas previstas').getByText(/há dados não exibidos/).waitFor();assert.equal(calls.length,0)
    checks.push('missing_empty_and_truncated_collections_remain_distinct_and_never_claim_complete_results')
    const evil='<img src=x onerror="window.hacked=true">',long=details({cliente_nome:evil+'Nome longo '.repeat(25),observacoes:evil+'Observações longas '.repeat(40),total:9876543210123.45},{items:[{...item,descricao:evil+'Serviço longo '.repeat(15),total:9876543210123.45}]})
    for(const width of [320,390,768]){await page.setViewportSize({width,height:1000});await open('obter_venda',long);await fit();assert.equal(await frame.locator('img').count(),0);assert.equal(await frame.locator('.document-total>strong').isVisible(),true);const rows=listing();rows.records[0].cliente=evil+'Nome longo '.repeat(25);rows.records[0].total=9876543210123.45;await open('listar_vendas',rows);await fit();assert.equal(await frame.locator('.commercial-party').first().evaluate(node=>getComputedStyle(node).textOverflow),'ellipsis')}
    await page.setViewportSize({width:390,height:1000});theme='dark';await open('listar_vendas',listing());const dark=await frame.locator('.commercial-status').first().evaluate(node=>getComputedStyle(node).backgroundColor);assert.notEqual(dark,colors[0].background);await shot('lista-vendas-escuro');await open();await shot('detalhe-venda-escuro');await fit();theme='light'
    checks.push('mobile_desktop_large_amounts_long_names_untrusted_text_and_light_dark_badge_backgrounds')
    variant='claude';await open('obter_venda',details({status:'rascunho'}));assert.equal(await frame.locator('input,select,table').count(),0);assert.equal(await frame.locator('.actions button').count(),2);assert.equal(await section('Informações gerais').count(),0)
    for(const height of await frame.locator('button').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height)))assert(height>=44)
    await frame.getByRole('button',{name:'Ver detalhes',exact:true}).click();await section('Informações gerais').waitFor();assert.equal(calls.length,0);await fit();variant='chatgpt'
    await open('obter_venda',details({status:'rascunho'}));await frame.getByRole('button',{name:'Confirmar venda',exact:true}).click();await frame.getByText('Prévia — nada foi salvo ainda.',{exact:true}).waitFor();assert.equal(calls.length,1);assert.equal(calls[0].name,'confirmar_venda');assert.deepEqual(calls[0].arguments.dados,{registro_id:1094});assert.equal(calls[0].arguments.empresa_id,2);assert.equal(calls[0].arguments.rascunho_id,undefined);assert(calls[0].arguments.chave_operacao)
    assert.deepEqual(errors,[]);checks.push('claude_compact_fullscreen_touch_targets_and_business_action_still_requires_preview')
    console.log(JSON.stringify({status:'passed',checks,screenshots:screenshots?'.cache/chatgptplugin-commercial':false,realERPChanges:false,realDatabase:false,realChatGPT:false}))
  }finally{await browser.close();await new Promise<void>(done=>server.close(()=>done()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
