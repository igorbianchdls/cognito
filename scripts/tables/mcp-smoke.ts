import assert from 'node:assert/strict'
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs'
import { randomUUID,createHash } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { executeTool,executionDependencies,type ExecutionDependencies } from '../../src/products/mcpcore/application/executeTool'
import { tablesTools } from '../../src/products/mcpcore/domains/tables/tools/catalog'
import { readSchemas } from '../../src/products/mcpcore/domains/tables/schemas/catalog'
import type { PluginPrincipal } from '../../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../../src/products/mcpcore/shared/config'
import type { Database } from '../../src/products/tables/server/database'
import { createPluginServer } from '../../src/products/chatgptplugin/mcp/createServer'
import { createClaudeServer } from '../../src/products/claudeplugin/mcp/createServer'
import { mcpUpload } from '../../src/products/tables/server/mcpUploads'
import type { AuthTenantContext } from '../../src/products/auth/shared/authContracts'
import { handlePluginRequest } from '../../src/products/chatgptplugin/mcp/handleRequest'
import { handleClaudeRequest } from '../../src/products/claudeplugin/mcp/handleRequest'

const db=new PGlite(), checks:string[]=[]
const called=new Set<string>(), objects=new Map<string,Buffer>(),originalFetch=globalThis.fetch
const envKeys=['SUPABASE_DB_URL','TABLES_SUPABASE_SERVICE_ROLE_KEY','TABLES_SUPABASE_URL'] as const,previousEnv=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]))
process.env.SUPABASE_DB_URL='postgresql://postgres.abcdefghijklmnopqrst:fixture@localhost/postgres'
process.env.TABLES_SUPABASE_SERVICE_ROLE_KEY='fixture'
delete process.env.TABLES_SUPABASE_URL
globalThis.fetch=async(url,init={})=>{
 const parsed=new URL(String(url));assert.equal(parsed.origin,'https://abcdefghijklmnopqrst.supabase.co');const path=parsed.pathname.replace('/storage/v1/','')
 if(path.startsWith('object/upload/sign/')){const key=path.slice('object/upload/sign/'.length);if(init.method==='POST')return Response.json({url:'/object/upload/sign/'+key+'?token=fixture'});objects.set(key,Buffer.from(init.body as Uint8Array));return Response.json({})}
 if(path.startsWith('object/authenticated/')){const bytes=objects.get(path.slice('object/authenticated/'.length));return new Response(null,{status:bytes?200:404,headers:bytes?{'content-length':String(bytes.length)}:{}})}
 if(path.startsWith('object/sign/')){const key=path.slice('object/sign/'.length);if(init.method==='POST')return Response.json({signedURL:'/object/sign/'+key+'?token=fixture'});const bytes=parsed.searchParams.has('token')&&objects.get(key);return new Response(bytes?new Uint8Array(bytes):null,{status:bytes?200:403})}
 throw Error('Unexpected isolated Storage request')
}
const principal:PluginPrincipal={userId:1,clerkUserId:'user_owner',clientId:'test-client',scopes:['erp:read','erp:write'],companies:[{id:1,name:'Equipe',profile:'administrador',capabilities:[]}]}
const config:PluginConfig={integration:'chatgpt',resource:'https://example.invalid/api/mcp',metadataUrl:'https://example.invalid/.well-known/oauth-protected-resource/api/mcp',issuer:'https://fixture.clerk.accounts.dev',scope:'erp:read',clientIds:['test-client'],origins:[],toolTimeoutMs:30000,requestsPerMinute:60}
const deps:ExecutionDependencies={...executionDependencies,reserve:async()=>randomUUID(),finish:async()=>undefined,tables:{transaction:async fn=>{await db.exec('BEGIN');try{const result=await fn(db as unknown as Database);await db.exec('COMMIT');return result}catch(e){await db.exec('ROLLBACK');throw e}}}}
async function call(name:string,args:object={},actor=principal,settings=config) {called.add('tables_'+name);const result=await executeTool(actor,'tables_'+name,{empresa_id:1,...args},settings,deps);const payload=JSON.parse((result.content[0] as {text:string}).text);return {...payload,isError:result.isError}}
async function ok(name:string,args:object={}){const r=await call(name,args);assert(!r.isError,JSON.stringify(r));return r.data}
async function change(name:string,data:object,key=randomUUID()){const preview=await ok(name,{chave_operacao:key,dados:data});assert(preview.confirmar);const result=await ok(name,{rascunho_id:preview.rascunho_id});assert.equal(result.status,'saved');return {preview,result,key}}
async function check(name:string,fn:()=>Promise<void>){await fn();checks.push(name);console.log('Passed: '+name)}
let base:string,table:string,record:string,statusField:string,peopleField:string
async function main(){try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA shared;CREATE SCHEMA plugin;
 CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');
 CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,full_name text,email text,status text DEFAULT 'active',clerk_user_id text);
 CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
 INSERT INTO shared.empresas(id) VALUES(1),(2);INSERT INTO shared.usuarios(id,full_name,email,clerk_user_id) VALUES(1,'Ana','ana@example.invalid','user_owner'),(2,'Leitor','leitor@example.invalid','user_viewer'),(3,'Bruno','bruno@example.invalid','user_member');
 INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role) VALUES(1,1,'owner'),(1,2,'viewer'),(1,3,'member');
 CREATE TABLE plugin.drafts(id uuid PRIMARY KEY,empresa_id bigint,user_id bigint,oauth_client_id text,operation_key uuid,proposal jsonb,status text DEFAULT 'pending',record_id text,created_at timestamptz DEFAULT now(),expires_at timestamptz DEFAULT now()+interval '24 hours',decided_at timestamptz,target_snapshot jsonb,integration text,
 CONSTRAINT drafts_integration_operation_key UNIQUE(integration,empresa_id,user_id,oauth_client_id,operation_key),CONSTRAINT legacy_result CHECK((status='saved')=(record_id IS NOT NULL)));
 CREATE TABLE plugin.executions(id uuid PRIMARY KEY,user_id bigint,empresa_id bigint,oauth_client_id text,tool_name text,status text,duration_ms int,finished_at timestamptz,integration text);`)
 for(const file of ['20261016120000_create_tables.sql','20261016193000_mcp_product_domains.sql','20261016200000_mcp_domain_uniqueness.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'))
 await check('31 unique tools and two host registrations',async()=>{
  assert.equal(tablesTools.length,31);assert.equal(new Set(tablesTools.map(t=>t.name)).size,31);assert.equal(Object.keys(readSchemas).length,10)
  for(const make of [createPluginServer,createClaudeServer]){const server=await make(principal,config,deps);const registry=(server as unknown as {_registeredTools:Record<string,unknown>})._registeredTools;assert.equal(Object.keys(registry).filter(n=>n.startsWith('tables_')).length,31);await server.close()}
 })
 await check('Preview writes nothing and confirmation is idempotent',async()=>{
  const key=randomUUID(),p=await ok('criar_base',{chave_operacao:key,dados:{nome:'Projetos MCP',modelo:'projetos'}})
  assert.equal((await db.query<{n:number}>('SELECT count(*)::int n FROM tables.bases')).rows[0].n,0)
  const r=await ok('criar_base',{rascunho_id:p.rascunho_id});base=r.resultado.base.id;table=r.resultado.tabela.id
  assert.deepEqual((await ok('criar_base',{rascunho_id:p.rascunho_id})).resultado,r.resultado)
  assert.equal((await ok('obter_operacao',{chave_operacao:key})).status,'saved')
  assert.equal((await call('criar_base',{chave_operacao:key,dados:{nome:'Outro'}})).code,'IDEMPOTENCY_CONFLICT')
 })
 await check('Scope, real membership role and domain isolation',async()=>{
  assert.equal((await call('criar_base',{chave_operacao:randomUUID(),dados:{nome:'Negado'}},{...principal,scopes:['erp:read']})).code,'INSUFFICIENT_SCOPE')
  const viewer={...principal,userId:2,clerkUserId:'user_viewer'}
  assert.equal((await call('criar_base',{chave_operacao:randomUUID(),dados:{nome:'Negado'}},viewer)).code,'ACCESS_DENIED')
  assert(!(await call('listar_bases',{},viewer)).isError)
  const id=randomUUID();await db.query("INSERT INTO plugin.drafts(id,empresa_id,user_id,oauth_client_id,operation_key,proposal,integration) VALUES($1,1,1,'test-client',$2,'{}','chatgpt')",[id,randomUUID()])
  assert.equal((await call('obter_operacao',{operacao_id:id})).code,'NOT_FOUND')
 })
 await check('Read metadata, create record and filter exact sums',async()=>{
  const fields=(await ok('obter_tabela',{tabela_id:table,tamanho:10})).itens;statusField=fields.find((f:{nome:string})=>f.nome==='Status').id
  const name=fields.find((f:{tipo:string})=>f.tipo==='texto').id,money=fields.find((f:{tipo:string})=>f.tipo==='moeda').id
  const created=await change('criar_registro',{tabela_id:table,valores:{[name]:'Portal',[money]:'1000.15'}});record=created.result.resultado.registros[0].id
  const rows=await ok('consultar_registros',{tabela_id:table,filtros:[{campo:name,operador:'contains',valor:'Portal'}]});assert.equal(rows.total,1);assert.equal(rows.somas[money],'1000.15')
 })
 await check('Partial field and view rename preserve configuration',async()=>{
  const before=await ok('obter_tabela',{tabela_id:table,campo_id:statusField});const options=before.itens[0].opcoes
  await change('editar_campo',{tabela_id:table,campo_id:statusField,alteracoes:{nome:'Etapa'}})
  assert.deepEqual((await ok('obter_tabela',{tabela_id:table,campo_id:statusField})).itens[0].opcoes,options)
  const views=await ok('obter_tabela',{tabela_id:table,secao:'visualizacoes'}),kanban=views.itens.find((v:{tipo:string})=>v.tipo==='kanban')
  const old=await ok('obter_tabela',{tabela_id:table,secao:'visualizacoes',visualizacao_id:kanban.id})
  await change('editar_visualizacao',{tabela_id:table,visualizacao_id:kanban.id,alteracoes:{nome:'Painel'}})
  const next=await ok('obter_tabela',{tabela_id:table,secao:'visualizacoes',visualizacao_id:kanban.id});assert.deepEqual(next.itens[0].configuracao,old.itens[0].configuracao)
 })
 await check('Multiple relation add/remove preserve previous people',async()=>{
  const field=await change('criar_campo',{tabela_id:table,campo:{nome:'Equipe',tipo:'usuarios'}});peopleField=field.result.resultado.campo.id
  await change('editar_registro',{tabela_id:table,registro_id:record,relacoes:[{campo_id:peopleField,modo:'definir',valores:['1']}]})
  await change('editar_registro',{tabela_id:table,registro_id:record,relacoes:[{campo_id:peopleField,modo:'adicionar',valores:['3']}]})
  assert.deepEqual((await ok('obter_registro',{registro_id:record})).registro.valores[peopleField],['1','3'])
 })
 await check('Batch rollback, duplicate IDs and stale previews',async()=>{
  const count=(await ok('consultar_registros',{tabela_id:table})).total
  const bad=await call('criar_registros_em_lote',{chave_operacao:randomUUID(),dados:{tabela_id:table,registros:[{valores:{}},{valores:{[randomUUID()]:'Inválido'}}]}});assert(bad.isError);assert.equal((await ok('consultar_registros',{tabela_id:table})).total,count)
  const created=await change('criar_registros_em_lote',{tabela_id:table,registros:[{valores:{}},{valores:{}}]});assert.equal(created.result.resultado.quantidade,2)
  const p=await ok('editar_registro',{chave_operacao:randomUUID(),dados:{tabela_id:table,registro_id:record,valores:{}}})
  await change('editar_registro',{tabela_id:table,registro_id:record,valores:{}})
  assert.equal((await call('editar_registro',{rascunho_id:p.rascunho_id})).code,'STALE_PROPOSAL')
 })
 await check('Paginated comments/history, cancellation and cross-host binding',async()=>{
  await change('adicionar_comentario',{registro_id:record,texto:'Revisado'});assert.equal((await ok('listar_comentarios',{registro_id:record,tamanho:1})).itens[0].texto,'Revisado')
  const h=await ok('consultar_historico',{registro_id:record,tamanho:1});assert(h.tem_mais)
  const p=await ok('editar_base',{chave_operacao:randomUUID(),dados:{base_id:base,alteracoes:{nome:'Novo nome'}}})
  assert.equal((await call('obter_operacao',{operacao_id:p.rascunho_id},principal,{...config,integration:'claude'})).code,'NOT_FOUND')
  assert.equal((await ok('cancelar_operacao',{operacao_id:p.rascunho_id})).status,'cancelled')
  assert.equal((await call('editar_base',{rascunho_id:p.rascunho_id})).code,'INVALID_STATE')
 })
 await check('Soft delete and field restore preserve record values',async()=>{
  await change('mover_para_lixeira',{tipo:'campos',item_id:peopleField});assert((await ok('listar_lixeira')).itens.some((i:{id:string})=>i.id===peopleField))
  await change('restaurar_item',{tipo:'campos',item_id:peopleField});assert.deepEqual((await ok('obter_registro',{registro_id:record})).registro.valores[peopleField],['1','3'])
 })
 await check('Tables, views, batch editing and reversible record deletion',async()=>{
  assert.equal((await ok('obter_base',{base_id:base})).base.id,base)
  const other=await change('criar_tabela',{base_id:base,nome:'Outra tabela'}),otherId=other.result.resultado.tabela.id
  await change('editar_tabela',{tabela_id:otherId,nome:'Tabela renomeada'})
  await change('editar_base',{base_id:base,alteracoes:{descricao:'Equipe MCP'}})
  const view=await change('criar_visualizacao',{tabela_id:table,visualizacao:{nome:'Grade extra',tipo:'grade',configuracao:{}}})
  await change('excluir_visualizacao',{tabela_id:table,visualizacao_id:view.result.resultado.visualizacao.id})
  const batch=await change('criar_registros_em_lote',{tabela_id:table,registros:[{valores:{}},{valores:{}}]}),ids=batch.result.resultado.registros.map((r:{id:string})=>r.id)
  await change('editar_registros_em_lote',{tabela_id:table,registros:ids.map((registro_id:string)=>({registro_id,valores:{}}))})
  await change('mover_registros_para_lixeira',{tabela_id:table,registros:ids.map((registro_id:string)=>({registro_id}))})
  await change('restaurar_item',{tipo:'registros',item_id:ids[0]})
 })
 await check('Upload form transfers bytes and confirms both tool and browser paths',async()=>{
  const field=await change('criar_campo',{tabela_id:table,campo:{nome:'Arquivos',tipo:'anexo'}})
  const prepared=await change('preparar_upload',{registro_id:record,campo_id:field.result.resultado.campo.id})
  assert.equal(prepared.result.resultado.status,'aguardando_envio');assert(prepared.result.resultado.upload_form_url)
  const actor={tenantId:1,sharedUserId:1,clerkUserId:'user_owner',role:'owner'} as AuthTenantContext
  const bytes=Buffer.from('Arquivo de teste MCP.\n'),meta={acao:'iniciar',nome:'teste.txt',mime_type:'text/plain',tamanho:bytes.length}
  const opened=await mcpUpload(actor,prepared.result.operacao_id,undefined,deps.tables!.transaction);assert.equal(opened.status,'aguardando_envio')
  const upload=await mcpUpload(actor,prepared.result.operacao_id,meta,deps.tables!.transaction);assert(upload.upload_url)
  const again=await mcpUpload(actor,prepared.result.operacao_id,meta,deps.tables!.transaction);assert.equal(again.anexo_id,upload.anexo_id)
  const failed=await call('confirmar_upload',{chave_operacao:randomUUID(),dados:{anexo_id:upload.anexo_id}});assert(!failed.isError)
  assert((await call('confirmar_upload',{rascunho_id:failed.data.rascunho_id})).isError,'A URL sem bytes enviados não confirma o arquivo')
  await fetch(upload.upload_url,{method:'PUT',body:bytes})
  await change('confirmar_upload',{anexo_id:upload.anexo_id})
  assert.equal((await mcpUpload(actor,prepared.result.operacao_id,{acao:'confirmar'},deps.tables!.transaction)).status,'confirmado')
  assert.equal((await ok('obter_operacao',{operacao_id:prepared.result.operacao_id})).resultado.status,'confirmado')
  const link=await ok('obter_link_anexo',{anexo_id:upload.anexo_id});assert.deepEqual(Buffer.from(await (await fetch(link.url)).arrayBuffer()),bytes)
  await change('remover_anexo',{anexo_id:upload.anexo_id})
  await assert.rejects(mcpUpload({...actor,sharedUserId:2,clerkUserId:'user_viewer'} as AuthTenantContext,prepared.result.operacao_id,undefined,deps.tables!.transaction))
 })
 await check('Actual HTTP handlers expose and execute Tables in both protocols',async()=>{
  for(const [integration,handler] of [['chatgpt',handlePluginRequest],['claude',handleClaudeRequest]] as const){
   const settings={...config,integration,resource:'https://example.invalid'+(integration==='claude'?'/api/claude/mcp':'/api/mcp')}
   const response=await handler(new Request(settings.resource,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream',authorization:'Bearer isolated'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'tables_listar_bases',arguments:{empresa_id:1}}})}),{config:()=>settings,resolve:async()=>principal,limit:async()=>undefined,execution:deps})
   assert.equal(response.status,200);const body=await response.json();assert.equal(body.result.structuredContent.ok,true,JSON.stringify(body));assert(body.result.structuredContent.data.itens.some((b:{id:string})=>b.id===base))
  }
 })
 assert.deepEqual([...called].sort(),tablesTools.map(t=>t.name).sort(),'Every proposed tool must have an executed case')
 const report={status:'passed',checks,toolsExercised:[...called].sort(),migrationDigests:Object.fromEntries(['20261016193000_mcp_product_domains.sql','20261016200000_mcp_domain_uniqueness.sql'].map(f=>[f,createHash('sha256').update(readFileSync('supabase/migrations/'+f)).digest('hex')])),productionWrites:false}
 mkdirSync('.cache/tables-mcp',{recursive:true});writeFileSync('.cache/tables-mcp/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify({status:'passed',checks:checks.length,tools:tablesTools.length}))
} finally {globalThis.fetch=originalFetch;for(const key of envKeys){if(previousEnv[key]===undefined)delete process.env[key];else process.env[key]=previousEnv[key]}await db.close()}}
main().catch(error=>{console.error(error);process.exitCode=1})
