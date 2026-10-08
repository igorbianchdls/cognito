import {applySharedMigration} from '../shared/schema-contract.mjs'
import {applyRecentMigrations} from './phase0-migrations.mjs'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { AsyncLocalStorage } from 'node:async_hooks'
import vm from 'node:vm'
import ts from 'typescript'
import { db, restoreCatalog } from './evolution-fixture.mjs'

// No .env reads, remote clients, or real identities. Only the pool transport and
// external identity resolver are substituted. The ERP's pool wrapper runs unchanged.
const root=resolve('.'), require=createRequire(import.meta.url), modules=new Map(), identity=new AsyncLocalStorage()
const results=[], logs=[], originalInfo=console.info, originalError=console.error
let tail=Promise.resolve(), server, base, postgres
const originalUrl=process.env.SUPABASE_DB_URL, originalCron=process.env.CRON_SECRET
process.env.SUPABASE_DB_URL='postgresql://local:local@127.0.0.1:5432/fictitious_only'
delete process.env.CRON_SECRET
class LocalPool {
  constructor(config) { assert.equal(new URL(config.connectionString).hostname,'127.0.0.1') }
  async connect() {
    const previous=tail; let unlock, released=false
    tail=new Promise(resolve=>{unlock=resolve}); await previous
    return { async query(sql,params) { return db.query(sql,params) }, release() { if(!released){released=true;unlock()} } }
  }
  async end() { await tail }
}
async function resolveIdentity() {
  const actor=identity.getStore()
  if(!actor) return null
  const [row]=await postgres.runQuery(`SELECT m.empresa_id,m.usuario_id,m.role,t.name,t.slug,u.email,u.clerk_user_id
    FROM shared.usuarios_empresas m JOIN shared.empresas t ON t.id=m.empresa_id
    JOIN shared.usuarios u ON u.id=m.usuario_id
    WHERE m.empresa_id=$1 AND m.usuario_id=$2 AND m.status='active' AND t.status='active'`,[actor.tenantId,actor.userId])
  if(!row) return null
  return {tenantId:Number(row.empresa_id),sharedUserId:Number(row.usuario_id),role:row.role,tenantName:row.name,tenantSlug:row.slug,email:row.email,clerkUserId:row.clerk_user_id,authMode:'clerk'}
}
function load(name,parent=resolve(root,'entry.ts')) {
  if(name==='pg') return {Pool:LocalPool}
  if(name==='@/products/auth/server/authTenantResolver') return {resolveAuthTenant:resolveIdentity}
  if(!name.startsWith('.')&&!name.startsWith('@/')&&!name.startsWith(root)) return require(name)
  let file=name.startsWith('@/')?resolve(root,'src',name.slice(2)):resolve(dirname(parent),name)
  if(!existsSync(file)) file=['.ts','.tsx','/index.ts'].map(suffix=>file+suffix).find(existsSync)
  assert(file,`Missing module: ${name}`)
  if(modules.has(file)) return modules.get(file).exports
  const record={exports:{}}; modules.set(file,record)
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(dependency=>load(dependency,file),record,record.exports)
  return record.exports
}
async function check(name,fn) { const evidence=await fn(); results.push({name,evidence:evidence??true}); originalInfo(`Passed: ${name}`) }
async function call(path,{method='GET',body,token='owner-a',headers={},raw,stream=false}={}) {
  const payload=raw??(body===undefined?undefined:JSON.stringify(body))
  const init={method,headers:{...(token?{'x-test-identity':token}:{}),...(payload===undefined?{}:{'content-type':'application/json'}),...headers}}
  if(stream){init.body=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(payload));controller.close()}});init.duplex='half'} else if(payload!==undefined)init.body=payload
  const response=await fetch(base+path,init), text=await response.text()
  const data=response.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text
  assert.equal(response.headers.get('cache-control'),'no-store')
  assert.match(response.headers.get('x-correlation-id'),/^[a-f0-9-]{36}$/)
  if(data?.error?.correlationId) assert.equal(data.error.correlationId,response.headers.get('x-correlation-id'))
  return {status:response.status,data,headers:response.headers}
}
const financialValues=side=>({[side==='pagar'?'fornecedor_id':'cliente_id']:101,descricao:'Materiais de teste',numero_documento:'LOCAL-001',observacoes:'Observação inicial',valor_total:120,data_competencia:'2026-10-05',data_emissao:'2026-10-05',categoria_id:side==='pagar'?101:102,conta_financeira_id:101,parcelas:[{data_vencimento:'2026-10-15',valor:60},{data_vencimento:'2026-11-15',valor:60}]})
async function createTitle(side,key,values=financialValues(side)) { const result=await call('/api/erp/titulos/'+side,{method:'POST',body:{values},headers:{'Idempotency-Key':key}});assert.equal(result.status,201,JSON.stringify(result.data));return result }
try {
  console.info=(...args)=>logs.push(args.join(' ')); console.error=(...args)=>logs.push(args.join(' '))
  await restoreCatalog()
  for(const file of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql']) await db.exec(readFileSync('scripts/erp/sql/'+file,'utf8'))
  for(const file of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql','20261003170000_harden_erp_read_access.sql','20261005020000_harden_erp_stock_operations.sql','20261005021000_anchor_contract_cycles.sql']) await db.exec(readFileSync('supabase/migrations/'+file,'utf8'))
  await applySharedMigration(db)
  // Simulação de NFS-e (já aplicada em produção antes das migrações recentes).
  for(const file of ['20261006010000_prepare_erp_fiscal_integration.sql','20261006020000_service_invoice_simulation.sql']) await db.exec(readFileSync('supabase/migrations/'+file,'utf8'))
  await applyRecentMigrations(db)
  await db.exec(`BEGIN;
    INSERT INTO shared.perfis_acesso(id,nome) VALUES('api-reader','API Reader');
    INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) VALUES('api-reader','erp.cadastros.visualizar'),('api-reader','erp.financeiro.visualizar');
    INSERT INTO shared.empresas(id,name,slug) VALUES(1,'Empresa fictícia A','api-a'),(2,'Empresa fictícia B','api-b');
    INSERT INTO shared.usuarios(id,email,full_name,clerk_user_id) VALUES(1,'owner@example.invalid','Owner','local_owner'),(2,'reader@example.invalid','Reader','local_reader');
    INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status,perfil_acesso_id) VALUES(1,1,'owner','active','api-reader'),(2,1,'owner','active','api-reader'),(1,2,'viewer','active','api-reader');
    INSERT INTO erp.entidades(id,empresa_id,nome,eh_cliente,eh_fornecedor) VALUES(101,1,'Parceiro A',true,true),(201,2,'Parceiro B',true,true);
    INSERT INTO erp.categorias(id,empresa_id,nome,tipo) VALUES(101,1,'Despesa A','despesa'),(102,1,'Receita A','receita'),(201,2,'Despesa B','despesa');
    INSERT INTO erp.contas_financeiras(id,empresa_id,nome,tipo,saldo_inicial) VALUES(101,1,'Conta A','banco',0),(201,2,'Conta B','banco',0);
    INSERT INTO erp.produtos(id,empresa_id,nome,sku,preco_venda,controla_estoque,permite_estoque_negativo) VALUES(101,1,'Produto A','A',20,true,false),(201,2,'Produto B','B',20,true,false);
    INSERT INTO erp.locais_estoque(id,empresa_id,nome,codigo,padrao) VALUES(101,1,'Local A','A',true),(201,2,'Local B','B',true);
    INSERT INTO erp.saldos_estoque(empresa_id,produto_id,local_estoque_id,quantidade_fisica) VALUES(1,101,101,10),(2,201,201,10);
    INSERT INTO erp.movimentacoes_estoque(empresa_id,produto_id,local_estoque_id,tipo,origem_tipo,quantidade,custo_unitario,saldo_apos,custo_medio_apos,chave_idempotencia) VALUES(1,101,101,'entrada','manual',10,0,10,0,'local-opening-a'),(2,201,201,'entrada','manual',10,0,10,0,'local-opening-b');
    COMMIT;`)
  // Explicit fixture IDs must never cause a later sequence collision.
  for(const row of (await db.query(`SELECT table_schema,table_name,column_name FROM information_schema.columns WHERE table_schema IN ('erp','shared') AND (is_identity='YES' OR column_default LIKE 'nextval%')`)).rows) {
    const table=row.table_schema+'.'+row.table_name, column=row.column_name
    const [sequence]=(await db.query('SELECT pg_get_serial_sequence($1,$2) AS seq',[table,column])).rows
    if(sequence.seq) await db.query(`SELECT setval($1,GREATEST(1,(SELECT COALESCE(max(${column}),0) FROM ${table})),true)`,[sequence.seq])
  }
  postgres=load('@/lib/postgres')
  const routes=load('@/products/erp/api/routeCatalog').ERP_API_ROUTES.map(route=>({...route,module:load(resolve(root,route.route)),segments:route.path.split('/').filter(Boolean)}))
    .sort((a,b)=>b.segments.length-a.segments.length || a.segments.filter(part=>part.startsWith('[')).length-b.segments.filter(part=>part.startsWith('[')).length)
  const actors={'owner-a':{tenantId:1,userId:1},'owner-b':{tenantId:2,userId:1},reader:{tenantId:1,userId:2},seller:{tenantId:1,userId:3}}
  server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,base),parts=url.pathname.split('/').filter(Boolean),route=routes.find(route=>route.segments.length===parts.length&&route.segments.every((segment,index)=>segment.startsWith('[')||segment===parts[index]))
      if(!route||!route.module[req.method]){res.writeHead(404);res.end();return}
      const params=Object.fromEntries(route.segments.flatMap((segment,index)=>segment.startsWith('[')?[[segment.slice(1,-1),decodeURIComponent(parts[index])]]:[]))
      const chunks=[];for await(const chunk of req)chunks.push(chunk)
      const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})})
      const response=await identity.run(actors[req.headers['x-test-identity']],()=>route.module[req.method](request,{params:Object.keys(params).length?Promise.resolve(params):undefined}))
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))
    }catch(error){originalError(error);res.writeHead(500);res.end(JSON.stringify({unexpected:error.message}))}
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port
  await check('All session routes reject unauthenticated HTTP requests',async()=>{
    let checked=0
    for(const route of routes.filter(route=>route.authentication==='session'))for(const method of route.methods){const result=await call(route.path.replace(/\[[^\]]+\]/g,'1'),{method,token:null});assert.equal(result.status,401);checked++}
    return {methods:checked}
  })
  await check('Read permission does not authorize creating records',async()=>{assert.equal((await call('/api/erp/clientes',{method:'POST',token:'reader',body:{values:{nome:'Denied'}}})).status,403)})
  await check('Transport rejects invalid IDs, pagination and date ranges',async()=>{
    for(const path of ['/api/erp/clientes/0','/api/erp/clientes/9007199254740992','/api/erp/clientes?page=NaN','/api/erp/clientes?pageSize=101','/api/erp/clientes?query='+('x'.repeat(501)),'/api/erp/relatorios/posicao-financeira?from=2026-02-30','/api/erp/clientes?filter.inicio=2026-10-06&filter.fim=2026-10-05']) assert.equal((await call(path)).status,422,path)
  })
  await check('Invalid JSON and content type return canonical errors',async()=>{
    assert.equal((await call('/api/erp/clientes',{method:'POST',raw:'{'})).status,400)
    assert.equal((await call('/api/erp/clientes',{method:'POST',raw:'{}',headers:{'Content-Type':'text/plain'}})).status,415)
    assert.equal((await call('/api/erp/clientes',{method:'POST',body:{values:{nome:'Injection',empresa_id:2}}})).status,422)
  })
  await check('Streamed body without declared length is bounded before execution',async()=>{
    const before=(await db.query('SELECT count(*)::int AS n FROM erp.entidades')).rows[0].n
    const result=await call('/api/erp/clientes',{method:'POST',raw:JSON.stringify({values:{nome:'Oversized',observacoes:'x'.repeat(1048576)}}),stream:true})
    assert.equal(result.status,413);assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.entidades')).rows[0].n,before)
  })
  let customer
  await check('Registration create/read/list/update/deactivate preserves version history',async()=>{
    const create=await call('/api/erp/clientes',{method:'POST',body:{values:{nome:'Cliente de teste',email:'crud@example.invalid'}}});assert.equal(create.status,201,JSON.stringify(create.data));customer=create.data.record
    const get=await call('/api/erp/clientes/'+customer.id);assert.equal(get.status,200);assert.equal(get.data.record.nome,'Cliente de teste')
    const list=await call('/api/erp/clientes?query=Cliente%20de%20teste&pageSize=20');assert.equal(list.data.total,1)
    const edit=await call('/api/erp/clientes/'+customer.id,{method:'PATCH',body:{expectedVersion:Number(customer.versao),values:{nome:'Cliente atualizado',email:'crud@example.invalid'}}});assert.equal(edit.status,200,JSON.stringify(edit.data));customer=edit.data.record
    assert.equal((await call('/api/erp/clientes/'+customer.id,{method:'PATCH',body:{expectedVersion:1,values:{nome:'Old'}}})).status,409)
    const remove=await call('/api/erp/clientes/'+customer.id,{method:'DELETE',body:{expectedVersion:Number(customer.versao)}});assert.equal(remove.status,200);assert.equal(remove.data.record.status,'inativo')
    const events=(await db.query('SELECT evento FROM erp.cadastros_eventos WHERE empresa_id=1 AND entidade_id=$1 ORDER BY id',[customer.id])).rows;assert(events.length>=2)
    return {id:customer.id,events:events.map(row=>row.evento)}
  })
  await check('HTTP requests isolate company context even when simultaneous',async()=>{
    for(let i=0;i<4;i++){const [a,b]=await Promise.all([call('/api/erp/produtos'),call('/api/erp/produtos',{token:'owner-b'})]);assert.equal(a.data.records.length,1);assert.equal(b.data.records.length,1);assert.equal(a.data.records[0].nome,'Produto A');assert.equal(b.data.records[0].nome,'Produto B')}
    assert.equal((await call('/api/erp/clientes/201')).status,422)
    return {independentPostgresSessions:false,concurrentHttpRequests:true}
  })
  await check('Title creation requires a valid operation key and balanced schedule',async()=>{
    assert.equal((await call('/api/erp/titulos/pagar',{method:'POST',body:{values:financialValues('pagar')}})).status,422)
    assert.equal((await call('/api/erp/titulos/pagar',{method:'POST',body:{values:{...financialValues('pagar'),valor_total:121}},headers:{'Idempotency-Key':'local-invalid'}})).status,422)
  })
  for(const side of ['pagar','receber']){
    await check(`${side}: create, repeat, list, ETag, edit and logical delete`,async()=>{
      const key='local-crud-'+side,created=await createTitle(side,key),id=created.data.record.id,path='/api/erp/titulos/'+side+'/'+id
      const repeated=await call('/api/erp/titulos/'+side,{method:'POST',body:{values:financialValues(side)},headers:{'Idempotency-Key':key}});assert.equal(repeated.status,200);assert.equal(repeated.data.record.id,id);assert.equal(repeated.data.reused,true)
      assert.equal((await call('/api/erp/titulos/'+side,{method:'POST',body:{values:{...financialValues(side),descricao:'Different'}},headers:{'Idempotency-Key':key}})).status,409)
      const list=await call('/api/erp/titulos/'+side);assert.equal(list.status,200);assert.equal(list.data.total,2);assert(list.data.records.every(row=>String(row.conta_id)===id))
      const get=await call(path);assert.equal(get.status,200,JSON.stringify(get.data));const etag=get.headers.get('etag');assert.equal(etag,'"'+get.data.versao+'"')
      const values=financialValues(side);delete values.observacoes;delete values.numero_documento;delete values.conta_financeira_id;values.descricao='Título atualizado'
      assert.equal((await call(path,{method:'PATCH',body:{values}})).status,428)
      assert.equal((await call(path,{method:'PATCH',body:{values},headers:{'If-Match':'"'+('0'.repeat(64))+'"'}})).status,412)
      const edit=await call(path,{method:'PATCH',body:{values},headers:{'If-Match':etag}});assert.equal(edit.status,200,JSON.stringify(edit.data));assert.notEqual(edit.headers.get('etag'),etag);assert.equal(edit.data.record.observacoes,'Observação inicial');assert.equal(edit.data.record.numero_documento,'LOCAL-001');assert.equal(edit.data.record.conta_financeira_id,'101')
      assert.equal((await call(path,{method:'DELETE',body:{motivo:'Registro de teste'},headers:{'If-Match':etag}})).status,412)
      const cleared=await call(path,{method:'PATCH',body:{values:{...values,observacoes:null,numero_documento:null,conta_financeira_id:null}},headers:{'If-Match':edit.headers.get('etag')}});assert.equal(cleared.status,200,JSON.stringify(cleared.data));assert.equal(cleared.data.record.observacoes,null);assert.equal(cleared.data.record.conta_financeira_id,null)
      const removed=await call(path,{method:'DELETE',body:{motivo:'Registro fictício encerrado'},headers:{'If-Match':cleared.headers.get('etag')}});assert.equal(removed.status,200,JSON.stringify(removed.data));assert.equal(removed.data.deleted,true);assert.equal((await call(path)).status,404)
      assert.equal((await call('/api/erp/titulos/'+side,{method:'POST',body:{values:financialValues(side)},headers:{'Idempotency-Key':key}})).status,409)
      assert.equal((await db.query(`SELECT count(*)::int AS n FROM erp.contas_${side} WHERE empresa_id=1 AND id=$1 AND excluido_em IS NOT NULL`,[id])).rows[0].n,1)
      return {id,deletedLogically:true,repetitionPreserved:true}
    })
  }
  await check('Foreign financial references cannot create partial documents',async()=>{
    const count=async()=>(await db.query('SELECT count(*)::int AS n FROM erp.contas_pagar')).rows[0].n,before=await count()
    const result=await call('/api/erp/titulos/pagar',{method:'POST',body:{values:{...financialValues('pagar'),fornecedor_id:201}},headers:{'Idempotency-Key':'local-cross-tenant'}});assert.equal(result.status,409);assert.equal(await count(),before)
  })
  let paid
  await check('Payment uses parcel ID, repeats safely and prevents rewriting its title',async()=>{
    const title=await createTitle('pagar','local-payment-title');paid={id:title.data.record.id,part:title.data.installments[0].id}
    const body={values:{valor:30,conta_financeira_id:101,data_pagamento:'2026-10-05'}},headers={'Idempotency-Key':'local-payment'}
    const a=await call('/api/erp/contas-pagar-parcelas/'+paid.part+'/baixar',{method:'POST',body,headers});assert.equal(a.status,200,JSON.stringify(a.data))
    const b=await call('/api/erp/contas-pagar-parcelas/'+paid.part+'/baixar',{method:'POST',body,headers});assert.equal(b.status,200);assert.deepEqual(b.data,a.data)
    const get=await call('/api/erp/titulos/pagar/'+paid.id);assert.equal(get.data.history.length,1);assert.equal(Number(get.data.installments[0].valor_pago),30)
    const blocked=await call('/api/erp/titulos/pagar/'+paid.id,{method:'PATCH',body:{values:financialValues('pagar')},headers:{'If-Match':get.headers.get('etag')}});assert.equal(blocked.status,409)
    const reversal=await call('/api/erp/pagamentos/'+get.data.history[0].id+'/estornar',{method:'POST',body:{motivo:'Reversão de teste'},headers:{'Idempotency-Key':'local-reversal'}});assert.equal(reversal.status,200,JSON.stringify(reversal.data))
    const after=await call('/api/erp/titulos/pagar/'+paid.id);assert.equal(Number(after.data.installments[0].valor_pago),0)
    assert.equal((await call('/api/erp/titulos/pagar/'+paid.id,{method:'DELETE',body:{motivo:'Teste com histórico'},headers:{'If-Match':after.headers.get('etag')}})).status,409)
  })
  await check('Closed financial period rejects create without leaving title or installments',async()=>{
    const before=(await db.query('SELECT count(*)::int AS n FROM erp.contas_receber')).rows[0].n
    const closure=await call('/api/erp/fechamentos',{method:'POST',body:{modulo:'financeiro',periodo_inicio:'2026-10-01',periodo_fim:'2026-10-31',motivo:'Fechamento de teste'}})
    assert.equal(closure.status,200,JSON.stringify(closure.data))
    const result=await call('/api/erp/titulos/receber',{method:'POST',body:{values:financialValues('receber')},headers:{'Idempotency-Key':'local-closed'}});assert.equal(result.status,409,JSON.stringify(result.data));assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.contas_receber')).rows[0].n,before)
    assert.equal((await call('/api/erp/fechamentos',{method:'PATCH',body:{id:Number(closure.data.record.id)}})).status,422)
    const reopened=await call('/api/erp/fechamentos',{method:'PATCH',body:{id:Number(closure.data.record.id),motivo:'Retomar testes locais'}})
    assert.equal(reopened.status,200,JSON.stringify(reopened.data))
  })
  await check('Commercial HTTP CRUD and draft deletion enforce versions',async()=>{
    for(const type of ['vendas','compras']){
      const values={ [type==='vendas'?'cliente_id':'fornecedor_id']:101,numero:'LOCAL-CRUD-'+type,data_venda:'2026-10-05',data_compra:'2026-10-05',data_vencimento:'2026-10-15',categoria_id:type==='vendas'?102:101,conta_financeira_id:101,local_estoque_id:101,produto_id:101,descricao:'Item de teste',quantidade:1,valor_unitario:20,tipo_movimento:'cotacao',gera_financeiro:false }
      const created=await call('/api/erp/'+type,{method:'POST',body:{values},headers:{'Idempotency-Key':'local-commercial-'+type}});assert.equal(created.status,201,JSON.stringify(created.data));const id=created.data.record.id,path='/api/erp/'+type+'/'+id
      const detail=await call(path);assert.equal(detail.status,200);let record=detail.data[type==='vendas'?'sale':'purchase']
      const edited=await call(path,{method:'PATCH',body:{expectedVersion:Number(record.versao),values:{...values,observacoes:'Edição HTTP de teste'}}})
      assert.equal(edited.status,200,JSON.stringify(edited.data));record=edited.data[type==='vendas'?'sale':'purchase'];assert.equal(record.observacoes,'Edição HTTP de teste')
      assert.equal((await call(path,{method:'PATCH',body:{expectedVersion:1,values}})).status,409)
      assert.equal((await call(path,{method:'DELETE',body:{expectedVersion:1,motivo:'Versão antiga'}})).status,409)
      const removed=await call(path,{method:'DELETE',body:{expectedVersion:Number(record.versao),motivo:'Rascunho fictício'}});assert.equal(removed.status,200,JSON.stringify(removed.data));assert.equal(removed.data.deleted,true)
      assert.equal((await db.query(`SELECT count(*)::int AS n FROM erp.${type} WHERE empresa_id=1 AND id=$1 AND excluido_em IS NOT NULL`,[id])).rows[0].n,1)
      const confirmedDraft=await call('/api/erp/'+type,{method:'POST',body:{values:{...values,numero:'LOCAL-CONFIRM-'+type}},headers:{'Idempotency-Key':'local-confirm-'+type}})
      assert.equal(confirmedDraft.status,201,JSON.stringify(confirmedDraft.data))
      const confirmedPath='/api/erp/'+type+'/'+confirmedDraft.data.record.id
      const confirmedDetail=await call(confirmedPath),version=Number(confirmedDetail.data[type==='vendas'?'sale':'purchase'].versao)
      const confirmed=await call(confirmedPath+'/confirmar',{method:'POST',body:{values:{expectedVersion:version}}});assert.equal(confirmed.status,200,JSON.stringify(confirmed.data))
      const fresh=await call(confirmedPath),freshVersion=Number(fresh.data[type==='vendas'?'sale':'purchase'].versao)
      assert.equal((await call(confirmedPath,{method:'DELETE',body:{expectedVersion:freshVersion,motivo:'Não pode excluir confirmado'}})).status,409)
    }
  })
  await check('Audit failure rolls back financial header, installments and operation key',async()=>{
    const count=async()=>(await db.query('SELECT count(*)::int AS n FROM erp.contas_pagar')).rows[0].n,before=await count()
    await db.exec(`CREATE FUNCTION erp.local_api_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Local audit failure'; END $$;
      CREATE TRIGGER local_api_audit_failure BEFORE INSERT ON erp.contas_pagar_eventos FOR EACH ROW EXECUTE FUNCTION erp.local_api_audit_failure();`)
    try{
      const response=await call('/api/erp/titulos/pagar',{method:'POST',body:{values:financialValues('pagar')},headers:{'Idempotency-Key':'local-audit-rollback'}})
      assert.equal(response.status,500);assert.equal(await count(),before)
      assert.equal((await db.query("SELECT count(*)::int AS n FROM erp.contas_pagar WHERE empresa_id=1 AND chave_idempotencia='local-audit-rollback'")).rows[0].n,0)
    }finally{await db.exec('DROP TRIGGER local_api_audit_failure ON erp.contas_pagar_eventos; DROP FUNCTION erp.local_api_audit_failure();')}
    const retry=await createTitle('pagar','local-audit-rollback');assert.equal(retry.status,201)
  })
  await check('Stock HTTP creation shares idempotency and ledger rules',async()=>{
    const values={local_estoque_id:101,produto_id:101,tipo:'entrada',quantidade:2,custo_unitario:0},body={values},headers={'Idempotency-Key':'local-stock'}
    const a=await call('/api/erp/operacoes/movimentacoes',{method:'POST',body,headers});assert.equal(a.status,201,JSON.stringify(a.data))
    const b=await call('/api/erp/operacoes/movimentacoes',{method:'POST',body,headers});assert.equal(b.status,201);assert.equal(a.data.record.id,b.data.record.id)
    assert.equal(Number((await db.query('SELECT quantidade_fisica FROM erp.saldos_estoque WHERE empresa_id=1 AND produto_id=101')).rows[0].quantidade_fisica),12)
  })
  await check('Existing GET groups return compatible data envelopes',async()=>{
    const paths=['/api/erp/acesso','/api/erp/resumo','/api/erp/resumo/profissional','/api/erp/clientes','/api/erp/produtos','/api/erp/categorias','/api/erp/contas-financeiras','/api/erp/vendas','/api/erp/vendas/catalogos','/api/erp/compras','/api/erp/compras/catalogos','/api/erp/catalogos/busca?tipo=produto','/api/erp/catalogos/categorias','/api/erp/operacoes/movimentacoes','/api/erp/operacoes/catalogos?resource=movimentacoes&source=products','/api/erp/automacoes','/api/erp/conciliacao/concluidas','/api/erp/conciliacao/regras','/api/erp/conciliacao/sugestoes','/api/erp/recorrencias','/api/erp/pagamentos?tipo=pagar&conta_id='+paid.id,'/api/erp/fechamentos','/api/erp/estoque/contagem?local=101&produtos=101','/api/erp/notas-compra','/api/erp/ordens-servico','/api/erp/financeiro/adiantamentos','/api/erp/relatorios/posicao-financeira?from=2026-10-01&to=2026-10-31']
    for(const path of paths){const result=await call(path);assert.equal(result.status,200,path+': '+JSON.stringify(result.data));assert(result.data&&typeof result.data==='object')}
    return {endpoints:paths.length}
  })
  await check('Membership revocation is effective on the next HTTP request',async()=>{
    assert.equal((await call('/api/erp/clientes',{token:'reader'})).status,200)
    await db.exec("UPDATE shared.usuarios_empresas SET status='suspended' WHERE empresa_id=1 AND usuario_id=2")
    assert.equal((await call('/api/erp/clientes',{token:'reader'})).status,401)
  })
  await check('Cron requires its own secret and retired fiscal actions stay disabled',async()=>{
    assert.equal((await call('/api/erp/internal/automacoes',{token:null})).status,503)
    process.env.CRON_SECRET='local-test-secret'
    assert.equal((await call('/api/erp/internal/automacoes',{token:null})).status,401)
    assert.equal((await call('/api/erp/vendas/1/faturar',{method:'POST',token:null})).status,410)
  })
  await check('Fase 1: tabela de preço, transporte, crédito e comissões',async()=>{
    await db.exec(`INSERT INTO erp.entidades(id,empresa_id,nome,eh_vendedor,eh_fornecedor) VALUES(301,1,'Vendedora Ana',true,true);
      INSERT INTO erp.entidades(id,empresa_id,nome,eh_transportadora) VALUES(302,1,'Transportadora Rápida',true);
      INSERT INTO erp.entidades(id,empresa_id,nome,eh_cliente) VALUES(303,1,'Cliente com limite',true);`)
    // Tabela com duas faixas de quantidade, preço mínimo e desconto máximo.
    const table=await call('/api/erp/tabelas-preco',{method:'POST',body:{values:{nome:'Atacado',itens:[
      {tipo:'produto',item_id:101,preco:18,preco_minimo:16,desconto_maximo_percentual:10,quantidade_minima:1},
      {tipo:'produto',item_id:101,preco:15,preco_minimo:14,quantidade_minima:5}]}}})
    assert.equal(table.status,201,JSON.stringify(table.data));const tableId=Number(table.data.record.id);assert.equal(table.data.items.length,2)
    assert.equal((await call('/api/erp/tabelas-preco',{method:'POST',body:{values:{nome:'Outra',itens:[{tipo:'produto',item_id:201,preco:1}]}}})).status,422)
    // O leitor (vínculo revogado em um teste anterior ou sem permissão de cadastro) não grava.
    assert([401,403].includes((await call('/api/erp/tabelas-preco',{token:'reader',method:'POST',body:{values:{nome:'Sem permissão'}}})).status))
    // Condições comerciais do cliente pelo cadastro: limite de crédito e tabela de preço.
    const customerVersion=Number((await db.query('SELECT versao FROM erp.entidades WHERE id=303')).rows[0].versao)
    const terms=await call('/api/erp/clientes/303',{method:'PATCH',body:{expectedVersion:customerVersion,values:{nome:'Cliente com limite',status:'ativo',tipo:'PJ',limite_credito:100,tabela_preco_id:tableId}}})
    assert.equal(terms.status,200,JSON.stringify(terms.data))
    assert.deepEqual((await db.query('SELECT limite_credito::text,tabela_preco_id::text FROM erp.entidades WHERE id=303')).rows[0],{limite_credito:'100.00',tabela_preco_id:String(tableId)})
    // Regras: geral de 5% e específica da vendedora para o produto (10%, sobre o recebido).
    assert.equal((await call('/api/erp/comissoes/regras',{method:'POST',body:{values:{nome:'Geral',percentual:5}}})).status,201)
    const rule=await call('/api/erp/comissoes/regras',{method:'POST',body:{values:{nome:'Ana no produto A',vendedor_id:301,produto_id:101,percentual:10,base:'recebimento'}}})
    assert.equal(rule.status,201,JSON.stringify(rule.data))
    assert.equal((await call('/api/erp/comissoes/regras',{method:'POST',body:{values:{nome:'Dupla',produto_id:101,categoria_id:102,percentual:1}}})).status,422)
    // Venda sem preço: usa a faixa de 5+ unidades (15,00); transporte gravado.
    const saleValues={cliente_id:303,vendedor_id:301,data_venda:'2026-10-06',data_vencimento:'2026-10-20',categoria_id:102,conta_financeira_id:101,local_estoque_id:101,
      itens:[{tipo:'produto',item_id:101,quantidade:6}],transportadora_id:302,modalidade_frete:'destinatario',volumes:2,peso_bruto:12.5}
    const sale=await call('/api/erp/vendas',{method:'POST',body:{values:saleValues},headers:{'Idempotency-Key':'fase1-venda-1'}})
    assert.equal(sale.status,201,JSON.stringify(sale.data));const saleId=Number(sale.data.record.id)
    const saved=(await db.query(`SELECT v.total::text,v.tabela_preco_id::text,v.transportadora_id::text,v.modalidade_frete,v.volumes,v.numero,i.valor_unitario::text,i.preco_tabela::text
      FROM erp.vendas v JOIN erp.vendas_itens i ON i.empresa_id=v.empresa_id AND i.venda_id=v.id WHERE v.id=$1`,[saleId])).rows[0]
    assert.deepEqual({...saved,numero:undefined},{total:'90.00',tabela_preco_id:String(tableId),transportadora_id:'302',modalidade_frete:'destinatario',volumes:2,numero:undefined,valor_unitario:'15.0000',preco_tabela:'15.0000'})
    assert.match(saved.numero,/^VEN-2026-\d{4}$/)
    // Abaixo do mínimo e acima do desconto máximo da tabela.
    const below=await call('/api/erp/vendas',{method:'POST',body:{values:{...saleValues,itens:[{tipo:'produto',item_id:101,quantidade:1,valor_unitario:15}]}},headers:{'Idempotency-Key':'fase1-abaixo'}})
    assert.equal(below.status,422,JSON.stringify(below.data));assert.match(below.data.error.message,/mínimo/)
    const discount=await call('/api/erp/vendas',{method:'POST',body:{values:{...saleValues,itens:[{tipo:'produto',item_id:101,quantidade:1,valor_unitario:18,desconto:1.9}]}},headers:{'Idempotency-Key':'fase1-desconto'}})
    assert.equal(discount.status,422,JSON.stringify(discount.data));assert.match(discount.data.error.message,/desconto/)
    assert.equal((await call('/api/erp/vendas',{method:'POST',body:{values:{...saleValues,transportadora_id:303}},headers:{'Idempotency-Key':'fase1-transp'}})).status,422)
    // Confirmação dentro do limite gera a comissão da regra mais específica (10% de 90).
    const version=async id=>Number((await db.query('SELECT versao FROM erp.vendas WHERE id=$1',[id])).rows[0].versao)
    const confirmed=await call('/api/erp/vendas/'+saleId+'/confirmar',{method:'POST',body:{values:{expectedVersion:await version(saleId)}}})
    assert.equal(confirmed.status,200,JSON.stringify(confirmed.data))
    assert.deepEqual((await db.query('SELECT vendedor_id::text,base,valor_base::text,percentual::text,valor::text FROM erp.comissoes_lancamentos WHERE venda_id=$1',[saleId])).rows,
      [{vendedor_id:'301',base:'recebimento',valor_base:'90.00',percentual:'10.0000',valor:'9.00'}])
    // Segunda venda passa do limite (90 em aberto + 18): bloqueia; liberação com motivo pelo financeiro.
    const second=await call('/api/erp/vendas',{method:'POST',body:{values:{...saleValues,vendedor_id:null,itens:[{tipo:'produto',item_id:101,quantidade:1}]}},headers:{'Idempotency-Key':'fase1-venda-2'}})
    assert.equal(second.status,201,JSON.stringify(second.data));const secondId=Number(second.data.record.id)
    const blocked=await call('/api/erp/vendas/'+secondId+'/confirmar',{method:'POST',body:{values:{expectedVersion:await version(secondId)}}})
    assert.equal(blocked.status,409,JSON.stringify(blocked.data));assert.equal(blocked.data.error.code,'CREDIT_LIMIT_EXCEEDED');assert.equal(blocked.data.error.details.excedente,8)
    const released=await call('/api/erp/vendas/'+secondId+'/confirmar',{method:'POST',body:{values:{expectedVersion:await version(secondId),liberarCreditoMotivo:'Cliente antigo, pagamento garantido'}}})
    assert.equal(released.status,200,JSON.stringify(released.data))
    assert.equal((await db.query('SELECT credito_liberado_motivo FROM erp.vendas WHERE id=$1',[secondId])).rows[0].credito_liberado_motivo,'Cliente antigo, pagamento garantido')
    // Relatório: base recebimento sem recebimento ainda não libera; após receber metade, libera metade.
    const report=async()=>(await call('/api/erp/comissoes?inicio=2026-01-01&fim=2026-12-31&vendedor_id=301')).data
    assert.deepEqual((await report()).summary.map(r=>[r.valor,r.liberado,r.a_pagar].map(Number)),[[9,0,0]])
    const payBody={values:{vendedor_id:301,ate:'2026-12-31',categoria_id:101,data_vencimento:'2026-11-10'}}
    assert.equal((await call('/api/erp/comissoes/pagar',{method:'POST',body:payBody,headers:{'Idempotency-Key':'fase1-comissao-0'}})).status,422)
    const part=(await db.query('SELECT p.id FROM erp.contas_receber_parcelas p JOIN erp.contas_receber c ON c.empresa_id=p.empresa_id AND c.id=p.conta_receber_id WHERE c.venda_id=$1',[saleId])).rows[0].id
    const receipt=await call('/api/erp/contas-receber-parcelas/'+part+'/baixar',{method:'POST',body:{values:{valor:45,conta_financeira_id:101,data_pagamento:'2026-10-07'}},headers:{'Idempotency-Key':'fase1-recebimento'}})
    assert.equal(receipt.status,200,JSON.stringify(receipt.data))
    assert.deepEqual((await report()).summary.map(r=>[r.valor,r.liberado,r.a_pagar].map(Number)),[[9,4.5,4.5]])
    // Pagamento gera conta a pagar à vendedora e é idempotente.
    const paid=await call('/api/erp/comissoes/pagar',{method:'POST',body:payBody,headers:{'Idempotency-Key':'fase1-comissao-1'}})
    assert.equal(paid.status,201,JSON.stringify(paid.data));assert.equal(Number(paid.data.valor),4.5)
    const again=await call('/api/erp/comissoes/pagar',{method:'POST',body:payBody,headers:{'Idempotency-Key':'fase1-comissao-1'}});assert.equal(again.status,200)
    assert.deepEqual((await db.query('SELECT fornecedor_id::text,valor_total::text FROM erp.contas_pagar WHERE id=$1',[paid.data.conta_pagar_id])).rows[0],{fornecedor_id:'301',valor_total:'4.50'})
    assert.deepEqual((await report()).summary.map(r=>[r.liberado,r.pago,r.a_pagar].map(Number)),[[4.5,4.5,0]])
    // Bloqueio comercial impede confirmar; cancelamento da venda cancela a comissão.
    await db.query("UPDATE erp.entidades SET bloqueio_comercial=true,bloqueio_motivo='Inadimplência' WHERE id=303")
    const third=await call('/api/erp/vendas',{method:'POST',body:{values:{...saleValues,itens:[{tipo:'produto',item_id:101,quantidade:1}]}},headers:{'Idempotency-Key':'fase1-venda-3'}})
    const thirdBlocked=await call('/api/erp/vendas/'+third.data.record.id+'/confirmar',{method:'POST',body:{values:{expectedVersion:await version(third.data.record.id),liberarCreditoMotivo:'Tentativa'}}})
    assert.equal(thirdBlocked.status,409);assert.equal(thirdBlocked.data.error.code,'CUSTOMER_BLOCKED')
    return {tabela:tableId,venda:saleId,comissaoPaga:Number(paid.data.valor)}
  })
  await check('Fase 1.5: devolução com abatimento, crédito e reembolso sem caixa fictício',async()=>{
    const version=async id=>Number((await db.query('SELECT versao FROM erp.vendas WHERE id=$1',[id])).rows[0].versao)
    const stock=async()=>Number((await db.query('SELECT quantidade_fisica FROM erp.saldos_estoque WHERE empresa_id=1 AND produto_id=101 AND local_estoque_id=101')).rows[0].quantidade_fisica)
    const sale=await call('/api/erp/vendas',{method:'POST',body:{values:{cliente_id:101,data_venda:'2026-10-06',data_vencimento:'2026-10-20',categoria_id:102,conta_financeira_id:101,local_estoque_id:101,
      itens:[{tipo:'produto',item_id:101,quantidade:3,valor_unitario:20}]}},headers:{'Idempotency-Key':'dev-venda'}})
    assert.equal(sale.status,201,JSON.stringify(sale.data));const saleId=Number(sale.data.record.id)
    assert.equal((await call('/api/erp/vendas/'+saleId+'/confirmar',{method:'POST',body:{values:{expectedVersion:await version(saleId)}}})).status,200)
    const item=(await db.query('SELECT id FROM erp.vendas_itens WHERE venda_id=$1',[saleId])).rows[0].id
    const ret=(key,values)=>call('/api/erp/vendas/'+saleId+'/devolucoes',{method:'POST',body:{values},headers:{'Idempotency-Key':key}})
    // Produto ainda não entregue não pode ser devolvido.
    const early=await ret('dev-cedo',{tratamento:'abater',motivo:'Não entregue',itens:[{venda_item_id:Number(item),quantidade:1}]})
    assert.equal(early.status,422,JSON.stringify(early.data));assert.match(early.data.error.message,/entregue/)
    const attended=await call('/api/erp/vendas/'+saleId+'/atender',{method:'POST',body:{values:{expectedVersion:await version(saleId)}}})
    assert.equal(attended.status,200,JSON.stringify(attended.data));const afterSale=await stock()
    // Abater: 1 unidade (20) quita parte da parcela sem entrar dinheiro; produto volta ao estoque.
    const a=await ret('dev-abater',{tratamento:'abater',motivo:'Produto com defeito',itens:[{venda_item_id:Number(item),quantidade:1}]})
    assert.equal(a.status,201,JSON.stringify(a.data));assert.match(a.data.record.numero,/^DEV-2026-\d{4}$/);assert.equal(Number(a.data.record.valor_total),20)
    assert.equal((await ret('dev-abater',{tratamento:'abater',motivo:'Produto com defeito',itens:[{venda_item_id:Number(item),quantidade:1}]})).status,200)
    assert.equal(await stock(),afterSale+1)
    const parcel=(await db.query('SELECT p.id,p.valor_pago::text,p.status FROM erp.contas_receber_parcelas p JOIN erp.contas_receber c ON c.empresa_id=p.empresa_id AND c.id=p.conta_receber_id WHERE c.venda_id=$1',[saleId])).rows[0]
    assert.deepEqual([parcel.valor_pago,parcel.status],['20.00','parcial'])
    // Crédito: 1 unidade vira crédito do cliente e é usado na mesma parcela.
    const c=await ret('dev-credito',{tratamento:'credito',motivo:'Troca futura',itens:[{venda_item_id:Number(item),quantidade:1}]})
    assert.equal(c.status,201,JSON.stringify(c.data));assert.equal(Number(c.data.record.credito_disponivel),20)
    assert.equal((await call('/api/erp/devolucoes?com_credito=1&cliente_id=101')).data.records.length,1)
    const tooMuch=await call('/api/erp/devolucoes/'+c.data.record.id+'/usar-credito',{method:'POST',body:{values:{parcela_id:Number(parcel.id),valor:25}},headers:{'Idempotency-Key':'cred-demais'}})
    assert.equal(tooMuch.status,409,JSON.stringify(tooMuch.data))
    const used=await call('/api/erp/devolucoes/'+c.data.record.id+'/usar-credito',{method:'POST',body:{values:{parcela_id:Number(parcel.id),valor:20,data:'2026-10-08'}},headers:{'Idempotency-Key':'cred-uso'}})
    assert.equal(used.status,200,JSON.stringify(used.data));assert.equal(Number(used.data.record.credito_disponivel),0)
    // Reembolso: conta a pagar ao cliente (marcado também como fornecedor).
    const r=await ret('dev-reembolso',{tratamento:'reembolso',motivo:'Cliente desistiu',categoria_id:101,data_vencimento:'2026-10-30',itens:[{venda_item_id:Number(item),quantidade:1}]})
    assert.equal(r.status,201,JSON.stringify(r.data))
    assert.deepEqual((await db.query('SELECT fornecedor_id::text,valor_total::text FROM erp.contas_pagar WHERE id=$1',[r.data.record.conta_pagar_id])).rows[0],{fornecedor_id:'101',valor_total:'20.00'})
    // Tudo devolvido: nada mais pode voltar; estoque recompôs as 3 unidades.
    assert.equal((await ret('dev-demais',{tratamento:'credito',motivo:'Excesso',itens:[{venda_item_id:Number(item),quantidade:1}]})).status,422)
    assert.equal(await stock(),afterSale+3)
    // Nenhuma das baixas da devolução movimentou caixa.
    assert.deepEqual((await db.query("SELECT count(*)::int n,coalesce(sum(valor_liquido),0)::text liquido FROM erp.pagamentos WHERE origem IN ('devolucao','credito_cliente')")).rows[0],{n:2,liquido:'0.00'})
    // DRE por competência mostra a dedução das devoluções.
    const dre=await call('/api/erp/relatorios/dre-competencia?inicio=2026-10-01&fim=2026-10-31&from=2026-10-01&to=2026-10-31')
    if(dre.status===200){const rows=dre.data.records||dre.data.rows||[];if(rows.length)assert(rows.some(row=>row.categoria==='Devoluções de vendas'&&Number(row.valor)===-60),JSON.stringify(rows))}
    return {venda:saleId,devolucoes:3}
  })
  await check('Fase 1.7: vendedor restrito às próprias vendas e ao desconto máximo',async()=>{
    await db.exec(`INSERT INTO shared.perfis_acesso(id,nome) VALUES('api-seller','API Seller');
      INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) SELECT 'api-seller',c FROM unnest(ARRAY['erp.vendas.visualizar','erp.vendas.gerenciar','erp.cadastros.visualizar','erp.financeiro.visualizar','erp.estoque.visualizar']) c;
      INSERT INTO shared.usuarios(id,email,full_name,clerk_user_id) VALUES(3,'seller@example.invalid','Seller','local_seller');
      INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status,perfil_acesso_id) VALUES(1,3,'member','active','api-seller');
      INSERT INTO erp.entidades(id,empresa_id,nome,eh_vendedor) VALUES(304,1,'Vendedor Bruno',true);`)
    // Escopo restrito exige vendedor; vendedor precisa ser da empresa.
    await assert.rejects(db.query("UPDATE shared.usuarios_empresas SET escopo_vendas='proprias' WHERE empresa_id=1 AND usuario_id=3"),/vincule/)
    await assert.rejects(db.query("UPDATE shared.usuarios_empresas SET vendedor_id=201 WHERE empresa_id=1 AND usuario_id=3"),/Vendedor inválido/)
    const settings=load('@/products/auth/server/settingsRepository')
    const member=await settings.updateWorkspaceMember({actorUserId:1,tenantId:1,values:{userId:3,sellerId:304,salesScope:'proprias',maxDiscountPercent:5,reason:'Teste'}})
    assert.deepEqual([member.sellerId,member.salesScope,member.maxDiscountPercent,member.role],[304,'proprias',5,'member'])
    assert((await settings.getSettingsState({sharedUserId:1,tenantId:1})).sellers.some(seller=>seller.id===304))
    assert.equal((await db.query("SELECT count(*)::int n FROM shared.historico_acessos WHERE usuario_id=3 AND depois->>'escopo_vendas'='proprias'")).rows[0].n,1)
    // O vendedor restrito vende sempre como ele mesmo, mesmo informando outro vendedor.
    const values={cliente_id:101,vendedor_id:301,data_venda:'2026-10-06',data_vencimento:'2026-10-20',categoria_id:102,conta_financeira_id:101,itens:[{tipo:'produto',item_id:101,quantidade:1,valor_unitario:20}]}
    const own=await call('/api/erp/vendas',{token:'seller',method:'POST',body:{values},headers:{'Idempotency-Key':'f17-propria'}})
    assert.equal(own.status,201,JSON.stringify(own.data))
    assert.equal((await db.query('SELECT vendedor_id::text FROM erp.vendas WHERE id=$1',[own.data.record.id])).rows[0].vendedor_id,'304')
    // Desconto acima de 5% (itens + venda) é recusado; 5% passa.
    const over=await call('/api/erp/vendas',{token:'seller',method:'POST',body:{values:{...values,desconto:1.2}},headers:{'Idempotency-Key':'f17-desconto'}})
    assert.equal(over.status,403,JSON.stringify(over.data));assert.equal(over.data.error.code,'DISCOUNT_LIMIT_EXCEEDED')
    assert.equal((await call('/api/erp/vendas',{token:'seller',method:'POST',body:{values:{...values,itens:[{...values.itens[0],desconto:1}]}},headers:{'Idempotency-Key':'f17-desconto-ok'}})).status,201)
    // Só enxerga as próprias vendas; a de outro vendedor some, o dono continua vendo tudo.
    const mine=await call('/api/erp/vendas?pageSize=100',{token:'seller'});assert.equal(mine.status,200,JSON.stringify(mine.data))
    const ids=(mine.data.records||mine.data.rows||[]).map(row=>Number(row.id))
    const sellerSales=(await db.query("SELECT id FROM erp.vendas WHERE empresa_id=1 AND vendedor_id=304 AND excluido_em IS NULL")).rows.map(row=>Number(row.id))
    assert.deepEqual(ids.sort(),sellerSales.sort(),JSON.stringify(mine.data).slice(0,300))
    const other=(await db.query("SELECT id FROM erp.vendas WHERE empresa_id=1 AND vendedor_id=301 LIMIT 1")).rows[0].id
    // Igual a uma venda inexistente: não revela que existe.
    assert.equal((await call('/api/erp/vendas/'+other,{token:'seller'})).status,(await call('/api/erp/vendas/999999',{token:'seller'})).status)
    assert.equal((await call('/api/erp/vendas/'+other)).status,200)
    // De volta a "todas": vê também as vendas da Ana.
    await settings.updateWorkspaceMember({actorUserId:1,tenantId:1,values:{userId:3,salesScope:'todas',maxDiscountPercent:null}})
    assert.equal((await call('/api/erp/vendas/'+other,{token:'seller'})).status,200)
    return {vendasProprias:sellerSales.length}
  })
  await check('Fase 2A: categorias com grupo da DRE, categorias de cadastro, receita prevista e DRE',async()=>{
    const structure=(await call('/api/erp/catalogos/categorias?estrutura=1')).data
    const group=code=>structure.grupos.find(g=>g.codigo===code).value
    assert.equal(structure.grupos.length,11);assert(structure.grupos.some(g=>g.value==='fora'))
    // Classificação das categorias existentes: Receita A → receita bruta; Despesa A → administrativas.
    for(const [id,code] of [[102,1],[101,5]]){
      const current=(await call('/api/erp/categorias/'+id)).data.record
      const updated=await call('/api/erp/categorias/'+id,{method:'PATCH',body:{expectedVersion:Number(current.versao),values:{...current,dre_grupo_id:group(code)}}})
      assert.equal(updated.status,200,JSON.stringify(updated.data))
    }
    // Hierarquia: Pessoal (grupo 4) › Salários herda o grupo; lançamento só na subcategoria.
    const pessoal=await call('/api/erp/categorias',{method:'POST',body:{values:{nome:'Pessoal',tipo:'despesa',dre_grupo_id:group(4),status:'ativo'}}})
    assert.equal(pessoal.status,201,JSON.stringify(pessoal.data))
    const salarios=await call('/api/erp/categorias',{method:'POST',body:{values:{nome:'Salários',tipo:'despesa',categoria_pai_id:pessoal.data.record.id,dre_grupo_id:group(6),status:'ativo'}}})
    assert.equal(salarios.status,201,JSON.stringify(salarios.data))
    assert.equal(String((await db.query('SELECT dre_grupo_id FROM erp.categorias WHERE id=$1',[salarios.data.record.id])).rows[0].dre_grupo_id),String(group(4)))
    assert.equal((await call('/api/erp/categorias',{method:'POST',body:{values:{nome:'Neto',tipo:'despesa',categoria_pai_id:salarios.data.record.id}}})).status,422)
    assert.equal((await call('/api/erp/categorias',{method:'POST',body:{values:{nome:'Inválida',tipo:'produto'}}})).status,422)
    const options=(await call('/api/erp/catalogos/categorias?tipo=despesa&identificador=id')).data.options
    assert(options.some(o=>o.value===salarios.data.record.id&&o.label==='Pessoal › Salários'));assert(!options.some(o=>o.value===pessoal.data.record.id))
    const payroll={...financialValues('pagar'),descricao:'Folha',numero_documento:'FOLHA-10',categoria_id:Number(pessoal.data.record.id),valor_total:1000,parcelas:[{data_vencimento:'2026-10-30',valor:1000}]}
    assert([409,422].includes((await call('/api/erp/titulos/pagar',{method:'POST',body:{values:payroll},headers:{'Idempotency-Key':'fase2a-folha-pai'}})).status))
    assert.equal((await call('/api/erp/titulos/pagar',{method:'POST',body:{values:{...payroll,categoria_id:Number(salarios.data.record.id)}},headers:{'Idempotency-Key':'fase2a-folha'}})).status,201)
    // Empréstimo: fora da DRE.
    const loan=await call('/api/erp/categorias',{method:'POST',body:{values:{nome:'Empréstimo recebido',tipo:'receita',dre_grupo_id:'fora',status:'ativo'}}})
    assert.equal(loan.status,201,JSON.stringify(loan.data))
    assert.equal((await call('/api/erp/titulos/receber',{method:'POST',body:{values:{...financialValues('receber'),descricao:'Empréstimo banco',numero_documento:'EMP-1',categoria_id:Number(loan.data.record.id),valor_total:5000,parcelas:[{data_vencimento:'2026-10-20',valor:5000}]}},headers:{'Idempotency-Key':'fase2a-emprestimo'}})).status,201)
    // Receita prevista: fora da DRE e sem baixa até ser efetivada.
    const forecast=await call('/api/erp/titulos/receber',{method:'POST',body:{values:{...financialValues('receber'),descricao:'Projeto previsto',numero_documento:'PREV-1',valor_total:800,tipo_lancamento:'previsao',parcelas:[{data_vencimento:'2026-10-25',valor:800}]}},headers:{'Idempotency-Key':'fase2a-previsao'}})
    assert.equal(forecast.status,201,JSON.stringify(forecast.data));const forecastId=Number(forecast.data.record.id)
    const parcel=(await db.query('SELECT id FROM erp.contas_receber_parcelas WHERE conta_receber_id=$1',[forecastId])).rows[0].id
    assert([409,422].includes((await call('/api/erp/contas-receber-parcelas/'+parcel+'/baixar',{method:'POST',body:{values:{valor:800,conta_financeira_id:101,data_pagamento:'2026-10-25'}},headers:{'Idempotency-Key':'fase2a-previsao-baixa'}})).status))
    const listed=(await call('/api/erp/contas-a-receber?filter.tipo_lancamento=previsao&pageSize=50')).data.records
    assert(listed.some(r=>Number(r.conta_id)===forecastId&&r.tipo_lancamento==='previsao'))
    const dre=async()=>(await call('/api/erp/relatorios/dre?inicio=2026-10-01&fim=2026-10-31')).data
    const before=await dre()
    const g=(report,code)=>report.grupos.find(x=>x.codigo===code)
    assert(!g(before,1).categorias.some(c=>c.nome==='Empréstimo recebido'));assert.equal(before.fora_dre,5000)
    assert.equal((await call('/api/erp/financeiro/efetivar-previsao',{method:'POST',body:{values:{conta_id:forecastId,lado:'receber'}}})).status,200)
    assert.equal((await call('/api/erp/contas-receber-parcelas/'+parcel+'/baixar',{method:'POST',body:{values:{valor:800,conta_financeira_id:101,data_pagamento:'2026-10-25'}},headers:{'Idempotency-Key':'fase2a-previsao-baixa-2'}})).status,200)
    const after=await dre()
    assert.equal(Math.round((g(after,1).total-g(before,1).total)*100)/100,800)
    // Estrutura: subtotais acumulados batem com os grupos; folha no grupo 4 sob "Pessoal › Salários".
    const sum=codes=>Math.round(codes.reduce((t,c)=>t+(g(after,c)?.total||0),0)*100)/100
    assert.equal(after.subtotais.receita_liquida,sum([1,2]));assert.equal(after.subtotais.resultado_operacional,sum([1,2,3,4,5,6]));assert.equal(after.subtotais.lucro_liquido,sum([1,2,3,4,5,6,7,8,9,0]))
    const pessoalLine=g(after,4).categorias.find(c=>c.nome==='Pessoal');assert.equal(pessoalLine.total,-1000);assert.equal(pessoalLine.subcategorias[0].nome,'Salários')
    assert.deepEqual(after.linhas.filter(l=>l.tipo==='subtotal').map(l=>l.chave),['receita_liquida','lucro_bruto','resultado_operacional','lucro_antes_ir','lucro_liquido'])
    assert(g(after,2).categorias.some(c=>c.nome==='Devoluções de vendas'))
    const entries=(await call('/api/erp/relatorios/dre?inicio=2026-10-01&fim=2026-10-31&categoria_id='+pessoal.data.record.id)).data.records
    assert.equal(entries.length,1);assert.equal(Number(entries[0].valor),-1000);assert.equal(entries[0].descricao,'Folha')
    const cash=(await call('/api/erp/relatorios/dre?inicio=2026-10-01&fim=2026-10-31&visao=caixa')).data
    assert.equal(cash.visao,'caixa');assert(g(cash,1).total>=800)
    // Categorias de cadastro: módulo próprio; produto usa a categoria pelo nome e o tipo é protegido.
    const bebidas=await call('/api/erp/categorias-cadastro',{method:'POST',body:{values:{nome:'Bebidas',tipo:'produto',status:'ativo'}}})
    assert.equal(bebidas.status,201,JSON.stringify(bebidas.data))
    const product=await call('/api/erp/produtos',{method:'POST',body:{values:{nome:'Refrigerante',sku:'REF-1',preco:8,categoria:'Bebidas',status:'ativo',controla_estoque:'nao'}}})
    assert.equal(product.status,201,JSON.stringify(product.data))
    assert.equal(String((await db.query('SELECT categoria_id FROM erp.produtos WHERE id=$1',[product.data.record.id])).rows[0].categoria_id),String(bebidas.data.record.id))
    assert.equal(product.data.record.categoria,'Bebidas')
    const regs=(await call('/api/erp/categorias-cadastro?pageSize=50')).data.records;assert(regs.some(r=>r.nome==='Bebidas'&&r.itens===1))
    const customer=await call('/api/erp/clientes',{method:'POST',body:{values:{nome:'Cliente segmentado',tipo:'PJ',categoria:'Atacado',status:'ativo'}}})
    assert.equal(customer.status,201,JSON.stringify(customer.data));assert.equal(customer.data.record.categoria,'Atacado')
    assert.equal((await db.query('SELECT c.tipo FROM erp.entidades e JOIN erp.categorias_cadastro c ON c.empresa_id=e.empresa_id AND c.id=e.categoria_id WHERE e.id=$1',[customer.data.record.id])).rows[0].tipo,'cliente')
    return {lucro_liquido:after.subtotais.lucro_liquido,fora_dre:after.fora_dre}
  })
  await check('Fase 2B: anexos com link assinado, permissão do documento e comprovante da baixa',async()=>{
    // Armazenamento simulado em memória (nenhuma chamada sai da máquina): assina envio, recebe o PUT, confere e assina download.
    const storage=new Map(),storageHost='https://abcdefghijklmnopqrst.supabase.co',realFetch=globalThis.fetch
    const saved={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.SUPABASE_SERVICE_ROLE_KEY,limit:process.env.ERP_ANEXOS_LIMITE_MB}
    process.env.NEXT_PUBLIC_SUPABASE_URL=storageHost;process.env.SUPABASE_SERVICE_ROLE_KEY='local-service-key';process.env.ERP_ANEXOS_LIMITE_MB='10'
    globalThis.fetch=async(input,init={})=>{
      const url=new URL(typeof input==='string'?input:input.url)
      if(url.origin!==storageHost)return realFetch(input,init)
      const method=init.method||'GET'
      let match
      if(method==='POST'&&(match=url.pathname.match(/^\/storage\/v1\/object\/upload\/sign\/(.+)$/)))return new Response(JSON.stringify({url:'/object/upload/sign/'+match[1]+'?token=up'}),{status:200,headers:{'content-type':'application/json'}})
      if(method==='PUT'&&(match=url.pathname.match(/^\/storage\/v1\/object\/upload\/sign\/(.+)$/))){assert.equal(url.searchParams.get('token'),'up');const body=await new Response(init.body).arrayBuffer();storage.set(match[1],body.byteLength);return new Response('{}',{status:200})}
      if(method==='HEAD'&&(match=url.pathname.match(/^\/storage\/v1\/object\/authenticated\/(.+)$/)))return storage.has(match[1])?new Response(null,{status:200,headers:{'content-length':String(storage.get(match[1]))}}):new Response(null,{status:400})
      if(method==='POST'&&(match=url.pathname.match(/^\/storage\/v1\/object\/sign\/(.+)$/)))return new Response(JSON.stringify({signedURL:'/object/sign/'+match[1]+'?token=down'}),{status:200,headers:{'content-type':'application/json'}})
      return new Response(null,{status:404})
    }
    try{
      const title=await call('/api/erp/titulos/receber',{method:'POST',body:{values:{...financialValues('receber'),descricao:'Com anexo',numero_documento:'ANX-1'}},headers:{'Idempotency-Key':'fase2b-titulo'}})
      assert.equal(title.status,201,JSON.stringify(title.data));const titleId=Number(title.data.record.id)
      const prepare=values=>call('/api/erp/anexos',{method:'POST',body:{values:{documento:'conta_receber',registro_id:titleId,nome:'Nota fiscal.pdf',mime_type:'application/pdf',tamanho:1200,...values}}})
      assert.equal((await prepare({mime_type:'application/x-msdownload'})).status,422)
      assert.equal((await prepare({tamanho:11*1024*1024})).status,422)
      assert.equal((await prepare({registro_id:999999})).status,422)
      const prepared=await prepare({});assert.equal(prepared.status,201,JSON.stringify(prepared.data))
      const id=prepared.data.arquivo_id;assert.match(prepared.data.upload_url,/\/object\/upload\/sign\/erp-anexos\/1\/conta_receber\//)
      // Antes do envio: não confirma e não aparece na lista.
      assert.equal((await call('/api/erp/anexos/'+id+'/confirmar',{method:'POST',body:{values:{}}})).status,409)
      assert.equal((await call('/api/erp/anexos?documento=conta_receber&registro_id='+titleId)).data.records.length,0)
      assert.equal((await fetch(prepared.data.upload_url,{method:'PUT',headers:{'Content-Type':'application/pdf'},body:new Uint8Array(1200)})).status,200)
      assert.equal((await call('/api/erp/anexos/'+id+'/confirmar',{method:'POST',body:{values:{hash_sha256:'a'.repeat(64)}}})).status,200)
      const list=(await call('/api/erp/anexos?documento=conta_receber&registro_id='+titleId)).data.records
      assert.deepEqual(list.map(r=>[r.nome,r.finalidade,r.tamanho_bytes]),[['Nota fiscal.pdf','anexo',1200]])
      const link=await call('/api/erp/anexos/'+id);assert.equal(link.status,200);assert.match(link.data.url,/\/object\/sign\/erp-anexos\/1\/.+token=down/)
      // Outra empresa não enxerga nem remove.
      assert.equal((await call('/api/erp/anexos/'+id,{token:'owner-b'})).status,404)
      assert([403,404,422].includes((await call('/api/erp/anexos/'+id,{token:'owner-b',method:'DELETE'})).status))
      // Limite da empresa (10 MB): 9 MB passa, mais 9 MB não.
      assert.equal((await prepare({nome:'grande-1.pdf',tamanho:9*1024*1024})).status,201)
      const over=await prepare({nome:'grande-2.pdf',tamanho:9*1024*1024});assert.equal(over.status,422);assert.match(over.data.error.message,/Limite/)
      // Comprovante da baixa: anexado ao pagamento, com finalidade própria.
      const parcel=(await db.query('SELECT id FROM erp.contas_receber_parcelas WHERE conta_receber_id=$1 ORDER BY numero_parcela LIMIT 1',[titleId])).rows[0].id
      const paid=await call('/api/erp/contas-receber-parcelas/'+parcel+'/baixar',{method:'POST',body:{values:{valor:60,conta_financeira_id:101,data_pagamento:'2026-10-15'}},headers:{'Idempotency-Key':'fase2b-baixa'}})
      assert.equal(paid.status,200,JSON.stringify(paid.data));const paymentId=Number(paid.data.payment.id)
      const receipt=await call('/api/erp/anexos',{method:'POST',body:{values:{documento:'pagamento',registro_id:paymentId,nome:'pix.png',mime_type:'image/png',tamanho:300}}})
      assert.equal(receipt.status,201,JSON.stringify(receipt.data))
      await fetch(receipt.data.upload_url,{method:'PUT',headers:{'Content-Type':'image/png'},body:new Uint8Array(300)})
      assert.equal((await call('/api/erp/anexos/'+receipt.data.arquivo_id+'/confirmar',{method:'POST',body:{values:{}}})).status,200)
      assert.deepEqual((await call('/api/erp/anexos?documento=pagamento&registro_id='+paymentId)).data.records.map(r=>r.finalidade),['comprovante'])
      // Anexo de conta a receber é documento preservado; comprovante de baixa pode ser removido (fica marcado como excluído).
      assert.equal((await call('/api/erp/anexos/'+id,{method:'DELETE'})).status,422)
      assert.equal((await call('/api/erp/anexos/'+receipt.data.arquivo_id,{method:'DELETE'})).status,200)
      assert.equal((await call('/api/erp/anexos?documento=pagamento&registro_id='+paymentId)).data.records.length,0)
      assert((await db.query('SELECT excluido_em FROM erp.arquivos WHERE id=$1',[receipt.data.arquivo_id])).rows[0].excluido_em)
      return {anexos:storage.size}
    }finally{
      globalThis.fetch=realFetch
      for(const [key,value] of [['NEXT_PUBLIC_SUPABASE_URL',saved.url],['SUPABASE_SERVICE_ROLE_KEY',saved.key],['ERP_ANEXOS_LIMITE_MB',saved.limit]])if(value===undefined)delete process.env[key];else process.env[key]=value
    }
  })
  await check('Fase 2C: cartão pela maquininha, extrato CSV com regras, repasse conciliado, saldo e aviso de fechamento',async()=>{
    const post=(path,body,key)=>call(path,{method:'POST',body,...(key?{headers:{'Idempotency-Key':key}}:{})})
    const structure=(await call('/api/erp/catalogos/categorias?estrutura=1')).data
    const machine=await post('/api/erp/contas-financeiras',{values:{nome:'Stone',tipo:'maquininha',saldo_inicial:0,data_saldo_inicial:'2026-01-01',status:'ativo'}})
    assert.equal(machine.status,201,JSON.stringify(machine.data));const machineId=Number(machine.data.record.id)
    const feeCategory=await post('/api/erp/categorias',{values:{nome:'Taxas de cartão',tipo:'despesa',dre_grupo_id:structure.grupos.find(g=>g.codigo===6).value,status:'ativo'}})
    assert.equal(feeCategory.status,201,JSON.stringify(feeCategory.data))
    const acquirer=await post('/api/erp/fornecedores',{values:{nome:'Stone Pagamentos',tipo:'PJ',status:'ativo'}})
    assert.equal(acquirer.status,201,JSON.stringify(acquirer.data))
    const method=values=>post('/api/erp/financeiro/formas-pagamento',{values:{tipo:'cartao_credito',taxa_percentual:3.5,prazo_repasse_dias:30,
      conta_maquininha_id:machineId,conta_destino_id:101,categoria_taxa_id:Number(feeCategory.data.record.id),adquirente_id:Number(acquirer.data.record.id),...values}})
    assert.equal((await method({nome:'Inválida',conta_destino_id:machineId})).status,422)
    const single=await method({nome:'Crédito Stone',repasse:'unico'});assert.equal(single.status,201,JSON.stringify(single.data))
    const split=await method({nome:'Crédito Stone parcelado',repasse:'parcelado'});assert.equal(split.status,201,JSON.stringify(split.data))
    assert((await call('/api/erp/financeiro/formas-pagamento')).data.records.some(r=>r.nome==='Crédito Stone'&&r.conta_maquininha==='Stone'))
    const flow=async()=>(await call('/api/erp/relatorios/fluxo-de-caixa?from=2026-10-01&to=2026-12-31')).data.records
    const month=(rows,m)=>rows.find(r=>String(r.competencia).slice(0,7)===m)
    const before=await flow()
    // Recebimento de R$ 100 no crédito (3,5%, D+30, de uma vez).
    const receive=async(key,value,methodId,extra={})=>{
      const title=await post('/api/erp/titulos/receber',{values:{...financialValues('receber'),descricao:'Venda no cartão '+key,numero_documento:'CARD-'+key,valor_total:value,parcelas:[{data_vencimento:'2026-10-10',valor:value}]}},'fase2c-titulo-'+key)
      assert.equal(title.status,201,JSON.stringify(title.data))
      const parcel=(await db.query('SELECT id FROM erp.contas_receber_parcelas WHERE conta_receber_id=$1',[title.data.record.id])).rows[0].id
      const paid=await post('/api/erp/contas-receber-parcelas/'+parcel+'/baixar',{values:{valor:value,data_pagamento:'2026-10-05',metodo_pagamento_id:Number(methodId),conta_financeira_id:101,...extra}},'fase2c-baixa-'+key)
      assert.equal(paid.status,200,JSON.stringify(paid.data));return paid.data
    }
    const one=await receive('unico',100,single.data.id)
    assert.equal(one.cartao.taxa,3.5);assert.equal(one.cartao.liquido,96.5);assert.deepEqual(one.cartao.repasses.map(r=>[r.data,Number(r.valor)]),[['2026-11-04',96.5]])
    assert.equal(String((await db.query('SELECT conta_financeira_id FROM erp.pagamentos WHERE id=$1',[one.payment.id])).rows[0].conta_financeira_id),String(machineId))
    const fee=(await db.query("SELECT c.categoria_id, c.status, p.conta_financeira_id FROM erp.contas_pagar c JOIN erp.contas_pagar_parcelas pp ON pp.conta_pagar_id=c.id JOIN erp.pagamentos p ON p.conta_pagar_parcela_id=pp.id WHERE c.numero_documento=$1",['CARTAO-'+one.payment.id])).rows[0]
    assert.equal(String(fee.categoria_id),String(feeCategory.data.record.id));assert.equal(String(fee.conta_financeira_id),String(machineId))
    // A taxa aparece na DRE em despesas comerciais.
    const dre=(await call('/api/erp/relatorios/dre?inicio=2026-10-01&fim=2026-10-31')).data
    assert(dre.grupos.find(g=>g.codigo===6).categorias.some(c=>c.nome==='Taxas de cartão'&&c.total===-3.5))
    // Caixa: a maquininha não é dinheiro disponível; o repasse entra como previsto em novembro.
    const afterOne=await flow()
    assert.equal(Number(month(afterOne,'2026-10').entradas_realizadas),Number(month(before,'2026-10').entradas_realizadas))
    assert.equal(Math.round((Number(month(afterOne,'2026-11').entradas_previstas)-Number(month(before,'2026-11').entradas_previstas))*100)/100,96.5)
    // Parcelado em 3x: três repasses mensais.
    const three=await receive('parcelado',90,split.data.id,{parcelas_cartao:3})
    assert.deepEqual(three.cartao.repasses.map(r=>[r.data,Number(r.valor)]),[['2026-11-04',28.95],['2026-12-04',28.95],['2027-01-03',28.95]])
    // Estorno do parcelado: repasses cancelados e taxa estornada.
    const reversed=await call('/api/erp/pagamentos/'+three.payment.id+'/estornar',{method:'POST',body:{motivo:'Cliente cancelou'},headers:{'Idempotency-Key':'fase2c-estorno'}})
    assert.equal(reversed.status,200,JSON.stringify(reversed.data))
    assert.deepEqual((await db.query('SELECT DISTINCT status FROM erp.transferencias_financeiras WHERE pagamento_origem_id=$1',[three.payment.id])).rows.map(r=>r.status),['cancelada'])
    assert.equal((await db.query("SELECT status FROM erp.contas_pagar WHERE numero_documento=$1",['CARTAO-'+three.payment.id])).rows[0].status,'cancelado')
    // Regra: tarifa do extrato vira despesa paga e conciliada.
    const rule=await post('/api/erp/conciliacao/lancamentos',{values:{descricao_contem:'TARIFA',tipo_transacao:'debito',categoria_id:101,entidade_id:101}})
    assert.equal(rule.status,201,JSON.stringify(rule.data))
    assert.equal((await post('/api/erp/conciliacao/lancamentos',{values:{descricao_contem:'IOF',tipo_transacao:'debito',categoria_id:102,entidade_id:101}})).status,422)
    const csv=['Data;Histórico;Valor;Saldo','05/11/2026;TARIFA PACOTE SERVICOS;-12,90;1.000,00','04/11/2026;STONE REPASSE;96,50;1.096,50','20/11/2026;PIX RECEBIDO JOAO;50,00;1.146,50'].join('\n')
    const mapping={coluna_data:'Data',coluna_descricao:'Histórico',coluna_valor:'Valor',coluna_saldo:'Saldo',formato_data:'dd/mm/aaaa',separador:';'}
    const imported=await post('/api/erp/bancos/importar-ofx',{accountId:101,fileName:'extrato.csv',content:csv,format:'csv',mapping})
    assert.equal(imported.status,201,JSON.stringify(imported.data));assert.equal(imported.data.imported,3);assert.equal(imported.data.regras.lancadas,1,JSON.stringify(imported.data.regras))
    assert.equal((await post('/api/erp/bancos/importar-ofx',{accountId:101,fileName:'extrato.csv',content:csv,format:'csv'})).data.reused,true)
    const tariff=(await db.query("SELECT t.status, (SELECT count(*)::int FROM erp.conciliacoes_bancarias_itens i WHERE i.transacao_bancaria_id=t.id AND i.desfeito_em IS NULL) AS itens FROM erp.transacoes_bancarias t WHERE t.descricao='TARIFA PACOTE SERVICOS'")).rows[0]
    assert.equal(tariff.itens,1)
    // O crédito da Stone casa com o repasse previsto.
    const suggestions=(await call('/api/erp/conciliacao/sugestoes')).data.records
    const repasse=suggestions.find(r=>r.transferencia_id&&Number(r.valor)===96.5);assert(repasse,JSON.stringify(suggestions))
    assert.equal(repasse.tipo,'repasse')
    const done=await post('/api/erp/operacoes/conciliar-transacao',{values:{transacao_bancaria_id:Number(repasse.transacao_id),transferencia_financeira_id:Number(repasse.transferencia_id),origem_conciliacao:'sugerida'}},'fase2c-conciliar-repasse')
    assert.equal(done.status,201,JSON.stringify(done.data))
    assert.equal((await db.query('SELECT status FROM erp.transferencias_financeiras WHERE id=$1',[repasse.transferencia_id])).rows[0].status,'concluida')
    const afterTransfer=await flow()
    assert.equal(Math.round((Number(month(afterTransfer,'2026-11').entradas_realizadas)-Number(month(afterOne,'2026-11').entradas_realizadas))*100)/100,96.5)
    // Estornar recebimento cujo repasse já foi conciliado é bloqueado.
    assert.equal((await call('/api/erp/pagamentos/'+one.payment.id+'/estornar',{method:'POST',body:{motivo:'Teste'},headers:{'Idempotency-Key':'fase2c-estorno-bloqueado'}})).status,409)
    // Saldo: extrato informado × ERP.
    const balance=(await call('/api/erp/conciliacao/lancamentos?saldo_conta=101')).data
    assert.equal(balance.saldo_extrato,1146.5);assert.equal(balance.data_extrato,'2026-11-20');assert.equal(typeof balance.diferenca,'number');assert(balance.pendentes>=1)
    // Fechar novembro com transação pendente devolve aviso.
    const closed=await post('/api/erp/fechamentos',{modulo:'financeiro',periodo_inicio:'2026-11-01',periodo_fim:'2026-11-30',motivo:'Teste 2C'})
    assert([200,201].includes(closed.status),JSON.stringify(closed.data));assert.match(closed.data.record?.aviso||'',/não foram conciliadas/)
    return {taxa:one.cartao.taxa,repasse:96.5}
  })
  await check('Fase 2D e 2E: CMV na DRE, margem, orçamento × realizado e metas de venda',async()=>{
    // CMV: a venda atendida em outubro (Fase 1.5) gera a linha de custo no grupo 3.
    const dre=(await call('/api/erp/relatorios/dre?inicio=2026-10-01&fim=2026-10-31')).data
    assert(dre.grupos.find(g=>g.codigo===3).categorias.some(c=>c.nome==='CMV (custo das mercadorias vendidas)'),JSON.stringify(dre.grupos.find(g=>g.codigo===3)))
    const cmv=Number((await db.query("SELECT coalesce(sum(m.quantidade*m.custo_unitario),0)::numeric(18,2) v FROM erp.movimentacoes_estoque m LEFT JOIN erp.documentos_estoque d ON d.id=m.documento_estoque_id WHERE m.empresa_id=1 AND (m.origem_tipo IN ('venda','cancelamento_venda') OR d.venda_id IS NOT NULL) AND coalesce(m.data_operacional,m.ocorrido_em::date) BETWEEN '2026-10-01' AND '2026-10-31'")).rows[0].v)
    assert.equal(dre.grupos.find(g=>g.codigo===3).categorias.find(c=>c.nome.startsWith('CMV')).total,cmv)
    // Margem por item, venda e cliente.
    for(const report of ['margem-itens','margem-vendas','margem-clientes']){
      const rows=(await call('/api/erp/relatorios/'+report+'?from=2026-10-01&to=2026-10-31')).data.records
      assert(rows.length>0,report);assert(rows.every(r=>Math.abs(Number(r.receita_liquida)-Number(r.custo)-Number(r.margem))<0.02),report)
    }
    // Orçamento: 1.200 anual na receita (100/mês) e 50 de despesa em outubro.
    const created=await call('/api/erp/orcamentos-financeiros',{method:'POST',body:{values:{ano:2026,nome:'Orçamento 2026',linhas:[{categoria_id:102,mes:0,valor:1200},{categoria_id:101,mes:10,valor:50}]}}})
    assert.equal(created.status,201,JSON.stringify(created.data));assert.equal(created.data.linhas,13)
    const compared=(await call('/api/erp/orcamentos-financeiros?id='+created.data.id+'&comparar=1&ate_mes=10')).data
    assert.equal(compared.linhas.find(l=>l.codigo===1).orcado,1000);assert.equal(compared.linhas.find(l=>l.codigo===5).orcado,-50)
    const realized=(await call('/api/erp/relatorios/dre?inicio=2026-01-01&fim=2026-10-31')).data
    assert.equal(compared.linhas.find(l=>l.codigo===1).realizado,realized.grupos.find(g=>g.codigo===1).total)
    assert.equal(compared.resultado.orcado,950)
    const copied=await call('/api/erp/orcamentos-financeiros',{method:'POST',body:{values:{ano:2027,nome:'Base 2026 +10%',copiar_realizado_de:2026,reajuste_percentual:10}}})
    assert.equal(copied.status,201,JSON.stringify(copied.data));assert(copied.data.linhas>0)
    assert.equal((await call('/api/erp/orcamentos-financeiros',{method:'POST',body:{values:{ano:2026,nome:'Orçamento 2026'}}})).status,409)
    // Metas: geral de outubro e atingimento pelas vendas confirmadas.
    assert.equal((await call('/api/erp/metas-vendas',{method:'POST',body:{values:{mes:'2026-10',valor:1000}}})).status,201)
    assert.equal((await call('/api/erp/metas-vendas',{method:'POST',body:{values:{mes:'2026-10',valor:2000}}})).status,201)
    const goals=(await call('/api/erp/metas-vendas?inicio=2026-01-01&fim=2026-12-31')).data.records
    const october=goals.find(g=>g.mes==='2026-10'&&g.vendedor==='Empresa (todos)');assert.equal(Number(october.meta),2000)
    const sold=Number((await db.query("SELECT coalesce(sum(total),0) v FROM erp.vendas WHERE empresa_id=1 AND excluido_em IS NULL AND tipo_documento<>'orcamento' AND status NOT IN ('rascunho','cancelada','cancelado') AND date_trunc('month',data_venda)='2026-10-01'")).rows[0].v)
    assert.equal(Number(october.realizado),sold)
    return {cmv,metaOutubro:2000}
  })
  await check('NFS-e simulada: DPS nacional validado, numeração, rejeição por campo, chave, XML, retenções e cancelamento',async()=>{
    await db.exec(`INSERT INTO erp.entidades(id,empresa_id,nome,documento,email,eh_cliente) VALUES(401,1,'Cliente PJ Serviços','11.444.777/0001-61','pj@example.invalid',true),(402,1,'Cliente PF','529.982.247-25',null,true)`)
    // Serviço com o código de tributação nacional (pontuado entra só com dígitos).
    const service=await call('/api/erp/servicos',{method:'POST',body:{values:{nome:'Consultoria em TI',preco:1000,codigo_tributacao_nacional:'01.07.01',codigo_nbs:'115013000'}}})
    assert.equal(service.status,201,JSON.stringify(service.data));const serviceId=Number(service.data.record?.id||service.data.id)
    assert.deepEqual((await db.query('SELECT codigo_tributacao_nacional,codigo_nbs FROM erp.servicos WHERE id=$1',[serviceId])).rows[0],{codigo_tributacao_nacional:'010701',codigo_nbs:'115013000'})
    assert.equal((await call('/api/erp/servicos',{method:'POST',body:{values:{nome:'Código ruim',preco:1,codigo_tributacao_nacional:'0107'}}})).status,422)
    // Venda confirmada gera o título a receber que a retenção vai abater.
    const sale=await call('/api/erp/vendas',{method:'POST',body:{values:{cliente_id:401,data_venda:'2026-10-06',data_vencimento:'2026-10-30',categoria_id:102,conta_financeira_id:101,
      itens:[{tipo:'servico',item_id:serviceId,quantidade:1,valor_unitario:1000}]}},headers:{'Idempotency-Key':'nfse-venda'}})
    assert.equal(sale.status,201,JSON.stringify(sale.data));const saleId=Number(sale.data.record.id)
    const saleVersion=Number((await db.query('SELECT versao FROM erp.vendas WHERE id=$1',[saleId])).rows[0].versao)
    assert.equal((await call('/api/erp/vendas/'+saleId+'/confirmar',{method:'POST',body:{values:{expectedVersion:saleVersion}}})).status,200)
    const balance=async()=>Number((await db.query(`SELECT coalesce(sum(p.valor-coalesce((SELECT sum(g.valor) FROM erp.pagamentos g WHERE g.conta_receber_parcela_id=p.id AND g.estornado_em IS NULL AND g.estorno_de_pagamento_id IS NULL),0)),0) v
      FROM erp.contas_receber_parcelas p JOIN erp.contas_receber c ON c.empresa_id=p.empresa_id AND c.id=p.conta_receber_id WHERE c.venda_id=$1`,[saleId])).rows[0].v)
    assert.equal(await balance(),1000)
    const note=(key,values)=>call('/api/erp/notas-servico',{method:'POST',body:{chave_operacao:key,dados:{cliente_id:401,data_competencia:'2026-10-06',codigo_municipio_prestacao:'2304400',
      itens:[{item_id:serviceId,descricao:'Consultoria em TI - outubro',quantidade:1,valor_unitario:1000}],...values}}})
    const created=await note('nfse-nota-1',{venda_id:saleId,aliquota_iss:5,iss_retido:true,retencoes_federais:{irrf:1.5}})
    assert.equal(created.status,201,JSON.stringify(created.data));const id=created.data.record.id
    const act=async(name,body,key)=>{const versao=Number((await db.query('SELECT versao FROM erp.notas_fiscais WHERE id=$1',[id])).rows[0].versao)
      return call('/api/erp/notas-servico/'+id+'/'+name,{method:'POST',body:{chave_operacao:key,versao,...body}})}
    // Sem dados fiscais da empresa: o provedor recusaria o prestador.
    const noIssuer=await act('simular',{cenario:'sucesso'},'nfse-emitir-0')
    assert.equal(noIssuer.status,422,JSON.stringify(noIssuer.data));assert(noIssuer.data.error.details.campos.some(c=>c.campo==='prest'))
    assert.equal((await call('/api/erp/notas-servico/configuracao')).data.record,null)
    assert.equal((await call('/api/erp/notas-servico/configuracao',{method:'PUT',body:{cnpj:'11.222.333/0001-00',razao_social:'X',inscricao_municipal:'1',regime_tributario:'mei',endereco_codigo_municipio:'2304400',endereco_municipio:'Fortaleza',endereco_uf:'CE',endereco_cep:''}})).status,422)
    const config=await call('/api/erp/notas-servico/configuracao',{method:'PUT',body:{cnpj:'11.222.333/0001-81',razao_social:'Empresa Fictícia Serviços LTDA',inscricao_municipal:'123.456-7',regime_tributario:'simples_nacional',
      endereco_logradouro:'Rua Teste',endereco_numero:'100',endereco_bairro:'Centro',endereco_codigo_municipio:'2304400',endereco_municipio:'Fortaleza',endereco_uf:'ce',endereco_cep:'60000-000',serie_dps:'1',aliquota_iss_padrao:5}})
    assert.equal(config.status,200,JSON.stringify(config.data));assert.equal(config.data.record.cnpj,'11222333000181');assert.equal(config.data.record.endereco_uf,'CE')
    // Rejeição no formato do provedor: código e campo do leiaute; o DPS já recebe o número 1.
    const rejected=await act('simular',{cenario:'rejeicao'},'nfse-emitir-1')
    assert.equal(rejected.status,200,JSON.stringify(rejected.data));assert.equal(rejected.data.record.status,'falha')
    assert.equal(rejected.data.record.numero_dps,'1');assert.equal(rejected.data.record.resposta_provedor.erros[0].campo,'serv.cServ.cTribNac')
    // Reenvio autorizado reaproveita o número do DPS e gera chave de homologação (50 dígitos, ambiente 2).
    const issued=await act('simular',{cenario:'sucesso'},'nfse-emitir-2')
    assert.equal(issued.status,200,JSON.stringify(issued.data));const record=issued.data.record
    assert.equal(record.status,'emitida');assert.equal(record.numero,'1');assert.equal(record.numero_dps,'1');assert.match(record.chave_acesso,/^\d{50}$/);assert.equal(record.chave_acesso[7],'2')
    assert.match(record.codigo_verificacao,/^[0-9A-F]{8}$/);assert.match(record.protocolo,/^SIM/)
    // Retenções: ISS 5% (50) + IRRF 1,5% (15) abatidas do título, sem entrada de dinheiro.
    assert.deepEqual(record.retencoes,{iss:50,federais:15,total:65})
    assert.equal(await balance(),935)
    assert.deepEqual((await db.query("SELECT valor::text,desconto::text,valor_liquido::text FROM erp.pagamentos WHERE nota_fiscal_id=$1 AND origem='retencao'",[id])).rows,[{valor:'65.00',desconto:'65.00',valor_liquido:'0.00'}])
    const dps=(await db.query('SELECT payload_enviado FROM erp.notas_fiscais WHERE id=$1',[id])).rows[0].payload_enviado.infDPS
    assert.equal(dps.prest.CNPJ,'11222333000181');assert.equal(dps.toma.CNPJ,'11444777000161');assert.equal(dps.serv.cServ.cTribNac,'010701');assert.equal(dps.valores.trib.tribMun.tpRetISSQN,2);assert.equal(dps.tpAmb,2)
    // XML e DANFSe da nota autorizada.
    const xml=await fetch(base+'/api/erp/notas-servico/'+id+'/xml',{headers:{'x-test-identity':'owner-a'}})
    assert.equal(xml.status,200);const content=await xml.text()
    assert.match(content,/SIMULAÇÃO - SEM VALIDADE FISCAL/);assert.match(content,/<nDPS>1<\/nDPS>/);assert.match(content,/<cTribNac>010701<\/cTribNac>/);assert(content.includes('NFS'+record.chave_acesso))
    assert.equal((await fetch(base+'/api/erp/notas-servico/'+id+'/pdf',{headers:{'x-test-identity':'owner-a'}})).status,200)
    // Tomador pessoa física não pode ter ISS retido; próxima nota usa o DPS 2.
    const pf=await note('nfse-nota-pf',{cliente_id:402,aliquota_iss:5,iss_retido:true})
    assert.equal(pf.status,201,JSON.stringify(pf.data))
    const pfVersion=Number((await db.query('SELECT versao FROM erp.notas_fiscais WHERE id=$1',[pf.data.record.id])).rows[0].versao)
    const pfIssue=await call('/api/erp/notas-servico/'+pf.data.record.id+'/simular',{method:'POST',body:{chave_operacao:'nfse-emitir-pf',versao:pfVersion,cenario:'sucesso'}})
    assert.equal(pfIssue.status,422,JSON.stringify(pfIssue.data));assert(pfIssue.data.error.details.campos.some(c=>c.campo==='valores.trib.tribMun.tpRetISSQN'))
    const second=await note('nfse-nota-2',{cliente_id:402,aliquota_iss:3})
    const secondVersion=Number((await db.query('SELECT versao FROM erp.notas_fiscais WHERE id=$1',[second.data.record.id])).rows[0].versao)
    const secondIssued=await call('/api/erp/notas-servico/'+second.data.record.id+'/simular',{method:'POST',body:{chave_operacao:'nfse-emitir-3',versao:secondVersion,cenario:'demora'}})
    assert.equal(secondIssued.data.record.status,'aguardando_retorno',JSON.stringify(secondIssued.data));assert.equal(secondIssued.data.record.numero_dps,'2')
    // Cancelamento exige código do motivo e justificativa; estorna o abatimento da retenção.
    assert.equal((await act('cancelar',{motivo:'Serviço não prestado no período'},'nfse-cancelar-0')).status,422)
    assert.equal((await act('cancelar',{motivo:'curto demais',codigo_motivo:'2'},'nfse-cancelar-1')).status,422)
    const cancelled=await act('cancelar',{motivo:'Serviço não prestado no período',codigo_motivo:'2'},'nfse-cancelar-2')
    assert.equal(cancelled.status,200,JSON.stringify(cancelled.data));assert.equal(cancelled.data.record.status,'cancelada')
    assert.equal(await balance(),1000)
    return {dps:[record.numero_dps,secondIssued.data.record.numero_dps],chave:record.chave_acesso,retido:65}
  })
  await check('Logs contain correlation and status without submitted data',async()=>{
    assert(logs.some(line=>line.includes('"scope":"erp-api"')&&line.includes('"status":201')))
    assert(!logs.join('\n').includes('crud@example.invalid'));assert(!logs.join('\n').includes('Observação inicial'));assert(!logs.join('\n').includes('local-test-secret'))
  })
  const report={status:'passed',date:new Date().toISOString(),routes:routes.length,methods:routes.reduce((total,route)=>total+route.methods.length,0),checks:results.length,results,database:'PGlite/fictitious',independentPostgresSessions:false}
  mkdirSync('.cache/erp-api',{recursive:true});writeFileSync('.cache/erp-api/http-smoke.json',JSON.stringify(report,null,2)+'\n');originalInfo(JSON.stringify({...report,results:undefined}))
} catch(error) {
  originalError(JSON.stringify({status:'failed',message:error.message,code:error.code,stack:error.stack?.split('\n').slice(0,8)}))
  // Últimos registros de erro do servidor ajudam a localizar a causa (o teste só usa dados fictícios).
  originalError(logs.filter(line=>/error|falha|exception/i.test(line)).slice(-3).join('\n'))
  process.exitCode=1
} finally {
  console.info=originalInfo;console.error=originalError
  if(server) await new Promise(resolve=>server.close(resolve))
  await postgres?.closePool();await db.close()
  if(originalUrl===undefined)delete process.env.SUPABASE_DB_URL;else process.env.SUPABASE_DB_URL=originalUrl
  if(originalCron===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=originalCron
}
