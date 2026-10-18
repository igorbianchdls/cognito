import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {mkdirSync,writeFileSync} from 'node:fs'
import pg from 'pg'
import {config} from 'dotenv'
import {connection} from './erp/evolution-db.mjs'
import {installFiscalStorageFixture} from './erp/fiscal-storage-fixture.mjs'
import {getErpDatabaseContext,runWithErpDatabaseContext} from '../src/lib/erpDatabaseContext'
import {closePool,withTransaction} from '../src/lib/postgres'
import {createSalesContract} from '../src/products/erp/server/erpSalesContracts'
import {createErpEntityRecord,getErpPurchaseDetails} from '../src/products/erp/server/erpRepository'
import {receivePurchaseItems} from '../src/products/erp/server/erpProfessionalRepository'
import {closePluginDatabase} from '../src/products/mcpcore/shared/database'
import {loadPluginPrincipal} from '../src/products/mcpcore/auth/resolvePrincipal'
import {executionDependencies} from '../src/products/mcpcore/application/executeTool'
import {actionTools} from '../src/products/mcpcore/actions/catalog'
import {tools} from '../src/products/mcpcore/tools/catalog'
import type {PluginPrincipal} from '../src/products/mcpcore/shared/contracts'
import {handlePluginRequest} from '../src/products/mcpcore/hosts/chatgpt/handleRequest'
import {MODERN_VERSION} from '../src/products/mcpcore/hosts/chatgpt/modernProtocol'
import {getPluginConfig} from '../src/products/mcpcore/hosts/chatgpt/config'
import {getServiceInvoicePdf,getServiceInvoice} from '../src/products/erp/server/fiscal/serviceInvoiceRepository'
import {createServiceInvoiceLinkToken,verifyServiceInvoiceLinkToken} from '../src/products/erp/server/fiscal/serviceInvoiceLinks'
import {GET as downloadInvoice} from '../src/products/erp/api/handlers/notas-servico/publicLink'
import {closeErpPeriod} from '../src/products/erp/server/erpPeriodRepository'
import {GET as downloadCommercial} from '../src/products/erp/api/handlers/documentos-comerciais/publicLink'

// Real MCP SDK, repositories, approvals and RLS. Authentication is a fixture.
// Test-only pool adapter shares a single outer transaction: nested COMMITs
// release savepoints, never commit data. Native read-only/rate limiting have
// their own real-connection checks in chatgptplugin-live-read-smoke.ts.
config({path:'.env.local',quiet:true})
const fiscalStorageFixture=installFiscalStorageFixture({buckets:['erp-fiscal','erp-comercial']})
const opt=(name:string)=>Number(process.argv.find(a=>a.startsWith(`--${name}=`))?.split('=')[1])
const company=opt('company'),user=opt('user')
assert(company>0&&user>0,'Informe --company=<empresa> --user=<usuario>')
const db=connection(),marker='QA-OTTO-ALL-MCP-'+randomUUID(),called=new Set<string>(),successful=new Set<string>()
const checks:{name:string;status:string;error?:string}[]=[]
const report={date:new Date().toISOString(),company,user,marker,status:'running',realSupabase:true,oauthVerified:false,
 transport:'Real HTTP Request/Response handler and SDK; authentication fixture',
 isolation:'Test-process pool adapter; outer rollback includes business records, drafts, preferences and audit',
 checks,coverage:{} as Record<string,unknown>,originalRowsUnchanged:false,rolledBack:false,
 sqlErrors:[] as {code:string;message:string;statement:string}[]}
let principal:PluginPrincipal,seq=0,serial=0,active=false,outer=false
db.on('error',(error:Error)=>{console.error('Test connection lost: '+error.message);report.status='failed'})
const nested:string[]=[],originalConnect=pg.Pool.prototype.connect,originalQuery=pg.Pool.prototype.query
const settings=getPluginConfig()
const selectedCase=process.argv.find(a=>a.startsWith('--case='))?.slice(7)
const exportPdfs=process.argv.includes('--export-pdfs')
const exportPdfName=process.argv.find(a=>a.startsWith('--export-pdf='))?.slice('--export-pdf='.length)
function exportPdf(name:string,bytes:Buffer){if(exportPdfs||exportPdfName===name){mkdirSync('output/pdf',{recursive:true});writeFileSync('output/pdf/'+name,bytes)}}
const erpRead=<T>(fn:()=>Promise<T>)=>runWithErpDatabaseContext({tenantId:company,userId:user,readOnly:true},fn)
const fakeClient={release:()=>{},query:async(statement:string,params?:unknown[])=>{
 assert(active&&outer,'Adapter requires outer rollback transaction')
 const text=statement.trim(),context=getErpDatabaseContext()
 if(/^BEGIN\b/i.test(text)){const save='mcp_pool_'+(++serial);nested.push(save);return db.query('SAVEPOINT '+save)}
 if(/^COMMIT\b/i.test(text)){
  assert(nested.length,'Never commit outer transaction')
  await db.query('SET CONSTRAINTS ALL IMMEDIATE');await db.query('SET CONSTRAINTS ALL DEFERRED')
  return db.query('RELEASE SAVEPOINT '+nested.pop())
 }
 if(/^ROLLBACK\s*;?$/i.test(text)){
  assert(nested.length,'Never rollback outer transaction via pool')
  const save=nested.pop()!;await db.query('ROLLBACK TO SAVEPOINT '+save);return db.query('RELEASE SAVEPOINT '+save)
 }
 if(context?.readOnly&&/\berp\./i.test(text)&&/^\s*(INSERT|UPDATE|DELETE|TRUNCATE)\b/i.test(text))throw new Error('Read-only ERP mutation refused')
 // Can't turn an outer transaction containing writes into a native read-only
 // transaction. Keep real tenant/user/RLS, enforce read-only statements above.
 if(/^SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY\s*;?$/i.test(text)){assert(context?.readOnly);return {rows:[]}}
 const normalized=statement.replace(/set_config\('transaction_read_only', 'on', true\),?\s*/g,'')
 try{return await db.query(normalized,params)}catch(error){
  const e=error as {code?:string;message:string};report.sqlErrors.push({code:e.code||'',message:e.message.slice(0,250),statement:text.slice(0,160)});throw error
 }
}}
async function sql(statement:string,params:unknown[]=[]){await db.query('RESET ROLE');return (await db.query(statement,params)).rows}
async function fingerprint(){
 const names=(await sql("SELECT table_name FROM information_schema.tables WHERE table_schema='erp' AND table_type='BASE TABLE' ORDER BY table_name")).map((r:{table_name:string})=>r.table_name)
 const records=[]
 for(const name of names){assert(/^[a-z_]+$/.test(name));records.push({name,...(await sql(`SELECT count(*)::int n,md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY to_jsonb(t)::text),'')) hash FROM erp.${name} t`))[0]})}
 for(const name of ['usuarios','empresas','usuarios_empresas'])records.push({name:'shared.'+name,...(await sql(`SELECT count(*)::int n,md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY to_jsonb(t)::text),'')) hash FROM shared.${name} t`))[0]})
 return createHash('sha256').update(JSON.stringify(records)).digest('hex')
}
async function rpc(method:string,params:Record<string,unknown>={},identity:PluginPrincipal=principal,modern=false){
 const headers:Record<string,string>={'content-type':'application/json',accept:'application/json, text/event-stream',authorization:'Bearer local-fixture'}
 if(modern){headers['mcp-protocol-version']=MODERN_VERSION;headers['mcp-method']=method;if(params.name)headers['mcp-name']=String(params.name)}
 const response=await handlePluginRequest(new Request(settings.resource,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:++seq,method,params:modern?{...params,_meta:{'io.modelcontextprotocol/protocolVersion':MODERN_VERSION,'io.modelcontextprotocol/clientCapabilities':{}}}:params})}),
 {config:()=>settings,resolve:async()=>identity,limit:async()=>{},execution:executionDependencies})
 assert.equal(response.status,200);return response.json()
}
async function raw(name:string,args:Record<string,unknown>,identity=principal,modern=false){called.add(name);return rpc('tools/call',{name,arguments:args},identity,modern)}
async function call(name:string,args:Record<string,unknown>={},identity=principal,modern=false){
 const result=await raw(name,{empresa_id:company,...args},identity,modern)
 assert(!result.error&&!result.result?.isError,`${name}: ${JSON.stringify(result.error||result.result?.content)}`)
 successful.add(name);return result.result.structuredContent
}
async function reject(name:string,args:Record<string,unknown>,expected?:string,identity=principal){
 await db.query('SAVEPOINT rejected_call');const depth=nested.length
 try{const result=await raw(name,{empresa_id:company,...args},identity);assert(result.error||result.result?.isError,`${name} accepted invalid input`)
 if(expected){assert(!result.error,JSON.stringify(result.error));assert.equal(JSON.parse(result.result.content[0].text).code,expected)}}
 finally{await db.query('ROLLBACK TO SAVEPOINT rejected_call');await db.query('RELEASE SAVEPOINT rejected_call');nested.length=depth}
}
async function check(name:string,fn:()=>Promise<void>){
 if(selectedCase&&!name.startsWith('MCP:')&&!new RegExp(selectedCase,'i').test(name))return
 await db.query('RESET ROLE');const save='scenario_'+(++serial),depth=nested.length;await db.query('SAVEPOINT '+save)
 try{await fn();await db.query('RESET ROLE');await db.query('SET CONSTRAINTS ALL IMMEDIATE');await db.query('SET CONSTRAINTS ALL DEFERRED');await db.query('RELEASE SAVEPOINT '+save);checks.push({name,status:'passed'});console.log('PASS '+name)}
 catch(error){await db.query('ROLLBACK TO SAVEPOINT '+save);await db.query('RELEASE SAVEPOINT '+save);nested.length=depth;const message=error instanceof Error?error.message:String(error);checks.push({name,status:'failed',error:message.slice(0,1200)});console.log('FAIL '+name+' '+message.slice(0,500))}
}
async function prepare(name:string,args:Record<string,unknown>,key=randomUUID()){
 const view=(await call(name,{...args,chave_operacao:key})).data;assert.equal(view.status,'pending');assert.equal(view.etapa,'previa');assert.equal(view.confirmar.tool,name);return view
}
async function execute(name:string,draft:string){const view=(await call(name,{rascunho_id:draft})).data;assert.equal(view.status,'saved');assert.equal(view.etapa,'executado');return Number(view.registro_id)}
async function mutate(name:string,args:Record<string,unknown>){const view=await prepare(name,args);const id=await execute(name,view.rascunho_id);assert.equal(await execute(name,view.rascunho_id),id,'Replay must not duplicate');return id}
let today='',due=''
const reason='Encerramento dos registros fictícios deste teste'
async function main(){let before='';try{
 await db.connect();before=await fingerprint()
 const identity=(await sql('SELECT clerk_user_id FROM shared.usuarios WHERE id=$1 AND status=$2',[user,'active']))[0];assert(identity?.clerk_user_id)
 principal=await loadPluginPrincipal(identity.clerk_user_id,'all-tools-regression-'+randomUUID(),['erp:read','erp:write'])
 assert(principal.companies.some(c=>c.id===company&&c.capabilities.includes('erp.financeiro.gerenciar')))
 today=new Intl.DateTimeFormat('sv-SE',{timeZone:principal.companies.find(c=>c.id===company)?.timeZone||'America/Sao_Paulo'}).format(new Date())
 due=new Date(Date.parse(today+'T00:00:00Z')+7*86400000).toISOString().slice(0,10)
 await db.query('BEGIN');outer=true;active=true
 pg.Pool.prototype.connect=async function(){return fakeClient} as never
 pg.Pool.prototype.query=async function(statement:string,params?:unknown[]){await db.query('RESET ROLE');return fakeClient.query(statement,params)} as never
 await check('MCP: catálogo atual e ambos os protocolos',async()=>{
  const list=await rpc('tools/list'),modern=await rpc('tools/list',{},principal,true)
  const expected=[...tools.map(t=>t.name),...actionTools.map(t=>t.name),'meu_acesso','abrir_painel','ler_configuracoes','atualizar_configuracoes','search_mentions'].sort()
  assert.deepEqual(list.result.tools.map((t:{name:string})=>t.name).sort(),expected);assert.deepEqual(modern.result.tools.map((t:{name:string})=>t.name).sort(),expected)
  assert.equal(expected.length,new Set(expected).size);report.coverage.catalog=expected
 })
 const readOnly={...principal,scopes:['erp:read']},restricted={...principal,companies:principal.companies.map(c=>({...c,capabilities:[]}))}
 for(const action of process.argv.includes('--flows-only')?[]:actionTools)await check('Permissões e argumentos: '+action.name,async()=>{
  await reject(action.name,{rascunho_id:randomUUID()},'INSUFFICIENT_SCOPE',readOnly)
  await reject(action.name,{rascunho_id:randomUUID(),empresa_id:company+100000},'ACCESS_DENIED')
  await reject(action.name,{rascunho_id:randomUUID()},'NOT_FOUND')
  await reject(action.name,{dados:{},chave_operacao:randomUUID()})
 })
 for(const tool of process.argv.includes('--flows-only')?[]:tools)await check('Empresa e argumentos: '+tool.name,async()=>{
  const input=tool.schema.safeParse({empresa_id:company+100000})
  if(input.success)await reject(tool.name,{empresa_id:company+100000},'ACCESS_DENIED')
  await reject(tool.name,{empresa_id:company,unexpected_field:'invalid'})
 })
 const baseRefs=(await sql(`SELECT
 (SELECT id FROM erp.entidades WHERE empresa_id=$1 AND eh_cliente AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1) cliente,
 (SELECT id FROM erp.entidades WHERE empresa_id=$1 AND eh_fornecedor AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1) fornecedor,
 (SELECT id FROM erp.servicos WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1) servico,
 (SELECT id FROM erp.contas_financeiras WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1) conta,
 (SELECT c.id FROM erp.categorias c WHERE empresa_id=$1 AND tipo='receita' AND ativo AND excluido_em IS NULL AND NOT EXISTS(SELECT 1 FROM erp.categorias f WHERE f.empresa_id=$1 AND f.categoria_pai_id=c.id AND ativo AND excluido_em IS NULL) ORDER BY id LIMIT 1) receita,
 (SELECT c.id FROM erp.categorias c WHERE empresa_id=$1 AND tipo='despesa' AND ativo AND excluido_em IS NULL AND NOT EXISTS(SELECT 1 FROM erp.categorias f WHERE f.empresa_id=$1 AND f.categoria_pai_id=c.id AND ativo AND excluido_em IS NULL) ORDER BY id LIMIT 1) despesa`,[company]))[0]
 const refs=Object.fromEntries(Object.entries(baseRefs).map(([k,v])=>[k,Number(v)]));assert(Object.values(refs).every(v=>v>0))
 await check('Evolução: contratos e devolução integral com prévia, confirmação e repetição MCP',async()=>{
  const write=<T>(fn:()=>Promise<T>)=>runWithErpDatabaseContext({tenantId:company,userId:user},fn)
  const actor={tenantId:company,actorId:user}
  const contract=await write(()=>withTransaction(c=>createSalesContract(c,{...actor,idempotencyKey:randomUUID(),values:{cliente_id:refs.cliente,numero:marker+'-CON',descricao:marker,servico_id:refs.servico,quantidade:1,valor_unitario:100,data_inicio:today,periodicidade:'mensal',dia_vencimento:15}})))
  for(const [action,status] of [['suspender','pausado'],['retomar','ativo'],['encerrar','encerrado']]){
   await mutate('alterar_contrato',{tipo:action,dados:{registro_id:Number(contract.id),motivo:reason}})
   assert.equal((await call('obter_contrato',{registro_id:Number(contract.id)})).data.record.status,status)
  }
  const rejected=await prepare('alterar_contrato',{tipo:'retomar',dados:{registro_id:Number(contract.id),motivo:reason}})
  await reject('alterar_contrato',{rascunho_id:rejected.rascunho_id})
  const product=await write(()=>createErpEntityRecord({...actor,entityId:'produtos',idempotencyKey:randomUUID(),values:{nome:marker,sku:randomUUID(),preco:100,unidade_medida:'UN',controla_estoque:'sim',status:'ativo'}}))
  const nature=(await sql('SELECT id FROM erp.naturezas_operacao_compra WHERE empresa_id=$1 AND ativo AND atualiza_estoque ORDER BY id LIMIT 1',[company]))[0];assert(nature)
  const purchase=await write(()=>createErpEntityRecord({...actor,entityId:'pedidos-compra',idempotencyKey:randomUUID(),values:{numero:marker+'-COM',fornecedor_id:refs.fornecedor,tipo_compra:'produto',tipo_movimento:'compra',natureza_operacao_id:Number(nature.id),categoria_id:refs.despesa,gera_financeiro:true,data_compra:today,data_competencia:today,itens:[{produto_id:Number(product.id),quantidade:1,valor_unitario:100}],parcelas:[{numero_parcela:1,data_vencimento:today,valor:100,conta_financeira_id:refs.conta}]}}))
  const detail=await erpRead(()=>getErpPurchaseDetails(company,purchase.id));
  await write(()=>receivePurchaseItems({...actor,purchaseId:Number(purchase.id),idempotencyKey:randomUUID(),values:{items:detail.items.map(i=>({item_id:Number(i.id),quantidade:1,local_estoque_id:null}))}}))
  await mutate('devolver_compra',{dados:{registro_id:Number(purchase.id),motivo:reason}})
  assert.equal((await call('obter_compra',{compra_id:Number(purchase.id)})).data.purchase.devolvida,true)
 })
 await check('Contexto para agentes: campos fiscais, comerciais e classificação DRE',async()=>{
  const service=(await call('obter_cadastro',{tipo:'servicos',registro_id:refs.servico})).data.record;
  const expectedService=(await sql('SELECT codigo_tributacao_nacional,codigo_servico_municipal,codigo_nbs FROM erp.servicos WHERE empresa_id=$1 AND id=$2',[company,refs.servico]))[0];
  for(const field of ['codigo_tributacao_nacional','codigo_servico_municipal','codigo_nbs'])assert.equal(service[field],String(expectedService[field]||''));
  const customer=(await call('obter_cadastro',{tipo:'clientes',registro_id:refs.cliente})).data.record;
  const expectedCustomer=(await sql('SELECT limite_credito,bloqueio_comercial,tabela_preco_id FROM erp.entidades WHERE empresa_id=$1 AND id=$2',[company,refs.cliente]))[0];
  assert.equal(customer.limite_credito,expectedCustomer.limite_credito);assert.equal(customer.bloqueio_comercial,expectedCustomer.bloqueio_comercial?'sim':'nao');assert.equal(customer.tabela_preco_id,expectedCustomer.tabela_preco_id==null?null:String(expectedCustomer.tabela_preco_id));
  const category=(await call('obter_cadastro',{tipo:'categorias',registro_id:refs.receita})).data.record;
  const expectedCategory=(await sql('SELECT c.fora_dre,g.codigo FROM erp.categorias c LEFT JOIN erp.dre_grupos g ON g.empresa_id=c.empresa_id AND g.id=c.dre_grupo_id WHERE c.empresa_id=$1 AND c.id=$2',[company,refs.receita]))[0];
  assert.equal(category.fora_dre,expectedCategory.fora_dre);assert.equal(category.dre_grupo_codigo,expectedCategory.codigo);
  const existing=(await sql("SELECT id,vendedor_id,tabela_preco_id,transportadora_id,modalidade_frete,volumes,peso_bruto,peso_liquido,fiscal_status,venda_origem_id FROM erp.vendas WHERE empresa_id=$1 AND excluido_em IS NULL ORDER BY id LIMIT 1",[company]))[0];assert(existing);
  const sale=(await call('obter_venda',{venda_id:Number(existing.id)})).data.sale;
  for(const field of ['vendedor_id','tabela_preco_id','transportadora_id','modalidade_frete','volumes','peso_bruto','peso_liquido','fiscal_status','venda_origem_id'])assert.equal(sale[field],existing[field]);
 })
 const registrations:Record<string,Record<string,unknown>>={cliente:{nome:marker+' cliente',tipo:'fisica',email:'mcp@example.invalid',telefone:'11999990000'},fornecedor:{nome:marker+' fornecedor',tipo:'juridica'},vendedor:{nome:marker+' vendedor',tipo:'fisica'},produto:{nome:marker+' produto',preco:100,controla_estoque:'nao'},servico:{nome:marker+' serviço',preco:100},categoria:{nome:marker+' categoria',tipo:'receita',dre_grupo_codigo:1},conta_financeira:{nome:marker+' conta',tipo:'caixa',saldo_inicial:0,data_saldo_inicial:today}}
 const moduleNames:Record<string,string>={cliente:'clientes',fornecedor:'fornecedores',vendedor:'vendedores',produto:'produtos',servico:'servicos',categoria:'categorias',conta_financeira:'contas-financeiras'}
 for(const [kind,data] of Object.entries(registrations))await check('CRUD e idempotência: '+kind,async()=>{
  const key=randomUUID(),draft=await prepare('criar_cadastro',{tipo:kind,dados:data},key)
  assert.equal((await call('buscar_cadastros',{tipo:moduleNames[kind],busca:String(data.nome)})).data.total,0,'Preview cannot create records')
  assert.equal((await prepare('criar_cadastro',{tipo:kind,dados:data},key)).rascunho_id,draft.rascunho_id)
  await reject('criar_cadastro',{tipo:kind,dados:{...data,nome:marker+' diferente'},chave_operacao:key},'IDEMPOTENCY_CONFLICT')
  await reject('excluir_cadastro',{rascunho_id:draft.rascunho_id},'INVALID_INPUT')
  await reject('criar_cadastro',{tipo:kind,dados:data,chave_operacao:randomUUID()},'ACCESS_DENIED',restricted)
  const id=await execute('criar_cadastro',draft.rascunho_id);assert.equal(await execute('criar_cadastro',draft.rascunho_id),id)
  assert.equal((await call('obter_cadastro',{tipo:moduleNames[kind],registro_id:id})).data.record.nome,data.nome)
  await mutate('editar_cadastro',{tipo:kind,dados:{registro_id:id,nome:String(data.nome)+' atualizado',...(kind==='cliente'||kind==='fornecedor'?{telefone:'11999990099'}:{})}})
  const edited=(await call('obter_cadastro',{tipo:moduleNames[kind],registro_id:id})).data;assert.equal(edited.record.nome,String(data.nome)+' atualizado')
  if(kind==='cliente'||kind==='fornecedor')assert.equal(edited.record.telefone,'11999990099')
  await mutate('excluir_cadastro',{tipo:kind,dados:{registro_id:id,motivo:reason}})
  await reject('obter_cadastro',{tipo:moduleNames[kind],registro_id:id},'NOT_FOUND')
 })
 await check('Alteração após a prévia exige nova revisão',async()=>{
  const id=await mutate('criar_cadastro',{tipo:'cliente',dados:{nome:marker+' concorrência',tipo:'fisica'}})
  const draft=await prepare('editar_cadastro',{tipo:'cliente',dados:{registro_id:id,nome:marker+' antiga'}})
  await mutate('editar_cadastro',{tipo:'cliente',dados:{registro_id:id,nome:marker+' concorrente'}})
  await reject('editar_cadastro',{rascunho_id:draft.rascunho_id},'STALE_PROPOSAL')
 })
 await check('Suspensão da empresa depois da prévia impede execução',async()=>{
  const draft=await prepare('criar_cadastro',{tipo:'cliente',dados:{nome:marker+' suspenso',tipo:'fisica'}})
  await sql("UPDATE shared.empresas SET status='suspended' WHERE id=$1",[company])
  await reject('criar_cadastro',{rascunho_id:draft.rascunho_id},'ACCESS_DENIED')
  await sql("UPDATE shared.empresas SET status='active' WHERE id=$1",[company])
 })
 for(const side of ['pagar','receber'])await check('Financeiro completo: '+side,async()=>{
  const data={descricao:marker+' '+side,[side==='pagar'?'fornecedor_id':'cliente_id']:refs[side==='pagar'?'fornecedor':'cliente'],categoria_id:refs[side==='pagar'?'despesa':'receita'],conta_financeira_id:refs.conta,data_emissao:today,data_competencia:today,valor_total:100,tipo_lancamento:'previsao',parcelas:[{data_vencimento:due,valor:40},{data_vencimento:'2026-11-16',valor:60}]}
  const id=await mutate('criar_titulo',{tipo:side,dados:data})
  await mutate('editar_titulo',{tipo:side,dados:{...data,registro_id:id,descricao:marker+' financeiro atualizado'}})
  let detail=(await call('obter_titulo_financeiro',{tipo:side,conta_id:id})).data;assert.equal(detail.record.tipo_lancamento,'previsao');assert.equal(detail.installments.length,2)
  const part=Number(detail.installments[0].id),paymentData={registro_id:part,valor:20,data_pagamento:today,conta_financeira_id:refs.conta}
  const preview=await prepare('registrar_baixa',{tipo:side,dados:paymentData})
  await reject('registrar_baixa',{rascunho_id:preview.rascunho_id})
  await mutate('efetivar_previsao',{tipo:side,dados:{registro_id:id}})
  detail=(await call('obter_titulo_financeiro',{tipo:side,conta_id:id})).data;assert.equal(detail.record.tipo_lancamento,'efetivo')
  await mutate('registrar_baixa',{tipo:side,dados:paymentData})
  assert.equal(Number((await call('obter_parcela_financeira',{tipo:side,parcela_id:part})).data.record.saldo),20)
  await call('listar_pagamentos',{tipo:side,por_pagina:50})
  const payment=(await sql(`SELECT id FROM erp.pagamentos WHERE empresa_id=$1 AND conta_${side}_parcela_id=$2 AND estorno_de_pagamento_id IS NULL AND estornado_em IS NULL`,[company,part]))[0];assert(payment)
  await mutate('estornar_pagamento',{dados:{registro_id:Number(payment.id),motivo:reason}})
  assert.equal(Number((await call('obter_parcela_financeira',{tipo:side,parcela_id:part})).data.record.saldo),40)
  const unused=await mutate('criar_titulo',{tipo:side,dados:{...data,descricao:marker+' exclusão '+side}})
  await mutate('excluir_titulo',{tipo:side,dados:{registro_id:unused,motivo:reason}})
  await reject('obter_titulo_financeiro',{tipo:side,conta_id:unused},'NOT_FOUND')
 })
 const commercial=(sale:boolean,item=refs.servico,kind='servico',quantity=1)=>({[sale?'cliente_id':'fornecedor_id']:refs[sale?'cliente':'fornecedor'],[sale?'data_venda':'data_compra']:today,data_vencimento:due,itens:[{tipo:kind,item_id:item,quantidade:quantity,valor_unitario:100,desconto:0}],observacoes:marker})
 await check('Comercial ampliado: OS, proposta, parcelas e PDF privado',async()=>{
  const data={cliente_id:refs.cliente,data_inicio:today,previsao_entrega:due,equipamento:'Equipamento de teste MCP',observacoes_internas:'SEGREDO_INTERNO_MCP',desconto:10,itens:[{tipo:'servico',item_id:refs.servico,descricao:'Serviço do teste MCP',quantidade:2,valor_unitario:100,desconto:0}]};
  const os=await mutate('criar_ordem_servico',{dados:data});await mutate('editar_ordem_servico',{dados:{...data,registro_id:os,diagnostico:'Diagnóstico revisado'}});
  const listed=(await call('listar_ordens_servico',{busca:'Equipamento de teste MCP'})).data;assert(listed.records.some((r:{id:string})=>Number(r.id)===os));
  let detail=(await call('obter_ordem_servico',{registro_id:os})).data;assert.equal(Number(detail.record.total),190);
  for(const tipo of ['aprovar','iniciar','concluir'])await mutate('alterar_ordem_servico',{tipo,dados:{registro_id:os}});
  const q=await mutate('converter_ordem_servico',{tipo:'orcamento',dados:{registro_id:os}});
  await mutate('alterar_orcamento',{tipo:'enviar',dados:{registro_id:q}});await mutate('alterar_orcamento',{tipo:'aprovar',dados:{registro_id:q}});
  await mutate('arquivar_documento_comercial',{tipo:'ordem_servico',dados:{registro_id:os}});
  await mutate('arquivar_documento_comercial',{tipo:'orcamento',dados:{registro_id:q}});
  for(const revisao of [undefined,1]){
   const document=(await call('obter_documento_comercial',{tipo:'ordem_servico',registro_id:os,...(revisao?{revisao}:{})})).data.record;
   const response=await downloadCommercial(new Request(String(document.pdf_url)),{params:Promise.resolve({token:new URL(String(document.pdf_url)).pathname.split('/').at(-1)!})});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/pdf');
   const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert(!bytes.includes(Buffer.from('SEGREDO_INTERNO_MCP')));
   if(revisao)exportPdf('ordem-servico-tool-teste.pdf',bytes);
  }
  const attachments=(await call('listar_anexos',{documento:'ordem_servico',registro_id:os})).data.records;assert(attachments.some((a:{link_download?:string})=>a.link_download));
  for(const revisao of [undefined,1]){
   const pdf=(await call('obter_documento_comercial',{tipo:'orcamento',registro_id:q,...(revisao?{revisao}:{})})).data.record;
   const token=new URL(String(pdf.pdf_url)).pathname.split('/').at(-1)!;
   const response=await downloadCommercial(new Request(String(pdf.pdf_url)),{params:Promise.resolve({token})});assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/pdf');
   const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert(!bytes.includes(Buffer.from('SEGREDO_INTERNO_MCP')));
   if(revisao)exportPdf('proposta-comercial-tool-teste.pdf',bytes);
   const invalid=await downloadCommercial(new Request(String(pdf.pdf_url)+'x'),{params:Promise.resolve({token:token+'x'})});assert.equal(invalid.status,404);
  }
  const proposalAttachments=(await call('listar_anexos',{documento:'venda',registro_id:q})).data.records;assert(proposalAttachments.some((a:{link_download?:string})=>a.link_download));
  const sale=await mutate('converter_orcamento',{dados:{registro_id:q}}),fromOS=await mutate('converter_ordem_servico',{tipo:'venda',dados:{registro_id:os}});assert.equal(sale,fromOS);detail=(await call('obter_ordem_servico',{registro_id:os})).data;assert.equal(Number(detail.record.venda_id),sale);
  const complex={...commercial(true),validade_em:due,desconto:10,frete:5,parcelas:[{data_vencimento:due,valor:40},{data_vencimento:due,valor:55}]},draft=await mutate('criar_venda',{tipo:'orcamento',dados:complex});await mutate('editar_venda',{tipo:'orcamento',dados:{...complex,registro_id:draft,observacoes:'Condição comercial revisada'}});assert.equal((await call('obter_venda',{venda_id:draft})).data.installments.length,2);
  await mutate('alterar_orcamento',{tipo:'recusar',dados:{registro_id:draft,motivo:reason}});const denied=await prepare('converter_orcamento',{dados:{registro_id:draft}});await reject('converter_orcamento',{rascunho_id:denied.rascunho_id},'INVALID_STATE');
  const cancelled=await mutate('criar_ordem_servico',{dados:data});await mutate('alterar_ordem_servico',{tipo:'cancelar',dados:{registro_id:cancelled,motivo:reason}});
  const quoteCancelled=await mutate('criar_venda',{tipo:'orcamento',dados:commercial(true)});await mutate('alterar_orcamento',{tipo:'cancelar',dados:{registro_id:quoteCancelled,motivo:reason}});
 });
 await check('Orçamento: criar, editar, converter e excluir rascunhos',async()=>{
  const data=commercial(true),id=await mutate('criar_venda',{tipo:'orcamento',dados:data})
  await mutate('editar_venda',{tipo:'orcamento',dados:{...data,registro_id:id,observacoes:marker+' orçamento alterado'}})
  const converted=await mutate('converter_orcamento',{dados:{registro_id:id}})
  const detail=(await call('obter_venda',{venda_id:converted})).data;assert.equal(detail.sale.tipo_documento,'venda');assert.equal(detail.sale.status,'rascunho')
  await mutate('excluir_venda',{tipo:'venda',dados:{registro_id:converted,motivo:reason}})
  const removable=await mutate('criar_venda',{tipo:'orcamento',dados:data});await mutate('excluir_venda',{tipo:'orcamento',dados:{registro_id:removable,motivo:reason}})
 })
 await check('Venda: criar, editar, confirmar, título e cancelamento',async()=>{
  const data=commercial(true),id=await mutate('criar_venda',{tipo:'venda',dados:data})
  await mutate('editar_venda',{tipo:'venda',dados:{...data,registro_id:id,itens:[{...data.itens[0],quantidade:2}]}})
  await mutate('confirmar_venda',{dados:{registro_id:id}})
  const titles=await sql('SELECT id,valor_total FROM erp.contas_receber WHERE empresa_id=$1 AND venda_id=$2 AND excluido_em IS NULL',[company,id]);assert.equal(titles.length,1);assert.equal(Number(titles[0].valor_total),200)
  const deletion=await prepare('excluir_venda',{tipo:'venda',dados:{registro_id:id,motivo:reason}});await reject('excluir_venda',{rascunho_id:deletion.rascunho_id})
  await mutate('cancelar_venda',{dados:{registro_id:id,motivo:reason}})
  assert.equal((await call('obter_venda',{venda_id:id})).data.sale.status,'cancelada')
 })
 await check('Compra: criar, editar, confirmar, título, cancelar e excluir rascunho',async()=>{
  const data=commercial(false),id=await mutate('criar_compra',{dados:data})
  await mutate('editar_compra',{dados:{...data,registro_id:id,itens:[{...data.itens[0],quantidade:2}]}})
  await mutate('confirmar_compra',{dados:{registro_id:id}})
  const titles=await sql('SELECT id,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND compra_id=$2 AND excluido_em IS NULL',[company,id]);assert.equal(titles.length,1);assert.equal(Number(titles[0].valor_total),200)
  await mutate('cancelar_compra',{dados:{registro_id:id}});assert.equal((await call('obter_compra',{compra_id:id})).data.purchase.status,'cancelada')
  const removable=await mutate('criar_compra',{dados:data});await mutate('excluir_compra',{dados:{registro_id:removable,motivo:reason}})
 })
 await check('Estoque: compra confirmada, reserva, atendimento e três tratamentos de devolução',async()=>{
  const stockCustomer=await mutate('criar_cadastro',{tipo:'cliente',dados:{nome:marker+' cliente de devoluções',tipo:'fisica'}})
  // Reimbursement requires both customer and supplier roles. Only this newly
  // created fixture receives the second role; existing registrations are untouched.
  await sql('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[company,stockCustomer])
  const stock=(await sql('SELECT produto_id,local_estoque_id,quantidade_fisica,quantidade_reservada FROM erp.saldos_estoque WHERE empresa_id=$1 AND quantidade_fisica-quantidade_reservada>=3 ORDER BY id LIMIT 1',[company]))[0];assert(stock)
  const product=Number(stock.produto_id),local=Number(stock.local_estoque_id)
  const balance=async()=>Number((await sql('SELECT quantidade_fisica FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[company,product,local]))[0].quantidade_fisica)
  const initial=await balance(),purchase=await mutate('criar_compra',{dados:commercial(false,product,'produto',3)})
  await mutate('confirmar_compra',{dados:{registro_id:purchase}})
  // Confirmation generates payables; goods arrive through a separate ERP
  // receiving operation, currently absent from the MCP catalog.
  assert.equal(await balance(),initial);assert.equal((await call('obter_compra',{compra_id:purchase})).data.purchase.status,'confirmada')
  for(const treatment of ['abater','credito','reembolso']){
   const id=await mutate('criar_venda',{tipo:'venda',dados:{...commercial(true,product,'produto',1),cliente_id:stockCustomer}})
   await mutate('confirmar_venda',{dados:{registro_id:id}})
   const reservation=(await sql('SELECT quantidade,status FROM erp.reservas_estoque WHERE empresa_id=$1 AND venda_id=$2',[company,id]))[0];assert.equal(Number(reservation.quantidade),1)
   const beforeSale=await balance();await mutate('atender_venda',{dados:{registro_id:id}});assert.equal(await balance(),beforeSale-1)
   const item=(await call('obter_venda',{venda_id:id})).data.items[0]
   await mutate('registrar_devolucao',{dados:{registro_id:id,tratamento:treatment,motivo:reason,itens:[{venda_item_id:Number(item.id),quantidade:1}],...(treatment==='reembolso'?{categoria_id:refs.despesa,data_vencimento:due}:{})}})
   assert.equal(await balance(),beforeSale)
   const returned=(await sql('SELECT valor_total,tratamento FROM erp.devolucoes WHERE empresa_id=$1 AND venda_id=$2',[company,id]))[0];assert.equal(returned.tratamento,treatment);assert.equal(Number(returned.valor_total),100)
  }
 })
 await check('Estoque insuficiente: recusa com mensagem de negócio',async()=>{
  const product=await mutate('criar_cadastro',{tipo:'produto',dados:{nome:marker+' sem estoque',preco:100,controla_estoque:'sim'}})
  const sale=await mutate('criar_venda',{tipo:'venda',dados:commercial(true,product,'produto',1)})
  const draft=await prepare('confirmar_venda',{dados:{registro_id:sale}})
  const result=await raw('confirmar_venda',{empresa_id:company,rascunho_id:draft.rascunho_id})
  assert(result.result.isError);const error=JSON.parse(result.result.content[0].text)
  assert(/estoque|saldo/i.test(error.message),'Insufficient stock was returned as '+error.code+': '+error.message)
 })
 await check('Período fechado impede confirmar a venda sem efeitos parciais',async()=>{
  await db.query('SAVEPOINT closed_period_case');const depth=nested.length
  try{
   const sale=await mutate('criar_venda',{tipo:'venda',dados:commercial(true)})
   const draft=await prepare('confirmar_venda',{dados:{registro_id:sale}})
   await runWithErpDatabaseContext({tenantId:company,userId:user},()=>closeErpPeriod({tenantId:company,actorId:user,modulo:'vendas',periodo_inicio:today,periodo_fim:today,motivo:marker}))
   await reject('confirmar_venda',{rascunho_id:draft.rascunho_id},'PERIOD_CLOSED')
   const titles=await sql('SELECT id FROM erp.contas_receber WHERE empresa_id=$1 AND venda_id=$2',[company,sale]);assert.equal(titles.length,0)
   assert.equal((await call('obter_venda',{venda_id:sale})).data.sale.status,'rascunho')
  }finally{await db.query('ROLLBACK TO SAVEPOINT closed_period_case');await db.query('RELEASE SAVEPOINT closed_period_case');nested.length=depth}
 })
 await check('NFS-e: CRUD, quatro cenários, PDF/XML e cancelamento',async()=>{
  const source=await erpRead(()=>getServiceInvoice(company,123)),{venda_id:_sale,...base}=source.input
  const data={...base,observacoes:marker,data_competencia:today,iss_retido:false,retencoes_federais:{},itens:[{...base.itens[0],quantidade:2,valor_unitario:150,desconto:0}]}
  const draftOnly=await mutate('criar_nota_servico',{dados:data})
  const listed=(await call('listar_notas_servico',{status:'rascunho'})).data;assert(listed.records.some((r:{id:string})=>Number(r.id)===draftOnly));
  await mutate('editar_nota_servico',{dados:{...data,registro_id:draftOnly,observacoes:marker+' editada'}})
  await mutate('excluir_nota_servico',{dados:{registro_id:draftOnly,motivo:reason}})
  for(const scenario of ['sucesso','rejeicao','demora','timeout']){
   const id=await mutate('criar_nota_servico',{dados:data})
   await mutate('emitir_nota_servico',{dados:{registro_id:id,cenario:scenario}})
   let detail=(await call('obter_nota_servico',{nota_id:id})).data
   if(scenario==='rejeicao'){assert.equal(detail.record.status,'falha');continue}
   if(scenario!=='sucesso'){assert.equal(detail.record.status,'aguardando_retorno');await mutate('consultar_nota_servico',{dados:{registro_id:id}});detail=(await call('obter_nota_servico',{nota_id:id})).data}
   assert.equal(detail.record.status,'emitida');assert.equal(Number(detail.record.valor_total),300)
   const pdf=await erpRead(()=>getServiceInvoicePdf(company,id));assert.equal(pdf.layoutVersion,2);assert.equal(pdf.hash,createHash('sha256').update(pdf.bytes).digest('hex'));assert(pdf.bytes.subarray(0,8).toString().startsWith('%PDF-'))
   const link=detail.record.pdf_url as string,token=link.split('/').pop()!
   const download=await downloadInvoice(new Request(link),{params:Promise.resolve({token})});assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'application/pdf');assert.equal(download.headers.get('X-PDF-Layout-Version'),'2');const bytes=Buffer.from(await download.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),pdf.hash)
   if(scenario==='sucesso'){exportPdf('nota-servico-tool-simulada.pdf',bytes);assert.equal(Number((await call('obter_nota_servico',{numero:String(detail.record.numero)})).data.record.id),id)}
   const xmlLink=detail.record.xml_url as string,xml=await downloadInvoice(new Request(xmlLink),{params:Promise.resolve({token:xmlLink.split('/').pop()!})});assert.equal(xml.status,200);assert((await xml.text()).includes('<'))
   await mutate('cancelar_nota_servico',{dados:{registro_id:id,codigo_motivo:'9',motivo:reason}})
   assert.equal((await call('obter_nota_servico',{nota_id:id})).data.record.status,'cancelada');assert.equal((await erpRead(()=>getServiceInvoicePdf(company,id,pdf.version,2))).hash,pdf.hash)
  }
 })
 await check('Configurações, menções e recursos HTML',async()=>{
  const read=await raw('ler_configuracoes',{});assert(!read.error&&!read.result.isError);successful.add('ler_configuracoes')
  const update=await raw('atualizar_configuracoes',{set:{empresa_preferida:String(company),por_pagina:30}});assert(!update.error&&!update.result.isError);assert.equal(update.result.structuredContent.values.por_pagina,30);successful.add('atualizar_configuracoes')
  await reject('atualizar_configuracoes',{set:{empresa_preferida:String(company+100000)}})
  const mention=await raw('search_mentions',{query:company+': '});assert(!mention.error&&!mention.result.isError);successful.add('search_mentions')
  await call('abrir_painel');await call('meu_acesso')
  const resources=await rpc('resources/list');for(const resource of resources.result.resources){const result=await rpc('resources/read',{uri:resource.uri});assert(!result.error);assert(result.result.contents[0].text.includes('<html'))}
 })
 await check('Consultas restantes e protocolo moderno',async()=>{
  await call('resumo_erp',{},principal,true);await call('listar_vendas');await call('listar_compras');await call('listar_notas_servico');await call('consultar_financeiro',{tipo:'pagar'});await call('consultar_financeiro',{tipo:'receber'})
  await call('consultar_estoque');await call('analisar_periodo',{tipo:'vendas',inicio:'2026-09-01',fim:today});await call('consultar_relatorio',{tipo:'dre-caixa',inicio:'2026-09-01',fim:today})
  const parts=(await call('consultar_financeiro',{tipo:'pagar'})).data.records;assert(parts[0]);await call('listar_anexos',{documento:'conta_pagar',registro_id:Number(parts[0].conta_id)})
 })
 await check('Anexos: sete tipos de documento e configuração do storage',async()=>{
  const targets=[['conta_pagar','contas_pagar'],['conta_receber','contas_receber'],['pagamento','pagamentos'],['venda','vendas'],['compra','compras'],['contrato','contratos_vendas'],['ordem_servico','ordens_servico']]
  const results=[]
  for(const [documento,table] of targets){
   const target=(await sql(`SELECT id FROM erp.${table} WHERE empresa_id=$1 AND excluido_em IS NULL ORDER BY id LIMIT 1`,[company]))[0];assert(target)
   const data=(await call('listar_anexos',{documento,registro_id:Number(target.id)})).data;assert(Array.isArray(data.records))
   results.push({documento,attachments:data.records.length,downloadLinks:data.records.filter((r:{link_download?:string})=>r.link_download).length})
  }
  report.coverage.attachments={results,storageConfigured:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY),actualStorageDownloadTested:false}
 })
 const reportTypes=tools.find(t=>t.name==='consultar_relatorio')!.schema.shape.tipo.options as string[]
 for(const type of reportTypes)await check('Relatório: '+type,async()=>{
  const result=(await call('consultar_relatorio',{tipo:type,inicio:'2026-07-01',fim:'2026-12-31',por_pagina:50})).data
  assert.equal(result.report,type);assert(Array.isArray(result.records));assert.equal(result.from,'2026-07-01');assert.equal(result.to,'2026-12-31')
  if(type.startsWith('margem-'))for(const row of result.records){if(row.receita_liquida!==undefined&&row.custo!==undefined&&row.margem!==undefined)assert(Math.abs(Number(row.receita_liquida)-Number(row.custo)-Number(row.margem))<0.02)}
 })
 await check('Links fiscais: expiração e adulteração recusadas',async()=>{
  const issued=createServiceInvoiceLinkToken({empresa:company,usuario:user,nota:123,tipo:'pdf'},Date.now()-3600000)
  assert.throws(()=>verifyServiceInvoiceLinkToken(issued.token))
  const expired=await downloadInvoice(new Request(settings.resource),{params:Promise.resolve({token:issued.token})});assert.equal(expired.status,404)
  const valid=createServiceInvoiceLinkToken({empresa:company,usuario:user,nota:123,tipo:'pdf'})
  assert.throws(()=>verifyServiceInvoiceLinkToken(valid.token+'.extra'))
  const tampered=await downloadInvoice(new Request(settings.resource),{params:Promise.resolve({token:valid.token+'.extra'})});assert.equal(tampered.status,404)
 })
 const catalog=report.coverage.catalog as string[],missing=catalog.filter(name=>!successful.has(name))
 report.coverage={...report.coverage,called:[...called].sort(),successful:[...successful].sort(),missingSuccessful:missing,calls:seq,actionVariants:actionTools.reduce((n,t)=>n+t.kinds.length,0)}
 await db.query('RESET ROLE');await db.query('ROLLBACK');outer=false;report.rolledBack=true
 assert.equal(await fingerprint(),before);report.originalRowsUnchanged=true
 report.status=checks.some(c=>c.status==='failed')||(!selectedCase&&missing.length)?'failed':'passed'
}catch(error){report.status='failed';checks.push({name:'Harness',status:'failed',error:error instanceof Error?error.message:String(error)})}
finally{
 report.coverage.fiscalStorage=fiscalStorageFixture.report();fiscalStorageFixture.restore()
 active=false;pg.Pool.prototype.connect=originalConnect;pg.Pool.prototype.query=originalQuery
 if(outer){await db.query('ROLLBACK').catch(()=>{});outer=false;report.rolledBack=true}
 if(before)report.originalRowsUnchanged=await fingerprint().then(hash=>hash===before).catch(()=>false)
 await Promise.allSettled([db.end(),closePool(),closePluginDatabase()])
 mkdirSync('.cache/all-tools',{recursive:true});writeFileSync('.cache/all-tools/'+(selectedCase?'selected-report.json':'report.json'),JSON.stringify({...report,selectedCase:selectedCase||null},null,2))
 console.log(JSON.stringify({status:report.status,passed:checks.filter(c=>c.status==='passed').length,failed:checks.filter(c=>c.status==='failed').length,coverage:report.coverage,rolledBack:report.rolledBack,originalRowsUnchanged:report.originalRowsUnchanged}))
 if(report.status!=='passed')process.exitCode=1
}}
void main()
