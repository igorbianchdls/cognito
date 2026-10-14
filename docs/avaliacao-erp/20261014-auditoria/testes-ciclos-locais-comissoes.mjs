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
const commercial=load('@/products/erp/server/erpCommercialRepository'), budget=load('@/products/erp/server/erpBudget')

import { writeFile } from 'node:fs/promises'
const actor={tenantId:2,actorId:3}, results=[], findings=[], rollback=new Error('QA_ROLLBACK_ONLY')
const today=load('@/products/erp/server/erpBusinessDate').erpToday()
let lastQuery='',seq=0,contractFilter=61
const key=label=>'QA-OTTO-20261014-'+label+'-'+(++seq)
try {
await context.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Sao_Paulo',statementTimeoutMs:30000},()=>pg.withTransaction(async client=>{
 const query=client.query.bind(client)
 client.query=async(sql,params)=>{lastQuery=sql.slice(0,200);if(sql.includes('FROM erp.contratos_vendas WHERE empresa_id=$1 AND status='))sql=sql.replace("AND status='ativo'","AND id="+contractFilter+" AND status='ativo'");return query(sql,params)}
 await pg.runWithErpTransactionClient(client,async()=>{
 const op=(resource,values,k=key(resource))=>stockRepo.createStockOperation({...actor,resource,values,idempotencyKey:k})
 const product=async(label)=>Number((await repo.createErpEntityRecord({...actor,entityId:'produtos',idempotencyKey:key('PRODUCT'),values:{nome:'QA-OTTO 20261014 '+label,sku:key(label),unidade_medida:'UN',preco:100,controla_estoque:'sim',status:'ativo'}})).id)
 const balance=async(p,l=10)=>{const b=(await client.query('SELECT quantidade_fisica,quantidade_reservada,custo_medio FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[2,p,l])).rows[0];return {qty:Number(b?.quantidade_fisica||0),reserved:Number(b?.quantidade_reservada||0),cost:Number(b?.custo_medio||0)}}
 const entry=(p,q,c,l=10)=>op('movimentacoes',{produto_id:p,local_estoque_id:l,tipo:'entrada',quantidade:q,custo_unitario:c,motivo:'QA-OTTO teste isolado'})
 const location=async()=>Number((await op('locais-estoque',{nome:'QA-OTTO Local Avançado',codigo:key('LOC')})).id)
 const makeSale=async(items,extra={},override)=>{
  const total=items.reduce((n,i)=>n+i.quantidade*i.valor_unitario-Number(i.desconto||0),0)-Number(extra.desconto||0)+Number(extra.frete||0)
  const saleId=Number((await repo.createErpEntityRecord({...actor,entityId:'pedidos',idempotencyKey:key('SALE'),values:{cliente_id:294,numero:key('VEN'),tipo_documento:'venda',categoria_id:127,local_estoque_id:10,data_venda:today,data_competencia:today,itens:items,parcelas:[{numero_parcela:1,data_vencimento:today,valor:total,conta_financeira_id:21,metodo_pagamento_id:21}],...extra}})).id)
  const confirmed=await repo.confirmErpSale({...actor,saleId,expectedVersion:1,creditOverrideReason:override});return {saleId,confirmed,details:await repo.getErpSaleDetails(2,saleId)}
 }
 const deliver=(saleId,items)=>professional.attendSaleItems({...actor,saleId,idempotencyKey:key('DEL'),values:{items}})
 const returnItem=(saleId,itemId,qty,treatment='credito',extra={},k=key('RET'))=>returns.createSaleReturn({...actor,saleId,idempotencyKey:k,values:{itens:[{venda_item_id:itemId,quantidade:qty}],tratamento:treatment,motivo:'QA-OTTO teste avançado isolado',data_devolucao:today,...extra}})
 const rowsAR=async(saleId)=>(await client.query(`SELECT parcelas.id,parcelas.valor,parcelas.valor_pago,parcelas.status,composicao.saldo,composicao.credito FROM erp.contas_receber_parcelas parcelas JOIN erp.contas_receber contas ON contas.empresa_id=parcelas.empresa_id AND contas.id=parcelas.conta_receber_id ${repo.financialCompositionSql('receber')} WHERE contas.empresa_id=$1 AND contas.venda_id=$2 ORDER BY parcelas.id`,[2,saleId])).rows
 const netCash=async(saleId)=>Number((await client.query("SELECT coalesce(sum(CASE WHEN p.estorno_de_pagamento_id IS NULL THEN p.valor_liquido ELSE -p.valor_liquido END),0) AS total FROM erp.pagamentos p JOIN erp.contas_receber_parcelas pa ON pa.empresa_id=p.empresa_id AND pa.id=p.conta_receber_parcela_id JOIN erp.contas_receber c ON c.empresa_id=pa.empresa_id AND c.id=pa.conta_receber_id WHERE c.empresa_id=$1 AND c.venda_id=$2",[2,saleId])).rows[0].total)
 // Fixa o contexto antes dos savepoints, para que o rollback de cada cenário não remova os GUCs da sessão.
 await client.query('SELECT id FROM erp.produtos WHERE empresa_id=$1 AND id=$2',[2,126])
 const rejectSafely=async(fn,predicate)=>{await client.query('SAVEPOINT qa_rejected');try{await assert.rejects(fn,predicate)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_rejected');await client.query('RELEASE SAVEPOINT qa_rejected')}}
 const scenario=async(name,fn)=>{if(process.argv[2]&&!name.includes(process.argv[2]))return;await client.query('SAVEPOINT qa_case');console.log('Testing '+name);try{const evidence=await fn();await client.query('SET CONSTRAINTS ALL IMMEDIATE');await client.query('SET CONSTRAINTS ALL DEFERRED');results.push({name,passed:true,evidence});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:{code:e.code,message:e.message,detail:e.detail,lastQuery}});console.log('FAIL '+name+' '+e.message)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_case');await client.query('RELEASE SAVEPOINT qa_case')}}

 await scenario('Duas vendas em locais diferentes devolvem ao custo de cada local',async()=>{
  const p=await product('MULTI-LOCAL'),l=await location();await entry(p,5,20);await entry(p,3,40,l)
  const a=await makeSale([{tipo:'produto',item_id:p,quantidade:2,valor_unitario:100}]),b=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{local_estoque_id:l}),ia=Number(a.details.items[0].id),ib=Number(b.details.items[0].id)
  await deliver(a.saleId,[{item_id:ia,quantidade:2,local_estoque_id:10}]);await deliver(b.saleId,[{item_id:ib,quantidade:1,local_estoque_id:l}]);await returnItem(a.saleId,ia,1);await returnItem(b.saleId,ib,1);assert.deepEqual(await balance(p),{qty:4,reserved:0,cost:20});assert.deepEqual(await balance(p,l),{qty:3,reserved:0,cost:40});await returnItem(a.saleId,ia,1);const aa=await balance(p),bb=await balance(p,l);assert.equal(aa.qty*aa.cost+bb.qty*bb.cost,220)
  return {primaryQty:5,primaryCost:20,secondaryQty:3,secondaryCost:40,totalValueRestored:220}
 })
 await scenario('Orçamento vencido ou recusado não é convertido',async()=>{
  const quote=async(validity)=>Number((await repo.createErpEntityRecord({...actor,entityId:'pedidos',idempotencyKey:key('QUOTE'),values:{cliente_id:294,numero:key('ORC'),tipo_documento:'orcamento',validade_em:validity,data_venda:today,data_competencia:today,itens:[{tipo:'servico',item_id:65,quantidade:1,valor_unitario:180}],parcelas:[{numero_parcela:1,data_vencimento:today,valor:180}]}})).id)
  const expired=await quote('2026-10-13');await rejectSafely(async()=>professional.convertQuoteToSale({...actor,quoteId:expired,expectedVersion:1}));const refused=await quote('2026-10-31');await professional.runQuoteAction({...actor,quoteId:refused,expectedVersion:1,action:'recusar',motivo:'QA-OTTO recusa'});const q=await repo.getErpSaleDetails(2,refused);await rejectSafely(async()=>professional.convertQuoteToSale({...actor,quoteId:refused,expectedVersion:Number(q.sale.versao)}));return {expiredBlocked:true,refusedBlocked:true}
 })
 await scenario('Contrato de fim de mês não gera ciclo além da vigência',async()=>{
  const created=await management.createManagementOperation({...actor,resource:'contratos',idempotencyKey:key('CTR-EOM'),values:{cliente_id:294,servico_id:65,numero:key('CTR'),descricao:'QA-OTTO fim de mês',quantidade:1,valor_unitario:180,data_inicio:'2026-10-31',data_fim:'2027-02-28',periodicidade:'mensal',dia_vencimento:31}});contractFilter=Number(created.id)
  const generated=await contracts.generateContractSales({...actor,until:'2027-02-28'});assert.equal(generated.total,4,JSON.stringify(generated));const detail=await contracts.getSalesContract(2,contractFilter),starts=detail.cycles.map(c=>String(c.periodo_inicio instanceof Date?c.periodo_inicio.toISOString():c.periodo_inicio).slice(0,10)).sort();assert.deepEqual(starts,['2026-10-31','2026-11-30','2026-12-31','2027-01-31'])
  const due=[];for(const g of generated.generated){const d=await repo.getErpSaleDetails(2,Number(g.saleId));assert.equal(Number(d.sale.total),180);due.push(String(d.installments[0].data_vencimento instanceof Date?d.installments[0].data_vencimento.toISOString():d.installments[0].data_vencimento).slice(0,10))};const again=await contracts.generateContractSales({...actor,until:'2027-02-28'});assert.equal(again.total,0);contractFilter=61;return {starts,due,total:720,repeated:0,partialCycleSkipped:generated.skipped}
 })
 await scenario('Comissão provisionada antes de devolução integral',async()=>{
  const seller=Number((await repo.createErpEntityRecord({...actor,entityId:'vendedores',idempotencyKey:key('SELLER'),values:{nome:key('QA-SELLER-RETURN'),tipo:'PF',status:'ativo'}})).id);await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,seller]);const p=await product('COMMISSION-RETURN');await entry(p,5,20);await commercial.saveCommissionRule({...actor,values:{nome:key('RULE'),vendedor_id:seller,produto_id:p,percentual:10,base:'faturamento',ativo:true}})
  const s=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{vendedor_id:seller});const provision=await commercial.payCommissions({...actor,idempotencyKey:key('PAY-COMM'),values:{vendedor_id:seller,ate:today,categoria_id:128,data_vencimento:today,conta_financeira_id:21}});await deliver(s.saleId,[{item_id:Number(s.details.items[0].id),quantidade:1}]);await returnItem(s.saleId,Number(s.details.items[0].id),1,'abater')
  const row=(await commercial.commissionReport(2,{inicio:today,fim:today,vendedor_id:seller})).records[0],ap=(await client.query('SELECT status,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2',[2,provision.conta_pagar_id])).rows[0]
  if(Number(row.valor_base)===0&&Number(ap.valor_total)>0&&!['cancelado','cancelada'].includes(ap.status))findings.push({severity:'P1',code:'COMMISSION_PAYABLE_SURVIVES_FULL_RETURN',message:'Devolução integral zera base comercial, mas mantém comissão e conta a pagar provisionada sem ajuste.',evidence:{commission:row,payable:ap}})
  return {commission:row,payable:ap}
 })

 await scenario('Cliente bloqueado não confirma venda nem com liberação',async()=>{
  const customer=Number((await repo.createErpEntityRecord({...actor,entityId:'clientes',idempotencyKey:key('BLOCKED-CLIENT'),values:{nome:key('QA-BLOCKED'),tipo:'PF',status:'ativo'}})).id);await client.query("UPDATE erp.entidades SET bloqueio_comercial=true,bloqueio_motivo='QA-OTTO',limite_credito=NULL WHERE empresa_id=$1 AND id=$2",[2,customer]);await rejectSafely(async()=>makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:1}],{cliente_id:customer},'QA-OTTO override'),e=>e.code==='CUSTOMER_BLOCKED');return {blockedCustomer:true,overrideDenied:true}
 })

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'ciclos-locais-comissoes.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
