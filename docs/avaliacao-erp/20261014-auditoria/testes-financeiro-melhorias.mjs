// Authorized QA company only. Every fixture is discarded by the outer transaction.
import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { writeFile } from 'node:fs/promises'
import { sourceLoader } from '../../../scripts/erp/accounting-test-runtime.mjs'
config({ path: '.env.local', quiet: true })
const load = sourceLoader(), pg = load('@/lib/postgres'), ctx = load('@/lib/erpDatabaseContext')
const repo = load('@/products/erp/server/erpRepository'), routines = load('@/products/erp/server/erpRoutineRepository')
const management = load('@/products/erp/server/erpManagementRepository'), crud = load('@/products/erp/server/erpCrudRepository')
const actor = { tenantId: 2, actorId: 3 }, tag = 'QA-OTTO-MELHORIAS-'+Date.now(), results = []
const rollback = new Error('QA_ROLLBACK')
try {
 await ctx.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Sao_Paulo',statementTimeoutMs:30000},()=>pg.withTransaction(async client=>{
  await pg.runWithErpTransactionClient(client, async()=>{
   const first = await repo.createErpEntityRecord({...actor,entityId:'contas-a-pagar',idempotencyKey:tag+'-rec',values:{fornecedor_id:295,descricao:tag,valor_total:100,categoria_id:128,data_competencia:'2027-01-31',data_vencimento:'2027-01-31',repetir:true,recorrencia:{frequencia:'mes',intervalo:1,termino_tipo:'ocorrencias',quantidade_ocorrencias:3}}})
   const title = (await client.query('SELECT c.id,c.descricao,c.recorrencia_financeira_id FROM erp.contas_pagar c JOIN erp.contas_pagar_parcelas p ON p.empresa_id=c.empresa_id AND p.conta_pagar_id=c.id WHERE p.empresa_id=$1 AND p.id=$2',[2,first.id])).rows[0]
   const recId=String(title.recorrencia_financeira_id)
   const recurrence=async()=>(await client.query('SELECT * FROM erp.recorrencias_financeiras WHERE empresa_id=$1 AND id=$2',[2,recId])).rows[0]
   const change=async(action,values,expected)=>(routines.changeFinancialRecurrence({...actor,id:recId,action,values,expectedUpdatedAt:expected||(await recurrence()).atualizado_em.toISOString()}))
   const edited={descricao:tag+' editada',termino_tipo:'ocorrencias',quantidade_ocorrencias:4}
   await assert.rejects(()=>change('editar',edited,'2000-01-01T00:00:00Z'),e=>e.code==='VERSION_CONFLICT')
   await assert.rejects(()=>change('editar',{...edited,quantidade_ocorrencias:1}),e=>e.code==='VALIDATION_ERROR')
   await change('editar',edited)
   assert.equal((await recurrence()).metadata.modelo.descricao,edited.descricao)
   assert.equal((await client.query('SELECT descricao FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2',[2,title.id])).rows[0].descricao,tag)
   const query=client.query.bind(client)
   client.query=(sql,args)=>sql.includes('SELECT * FROM erp.recorrencias_financeiras')&&sql.includes('FOR UPDATE SKIP LOCKED')
    ? query(sql.replace('WHERE empresa_id = $1','WHERE empresa_id = $1 AND id=$4'),[...args,recId]):query(sql,args)
   assert.equal((await repo.processErpFinancialRecurrences({...actor,throughDate:'2027-02-28',limit:100})).generated,1)
   const generated=(await query('SELECT descricao,data_competencia::text AS data FROM erp.contas_pagar WHERE empresa_id=$1 AND recorrencia_financeira_id=$2 ORDER BY data_competencia',[2,recId])).rows
   assert.deepEqual(generated.map(r=>r.descricao),[tag,edited.descricao]);assert.deepEqual(generated.map(r=>r.data),['2027-01-31','2027-02-28'])
   await change('pausar');assert.equal((await repo.processErpFinancialRecurrences({...actor,throughDate:'2027-03-31',limit:100})).generated,0)
   await change('retomar');assert.equal((await recurrence()).ativa,true)
   await change('encerrar');assert.equal((await repo.processErpFinancialRecurrences({...actor,throughDate:'2027-05-31',limit:100})).generated,0)
   await assert.rejects(()=>change('editar',edited),e=>e.code==='VALIDATION_ERROR')
   client.query=query
   results.push({group:'recorrências',passed:true,checks:['conflito de versão','término inválido recusado','edição afeta próxima ocorrência','título anterior preservado','pausar','retomar','encerrar','edição de encerrada recusada']})
   const makeTitle=async(side,account)=>Number(await crud.createManualFinancialTitle(client,2,3,side,{[side==='pagar'?'fornecedor_id':'cliente_id']:side==='pagar'?295:294,descricao:tag+' '+side,valor_total:100,categoria_id:side==='pagar'?128:127,data_competencia:'2026-10-14',data_emissao:'2026-10-14',parcelas:[{valor:100,data_vencimento:'2026-10-14'}]},tag+'-'+side+'-'+account,'api'))
   const settle=async(side,account)=>{const id=await makeTitle(side,account);const part=(await query(`SELECT id FROM erp.contas_${side}_parcelas WHERE empresa_id=$1 AND conta_${side}_id=$2`,[2,id])).rows[0];return (side==='pagar'?repo.settlePayableInstallment:repo.settleReceivableInstallment)({...actor,id:part.id,idempotencyKey:tag+'-pay-'+side+'-'+account,values:{valor:20,conta_financeira_id:account,metodo_pagamento_id:21,data_pagamento:'2026-10-14'}})}
   const matching=await settle('receber',21),wrongBank=await settle('receber',22),wrongSide=await settle('pagar',21)
   const tx=await management.createManagementOperation({...actor,resource:'conciliacao-bancaria',idempotencyKey:tag+'-tx',values:{conta_financeira_id:21,data:'2026-10-14',tipo:'credito',valor:20,descricao:tag}})
   const catalog=()=>management.searchErpOperationsCatalog({tenantId:2,source:'payments',transactionId:Number(tx.id),query:tag,limit:50})
   const options=await catalog();assert.deepEqual(options.map(x=>x.value),[String(matching.payment.id)])
   assert(options[0].label.includes('R$ 20,00'));assert(options[0].label.includes(tag));assert(options[0].label.includes('QA-OTTO Cliente Cenário'));assert(options[0].label.includes('QA-OTTO Banco Cenário'));assert(options[0].label.includes('#'+matching.payment.id))
   assert(!options.some(x=>x.value===String(wrongBank.payment.id)||x.value===String(wrongSide.payment.id)))
   await repo.reverseErpPayment({...actor,id:Number(matching.payment.id),idempotencyKey:tag+'-rev',reason:tag})
   assert.equal((await catalog()).length,0)
   assert.equal((await management.searchErpOperationsCatalog({tenantId:2,source:'payments',transactionId:999999999,query:tag})).length,0)
   results.push({group:'catálogo de baixas',passed:true,checks:['mesma conta','mesma direção','referência inequívoca','moeda pt-BR','documento e cliente','estornados excluídos','transação inexistente sem resultados']})
   await query('SET CONSTRAINTS ALL IMMEDIATE')
  })
  throw rollback
 }))
}catch(e){if(e!==rollback){console.error(e);results.push({passed:false,error:e.message});process.exitCode=1}}
finally{await pg.closePool();await writeFile('docs/avaliacao-erp/20261014-auditoria/financeiro-melhorias-regressao.json',JSON.stringify({at:new Date().toISOString(),rolledBack:true,results},null,2));console.log(JSON.stringify(results,null,2))}
