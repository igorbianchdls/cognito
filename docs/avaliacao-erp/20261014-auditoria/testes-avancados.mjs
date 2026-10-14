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
 await scenario('Inventário multi-itens, rollback integral, repetição e conflito',async()=>{
  const a=await product('INV-A'),b=await product('INV-B');await entry(a,10,20);await entry(b,5,30)
  const vals={local_estoque_id:10,data:today,motivo:'QA-OTTO contagem',itens:[{produto_id:a,quantidade_sistema:10,quantidade_contada:12},{produto_id:b,quantidade_sistema:999,quantidade_contada:4}]}
  await rejectSafely(async()=>op('inventarios',vals),e=>e.code==='STOCK_COUNT_CONFLICT');assert.equal((await balance(a)).qty,10);assert.equal((await balance(b)).qty,5)
  vals.itens[1].quantidade_sistema=5;const k=key('INV'),inv=await op('inventarios',vals,k),repeat=await op('inventarios',vals,k);assert.equal(inv.id,repeat.id)
  assert.deepEqual(await balance(a),{qty:12,reserved:0,cost:20});assert.deepEqual(await balance(b),{qty:4,reserved:0,cost:30})
  const moves=(await client.query("SELECT count(*)::int n FROM erp.movimentacoes_estoque WHERE empresa_id=$1 AND origem_tipo='inventario' AND origem_id=$2",[2,Number(inv.id)])).rows[0];assert.equal(moves.n,2)
  await rejectSafely(async()=>op('inventarios',vals),e=>e.code==='STOCK_COUNT_CONFLICT')
  const inactive=await location();await client.query('UPDATE erp.locais_estoque SET ativo=false WHERE empresa_id=$1 AND id=$2',[2,inactive]);await rejectSafely(async()=>entry(a,1,20,inactive));await rejectSafely(async()=>op('transferencias',{produto_id:a,local_origem_id:10,local_destino_id:inactive,quantidade:1,data:today}));assert.equal((await balance(a)).qty,12)
  return {a:12,b:4,value:360,movements:2,replay:true,atomicFailure:true,inactiveLocationBlocked:true}
 })
 await scenario('Transferências entre locais com custo médio diferente',async()=>{
  const p=await product('TRANSFER'),l=await location();await entry(p,10,20);await entry(p,5,40,l)
  await op('transferencias',{produto_id:p,local_origem_id:10,local_destino_id:l,quantidade:3,data:today});assert.deepEqual(await balance(p),{qty:7,reserved:0,cost:20});assert.deepEqual(await balance(p,l),{qty:8,reserved:0,cost:32.5})
  await op('transferencias',{produto_id:p,local_origem_id:l,local_destino_id:10,quantidade:4,data:today});const a=await balance(p),b=await balance(p,l);assert.equal(a.qty+b.qty,15);assert.ok(Math.abs(a.qty*a.cost+b.qty*b.cost-400)<0.0001)
  return {totalQty:15,totalValue:a.qty*a.cost+b.qty*b.cost,primary:a,secondary:b}
 })
 await scenario('Local solicitado na entrega e devolução ao local efetivo',async()=>{
  const p=await product('LOCAL-DELIVERY'),l=await location();await entry(p,5,20);await entry(p,5,40,l)
  const s=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}]),item=Number(s.details.items[0].id)
  const d=await deliver(s.saleId,[{item_id:item,quantidade:1,local_estoque_id:l}]);const a=await balance(p),b=await balance(p,l)
  if(a.qty===4&&b.qty===5)findings.push({severity:'P2',code:'SALE_DELIVERY_LOCATION_IGNORED',message:'Entrega aceita local diferente, mas baixa o local da reserva sem informar que ignorou a seleção.',evidence:{requestedLocal:l,reservedLocal:10,primary:a,secondary:b}})
  await returnItem(s.saleId,item,1);assert.equal((await balance(p)).qty,5);assert.equal((await balance(p,l)).qty,5)
  return {requestedLocal:l,document:d.documents,afterDelivery:{primary:a,secondary:b},returnToActualLocation:true}
 })
 await scenario('Devolução com abatimento, desconto, frete e sem caixa',async()=>{
  const p=await product('ABATER');await entry(p,10,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:4,valor_unitario:100}],{desconto:40,frete:10}),item=Number(s.details.items[0].id)
  await deliver(s.saleId,[{item_id:item,quantidade:4}]);const k=key('ABATER'),ret=await returnItem(s.saleId,item,2,'abater',{},k),repeat=await returnItem(s.saleId,item,2,'abater',{},k);assert.equal(ret.record.id,repeat.record.id);assert.equal(Number(ret.record.valor_total),180);assert.equal((await balance(p)).qty,8);assert.equal(await netCash(s.saleId),0)
  const ar=await rowsAR(s.saleId);assert.equal(Number(ar[0].saldo),190)
  await returnItem(s.saleId,item,2,'abater');const end=await rowsAR(s.saleId);assert.equal(Number(end[0].saldo),10);assert.equal((await balance(p)).qty,10)
  await rejectSafely(async()=>returnItem(s.saleId,item,1,'abater'));return {saleTotal:370,firstReturn:180,afterFirst:190,remainingFreight:10,cash:0,stockRestored:10}
 })
 await scenario('Reembolso de venda paga gera conta a pagar sem pagar automaticamente',async()=>{
  await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,294])
  const p=await product('REEMBOLSO');await entry(p,5,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:2,valor_unitario:100}]),item=Number(s.details.items[0].id);await deliver(s.saleId,[{item_id:item,quantidade:2}]);const ar=await rowsAR(s.saleId)
  await repo.settleReceivableInstallment({...actor,id:Number(ar[0].id),idempotencyKey:key('PAY'),values:{valor:200,conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today}})
  const ret=await returnItem(s.saleId,item,1,'reembolso',{categoria_id:128,data_vencimento:today,conta_financeira_id:21})
  const payable=(await client.query('SELECT c.valor_total,c.fornecedor_id,p.valor,p.valor_pago,p.status FROM erp.contas_pagar c JOIN erp.contas_pagar_parcelas p ON p.empresa_id=c.empresa_id AND p.conta_pagar_id=c.id WHERE c.empresa_id=$1 AND c.id=$2',[2,ret.record.conta_pagar_id])).rows[0]
  assert.equal(Number(payable.valor_total),100);assert.equal(Number(payable.valor_pago),0);assert.equal(Number(payable.fornecedor_id),294);assert.equal((await rowsAR(s.saleId))[0].status,'pago');assert.equal(await netCash(s.saleId),200);assert.equal((await balance(p)).qty,4)
  return {payable:100,paid:0,receivable:'pago',cashUnchanged:200,stock:4}
 })
 await scenario('Cancelamento após recebimento exige estorno',async()=>{
  const s=await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:180}]),ar=await rowsAR(s.saleId)
  const pay=await repo.settleReceivableInstallment({...actor,id:Number(ar[0].id),idempotencyKey:key('PARTIAL-PAY'),values:{valor:50,conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today}})
  await rejectSafely(async()=>repo.cancelErpSale({...actor,id:s.saleId,reason:'QA-OTTO',expectedVersion:2}),e=>e.message.includes('pagamento'));assert.equal(await netCash(s.saleId),50)
  await repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO estorno de teste',idempotencyKey:key('REVERSE')});await repo.cancelErpSale({...actor,id:s.saleId,reason:'QA-OTTO após estorno',expectedVersion:2});assert.equal((await rowsAR(s.saleId))[0].status,'cancelado');assert.equal(await netCash(s.saleId),0)
  return {blockedBeforeReversal:true,afterReversal:'cancelada',netCash:0}
 })
 await scenario('Cancelamento de venda entregue sem recebimento',async()=>{
  const p=await product('DELIVERED-CANCEL');await entry(p,5,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}]),item=Number(s.details.items[0].id);await deliver(s.saleId,[{item_id:item,quantidade:1}]);let cancelled,error
  try{cancelled=await repo.cancelErpSale({...actor,id:s.saleId,reason:'QA-OTTO teste cancelamento entregue',expectedVersion:3})}catch(e){error={code:e.code,message:e.message}}
  const b=await balance(p);if(cancelled&&b.qty===4)findings.push({severity:'P1',code:'DELIVERED_SALE_CANCEL_NO_STOCK_REVERSAL',message:'Venda entregue foi cancelada e o recebível cancelado, mas o produto continuou baixado sem devolução.',evidence:{saleId:s.saleId,stockBefore:5,stockAfter:b.qty,cancelled}})
  return {cancelled,error,balance:b,receivable:await rowsAR(s.saleId)}
 })
 await scenario('OS editável só em rascunho e orçamento convertido preserva vínculo',async()=>{
  const vals={cliente_id:294,numero:key('OS'),status:'rascunho',data_inicio:today,desconto:0,itens:[{tipo:'servico',item_id:65,descricao:'QA-OTTO serviço avançado',quantidade:1,valor_unitario:180,desconto:0}]}
  const os=await professional.createServiceOrder({...actor,values:vals,idempotencyKey:key('OS-CREATE')}),orderId=Number(os.id);vals.desconto=20;vals.itens[0].quantidade=2
  await professional.createServiceOrder({...actor,orderId,expectedVersion:1,values:vals});const edited=await professional.getServiceOrder(2,orderId);assert.equal(Number(edited.order.total),340)
  await rejectSafely(async()=>professional.createServiceOrder({...actor,orderId,expectedVersion:1,values:vals}),e=>e.code==='VERSION_CONFLICT')
  await professional.runServiceOrderAction({...actor,orderId,action:'aprovar',expectedVersion:2});await rejectSafely(async()=>professional.createServiceOrder({...actor,orderId,expectedVersion:3,values:vals}),e=>e.code==='INVALID_STATE')
  const quote=await professional.runServiceOrderAction({...actor,orderId,action:'gerar_orcamento',expectedVersion:3});const q=await repo.getErpSaleDetails(2,Number(quote.id));assert.equal(Number(q.sale.total),340)
  const converted=await professional.convertQuoteToSale({...actor,quoteId:Number(quote.id),expectedVersion:Number(q.sale.versao)});const linked=await professional.getServiceOrder(2,orderId);assert.equal(String(linked.order.venda_id),String(converted.sale.id));assert.equal(String(linked.order.orcamento_id),String(quote.id))
  const repeated=await professional.runServiceOrderAction({...actor,orderId,action:'gerar_venda',expectedVersion:Number(linked.order.versao)});assert.equal(String(repeated.id),String(converted.sale.id));assert.equal(repeated.reused,true)
  return {editedTotal:340,quoteTotal:340,linkedSale:String(converted.sale.id),repeated:true,staleEditBlocked:true}
 })
 await scenario('Revisão de contrato preserva ciclo anterior e aplica novo preço',async()=>{
  const c=await contracts.getSalesContract(2,61);assert.equal(c.record.numero,'QA-OTTO-CTR-018');const first=await contracts.generateContractSales({...actor,until:'2026-10-13'});assert.equal(first.total,1,JSON.stringify(first));const oldSale=await repo.getErpSaleDetails(2,Number(first.generated[0].saleId));assert.equal(Number(oldSale.sale.total),180)
  const after=await contracts.getSalesContract(2,61),item=after.versions[0].itens[0],rev={...actor,id:61,expectedVersion:Number(after.record.versao),inicio:'2026-11-13',motivo:'QA-OTTO revisão isolada',itens:[{id:String(item.id),quantidade:1,valor_unitario:220}]}
  await rejectSafely(async()=>contracts.reviseSalesContract({...rev,inicio:'2026-11-14'}),e=>e.code==='INVALID_PERIOD');await contracts.reviseSalesContract(rev);await rejectSafely(async()=>contracts.reviseSalesContract(rev),e=>e.code==='VERSION_CONFLICT')
  const next=await contracts.generateContractSales({...actor,until:'2026-11-13'});assert.equal(next.total,1,JSON.stringify(next));const nextSale=await repo.getErpSaleDetails(2,Number(next.generated[0].saleId));assert.equal(Number(nextSale.sale.total),220);assert.equal(Number((await repo.getErpSaleDetails(2,Number(first.generated[0].saleId))).sale.total),180)
  const repeat=await contracts.generateContractSales({...actor,until:'2026-11-13'});assert.equal(repeat.total,0);return {oldCycle:180,newCycle:220,repeated:0,versionConflictBlocked:true}
 })
 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'estoque-vendas-servicos-testes.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
