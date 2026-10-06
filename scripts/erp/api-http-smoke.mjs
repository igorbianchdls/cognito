import {applySharedMigration} from '../shared/schema-contract.mjs'
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
  const actors={'owner-a':{tenantId:1,userId:1},'owner-b':{tenantId:2,userId:1},reader:{tenantId:1,userId:2}}
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
  await check('Logs contain correlation and status without submitted data',async()=>{
    assert(logs.some(line=>line.includes('"scope":"erp-api"')&&line.includes('"status":201')))
    assert(!logs.join('\n').includes('crud@example.invalid'));assert(!logs.join('\n').includes('Observação inicial'));assert(!logs.join('\n').includes('local-test-secret'))
  })
  const report={status:'passed',date:new Date().toISOString(),routes:routes.length,methods:routes.reduce((total,route)=>total+route.methods.length,0),checks:results.length,results,database:'PGlite/fictitious',independentPostgresSessions:false}
  mkdirSync('.cache/erp-api',{recursive:true});writeFileSync('.cache/erp-api/http-smoke.json',JSON.stringify(report,null,2)+'\n');originalInfo(JSON.stringify({...report,results:undefined}))
} catch(error) {
  originalError(JSON.stringify({status:'failed',message:error.message,code:error.code,stack:error.stack?.split('\n').slice(0,4)}))
  process.exitCode=1
} finally {
  console.info=originalInfo;console.error=originalError
  if(server) await new Promise(resolve=>server.close(resolve))
  await postgres?.closePool();await db.close()
  if(originalUrl===undefined)delete process.env.SUPABASE_DB_URL;else process.env.SUPABASE_DB_URL=originalUrl
  if(originalCron===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=originalCron
}
