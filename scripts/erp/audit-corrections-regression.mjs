import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import assert from 'node:assert/strict'
import { z } from 'zod'
import { connection } from './evolution-db.mjs'
mkdirSync('.cache/erp-audit',{recursive:true})

function load(path, dependencies) {
  const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
  const module={exports:{}}
  vm.runInThisContext('(function(require,module,exports){'+js+'\n})',{filename:path})(name=>{
    if (name in dependencies) return dependencies[name]
    throw new Error('Unexpected dependency '+name)
  },module,module.exports)
  return module.exports
}
const reports=load('src/products/erp/server/erpFinancialReports.ts',{
  './erpBusinessDate':{ERP_TODAY_SQL:'CURRENT_DATE'},
  './erpRepository':{financialCompositionSql:()=>{throw new Error('Not part of these fixtures')}}
})
const db=connection(), result={readOnly:true,fixturesOnly:true,checks:{}}
async function queryFixture(sql,tables) {
  let text=sql, params=[2,'2026-10-01','2026-10-31'], definitions=[]
  for(const [name,records] of Object.entries(tables)) {
    assert(/^[a-z_]+$/.test(name));params.push(JSON.stringify(records))
    definitions.push(`audit_${name} AS (SELECT * FROM jsonb_populate_recordset(NULL::erp.${name},$${params.length}::jsonb))`)
    text=text.replaceAll('erp.'+name+' ', 'audit_'+name+' ')
  }
  assert(/^WITH\s/i.test(text))
  return (await db.query('WITH '+definitions.join(',')+', '+text.replace(/^WITH\s/i,''),params)).rows
}
try {
  await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  result.checks.marginRepeatedProduct=await queryFixture(reports.marginSql('venda'),{
    vendas:[{id:1,empresa_id:2,numero:'TESTE',cliente_id:1,data_venda:'2026-10-11',status:'confirmada',tipo_documento:'venda',subtotal:200,total:200,frete:0}],
    vendas_itens:[10,11].map(id=>({id,empresa_id:2,venda_id:1,produto_id:1,quantidade:1,total:100,custo_unitario:30,descricao:'Mesmo produto'})),
    entidades:[{id:1,empresa_id:2,nome:'Cliente sintético'}],
    movimentacoes_estoque:[{id:1,empresa_id:2,produto_id:1,quantidade:-2,custo_unitario:30,origem_tipo:'venda',origem_id:1}],
    documentos_estoque:[],documentos_estoque_itens:[],devolucoes_itens:[]
  })
  assert.equal(Number(result.checks.marginRepeatedProduct[0].custo),60)
  result.checks.marginExpected={revenue:200,cost:60,margin:140}
  const common={empresa_id:2,data_competencia:'2026-10-11',status:'aberto',tipo_lancamento:'efetivo'}
  const allocation=reports.accrualAllocationSql()+" SELECT tipo,rotulo,sum(valor)::numeric(18,2) valor FROM alocado GROUP BY tipo,rotulo ORDER BY tipo,rotulo"
  result.checks.refundAccrual=await queryFixture(allocation,{
    contas_receber:[{...common,id:1,cliente_id:1,valor_total:1000,categoria_id:1}],
    contas_pagar:[{...common,id:2,fornecedor_id:1,valor_total:200,categoria_id:2,origem:'manual'}],
    rateios_financeiros:[],renegociacoes:[],
    devolucoes:[{id:1,empresa_id:2,venda_id:1,cliente_id:1,tratamento:'reembolso',conta_pagar_id:2,data_devolucao:'2026-10-11',valor_total:200}]
  })
  result.checks.refundAccrualTotals={actual:result.checks.refundAccrual.reduce((s,r)=>s+Number(r.valor)*(r.tipo==='receita'?1:-1),0),expected:800}
  assert.equal(result.checks.refundAccrualTotals.actual,800)
  const linkedFixture={
    vendas:[{id:1,empresa_id:2,numero:'LINKED',cliente_id:1,data_venda:'2026-10-11',status:'confirmada',tipo_documento:'venda',subtotal:200,total:200,frete:0}],
    vendas_itens:[10,11].map(id=>({id,empresa_id:2,venda_id:1,produto_id:1,quantidade:1,total:100,custo_unitario:30,descricao:'Same product'})),
    entidades:[{id:1,empresa_id:2,nome:'Synthetic customer'}],
    movimentacoes_estoque:[{id:1,empresa_id:2,produto_id:1,quantidade:-1,custo_unitario:30,documento_estoque_id:1}],
    documentos_estoque:[{id:1,empresa_id:2,venda_id:1}],
    documentos_estoque_itens:[{empresa_id:2,documento_estoque_id:1,venda_item_id:10,produto_id:1,quantidade:1}],devolucoes_itens:[]
  }
  const partial=await queryFixture(reports.marginSql('venda'),linkedFixture)
  assert.equal(Number(partial[0].custo),60);assert.equal(partial[0].custo_estimado,true)
  linkedFixture.movimentacoes_estoque.push({id:2,empresa_id:2,produto_id:1,quantidade:1,custo_unitario:30,documento_estoque_id:2})
  linkedFixture.documentos_estoque.push({id:2,empresa_id:2,venda_id:1})
  linkedFixture.documentos_estoque_itens.push({empresa_id:2,documento_estoque_id:2,venda_item_id:10,produto_id:1,quantidade:1})
  linkedFixture.devolucoes_itens.push({empresa_id:2,venda_item_id:10,valor:100})
  const returned=await queryFixture(reports.marginSql('venda'),linkedFixture)
  assert.equal(Number(returned[0].custo),30);assert.equal(Number(returned[0].receita_liquida),100);assert.equal(Number(returned[0].margem),70)
  result.checks.linkedPartialDeliveryAndReturn='Costs stay assigned to the delivered/returned line; undelivered line retains estimated cost'
  result.checks.liveAffectedData=(await db.query(`SELECT
    (SELECT count(*) FROM (SELECT empresa_id,venda_id,produto_id FROM erp.vendas_itens WHERE excluido_em IS NULL AND produto_id IS NOT NULL GROUP BY 1,2,3 HAVING count(*)>1) x)::int repeated_product_groups,
    (SELECT count(*) FROM erp.devolucoes)::int returns,
    (SELECT count(*) FROM erp.comissoes_pagamentos)::int commission_payments`)).rows[0]
  await db.query('ROLLBACK')
} finally {await db.end()}

import crypto from 'node:crypto'
const errors = load('src/products/erp/shared/erpErrors.ts', {})
const identity = load('src/products/erp/server/erpCommercialIdempotency.ts', {'node:crypto':crypto,'../shared/erpErrors':errors})
const noWrite = {query:async sql=>{assert.match(sql,/^SELECT pg_advisory_xact_lock/);return {rows:[]}}}
const firstHash=await identity.commercialRequest(noWrite,2,'devolucao','key',{saleId:1,values:{a:1,b:2}})
assert.equal(firstHash,await identity.commercialRequest(noWrite,2,'devolucao','key',{values:{b:2,a:1},saleId:1}))
identity.assertCommercialReplay(firstHash,firstHash)
assert.throws(()=>identity.assertCommercialReplay(firstHash,'different'),e=>e.code==='IDEMPOTENCY_CONFLICT')
assert.throws(()=>identity.assertCommercialReplay(null,firstHash),e=>e.code==='IDEMPOTENCY_CONFLICT')
result.checks.requestSignature='same payload accepted; changed payload and unsigned legacy rejected'

// Unused dependencies are inert; the actual repository and HTTP branches under test execute.
function isolated(path,dependencies={}) {
 const source=readFileSync(path,'utf8'), names=[...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m=>m[1])
 return load(path,Object.assign(Object.fromEntries(names.map(name=>[name,{}])),dependencies))
}
let storedHash, writes=0
const replayClient={query:async(sql)=>{
 if(sql.startsWith('SELECT pg_advisory_xact_lock'))return {rows:[]}
 if(sql.includes('request_hash FROM erp.'))return {rows:[{id:'71',numero:'DEV-OLD',request_hash:storedHash}]}
 if(sql.includes('FROM erp.devolucoes_itens'))return {rows:[]}
 if(sql.includes('FROM erp.devolucoes d'))return {rows:[{id:'71',venda_id:'1',valor_total:'20',tratamento:'credito'}]}
 writes++;throw new Error('Unexpected replay query '+sql)
}}
const deps={'@/lib/postgres':{withTransaction:fn=>fn(replayClient)},'@/products/erp/shared/erpErrors':errors,'./erpCommercialIdempotency':identity}
const returns=isolated('src/products/erp/server/erpReturnsRepository.ts',deps)
const commercial=isolated('src/products/erp/server/erpCommercialRepository.ts',deps)
for(const [operation,run,payload] of [
 ['devolucao',v=>returns.createSaleReturn({tenantId:2,actorId:3,saleId:1,idempotencyKey:'key',values:v}),v=>({saleId:1,values:v})],
 ['credito_devolucao',v=>returns.useCustomerCredit({tenantId:2,actorId:3,returnId:71,idempotencyKey:'key',values:v}),v=>({returnId:71,values:v})],
 ['comissao',v=>commercial.payCommissions({tenantId:2,actorId:3,idempotencyKey:'key',values:v}),v=>v],
]) {
 const values={vendedor_id:5,valor:20}
 storedHash=await identity.commercialRequest(noWrite,2,operation,'key',payload(values))
 assert.equal((await run(values)).repetido,true)
 await assert.rejects(run({...values,valor:21}),e=>e.code==='IDEMPOTENCY_CONFLICT')
}
assert.equal(writes,0)
result.checks.serverReplays='return, credit and commission: replay succeeds; conflicting payload is blocked before writes'

const professional=isolated('src/products/erp/frontend/services/erpProfessionalClient.ts')
const {ErpMutation}=load('src/products/erp/frontend/services/erpMutation.ts',{'./erpProfessionalClient':professional})
const operations=new Map(), keys=[];let requests=0
const mutation=new ErpMutation(async(_url,init)=>{
 requests++;const key=init.headers['Idempotency-Key'];keys.push(key)
 if(!operations.has(key))operations.set(key,{id:operations.size+1})
 if(requests===1)throw new Error('Connection lost after commit')
 return new Response(JSON.stringify(operations.get(key)),{status:200})
},true)
await assert.rejects(mutation.submit('/api/erp/test',{value:1}),e=>e.code==='NETWORK_ERROR')
await assert.rejects(mutation.submit('/api/erp/test',{value:2}),e=>e.code==='OPERATION_UNCERTAIN')
const retries=await Promise.all([mutation.submit('/api/erp/test',{value:1}),mutation.submit('/api/erp/test',{value:1})])
assert.deepEqual(retries,[{id:1},{id:1}]);assert.equal(requests,2);assert.equal(operations.size,1);assert.equal(new Set(keys).size,1)
result.checks.browserLostResponse={requests,created:operations.size,concurrentRetryJoined:true,changedBodyBlocked:true}

const title={id:55,empresa_id:2,origem:'manual',status:'aberto',valor_total:100,data_competencia:'2026-10-11',data_emissao:'2026-10-11'}
const part={id:77,conta_pagar_id:55,numero_parcela:1,data_vencimento:'2026-10-31',valor:100,valor_pago:0}
let linked=true,mutations=[]
const linkedClient={query:async(sql)=>{
 if(sql.startsWith('SELECT * FROM erp.contas_pagar WHERE'))return {rows:[title]}
 if(sql.startsWith('SELECT * FROM erp.contas_pagar_parcelas'))return {rows:[part]}
 if(sql.includes('FROM erp.comissoes_pagamentos'))return {rows:linked?[{id:1}]:[]}
 if(sql.startsWith('SELECT'))return {rows:[]}
 mutations.push(sql);return {rows:[]}
}}
const crud=load('src/products/erp/server/erpCrudRepository.ts',{'./erpPeriodRepository':{assertErpPeriodOpen:async()=>{}},'../shared/erpErrors':errors,'../shared/erpMoney':{sumMoney:v=>v.reduce((a,b)=>a+b,0)}})
await assert.rejects(crud.changeManualFinancialTitle(linkedClient,2,3,'pagar',55,{motivo:'Test'},true,'api'),e=>e.status===409)
assert.equal(mutations.length,0);linked=false
await crud.changeManualFinancialTitle(linkedClient,2,3,'pagar',55,{motivo:'Test'},true,'api')
assert(mutations.length>0)
result.checks.linkedPayable='generated title protected; ordinary manual title remains editable'

// Export uses every page, including the final partial page, inside a read snapshot.
const fixtures=Array.from({length:251},(_,i)=>({id:String(i+1),nome:'Client',__total:251}))
let snapshot=false,pages=0
const importer=load('src/products/erp/server/erpImportRepository.ts',{
 'node:crypto':crypto,'@/lib/postgres':{runWithErpReadSnapshot:async fn=>{snapshot=true;try{return await fn()}finally{snapshot=false}}},
 '@/products/erp/server/erpRepository':{listErpEntityRecords:async({page,pageSize})=>{assert(snapshot);pages++;return fixtures.slice((page-1)*pageSize,page*pageSize)}},'../shared/erpErrors':errors
})
const exported=await importer.exportErpRecords(2,'clientes')
assert.equal(exported.length,251);assert.equal(pages,3);assert.equal(new Set(exported.map(r=>r.id)).size,251);assert(!('__total' in exported[0]))
result.checks.export={records:251,pages,snapshot:true}
result.status='passed';result.generatedAt=new Date().toISOString()
writeFileSync('.cache/erp-audit/corrections-regression.json',JSON.stringify(result,null,2))
console.log(JSON.stringify(result))
