import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { sourceLoader } from '../../../scripts/erp/accounting-test-runtime.mjs'
config({ path: '.env.local', quiet: true })
const load = sourceLoader(), pg = load('@/lib/postgres')
const context = load('@/lib/erpDatabaseContext')
const repo = load('@/products/erp/server/erpRepository')
const professional = load('@/products/erp/server/erpProfessionalRepository')
const returns = load('@/products/erp/server/erpReturnsRepository')
const finance = load('@/products/erp/server/erpFinanceRepository')
const management = load('@/products/erp/server/erpManagementRepository')
const stockRepo = load('@/products/erp/server/erpStockRepository')

const contracts=load('@/products/erp/server/erpSalesContracts')

import { writeFile } from 'node:fs/promises'
const actor={tenantId:2,actorId:3}, results=[], findings=[], rollback=new Error('QA_ROLLBACK_ONLY')
const today=load('@/products/erp/server/erpBusinessDate').erpToday()
let lastQuery='',seq=0
const key=label=>'QA-OTTO-20261014-'+label+'-'+(++seq)
try {
await context.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Sao_Paulo',statementTimeoutMs:30000},()=>pg.withTransaction(async client=>{
 const query=client.query.bind(client)
 client.query=async(sql,params)=>{lastQuery=sql.slice(0,200);if(sql.includes('FROM erp.contratos_vendas WHERE empresa_id=$1 AND status='))sql=sql.replace("AND status='ativo'","AND id=61 AND status='ativo'");return query(sql,params)}
 await pg.runWithErpTransactionClient(client,async()=>{
 const op=(resource,values,k=key(resource))=>stockRepo.createStockOperation({...actor,resource,values,idempotencyKey:k})
 const product=async(label)=>Number((await repo.createErpEntityRecord({...actor,entityId:'produtos',idempotencyKey:key('PRODUCT'),values:{nome:'QA-OTTO 20261014 '+label,sku:key(label),unidade_medida:'UN',preco:100,controla_estoque:'sim',status:'ativo'}})).id)
 const balance=async(p,l=10)=>{const b=(await client.query('SELECT quantidade_fisica,quantidade_reservada,custo_medio FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[2,p,l])).rows[0];return {qty:Number(b?.quantidade_fisica||0),reserved:Number(b?.quantidade_reservada||0),cost:Number(b?.custo_medio||0)}}
 const entry=(p,q,c,l=10)=>op('movimentacoes',{produto_id:p,local_estoque_id:l,tipo:'entrada',quantidade:q,custo_unitario:c,motivo:'QA-OTTO teste isolado'})
 const location=async()=>Number((await op('locais-estoque',{nome:'QA-OTTO Local Avançado',codigo:key('LOC')})).id)
 const makeSale=async(items,extra={})=>{
  const total=items.reduce((n,i)=>n+i.quantidade*i.valor_unitario-Number(i.desconto||0),0)-Number(extra.desconto||0)+Number(extra.frete||0)
  const saleId=Number((await repo.createErpEntityRecord({...actor,entityId:'pedidos',idempotencyKey:key('SALE'),values:{cliente_id:294,numero:key('VEN'),tipo_documento:'venda',categoria_id:127,local_estoque_id:10,data_venda:today,data_competencia:today,itens:items,parcelas:[{numero_parcela:1,data_vencimento:today,valor:total,conta_financeira_id:21,metodo_pagamento_id:21}],...extra}})).id)
  const confirmed=await repo.confirmErpSale({...actor,saleId,expectedVersion:1});return {saleId,confirmed,details:await repo.getErpSaleDetails(2,saleId)}
 }
 const deliver=(saleId,items)=>professional.attendSaleItems({...actor,saleId,idempotencyKey:key('DEL'),values:{items}})
 const returnItem=(saleId,itemId,qty,treatment='credito',extra={},k=key('RET'))=>returns.createSaleReturn({...actor,saleId,idempotencyKey:k,values:{itens:[{venda_item_id:itemId,quantidade:qty}],tratamento:treatment,motivo:'QA-OTTO teste avançado isolado',data_devolucao:today,...extra}})
 const rowsAR=async(saleId)=>(await client.query(`SELECT parcelas.id,parcelas.valor,parcelas.valor_pago,parcelas.status,composicao.saldo,composicao.credito FROM erp.contas_receber_parcelas parcelas JOIN erp.contas_receber contas ON contas.empresa_id=parcelas.empresa_id AND contas.id=parcelas.conta_receber_id ${repo.financialCompositionSql('receber')} WHERE contas.empresa_id=$1 AND contas.venda_id=$2 ORDER BY parcelas.id`,[2,saleId])).rows
 const netCash=async(saleId)=>Number((await client.query("SELECT coalesce(sum(CASE WHEN p.estorno_de_pagamento_id IS NULL THEN p.valor_liquido ELSE -p.valor_liquido END),0) AS total FROM erp.pagamentos p JOIN erp.contas_receber_parcelas pa ON pa.empresa_id=p.empresa_id AND pa.id=p.conta_receber_parcela_id JOIN erp.contas_receber c ON c.empresa_id=pa.empresa_id AND c.id=pa.conta_receber_id WHERE c.empresa_id=$1 AND c.venda_id=$2",[2,saleId])).rows[0].total)
 // Fixa o contexto antes dos savepoints, para que o rollback de cada cenário não remova os GUCs da sessão.
 await client.query('SELECT id FROM erp.produtos WHERE empresa_id=$1 AND id=$2',[2,126])
 const rejectSafely=async(fn,predicate)=>{await client.query('SAVEPOINT qa_rejected');try{await assert.rejects(fn,predicate)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_rejected');await client.query('RELEASE SAVEPOINT qa_rejected')}}
 const scenario=async(name,fn)=>{if(process.argv[2]&&!name.includes(process.argv[2]))return;await client.query('SAVEPOINT qa_case');console.log('Testing '+name);try{const evidence=await fn();await client.query('SET CONSTRAINTS ALL IMMEDIATE');await client.query('SET CONSTRAINTS ALL DEFERRED');results.push({name,passed:true,evidence});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:{code:e.code,message:e.message,detail:e.detail,lastQuery}});console.log('FAIL '+name+' '+e.message)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_case');await client.query('RELEASE SAVEPOINT qa_case')}}

 await scenario('Reenvio de atendimento parcial não pode consumir reserva duas vezes',async()=>{
  const p=await product('DEL-REPLAY');await entry(p,10,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:4,valor_unitario:100}]),item=Number(s.details.items[0].id)
  const input={...actor,saleId:s.saleId,idempotencyKey:key('DEL-REPLAY'),values:{items:[{item_id:item,quantidade:1,local_estoque_id:10}]}}
  const first=await professional.attendSaleItems(input),before={stock:await balance(p),details:await repo.getErpSaleDetails(2,s.saleId)}
  let repeated,error;try{repeated=await professional.attendSaleItems(input)}catch(e){error={code:e.code,message:e.message}}
  const after={stock:await balance(p),details:await repo.getErpSaleDetails(2,s.saleId)}
  const beforeDelivered=Number(before.details.items[0].quantidade_atendida),afterDelivered=Number(after.details.items[0].quantidade_atendida)
  if(afterDelivered!==beforeDelivered||after.stock.reserved!==before.stock.reserved)findings.push({severity:'P1',code:'PARTIAL_DELIVERY_REPLAY_CONSUMES_RESERVATION',message:'Reenviar a mesma entrega parcial avança o atendimento e reduz reserva novamente sem uma nova saída de estoque.',evidence:{sameDocument:String(first.documents[0].id)===String(repeated?.documents[0]?.id),stockBefore:before.stock,stockAfter:after.stock,deliveredBefore:beforeDelivered,deliveredAfter:afterDelivered}})
  return {before:before.stock,after:after.stock,deliveredBefore:beforeDelivered,deliveredAfter:afterDelivered,error}
 })
 await scenario('Cancelamento depois de devolução com crédito',async()=>{
  const p=await product('RETURN-CANCEL');await entry(p,5,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}]),item=Number(s.details.items[0].id)
  await deliver(s.saleId,[{item_id:item,quantidade:1}]);const credit=await returnItem(s.saleId,item,1,'credito')
  let cancelled,error;try{cancelled=await repo.cancelErpSale({...actor,id:s.saleId,reason:'QA-OTTO cancelamento após devolver',expectedVersion:3})}catch(e){error={code:e.code,message:e.message}}
  const creditAfter=await returns.getSaleReturn(2,Number(credit.record.id))
  if(cancelled&&Number(creditAfter.record.credito_disponivel)>0){
   const target=await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:100}]),parcels=await rowsAR(target.saleId)
   await returns.useCustomerCredit({...actor,returnId:Number(credit.record.id),idempotencyKey:key('CREDIT-AFTER-CANCEL'),values:{parcela_id:Number(parcels[0].id),valor:100,data:today}})
   const targetAfter=await rowsAR(target.saleId)
   findings.push({severity:'P1',code:'CANCELLED_SALE_LEAVES_USABLE_CUSTOMER_CREDIT',message:'Cancelar venda não recebida após devolução cancela o recebível, mas mantém crédito que pode quitar outra venda, concedendo 100 sem entrada de caixa.',evidence:{originalSale:s.saleId,cancelled:cancelled.status,remainingCreditBeforeUse:Number(creditAfter.record.credito_disponivel),targetParcel:targetAfter[0],cash:await netCash(target.saleId)}})
  }
  return {cancelled,error,creditBeforeUse:Number(creditAfter.record.credito_disponivel)}
 })
 await scenario('Serviço devolvido com abatimento e bloqueio de duplicação',async()=>{
  const s=await makeSale([{tipo:'servico',item_id:65,quantidade:2,valor_unitario:180}]),item=Number(s.details.items[0].id)
  const ret=await returnItem(s.saleId,item,1,'abater');assert.equal(Number(ret.record.valor_total),180);assert.equal(await netCash(s.saleId),0);const parcels=await rowsAR(s.saleId);assert.equal(Number(parcels[0].saldo),180)
  await rejectSafely(async()=>returnItem(s.saleId,item,2,'credito'));return {returnedService:180,open:180,cash:0}
 })

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'reenvios-cancelamentos-testes.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
