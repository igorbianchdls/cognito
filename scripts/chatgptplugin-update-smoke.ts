import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {existsSync,mkdirSync} from 'node:fs'
import {createServer} from 'node:http'
import {resolve} from 'node:path'
import {chromium} from 'playwright-core'
import {renderCardsHtml} from '../src/products/mcpcore/ui/resource'
import {toolCallForProposal} from '../src/products/mcpcore/domains/erp/actions/catalog'
import {editSnapshot,type EditSnapshot} from '../src/products/mcpcore/domains/erp/actions/editSnapshot'
import {operationSnapshot} from '../src/products/mcpcore/domains/erp/actions/operations'
import {decideDraft} from '../src/products/mcpcore/domains/erp/actions/approvalRepository'
import {draftView,type DraftRow} from '../src/products/mcpcore/domains/erp/actions/draftRepository'
import {proposalSchema} from '../src/products/mcpcore/domains/erp/schemas/actionContracts'
import {runWithErpTransactionClient,type SQLClient} from '../src/lib/postgres'
import {runWithErpDatabaseContext} from '../src/lib/erpDatabaseContext'

type Row=Record<string,unknown>
type Data={etapa:string;empresa_id:number;rascunho_id:string;status:string;registro_id:string|null;expira_em:string;proposta:{tipo:string;dados:Row;total?:number};alvo:{registro_id:number;nome:string;valor:string|null;status:string;edicao?:EditSnapshot};confirmar?:{tool:string;argumentos:{empresa_id:number;rascunho_id:string}}}
type Call={name:string;arguments:Row&{dados?:Row;rascunho_id?:string}}
const item={tipo:'servico',item_id:9,descricao:'Consultoria de marketing',quantidade:1,valor_unitario:350,desconto:0,total:350}
const base={registro_id:1250,cliente_id:5,data_venda:'2026-10-19',data_vencimento:'2026-10-25',itens:[item]}
function draft(kind='editar_venda',values:Row={...structuredClone(base),data_vencimento:'2026-10-30'},old:Row=structuredClone(base)):Data{
  const id=randomUUID(),mapping=toolCallForProposal({tipo:kind,dados:{}}),full=['venda','orcamento','compra','ordem_servico','nota_servico','conta_pagar','conta_receber'].includes(kind.slice(7)),sum=(items:Row[])=>items.reduce((total,line)=>total+Number(line.quantidade)*Number(line.valor_unitario)-Number(line.desconto||0),0)
  const before={...old,...(Array.isArray(old.itens)?{total:sum(old.itens)}:{})}
  return {etapa:'previa',empresa_id:2,rascunho_id:id,status:'pending',registro_id:null,expira_em:new Date(Date.now()+86400000).toISOString(),proposta:{tipo:kind,dados:values,...(Array.isArray(values.itens)?{total:sum(values.itens)}:{})},alvo:{registro_id:1250,nome:'Venda #1250',valor:'350',status:'rascunho',edicao:{campos:before,conhecidos:Object.keys(before),referencias:{'cliente_id:5':'Ana Martins'},participante:'Ana Martins',preserva_demais:!full,avisos:[...(full?['O ERP revalida e recalcula o documento completo. Itens ou parcelas podem ser reorganizados; confira também os valores e a condição de pagamento.']:[]),...(kind.includes('orcamento')?['A edição reabre a aprovação do orçamento.']:kind.includes('nota_servico')?['Rascunho de NFS-e simulada. Nada será enviado à prefeitura.']:[])],efeitos:{}}},confirmar:{tool:mapping.name,argumentos:{empresa_id:2,rascunho_id:id}}}
}
const checks:string[]=[],calls:Call[]=[],contexts:Row[]=[],messages:Row[]=[]
let input=draft(),theme='light',hostKind:'chatgpt'|'claude'='chatgpt',failure='',override:Data|null=null,actualOverride:Row|null=null,writeCount=0,rejectContext=false
let writeGate:Promise<void>|null=null,releaseWrite:()=>void=()=>{},contextGate:Promise<void>|null=null,releaseContext:()=>void=()=>{}
const screenshots=process.env.CHATGPTPLUGIN_SKIP_SCREENSHOTS!=='1',encode=(value:unknown)=>JSON.stringify(value).replaceAll('<','\\u003c')
const response=(data:unknown)=>({structuredContent:{ok:true,empresa_id:2,data}})
function host(){return `<!doctype html><html><head><style>body{margin:0;background:${theme==='dark'?'#1a1c1f':'#fff'}}iframe{box-sizing:border-box;width:100%;height:1000px;border:1px solid ${theme==='dark'?'#34383d':'#e6e8eb'};border-radius:18px}</style></head><body><iframe id="card" title="Atualização"></iframe><script>
const frame=document.getElementById('card');frame.srcdoc=${encode(renderCardsHtml({name:'update-test',version:'1',host:hostKind}))};
addEventListener('message',async event=>{if(event.source!==frame.contentWindow)return;const message=event.data;if(message.method==='ui/notifications/size-changed'){frame.style.height=Math.ceil(message.params.height)+2+'px';return}
if(message.method==='ui/notifications/initialized'){frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:{empresa_id:2}}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:{ok:true,empresa_id:2,data:${encode(input)}},_meta:{'cognito/tool':${encode(input.confirmar?.tool||'editar_venda')}}}},'*');return}
if(message.id===undefined)return;let result={};if(message.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostContext:{theme:${encode(theme)},displayMode:'inline'},hostCapabilities:{}};
if(message.method==='tools/call')result=await(await fetch('/call',{method:'POST',body:JSON.stringify(message.params)})).json();if(message.method==='ui/request-display-mode')result={mode:message.params.mode};
if(message.method==='ui/update-model-context'||message.method==='ui/message'){const answer=await(await fetch('/event',{method:'POST',body:JSON.stringify(message)})).json();if(answer.error){frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,error:answer.error},'*');return}}
frame.contentWindow.postMessage({jsonrpc:'2.0',id:message.id,result},'*')});</script></body></html>`}
async function backend(){
  const queries:{sql:string;params:unknown[]}[]=[],query=async(sql:string,params:unknown[])=>{queries.push({sql,params});return sql.includes('dre_grupos')?[{codigo:3}]:[{id:'5',nome:'Ana Martins'}]}
  const common={tenantId:2,kind:'editar_venda',table:'vendas',row:{cliente_id:5,data_venda:'2026-10-19'},values:{cliente_id:5,data_vencimento:'2026-10-30',itens:[item]},items:[{servico_id:'9',descricao:item.descricao,quantidade:'1.0000',valor_unitario:'350.00',valor_desconto:'0'}],parts:[{numero_parcela:1,data_vencimento:new Date('2026-10-25T00:00:00Z'),valor:'350'}],totals:{},query,lock:true}
  const source=await editSnapshot(common);assert.equal(source.campos.data_vencimento,'2026-10-25');assert.equal(source.participante,'Ana Martins');assert.equal((source.campos.itens as Row[])[0].desconto,'0');assert.equal(source.preserva_demais,false);assert(queries.every(entry=>entry.params[0]===2))
  for(const [table,kind,row,values,key,expected] of [
    ['produtos','editar_produto',{preco_venda:'50',controla_estoque:true,ativo:false},{preco:60,controla_estoque:'nao',status:'ativo'},'status','pausado'],
    ['servicos','editar_servico',{preco:'10',custo:'2'},{preco:15,custo:3},'custo','2'],
    ['entidades','editar_cliente',{tipo_pessoa:'juridica',email:null},{tipo:'fisica',email:'ana@example.invalid'},'tipo','juridica'],
    ['categorias','editar_categoria',{metadata:{descricao:'Descrição anterior'},dre_grupo_id:7},{descricao:'Nova',dre_grupo_codigo:4},'dre_grupo_codigo',3],
    ['contas_financeiras','editar_conta_financeira',{padrao:true},{padrao:'nao'},'padrao','sim'],
    ['notas_fiscais','editar_nota_servico',{entidade_id:5,metadata:{retencoes_federais:{irrf:1}}},{retencoes_federais:{irrf:2},iss_retido:true},'retencoes_federais',{irrf:1}],
  ] as const){const result=await editSnapshot({...common,table,kind,row:{...row},values:{...values},totals:{iss_retido:false}});assert.deepEqual(result.campos[key],expected)}
  const quote=await editSnapshot({...common,kind:'editar_orcamento',row:{...common.row,situacao:'aprovado'}});assert.equal(quote.efeitos.situacao,'em_andamento');assert.equal(quote.campos.situacao,'aprovado');assert(quote.avisos.some(text=>text.includes('aprovação')))
  const unknown=await editSnapshot({...common,values:{campo_inexistente:'Novo'}});assert(!unknown.conhecidos.includes('campo_inexistente'))
  let groupCode=3
  const categoryClient:SQLClient={release(){},query:async(sql,params=[])=>{assert.equal(params[0],2);return {rows:sql.includes('FROM erp.categorias')?[{id:1250,nome:'Categoria',dre_grupo_id:1,metadata:{}}]:[{codigo:groupCode}]}}}
  const categoryProposal=proposalSchema.parse({tipo:'editar_categoria',dados:{registro_id:1250,dre_grupo_codigo:4}}),firstCategory=await operationSnapshot(2,categoryProposal,categoryClient);groupCode=7
  assert.notEqual((await operationSnapshot(2,categoryProposal,categoryClient))?.hash,firstCategory?.hash)
  checks.push('canonical_server_values_cover_dates_aliases_references_nulls_and_document_effects')
  let product:Row={id:1250,empresa_id:2,nome:'Produto',sku:'P1',preco_venda:'10',controla_estoque:true,ativo:true,versao:1,unidade_medida:'UN',permite_estoque_negativo:true,estoque_minimo:'7',ponto_reposicao:'8',categoria_id:null},productWrites=0,audits=0,allow=true
  const client:SQLClient={release(){},query:async(sql,params=[])=>{
    if(sql.includes('FROM shared.usuarios_empresas'))return {rows:allow?[{role:'admin'}]:[]}
    if(sql.startsWith('SELECT * FROM plugin.drafts'))return {rows:params[1]===record.empresa_id?[structuredClone(record)]:[]}
    if(sql.startsWith('UPDATE plugin.drafts SET target_snapshot')){record.target_snapshot=JSON.parse(String(params[1]));return {rows:[]}}
    if(sql.startsWith('UPDATE plugin.drafts SET status')){record.status=String(params[1]) as DraftRow['status'];record.record_id=String(params[2]);return {rows:[]}}
    if(sql.includes('INSERT INTO plugin.executions')){audits++;return {rows:[]}}
    if(sql.includes('UPDATE erp.produtos SET nome')){productWrites++;product={...product,preco_venda:String(params[4]),permite_estoque_negativo:params[8],estoque_minimo:params[9],ponto_reposicao:params[10],versao:Number(product.versao)+1};return {rows:[structuredClone(product)]}}
    if(sql.includes('FROM erp.produtos'))return {rows:sql.startsWith('SELECT *')?[structuredClone(product)]:[{id:1250,nome:'Produto',sku:'P1',preco:product.preco_venda,controla_estoque:'sim',status:'ativo',versao:product.versao,unidade_medida:'UN',categoria:''}]}
    if(sql.includes('set_config')||sql.includes('INSERT INTO erp.cadastros_eventos'))return {rows:[]}
    throw new Error('Consulta não simulada: '+sql)
  }}
  const proposal=proposalSchema.parse({tipo:'editar_produto',dados:{registro_id:1250,preco:20}}),snapshot=await operationSnapshot(2,proposal,client)
  const record:DraftRow={id:randomUUID(),empresa_id:2,user_id:1,oauth_client_id:'test',proposal,status:'pending',record_id:null,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),decided_at:null,target_snapshot:snapshot}
  const actor={integration:'chatgpt' as const,tenantId:2,userId:1,clerkUserId:'user_1',oauthClientId:'test',kinds:['editar_produto'],tool:'editar_cadastro'}
  const approve=(selectedActor=actor)=>runWithErpDatabaseContext({tenantId:selectedActor.tenantId,userId:1},()=>runWithErpTransactionClient(client,()=>decideDraft(record.id,selectedActor,'save')))
  await approve()
  assert.equal(record.status,'saved');assert.equal(productWrites,1);assert.equal(audits,1);assert.equal(product.permite_estoque_negativo,true);assert.equal(Number(product.estoque_minimo),7);assert.equal(Number(product.ponto_reposicao),8)
  const view=draftView(record,{resource:'https://example.invalid/api/mcp',integration:'chatgpt'});assert.equal(view.alvo?.edicao?.campos.preco,'10');assert.equal(Number(view.alvo?.edicao?.resultado?.campos.preco),20)
  await approve();assert.equal(productWrites,1);assert.equal(audits,1)
  record.status='pending';record.target_snapshot=await operationSnapshot(2,proposal,client);product.preco_venda='99'
  await assert.rejects(approve(),/O registro mudou/);assert.equal(productWrites,1)
  allow=false;await assert.rejects(approve(),/revogado/);assert.equal(productWrites,1)
  allow=true;await assert.rejects(approve({...actor,tenantId:3}),/Rascunho não disponível/)
  checks.push('real_approval_code_captures_persisted_result_preserves_unrelated_stock_fields_and_rejects_stale_or_foreign_drafts')
}
async function main(){
  await backend()
  const server=createServer(async(request,res)=>{const chunks:Buffer[]=[];for await(const chunk of request)chunks.push(Buffer.from(chunk));res.setHeader('Content-Type','application/json')
    if(request.url==='/event'){const event=JSON.parse(Buffer.concat(chunks).toString());(event.method==='ui/message'?messages:contexts).push(event.params);if(contextGate&&event.method==='ui/update-model-context')await contextGate;res.end(JSON.stringify(rejectContext&&event.method==='ui/update-model-context'?{error:{message:'Contexto indisponível'}}:{}));return}
    if(request.url==='/call'){const call:Call=JSON.parse(Buffer.concat(chunks).toString());calls.push(call)
      if(call.arguments.rascunho_id){writeCount++;if(writeGate)await writeGate;if(failure){res.end(JSON.stringify({isError:true,content:[{type:'text',text:JSON.stringify({code:failure,message:'Falha de teste: '+failure})}]}));return}
        const saved=structuredClone(input);saved.etapa='executado';saved.status='saved';saved.registro_id='1250';delete saved.confirmar;const fields=actualOverride||{...saved.proposta.dados,...saved.alvo.edicao!.efeitos,...(saved.proposta.total!==undefined?{total:saved.proposta.total}:{})};saved.alvo.edicao!.resultado={campos:fields,conhecidos:Object.keys(fields),referencias:saved.alvo.edicao!.referencias,participante:'Ana Martins'};res.end(JSON.stringify(response(override||saved)));return}
      if(call.arguments.chave_operacao){const values=structuredClone(call.arguments.dados!);input=draft(input.proposta.tipo,values,input.alvo.edicao!.campos);res.end(JSON.stringify(response(input)));return}
      res.end(JSON.stringify(response(call.name==='obter_venda'?{sale:{id:'1250',numero:'VEN-1250',cliente_nome:'Ana Martins',total:350,status:'rascunho',data_venda:'2026-10-19'},items:[],installments:[],totalItems:0,itemsTruncated:false}:{record:{id:'1250',nome:'Registro atualizado'},history:[]})));return}
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host())})
  await new Promise<void>(done=>server.listen(0,'127.0.0.1',done))
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);assert(executable)
  const browser=await chromium.launch({executablePath:executable,headless:true,args:['--disable-features=BackForwardCache','--disable-extensions','--disable-background-networking']}),page=await browser.newPage({viewport:{width:390,height:1000}}),frame=page.frameLocator('#card'),errors:string[]=[],url='http://127.0.0.1:'+(server.address() as {port:number}).port
  page.on('pageerror',error=>errors.push(error.message));if(screenshots)mkdirSync('.cache/chatgptplugin-update',{recursive:true})
  const open=async(data=draft())=>{input=data;calls.length=0;contexts.length=0;messages.length=0;failure='';override=null;actualOverride=null;writeCount=0;rejectContext=false;await page.goto(url);await frame.locator('.edit-card').waitFor()}
  const shot=async(name:string)=>{if(screenshots)await page.locator('#card').screenshot({path:resolve('.cache/chatgptplugin-update/'+name+'.png')})}
  try{
    await open();await frame.getByRole('heading',{name:'Atualizar venda',exact:true}).waitFor();assert.equal(await frame.locator('.edit-change').count(),1);await frame.locator('del').getByText('25/10/2026',{exact:true}).waitFor();assert.equal(await frame.getByLabel('Vencimento — novo valor',{exact:true}).inputValue(),'2026-10-30');assert.equal(calls.length,0)
    for(const width of [320,390,768]){await page.setViewportSize({width,height:1000});assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)}await page.setViewportSize({width:390,height:1000});await shot('atualizar-venda')
    const id=input.rascunho_id;writeGate=new Promise<void>(done=>{releaseWrite=done});contextGate=new Promise<void>(done=>{releaseContext=done});const context=page.waitForResponse(reply=>reply.url().endsWith('/event'))
    await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click()});await frame.getByRole('button',{name:'Salvando…',exact:true}).waitFor();assert.equal(await frame.getByRole('button',{name:'Salvando…',exact:true}).isEnabled(),false);releaseWrite();writeGate=null
    await frame.getByRole('heading',{name:'Venda atualizada!',exact:true}).waitFor();await frame.locator('.edit-new').getByText('30/10/2026',{exact:true}).waitFor();await shot('venda-atualizada');assert.equal(writeCount,1);assert.deepEqual({...calls[0]},{name:'editar_venda',arguments:{empresa_id:2,rascunho_id:id}})
    const reading=page.waitForResponse(reply=>reply.url().endsWith('/call'));await frame.getByRole('button',{name:'Ver registro',exact:true}).click();await reading;assert.deepEqual(calls.at(-1),{name:'obter_venda',arguments:{empresa_id:2,venda_id:1250}});releaseContext();contextGate=null;await context;await frame.getByRole('button',{name:'← Voltar',exact:true}).click();await frame.getByRole('heading',{name:'Venda atualizada!',exact:true}).waitFor();assert.equal(writeCount,1)
    checks.push('reference_before_after_and_saved_values_double_click_guard_nonblocking_context_and_company_bound_navigation')
    await open();const previous=input.rascunho_id;await frame.getByLabel('Vencimento — novo valor',{exact:true}).fill('2026-11-05');assert.equal(await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).count(),0);await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).waitFor();assert.notEqual(input.rascunho_id,previous);assert.equal(writeCount,0)
    assert.equal(calls[0].arguments.dados!.cliente_id,5);assert.equal((calls[0].arguments.dados!.itens as Row[])[0].quantidade,1);assert.equal((calls[0].arguments.dados!.itens as Row[])[0].total,undefined);assert.equal(calls[0].arguments.dados!.data_vencimento,'2026-11-05')
    await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByRole('heading',{name:'Venda atualizada!',exact:true}).waitFor();assert.equal(calls.at(-1)?.arguments.rascunho_id,input.rascunho_id)
    const old:Row={registro_id:1250,nome:'Antigo',email:'old@example.invalid',telefone:'8599999999',documento:'123',limite_credito:100,bloqueio_motivo:'Antigo motivo',tipo:'fisica'},next={...old,nome:'Novo',email:'new@example.invalid',telefone:'8588888888',documento:'456',limite_credito:200,bloqueio_motivo:'Novo motivo',tipo:'juridica'}
    await open(draft('editar_cliente',next,old));assert.equal(await frame.locator('.edit-change').count(),5);await frame.getByLabel('Nome — novo valor',{exact:true}).fill('Ajuste na página 1');await frame.getByRole('button',{name:'Próxima: alterações',exact:true}).click();await frame.getByLabel('Tipo — novo valor',{exact:true}).selectOption('fisica');await frame.getByRole('button',{name:'Anterior: alterações',exact:true}).click();assert.equal(await frame.getByLabel('Nome — novo valor',{exact:true}).inputValue(),'Ajuste na página 1');await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).waitFor();assert.equal(calls.at(-1)?.arguments.dados?.nome,'Ajuste na página 1');assert.equal(calls.at(-1)?.arguments.dados?.tipo,'fisica')
    checks.push('scalar_edits_generate_new_preview_preserve_other_values_and_survive_five_change_pages')
    await open(draft('editar_produto',{registro_id:1250,preco:10},{registro_id:1250,preco:'10.00'}));await frame.getByText('Nenhuma alteração para salvar.',{exact:true}).waitFor();assert.equal(await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).isEnabled(),false);assert.equal(calls.length,0)
    await open(draft('editar_cliente',{registro_id:1250,limite_credito:null},{registro_id:1250,limite_credito:100}));assert.equal(await frame.locator('.edit-input select').inputValue(),'__null');await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).waitFor()
    await open();await frame.getByRole('button',{name:'Cancelar',exact:true}).click();await frame.getByRole('heading',{name:'Alterações descartadas',exact:true}).waitFor();assert.equal(calls.length,0)
    checks.push('semantic_no_ops_and_local_cancel_never_write_and_null_remains_distinct_from_unknown')
    for(const code of ['TIMEOUT','ERP_UNAVAILABLE','STALE_PROPOSAL','DRAFT_EXPIRED','ACCESS_DENIED','PERIOD_CLOSED']){await open();failure=code;await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByRole('alert').getByText('Falha de teste: '+code,{exact:true}).waitFor();assert.equal(await frame.locator('.creation-success-icon').count(),0);assert.equal(await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).count(),0);assert.equal(await frame.getByRole('button',{name:'Tentar novamente',exact:true}).count(),0);assert.equal(writeCount,1);await frame.getByRole('button',{name:['TIMEOUT','ERP_UNAVAILABLE'].includes(code)?'Verificar na conversa':'Atualizar prévia',exact:true}).waitFor()}
    const expired=draft();expired.expira_em=new Date(Date.now()-1000).toISOString();await open(expired);await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).waitFor();assert.equal(writeCount,0)
    for(const changed of [{status:'pending',registro_id:null},{status:'saved',registro_id:'999'},{status:'saved',empresa_id:3},{status:'saved',rascunho_id:randomUUID()}]){await open();override={...structuredClone(input),etapa:'executado',registro_id:'1250',...changed};await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByText(/O resultado da atualização ainda não foi confirmado/).waitFor();assert.equal(await frame.locator('.creation-success-icon').count(),0)}
    await open();actualOverride={...base,data_vencimento:'2026-11-20'};await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByRole('heading',{name:'Resultado da atualização',exact:true}).waitFor();await frame.locator('.edit-new').getByText('20/11/2026',{exact:true}).waitFor();assert.equal(await frame.locator('.creation-success-icon').count(),0);assert.equal(await frame.locator('.edit-new').getByText('30/10/2026',{exact:true}).count(),0)
    await open();rejectContext=true;await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByText(/pode não ter sido avisado/).waitFor();assert.equal(writeCount,1)
    checks.push('uncertain_or_wrong_results_never_repeat_or_show_false_success_and_actual_saved_values_win')
    const kinds=['venda','orcamento','compra','cliente','fornecedor','vendedor','produto','servico','categoria','conta_financeira','conta_pagar','conta_receber','ordem_servico','nota_servico']
    for(const kind of kinds){await open(draft('editar_'+kind,{registro_id:1250,observacoes:'Nova observação'},{registro_id:1250,observacoes:'Observação anterior'}));await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.locator('.creation-success-icon').waitFor();assert.equal(writeCount,1);assert.equal(calls[0].name,toolCallForProposal({tipo:'editar_'+kind,dados:{}}).name);assert.equal(calls.length,1)}
    const oldItems=[{...item,total:undefined,valor_unitario:'350.00',quantidade:'1.0000',desconto:'0'}],newItems=[{...item,total:undefined,quantidade:2}];await open(draft('editar_venda',{registro_id:1250,itens:newItems},{registro_id:1250,itens:oldItems}));assert.equal(await frame.locator('.edit-change').count(),2);await frame.getByText('R$ 700,00',{exact:true}).waitFor();await frame.getByLabel('Consultoria de marketing · Quantidade — novo valor',{exact:true}).fill('0');assert.equal(await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).isEnabled(),false);await frame.getByLabel('Consultoria de marketing · Quantidade — novo valor',{exact:true}).fill('3');assert.equal(await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).isEnabled(),true);await frame.getByRole('button',{name:'Atualizar prévia',exact:true}).click();await frame.getByText('R$ 1.050,00',{exact:true}).waitFor();assert.equal(writeCount,0)
    const dangerous='<img src=x onerror="window.hacked=true">'+'Nome longo '.repeat(30);await open(draft('editar_cliente',{registro_id:1250,nome:dangerous},{registro_id:1250,nome:'Antigo'}));assert.equal(await frame.locator('img').count(),0);assert.equal(await frame.locator('html').evaluate(root=>root.scrollWidth<=root.clientWidth),true)
    theme='dark';await open();await shot('atualizar-venda-escuro');await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByRole('heading',{name:'Venda atualizada!',exact:true}).waitFor();await shot('venda-atualizada-escuro')
    hostKind='claude';await open();assert.equal(await frame.locator('input,select,textarea').count(),0);await frame.getByRole('button',{name:'Revisar alterações',exact:true}).click();await frame.getByLabel('Vencimento — novo valor',{exact:true}).waitFor();await frame.getByRole('button',{name:'Confirmar alterações',exact:true}).click();await frame.getByRole('heading',{name:'Venda atualizada!',exact:true}).waitFor()
    checks.push('all_fourteen_edit_types_nested_items_inputs_xss_mobile_dark_and_claude_fullscreen')
    assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'passed',checks,screenshots:screenshots?'.cache/chatgptplugin-update':false,realERPChanges:false,realDatabase:false,realChatGPT:false}))
  }finally{releaseWrite();writeGate=null;releaseContext();contextGate=null;await browser.close();await new Promise<void>(done=>server.close(()=>done()))}
}
void main().catch(error=>{console.error(error);process.exitCode=1})
