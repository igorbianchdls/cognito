import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {existsSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {chromium} from 'playwright-core'
import {renderCardsHtml} from '../src/products/mcpcore/ui/resource'
import {toolCallForProposal} from '../src/products/mcpcore/actions/catalog'

type Item={tipo:string;item_id:number;descricao:string;quantidade:number;valor_unitario:number;desconto?:number;total?:number}
type Values={itens?:Item[];parcelas?:{data_vencimento:string;valor:number}[];[key:string]:unknown}
type Data={etapa:string;empresa_id:number;rascunho_id:string;status:string;registro_id:string|null;expira_em:string;referencias?:{cliente:{id:string;nome:string};fornecedor:{id:string;nome:string};itens:unknown[]};proposta:{tipo:string;dados:Values;total?:number};confirmar?:{tool:string;argumentos:{empresa_id:number;rascunho_id:string}}}
type Call={name:string;arguments:{dados?:Values;rascunho_id?:string;chave_operacao?:string;[key:string]:unknown}}
const expires=()=>new Date(Date.now()+86400000).toISOString()
const baseItems=[{tipo:'servico',item_id:9,descricao:'Consultoria de marketing',quantidade:1,valor_unitario:350,desconto:0,total:350}]
function draft(kind='venda',values:Values={}):Data{return {etapa:'previa',empresa_id:2,rascunho_id:randomUUID(),status:'pending',registro_id:null,expira_em:expires(),referencias:{cliente:{id:'5',nome:'Ana Martins'},fornecedor:{id:'6',nome:'Fornecedor Norte'},itens:[]},proposta:{tipo:kind,dados:kind==='venda'?{cliente_id:5,itens:structuredClone(baseItems),data_vencimento:'2026-10-25',...values}:values,...(['venda','compra','orcamento','conta_pagar','conta_receber'].includes(kind)?{total:350}:{})}}}
const checks:string[]=[],calls:Call[]=[],messages:unknown[]=[],contexts:{structuredContent:{execucao_confirmada:boolean}}[]=[]
let input=draft(),variant:'chatgpt'|'claude'='chatgpt',theme='light',failure='',rejectContext=false,writeCount=0,detailFailure=false,freshName='Ana Martins',savedOverride:Data|null=null
const response=(data:unknown)=>({structuredContent:{ok:true,empresa_id:2,data}})
const encode=(data:unknown)=>JSON.stringify(data).replaceAll('<','\\u003c')
function host(){const html=renderCardsHtml({name:'creation-test',version:'1',host:variant});return `<!doctype html><html><head><style>body{margin:0;background:${theme==='dark'?'#1a1c1f':'#fff'}}iframe{box-sizing:border-box;border:1px solid ${theme==='dark'?'#34383d':'#e6e8eb'};border-radius:18px}</style></head><body><iframe id="card" style="width:100%;height:1200px"></iframe><script>
  const frame=document.getElementById('card');frame.srcdoc=${encode(html)};
  addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;
    if(message.method==='ui/notifications/size-changed'){frame.style.height=Math.ceil(message.params.height)+2+'px';return}
    if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{empresa_id:2}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:{ok:true,empresa_id:2,data:${encode(input)}},_meta:{'cognito/tool':${encode(toolCallForProposal(input.proposta).name)}}}},'*');return}
    if(message.id===undefined)return;let result={};
    if(message.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostContext:{theme:${encode(theme)},displayMode:'inline'},hostCapabilities:{}};
    if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();
    if(message.method==='ui/request-display-mode')result={mode:message.params.mode};
    if(message.method==='ui/update-model-context'||message.method==='ui/message'){const answer=await(await fetch('/event',{method:'POST',body:JSON.stringify(message)})).json();if(answer.error){frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,error:answer.error},'*');return}}
    frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>`}
async function main(){
  const server=createServer(async(request,res)=>{
    const chunks:Buffer[]=[];for await(const chunk of request)chunks.push(Buffer.from(chunk));res.setHeader('Content-Type','application/json')
    if(request.url==='/event'){const event=JSON.parse(Buffer.concat(chunks).toString());(event.method==='ui/message'?messages:contexts).push(event.params);res.end(JSON.stringify(rejectContext&&event.method==='ui/update-model-context'?{error:{message:'Contexto indisponível'}}:{}));return}
    if(request.url==='/call'){
      const call:Call=JSON.parse(Buffer.concat(chunks).toString());calls.push(call)
      if(call.arguments.rascunho_id){writeCount++;await new Promise(done=>setTimeout(done,160));if(failure){res.end(JSON.stringify({isError:true,content:[{type:'text',text:JSON.stringify({code:failure,message:'Falha de teste: '+failure})}]}));return}
        res.end(JSON.stringify(response(savedOverride||{...input,referencias:undefined,confirmar:undefined,status:'saved',registro_id:'1068',etapa:'executado'})));return}
      if(call.arguments.chave_operacao){const values=structuredClone(call.arguments.dados!);if(Array.isArray(values.itens))values.itens=values.itens.map(item=>({...item,total:item.quantidade*item.valor_unitario-(item.desconto||0)}));input={...draft(input.proposta.tipo,values),proposta:{tipo:input.proposta.tipo,dados:values,...(Array.isArray(values.itens)?{total:values.itens.reduce((sum,item)=>sum+Number(item.total),0)}:{})}};input.confirmar={tool:toolCallForProposal(input.proposta).name,argumentos:{empresa_id:2,rascunho_id:input.rascunho_id}};res.end(JSON.stringify(response(input)));return}
      if(detailFailure){res.end(JSON.stringify({isError:true,content:[{type:'text',text:JSON.stringify({code:'ERP_UNAVAILABLE',message:'Consulta indisponível.'})}]}));return}
      const kind=input.proposta.tipo,record={id:'1068',nome:kind==='produto'?'Produto salvo':'Ana Martins',cliente:freshName,fornecedor:'Fornecedor Norte',total:350,valor_total:350,status:'rascunho',data_venda:'2026-10-19',preco:20,saldo_inicial:50};
      res.end(JSON.stringify(response({...(call.name==='obter_venda'?{sale:record}:call.name==='obter_compra'?{purchase:record}:{record}),items:[],totalItems:0,itemsTruncated:false,installments:[{data_vencimento:'2026-10-25',valor:350}]})));return
    }
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host())
  })
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done))
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executable)
  const browser=await chromium.launch({executablePath:executable,headless:true,args:['--disable-features=BackForwardCache','--disable-extensions','--disable-background-networking']})
  mkdirSync('.cache/chatgptplugin-creation',{recursive:true})
  const page=await browser.newPage({viewport:{width:390,height:1000}}),errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  const frame=page.frameLocator('#card'),url='http://127.0.0.1:'+(server.address() as {port:number}).port
  const open=async(data=draft())=>{input=data;if(data.etapa==='previa'&&data.status==='pending')input.confirmar={tool:toolCallForProposal(input.proposta).name,argumentos:{empresa_id:2,rascunho_id:input.rascunho_id}};calls.length=0;messages.length=0;contexts.length=0;writeCount=0;failure='';detailFailure=false;savedOverride=null;rejectContext=false;freshName='Ana Martins';await page.goto(url);await frame.locator('.creation-card').waitFor()}
  const screenshot=async(name:string)=>page.locator('#card').screenshot({path:resolve('.cache/chatgptplugin-creation/'+name+'.png')})
  try{
    await open();await frame.getByRole('heading',{name:'Nova venda',exact:true}).waitFor();await frame.getByText('Ana Martins',{exact:true}).waitFor()
    await frame.getByText('1 × R$ 350,00',{exact:true}).waitFor();assert.equal(await frame.locator('table').count(),0)
    await frame.locator('.creation-total').getByText('R$ 350,00',{exact:true}).waitFor()
    for(const width of [320,390,768]){await page.setViewportSize({width,height:1000});assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)}
    await page.setViewportSize({width:390,height:1000});await screenshot('nova-venda')
    const originalId=input.rascunho_id
    await frame.getByRole('button',{name:'Confirmar registro',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click()})
    await frame.getByRole('button',{name:'Registrando…',exact:true}).waitFor();assert.equal(await frame.getByRole('button',{name:'Registrando…',exact:true}).isEnabled(),false)
    await frame.getByRole('heading',{name:'Venda registrada!',exact:true}).waitFor();await frame.locator('.creation-summary').getByText('Ana Martins',{exact:true}).waitFor()
    assert.equal(writeCount,1);assert.deepEqual(calls[0],{name:'criar_venda',arguments:{empresa_id:2,rascunho_id:originalId}})
    await frame.getByText('Registro #1068 · Rascunho',{exact:true}).waitFor();assert.equal(await frame.getByRole('button',{name:'Confirmar registro',exact:true}).count(),0)
    assert.equal(await frame.getByRole('button',{name:'Voltar à prévia',exact:true}).count(),0)
    await page.waitForFunction(()=>document.querySelector('iframe')!==null);await screenshot('venda-registrada')
    assert.equal(contexts[0].structuredContent.execucao_confirmada,true)
    await frame.getByRole('button',{name:'Ver registro',exact:true}).click();await frame.getByRole('button',{name:'← Voltar',exact:true}).click();await frame.getByRole('heading',{name:'Venda registrada!',exact:true}).waitFor();assert.equal(writeCount,1)
    checks.push('reference_preview_real_saved_summary_double_click_guard_context_and_safe_navigation')
    await open();freshName='Nome atualizado no ERP';await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.locator('.creation-summary').getByText(freshName,{exact:true}).waitFor()
    checks.push('success_fetches_actual_record_instead_of_reusing_preview_names')
    for(const code of ['TIMEOUT','ERP_UNAVAILABLE','DRAFT_EXPIRED','VERSION_CONFLICT','ACCESS_DENIED']){
      await open();failure=code;await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.getByRole('alert').getByText('Falha de teste: '+code,{exact:true}).waitFor()
      assert.equal(await frame.getByRole('heading',{name:'Venda registrada!',exact:true}).count(),0);assert.equal(await frame.getByRole('button',{name:'Tentar novamente',exact:true}).count(),0)
      if(code==='TIMEOUT'||code==='ERP_UNAVAILABLE'){assert.equal(await frame.getByRole('button',{name:'Confirmar registro',exact:true}).count(),0);assert.equal(await frame.getByText('Nada foi registrado ainda.',{exact:true}).count(),0);const event=page.waitForResponse(reply=>reply.url().endsWith('/event'));await frame.getByRole('button',{name:'Revisar na conversa',exact:true}).click();await event;assert.equal(messages.length,1)}
      else await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).waitFor()
      assert.equal(writeCount,1)
    }
    checks.push('uncertain_writes_are_not_retried_and_stale_previews_require_new_confirmation')
    const expired=draft();expired.expira_em=new Date(Date.now()-1000).toISOString();await open(expired)
    assert.equal(await frame.getByRole('button',{name:'Confirmar registro',exact:true}).count(),0)
    await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Confirmar registro',exact:true}).waitFor();assert.equal(writeCount,0);assert.notEqual(input.rascunho_id,expired.rascunho_id)
    const many=Array.from({length:7},(_,index)=>({...baseItems[0],item_id:index+1,descricao:'Serviço '+(index+1),valor_unitario:50,total:50}))
    await open(draft('venda',{itens:many,parcelas:Array.from({length:7},(_,index)=>({data_vencimento:'2026-11-'+String(index+1).padStart(2,'0'),valor:50})),data_vencimento:undefined}))
    assert.equal(await frame.locator('.creation-items>li').count(),5);await frame.getByText('Primeiro vencimento',{exact:true}).waitFor()
    await frame.locator('summary').click();assert.equal(await frame.locator('.creation-installments .creation-fields>div').count(),5)
    await frame.getByRole('button',{name:'Próxima: parcelas',exact:true}).click();assert.equal(await frame.locator('.creation-installments .creation-fields>div').count(),2)
    await open(draft('venda',{itens:many}))
    await frame.getByRole('button',{name:'Ajustar',exact:true}).click();await frame.getByLabel('Quantidade de Serviço 1',{exact:true}).fill('2')
    await frame.getByRole('button',{name:'Próxima: itens',exact:true}).click();await frame.getByLabel('Quantidade de Serviço 6',{exact:true}).fill('3')
    await frame.getByRole('button',{name:'Anterior: itens',exact:true}).click();assert.equal(await frame.getByLabel('Quantidade de Serviço 1',{exact:true}).inputValue(),'2')
    await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Confirmar registro',exact:true}).waitFor()
    const adjusted=calls.at(-1)!.arguments;assert.equal(adjusted.dados!.itens![0].quantidade,2);assert.equal(adjusted.dados!.itens![5].quantidade,3);assert(adjusted.dados!.itens!.every(item=>item.total===undefined));assert.equal(writeCount,0)
    checks.push('items_and_installments_paginate_by_five_and_edits_survive_page_changes')
    for(const status of ['pending','expired','cancelled','saved']){await open();savedOverride={...input,status,registro_id:null,etapa:'executado'};const event=page.waitForResponse(reply=>reply.url().endsWith('/event'));await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.getByRole('heading',{name:'Registro não confirmado',exact:true}).waitFor();await event;assert.equal(await frame.locator('.creation-success-icon').count(),0);assert.equal(contexts.at(-1)?.structuredContent.execucao_confirmada,false)}
    await open();detailFailure=true;await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.getByText('O registro foi salvo, mas não foi possível carregar todo o resumo atualizado.',{exact:true}).waitFor();assert.equal(writeCount,1)
    await open();rejectContext=true;await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.getByText(/pode não ter sido avisado/).waitFor();assert.equal(writeCount,1)
    checks.push('no_false_success_without_saved_id_and_read_or_context_failures_do_not_repeat_writes')
    for(const [kind,title,tool,expectedArgs] of [
      ['venda','Nova venda','obter_venda',{empresa_id:2,venda_id:1068}],
      ['orcamento','Novo orçamento','obter_venda',{empresa_id:2,venda_id:1068}],
      ['compra','Nova compra','obter_compra',{empresa_id:2,compra_id:1068}],
      ['ordem_servico','Nova ordem de serviço','obter_ordem_servico',{empresa_id:2,registro_id:1068}],
      ['conta_pagar','Nova conta a pagar','obter_titulo_financeiro',{empresa_id:2,tipo:'pagar',conta_id:1068}],
      ['conta_receber','Nova conta a receber','obter_titulo_financeiro',{empresa_id:2,tipo:'receber',conta_id:1068}],
      ['cliente','Novo cliente','obter_cadastro',{empresa_id:2,tipo:'clientes',registro_id:1068}],
      ['fornecedor','Novo fornecedor','obter_cadastro',{empresa_id:2,tipo:'fornecedores',registro_id:1068}],
      ['vendedor','Novo vendedor','obter_cadastro',{empresa_id:2,tipo:'vendedores',registro_id:1068}],
      ['produto','Novo produto','obter_cadastro',{empresa_id:2,tipo:'produtos',registro_id:1068}],
      ['servico','Novo serviço','obter_cadastro',{empresa_id:2,tipo:'servicos',registro_id:1068}],
      ['categoria','Nova categoria','obter_cadastro',{empresa_id:2,tipo:'categorias',registro_id:1068}],
      ['conta_financeira','Nova conta financeira','obter_cadastro',{empresa_id:2,tipo:'contas-financeiras',registro_id:1068}]
    ] as const){await open(draft(kind,{nome:'Nome de teste',fornecedor_id:6,cliente_id:5,preco:20,descricao:'Descrição de teste',parcelas:[{data_vencimento:'2026-10-25',valor:350}]}));await frame.getByRole('heading',{name:title,exact:true}).waitFor();assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true);assert.equal(calls.length,0);await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.locator('.creation-summary').waitFor();assert.deepEqual({...calls[0]},{name:toolCallForProposal(input.proposta).name,arguments:{empresa_id:2,rascunho_id:input.rascunho_id}});assert.deepEqual(calls.at(-1),{name:tool,arguments:expectedArgs});assert.equal(writeCount,1)}
    checks.push('all_thirteen_creation_types_confirm_once_with_correct_tool_company_draft_and_saved_record_query')
    const saved=draft();saved.status='saved';saved.registro_id='1068';await open(saved);await frame.getByRole('heading',{name:'Venda registrada!',exact:true}).waitFor();assert.equal(await frame.getByRole('button',{name:'Confirmar registro',exact:true}).count(),0);assert.equal(writeCount,0)
    const long=draft('cliente',{nome:'<img src=x onerror="window.hacked=true">'+'Nome longo '.repeat(30)});await open(long);assert.equal(await frame.locator('img').count(),0);assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)
    variant='claude';theme='dark';await open();await screenshot('nova-venda-escuro');await frame.getByRole('button',{name:'Confirmar registro',exact:true}).click();await frame.locator('.creation-summary').getByText('Ana Martins',{exact:true}).waitFor();await screenshot('venda-registrada-escuro')
    checks.push('shared_layout_for_registrations_purchases_accounts_quotes_dark_claude_and_untrusted_long_text')
    assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',checks,screenshots:'.cache/chatgptplugin-creation',realDatabase:false,realChatGPT:false}))
  }finally{await browser.close();await new Promise<void>(done=>server.close(()=>done()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
