import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {existsSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {chromium} from 'playwright-core'
import {renderCardsHtml} from '../src/products/mcpcore/ui/resource'
import {toolCallForProposal} from '../src/products/mcpcore/actions/catalog'
import {operationSnapshot} from '../src/products/mcpcore/domains/erp/actions/operations'
import {draftView,type DraftRow} from '../src/products/mcpcore/domains/erp/actions/draftRepository'
import {proposalSchema} from '../src/products/mcpcore/domains/erp/schemas/actionContracts'
import type {SQLClient} from '../src/lib/postgres'

type Data={etapa:string;empresa_id:number;rascunho_id:string;status:string;registro_id:string|null;expira_em:string;
  proposta:{tipo:string;dados:{registro_id:number;motivo:string}};
  alvo:{registro_id:number;nome:string;status:string|null;valor:string|null;resumo_exclusao?:{data:string|null;data_label:string;participante:{tipo:string;id:string;nome:string|null}|null}}|null;
  confirmar?:{tool:string;argumentos:{empresa_id:number;rascunho_id:string}}}
type Call={name:string;arguments:{empresa_id:number;rascunho_id?:string;chave_operacao?:string;dados?:{registro_id:number;motivo:string};[key:string]:unknown}}
type Context={content:{text:string}[];structuredContent:{execucao_confirmada?:boolean;exclusao_executada?:boolean;rascunho_id?:string}}
const response=(data:unknown)=>({structuredContent:{ok:true,empresa_id:2,data}})
function draft(kind='excluir_venda',reason='Registro criado por engano'):Data{const id=randomUUID(),mapping=toolCallForProposal({tipo:kind,dados:{}});return {etapa:'previa',empresa_id:2,rascunho_id:id,status:'pending',registro_id:null,expira_em:new Date(Date.now()+86400000).toISOString(),proposta:{tipo:kind,dados:{registro_id:1068,motivo:reason}},alvo:{registro_id:1068,nome:'Venda #1068',status:'rascunho',valor:'350',resumo_exclusao:{data:'2026-10-19',data_label:'Data da venda',participante:{tipo:'cliente',id:'5',nome:'Ana Martins'}}},confirmar:{tool:mapping.name,argumentos:{empresa_id:2,rascunho_id:id}}}}
const calls:Call[]=[],contexts:Context[]=[],messages:unknown[]=[],checks:string[]=[]
const screenshots=process.env.CHATGPTPLUGIN_SKIP_SCREENSHOTS!=='1'
let input=draft(),theme='light',hostKind:'chatgpt'|'claude'='chatgpt',writeCount=0,failure='',rejectContext=false,savedOverride:Data|null=null
let writeGate:Promise<void>|null=null,releaseWrite:()=>void=()=>{}
let contextGate:Promise<void>|null=null,releaseContext:()=>void=()=>{}
const encode=(value:unknown)=>JSON.stringify(value).replaceAll('<','\\u003c')
function host(){return `<!doctype html><html><head><style>body{margin:0;background:${theme==='dark'?'#1a1c1f':'#fff'}}iframe{box-sizing:border-box;border:1px solid ${theme==='dark'?'#34383d':'#e6e8eb'};border-radius:18px}</style></head><body><iframe id="card" title="Exclusão"></iframe><script>
  const frame=document.getElementById('card');frame.style.width='100%';frame.style.height='1000px';frame.srcdoc=${encode(renderCardsHtml({name:'deletion-test',version:'1',host:hostKind}))};
  addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;
    if(message.method==='ui/notifications/size-changed'){frame.style.height=Math.ceil(message.params.height)+2+'px';return}
    if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{empresa_id:2}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:{ok:true,empresa_id:2,data:${encode(input)}},_meta:{'cognito/tool':${encode(input.confirmar?.tool||'excluir_venda')}}}},'*');return}
    if(message.id===undefined)return;let result={};
    if(message.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostContext:{theme:${encode(theme)},displayMode:'inline'},hostCapabilities:{}};
    if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();
    if(message.method==='ui/request-display-mode')result={mode:message.params.mode};
    if(message.method==='ui/update-model-context'||message.method==='ui/message'){const answer=await(await fetch('/event',{method:'POST',body:JSON.stringify(message)})).json();if(answer.error){frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,error:answer.error},'*');return}}
    frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>`}
async function snapshots(){
  let name='Ana Martins'
  const queries:{sql:string;args:unknown[]}[]=[],row={id:1068,empresa_id:2,numero:'VEN-1068',status:'rascunho',tipo_documento:'venda',total:'350',data_venda:new Date('2026-10-19T00:00:00Z'),cliente_id:5,versao:1}
  const client={query:async(sql:string,args:unknown[])=>{queries.push({sql,args});return {rows:sql.includes('FROM erp.vendas WHERE')?[{...row}]:sql.includes('SELECT nome FROM erp.entidades')?[{nome:name}]:[]}}} as unknown as SQLClient
  const proposal=proposalSchema.parse(draft().proposta),snapshot=await operationSnapshot(2,proposal,client)
  assert(snapshot);assert.deepEqual(snapshot.resumo_exclusao,{data:'2026-10-19',data_label:'Data da venda',participante:{tipo:'cliente',id:'5',nome:'Ana Martins'}})
  assert(queries.every(query=>query.args[0]===2));assert(queries.find(query=>query.sql.includes('SELECT nome'))?.sql.endsWith('FOR SHARE'))
  const view=draftView({id:randomUUID(),empresa_id:2,user_id:1,oauth_client_id:'test',proposal,status:'pending',record_id:null,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),decided_at:null,target_snapshot:snapshot} satisfies DraftRow,{resource:'https://example.invalid/api/mcp',integration:'chatgpt'})
  assert.deepEqual(view.alvo?.resumo_exclusao,snapshot.resumo_exclusao)
  name='Nome alterado';assert.notEqual((await operationSnapshot(2,proposal,client))?.hash,snapshot.hash)
  row.empresa_id=3
  const unavailable={query:async()=>({rows:[]})} as unknown as SQLClient
  await assert.rejects(operationSnapshot(2,proposal,unavailable),/Registro não disponível/)
  checks.push('server_snapshot_contains_real_date_and_party_with_tenant_scope_and_change_detection')
}
async function main(){
  await snapshots()
  const server=createServer(async(request,res)=>{
    const chunks:Buffer[]=[];for await(const chunk of request)chunks.push(Buffer.from(chunk));res.setHeader('Content-Type','application/json')
    if(request.url==='/event'){const event=JSON.parse(Buffer.concat(chunks).toString());(event.method==='ui/message'?messages:contexts).push(event.params);if(contextGate&&event.method==='ui/update-model-context')await contextGate;res.end(JSON.stringify(rejectContext&&event.method==='ui/update-model-context'?{error:{message:'Contexto indisponível'}}:{}));return}
    if(request.url==='/call'){
      const call:Call=JSON.parse(Buffer.concat(chunks).toString());calls.push(call)
      if(call.arguments.rascunho_id){writeCount++;if(writeGate)await writeGate;if(failure){res.end(JSON.stringify({isError:true,content:[{type:'text',text:JSON.stringify({code:failure,message:'Falha de teste: '+failure})}]}));return}
        res.end(JSON.stringify(response(savedOverride||{...input,confirmar:undefined,etapa:'executado',status:'saved',registro_id:'1068'})));return}
      if(call.arguments.chave_operacao){assert(call.arguments.dados);input={...draft(input.proposta.tipo,call.arguments.dados.motivo),alvo:structuredClone(input.alvo)};res.end(JSON.stringify(response(input)));return}
      res.end(JSON.stringify(response({records:[],total:0,page:1,pageSize:5})));return
    }
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host())
  })
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done))
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executable)
  const browser=await chromium.launch({executablePath:executable,headless:true,args:['--disable-features=BackForwardCache','--disable-extensions','--disable-background-networking']})
  const page=await browser.newPage({viewport:{width:390,height:1000}}),errors:string[]=[],frame=page.frameLocator('#card'),url='http://127.0.0.1:'+(server.address() as {port:number}).port
  page.on('pageerror',error=>errors.push(error.message))
  if(screenshots)mkdirSync('.cache/chatgptplugin-deletion',{recursive:true})
  const open=async(data=draft())=>{input=data;calls.length=0;contexts.length=0;messages.length=0;failure='';writeCount=0;savedOverride=null;rejectContext=false;await page.goto(url);await frame.locator('.deletion-card').waitFor()}
  const screenshot=async(name:string)=>{if(screenshots)await page.locator('#card').screenshot({path:resolve('.cache/chatgptplugin-deletion/'+name+'.png')})}
  try{
    await open();await frame.getByRole('heading',{name:'Excluir venda?',exact:true}).waitFor();await frame.locator('.deletion-summary').getByText('Ana Martins',{exact:true}).waitFor();await frame.getByText('19/10/2026',{exact:true}).waitFor()
    assert.equal(calls.length,0);assert.equal(await frame.locator('table').count(),0);assert.equal(await frame.getByText(/permanentemente|não poderá ser desfeita|protótipo/i).count(),0)
    for(const width of [320,390,768]){await page.setViewportSize({width,height:1000});assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)}
    await page.setViewportSize({width:390,height:1000});await screenshot('excluir-venda')
    const original=input.rascunho_id,confirmedContext=page.waitForResponse(reply=>reply.url().endsWith('/event'));writeGate=new Promise<void>(done=>{releaseWrite=done});contextGate=new Promise<void>(done=>{releaseContext=done})
    await frame.getByRole('button',{name:'Excluir venda',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click()})
    await frame.getByRole('button',{name:'Excluindo…',exact:true}).waitFor();assert.equal(await frame.getByRole('button',{name:'Excluindo…',exact:true}).isEnabled(),false)
    releaseWrite();writeGate=null
    await frame.getByRole('heading',{name:'Venda excluída',exact:true}).waitFor();await frame.locator('.deletion-status').getByText('Excluída',{exact:true}).waitFor();await screenshot('venda-excluida')
    assert.equal(writeCount,1);assert.deepEqual([...calls],[{name:'excluir_venda',arguments:{empresa_id:2,rascunho_id:original}}])
    assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0);assert.equal(await frame.getByRole('button',{name:/Voltar.*prévia/}).count(),0)
    const listing=page.waitForResponse(reply=>reply.url().endsWith('/call'));await frame.getByRole('button',{name:'Consultar vendas',exact:true}).click();await listing;assert.deepEqual(calls.at(-1),{name:'listar_vendas',arguments:{empresa_id:2,por_pagina:5}})
    releaseContext();contextGate=null;await confirmedContext;assert.equal(contexts.at(-1)?.structuredContent.execucao_confirmada,true)
    await frame.getByRole('button',{name:'← Voltar',exact:true}).click();await frame.getByRole('heading',{name:'Venda excluída',exact:true}).waitFor();assert.equal(writeCount,1)
    checks.push('reference_review_and_authoritative_success_with_single_write_and_safe_navigation')
    await open();const keep=page.waitForResponse(reply=>reply.url().endsWith('/event'));await frame.getByRole('button',{name:'Manter registro',exact:true}).click();await frame.getByRole('heading',{name:'Registro mantido',exact:true}).waitFor();await keep
    assert.equal(calls.length,0);assert.equal(contexts.at(-1)?.structuredContent.exclusao_executada,false);assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0)
    checks.push('keep_record_closes_local_review_without_server_write_or_false_cancellation')
    await open();const previous=input.rascunho_id;await frame.getByLabel('Motivo da exclusão',{exact:true}).selectOption('Registro duplicado');assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0)
    await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Excluir venda',exact:true}).waitFor();assert.equal(writeCount,0);assert.notEqual(input.rascunho_id,previous)
    const updated=input.rascunho_id;assert.deepEqual(calls[0].arguments.dados,{registro_id:1068,motivo:'Registro duplicado'});assert.equal(calls[0].arguments.empresa_id,2);assert(calls[0].arguments.chave_operacao)
    await frame.getByRole('button',{name:'Excluir venda',exact:true}).click();await frame.getByRole('heading',{name:'Venda excluída',exact:true}).waitFor();await frame.locator('.deletion-summary-reason').getByText('Registro duplicado',{exact:true}).waitFor();assert.equal(calls.at(-1)?.arguments.rascunho_id,updated)
    await open();await frame.getByLabel('Motivo da exclusão',{exact:true}).selectOption('custom');const area=frame.getByLabel('Descreva o motivo',{exact:true});await area.fill('ab');assert.equal(await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).isEnabled(),false)
    await area.fill('Motivo detalhado de exclusão');assert.equal(await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).isEnabled(),true);await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Excluir venda',exact:true}).waitFor();assert.equal(input.proposta.dados.motivo,'Motivo detalhado de exclusão');assert.equal(writeCount,0)
    checks.push('reason_changes_bind_new_preview_and_custom_reason_requires_valid_explicit_reconfirmation')
    for(const code of ['TIMEOUT','ERP_UNAVAILABLE','DRAFT_EXPIRED','STALE_PROPOSAL','ACCESS_DENIED','INVALID_STATE','PERIOD_CLOSED']){
      await open();failure=code;await frame.getByRole('button',{name:'Excluir venda',exact:true}).click();await frame.getByRole('alert').getByText('Falha de teste: '+code,{exact:true}).waitFor()
      assert.equal(await frame.getByRole('heading',{name:'Venda excluída',exact:true}).count(),0);assert.equal(await frame.getByRole('button',{name:'Tentar novamente',exact:true}).count(),0);assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0);assert.equal(writeCount,1)
      if(['TIMEOUT','ERP_UNAVAILABLE'].includes(code)){assert.equal(await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).count(),0);assert.equal(await frame.getByRole('button',{name:'Manter registro',exact:true}).count(),0);const event=page.waitForResponse(reply=>reply.url().endsWith('/event'));await frame.getByRole('button',{name:'Verificar na conversa',exact:true}).click();await event;assert.equal(messages.length,1)}
      else await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).waitFor()
    }
    const expired=draft();expired.expira_em=new Date(Date.now()-1000).toISOString();await open(expired);assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0)
    await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Excluir venda',exact:true}).waitFor();assert.equal(writeCount,0)
    checks.push('uncertain_results_do_not_retry_and_rejections_or_expired_previews_require_review')
    for(const change of [{status:'pending',registro_id:null},{status:'saved',registro_id:null},{status:'saved',registro_id:'999'},{status:'saved',empresa_id:3},{status:'saved',rascunho_id:randomUUID()}]){
      await open();savedOverride={...input,etapa:'executado',registro_id:'1068',...change};await frame.getByRole('button',{name:'Excluir venda',exact:true}).click();await frame.getByText(/O resultado da exclusão ainda não foi confirmado/).waitFor();assert.equal(await frame.locator('.creation-success-icon').count(),0);assert.equal(contexts.length,0);assert.equal(writeCount,1)
    }
    const invalid=draft();invalid.etapa='executado';invalid.status='saved';invalid.registro_id='999';await open(invalid);await frame.getByRole('heading',{name:'Exclusão não confirmada',exact:true}).waitFor();assert.equal(calls.length,0)
    const saved=draft();saved.status='saved';saved.registro_id='1068';await open(saved);await frame.getByRole('heading',{name:'Venda excluída',exact:true}).waitFor();assert.equal(calls.length,0)
    await open();rejectContext=true;await frame.getByRole('button',{name:'Excluir venda',exact:true}).click();await frame.getByText(/pode não ter sido avisado/).waitFor();assert.equal(writeCount,1)
    checks.push('no_false_success_for_wrong_id_company_draft_or_missing_saved_confirmation')
    for(const [kind,name] of [
      ['excluir_venda','venda'],['excluir_compra','compra'],['excluir_orcamento','orçamento'],
      ['excluir_cliente','cliente'],['excluir_fornecedor','fornecedor'],['excluir_vendedor','vendedor'],
      ['excluir_produto','produto'],['excluir_servico','serviço'],['excluir_categoria','categoria'],
      ['excluir_conta_financeira','conta financeira'],['excluir_conta_pagar','conta a pagar'],
      ['excluir_conta_receber','conta a receber'],['excluir_nota_servico','rascunho de NFS-e']
    ] as const){await open(draft(kind));await frame.getByRole('heading',{name:'Excluir '+name+'?',exact:true}).waitFor();if(kind==='excluir_nota_servico')await frame.getByText(/Nenhuma nota será cancelada na prefeitura/).waitFor();assert.equal(calls.length,0);await frame.getByRole('button',{name:'Excluir '+name,exact:true}).click();await frame.locator('.deletion-result .creation-success-icon').waitFor();assert.equal(writeCount,1);assert.equal(calls.length,1);assert.deepEqual({...calls[0]},{name:toolCallForProposal(input.proposta).name,arguments:{empresa_id:2,rascunho_id:input.rascunho_id}})}
    checks.push('all_thirteen_deletion_types_require_explicit_confirmation_and_bind_correct_tool_company_and_draft')
    const missing=draft();missing.alvo=null;await open(missing);assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0)
    const long=draft('excluir_cliente','<img src=x onerror="window.hacked=true">'+'Motivo longo '.repeat(30));long.alvo!.nome='<img src=x onerror="window.hacked=true">'+'Nome longo '.repeat(20);await open(long);assert.equal(await frame.locator('img').count(),0);assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)
    theme='dark';await open();await screenshot('excluir-venda-escuro');await frame.getByRole('button',{name:'Excluir venda',exact:true}).click();await frame.getByRole('heading',{name:'Venda excluída',exact:true}).waitFor();await screenshot('venda-excluida-escuro')
    hostKind='claude';await open();assert.equal(await frame.locator('select').count(),0);assert.equal(await frame.getByRole('button',{name:'Excluir venda',exact:true}).count(),0);await frame.getByRole('button',{name:'Revisar exclusão',exact:true}).click();await frame.getByLabel('Motivo da exclusão',{exact:true}).waitFor();await frame.getByRole('button',{name:'Excluir venda',exact:true}).click();await frame.getByRole('heading',{name:'Venda excluída',exact:true}).waitFor();assert.equal(writeCount,1)
    checks.push('shared_types_preserve_fiscal_simulation_missing_snapshot_and_safe_long_text_dark_claude')
    assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',checks,screenshots:screenshots?'.cache/chatgptplugin-deletion':false,realDatabase:false,realERPDeletes:false,realChatGPT:false}))
  }finally{releaseWrite();writeGate=null;releaseContext();contextGate=null;await browser.close();await new Promise<void>(done=>server.close(()=>done()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
