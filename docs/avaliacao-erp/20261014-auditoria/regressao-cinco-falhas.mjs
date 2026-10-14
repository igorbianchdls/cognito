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

 const party=async(role,label)=>Number((await repo.createErpEntityRecord({...actor,entityId:role,idempotencyKey:key('PARTY'),values:{nome:key('QA-'+label),tipo:'PF',status:'ativo'}})).id)
 const rule=async(seller,p,base='faturamento')=>commercial.saveCommissionRule({...actor,values:{nome:key('COMMISSION'),vendedor_id:seller,produto_id:p,percentual:10,base,ativo:true}})
 const commissions=async(seller)=>commercial.commissionReport(2,{inicio:today,fim:today,vendedor_id:seller})
 const cashReceipt=async(saleId,value)=>{const ar=await rowsAR(saleId);return repo.settleReceivableInstallment({...actor,id:Number(ar[0].id),idempotencyKey:key('PAY'),values:{valor:value,conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today}})}
 await scenario('Custo histórico em devoluções intercaladas com nova entrada',async()=>{
  const p=await product('RETURN-COST-CHANGES');await entry(p,5,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:2,valor_unitario:100}]),item=Number(s.details.items[0].id)
  await deliver(s.saleId,[{item_id:item,quantidade:1}]);await returnItem(s.saleId,item,1);await entry(p,5,40);await deliver(s.saleId,[{item_id:item,quantidade:1}]);await returnItem(s.saleId,item,1)
  const final=await balance(p),cmv=Number((await client.query("SELECT sum(m.quantidade*m.custo_unitario) AS total FROM erp.movimentacoes_estoque m LEFT JOIN erp.documentos_estoque d ON d.empresa_id=m.empresa_id AND d.id=m.documento_estoque_id WHERE m.empresa_id=$1 AND (m.origem_tipo='venda' AND m.origem_id=$2 OR d.venda_id=$2)",[2,s.saleId])).rows[0].total)
  assert.equal(final.qty,10);if(Math.abs(final.qty*final.cost-300)>0.0001||Math.abs(cmv)>0.0001)assert.fail(JSON.stringify({severity:'P1',code:'RETURN_COST_AFTER_NEW_DELIVERY',message:'Devolução total após retornos/entradas/entregas intercalados não restaura o valor original nem zera CMV.',evidence:{expectedStockValue:300,actualStockValue:final.qty*final.cost,netCMV:cmv,final}}))
  return {expectedValue:300,actualValue:final.qty*final.cost,netCMV:cmv}
 })
 await scenario('Comissão por faturamento desconta devolução e ignora frete',async()=>{
  const p=await product('COMMISSION-REVENUE'),seller=await party('vendedores','SELLER');await rule(seller,p);await entry(p,10,20)
  const s=await makeSale([{tipo:'produto',item_id:p,quantidade:4,valor_unitario:100}],{desconto:40,frete:10,vendedor_id:seller});const before=await commissions(seller);assert.equal(Number(before.records[0].valor),36)
  const item=Number(s.details.items[0].id);await deliver(s.saleId,[{item_id:item,quantidade:4}]);await returnItem(s.saleId,item,1);const after=await commissions(seller);assert.equal(Number(after.records[0].valor),27);assert.equal(Number(after.records[0].valor_base),270)
  const pay=await cashReceipt(s.saleId,100);await repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO estorno',idempotencyKey:key('REV')});assert.equal(Number((await commissions(seller)).records[0].valor),27)
  return {sale:370,freightExcluded:10,baseBefore:360,commissionBefore:36,baseAfter:270,commissionAfter:27,receiptReversalDoesNotChangeRevenueBasis:true}
 })
 await scenario('Comissão por recebimento libera proporcionalmente e reverte estorno',async()=>{
  const p=await product('COMMISSION-CASH'),seller=await party('vendedores','SELLER-CASH');await rule(seller,p,'recebimento');await entry(p,5,20)
  const s=await makeSale([{tipo:'produto',item_id:p,quantidade:2,valor_unitario:100}],{vendedor_id:seller});assert.equal(Number((await commissions(seller)).records[0].liberado),0)
  const pay=await cashReceipt(s.saleId,50);assert.equal(Number((await commissions(seller)).records[0].liberado),5);await repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO estorno',idempotencyKey:key('REV')});assert.equal(Number((await commissions(seller)).records[0].liberado),0)
  await deliver(s.saleId,[{item_id:Number(s.details.items[0].id),quantidade:2}]);await returnItem(s.saleId,Number(s.details.items[0].id),1,'abater');const after=await commissions(seller);assert.equal(Number(after.records[0].valor),10);assert.equal(Number(after.records[0].liberado),0)
  return {fullCommission:20,receipt50Released:5,afterReversal:0,afterReturnCommission:10,afterAbatementReleased:0}
 })
 await scenario('Comissão provisionada antes de cancelar venda',async()=>{
  const p=await product('COMMISSION-PAYOUT'),seller=await party('vendedores','SELLER-PAYOUT');await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,seller]);await rule(seller,p);await entry(p,5,20)
  const s=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{vendedor_id:seller});const k=key('COMM-PAY'),payInput={...actor,idempotencyKey:k,values:{vendedor_id:seller,ate:today,categoria_id:128,data_vencimento:today,conta_financeira_id:21}}
  const paid=await commercial.payCommissions(payInput),repeated=await commercial.payCommissions(payInput);assert.equal(String(paid.id),String(repeated.id));let cancelled,error;try{cancelled=await repo.cancelErpSale({...actor,id:s.saleId,expectedVersion:2,reason:'QA-OTTO comissão provisionada'})}catch(e){error={code:e.code,message:e.message}}
  const ap=(await client.query('SELECT status,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2',[2,paid.conta_pagar_id])).rows[0]
  if(cancelled&&!['cancelado','cancelada'].includes(ap.status))assert.fail(JSON.stringify({severity:'P1',code:'COMMISSION_PAYABLE_SURVIVES_SALE_CANCEL',message:'Cancelar venda sem entrega cancela comissão no relatório, mas mantém conta a pagar de comissão provisionada.',evidence:{cancelled:cancelled.status,payable:ap,paymentId:paid.id}}))
  assert.ifError(error);assert.equal(ap.status,'cancelado');return {provisioned:paid,cancelled,error,payable:ap}
 })
 await scenario('Limite de crédito, liberação com motivo e bloqueio comercial',async()=>{
  const customer=await party('clientes','CREDIT');await client.query('UPDATE erp.entidades SET limite_credito=100 WHERE empresa_id=$1 AND id=$2',[2,customer]);await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:70}],{cliente_id:customer})
  await rejectSafely(async()=>makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:40}],{cliente_id:customer}),e=>e.code==='CREDIT_LIMIT_EXCEEDED')
  const allowed=await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:40}],{cliente_id:customer},'QA-OTTO liberação administrativa de teste');const audit=(await client.query('SELECT credito_liberado_por,credito_liberado_motivo FROM erp.vendas WHERE empresa_id=$1 AND id=$2',[2,allowed.saleId])).rows[0];assert.equal(Number(audit.credito_liberado_por),3)
  await client.query("UPDATE erp.entidades SET bloqueio_comercial=true,bloqueio_motivo='QA-OTTO bloqueio' WHERE empresa_id=$1 AND id=$2",[2,customer]);await rejectSafely(async()=>makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:1}],{cliente_id:customer},'QA-OTTO liberação'),e=>e.code==='CUSTOMER_BLOCKED')
  return {limit:100,first:70,excess40Blocked:true,adminOverrideAudited:true,blockedCustomerCannotOverride:true}
 })
 await scenario('Tabela de preço com faixas, validade e desconto geral',async()=>{
  const p=await product('PRICE-TIER');await entry(p,30,20);const table=await commercial.savePriceTable({...actor,values:{nome:key('PRICE'),ativo:true,padrao:false,vigencia_inicio:'2026-10-01',vigencia_fim:'2026-10-31',itens:[{tipo:'produto',item_id:p,preco:100,preco_minimo:90,desconto_maximo_percentual:10,quantidade_minima:1},{tipo:'produto',item_id:p,preco:80,preco_minimo:75,desconto_maximo_percentual:10,quantidade_minima:10}]}})
  await rejectSafely(async()=>makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:89}],{tabela_preco_id:Number(table.record.id)}))
  const bulk=await makeSale([{tipo:'produto',item_id:p,quantidade:10,valor_unitario:80}],{tabela_preco_id:Number(table.record.id)});assert.equal(Number(bulk.details.sale.total),800)
  await rejectSafely(async()=>makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{tabela_preco_id:Number(table.record.id),desconto:30}));
  const discounted=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{tabela_preco_id:Number(table.record.id),desconto:10});assert.equal(Number(discounted.details.sale.total),90);const error=null;
  await client.query('UPDATE erp.tabelas_preco SET vigencia_fim=$3 WHERE empresa_id=$1 AND id=$2',[2,table.record.id,'2026-10-13']);await rejectSafely(async()=>makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{tabela_preco_id:Number(table.record.id)}))
  return {belowItemMinimumBlocked:true,bulkTotal:800,headerDiscountFinal:discounted?.details.sale.total,error,expiredTableBlocked:true}
 })
 await scenario('Metas consideram confirmadas e excluem canceladas e orçamentos',async()=>{
  const seller=await party('vendedores','GOALS');const goal=await budget.saveSalesGoal({...actor,values:{mes:today.slice(0,7),vendedor_id:seller,valor:1000}});const same=await budget.saveSalesGoal({...actor,values:{mes:today.slice(0,7),vendedor_id:seller,valor:1200}});assert.equal(String(goal.id),String(same.id))
  const sale=await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:300}],{vendedor_id:seller});await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:200}],{vendedor_id:seller})
  const name=(await client.query('SELECT nome FROM erp.entidades WHERE empresa_id=$1 AND id=$2',[2,seller])).rows[0].nome;const rows=await budget.salesGoalsReport(2,'2026-10-01','2026-10-31'),r=rows.find(x=>x.vendedor===name);assert.equal(Number(r.realizado),500);assert.equal(Number(r.meta),1200)
  await repo.cancelErpSale({...actor,id:sale.saleId,expectedVersion:2,reason:'QA-OTTO meta'});const end=(await budget.salesGoalsReport(2,'2026-10-01','2026-10-31')).find(x=>x.vendedor===name);assert.equal(Number(end.realizado),200)
  return {upsert:true,target:1200,beforeCancel:500,afterCancel:200,attainment:Number(end.atingimento_percentual)}
 })
 await scenario('Estoque fracionado, unidade sem conversão e produto inativo',async()=>{
  const p=await product('FRACTION');await entry(p,1.5,12);await op('movimentacoes',{produto_id:p,local_estoque_id:10,tipo:'saida',quantidade:0.25,motivo:'QA-OTTO fração'});assert.equal((await balance(p)).qty,1.25)
  await rejectSafely(async()=>op('movimentacoes',{produto_id:p,local_estoque_id:10,tipo:'entrada',quantidade:1,unidade:'CX',custo_unitario:12,motivo:'QA-OTTO'}));await rejectSafely(async()=>op('conversoes-unidades',{produto_id:p,unidade_origem:'CX',unidade_destino:'UN',fator:0}))
  await client.query('UPDATE erp.produtos SET ativo=false WHERE empresa_id=$1 AND id=$2',[2,p]);await rejectSafely(async()=>entry(p,1,12));assert.equal((await balance(p)).qty,1.25)
  return {fractionalQty:1.25,value:15,missingConversionBlocked:true,zeroFactorBlocked:true,inactiveProductBlocked:true}
 })
 await scenario('Kit circular e aninhado recusados; kit fracionado preserva componentes',async()=>{
  const a=await product('KIT-COMP'),k=await product('KIT-PARENT'),nested=await product('KIT-NESTED');await entry(a,10,20);await op('kits',{produto_id:k,produto_componente_id:a,quantidade:2})
  await rejectSafely(async()=>op('kits',{produto_id:k,produto_componente_id:k,quantidade:1}));await rejectSafely(async()=>op('kits',{produto_id:a,produto_componente_id:k,quantidade:1}));await rejectSafely(async()=>op('kits',{produto_id:nested,produto_componente_id:k,quantidade:1}))
  const s=await makeSale([{tipo:'produto',item_id:k,quantidade:0.5,valor_unitario:100}]);await deliver(s.saleId,[{item_id:Number(s.details.items[0].id),quantidade:0.5}]);assert.equal((await balance(a)).qty,9);await returnItem(s.saleId,Number(s.details.items[0].id),0.5);assert.equal((await balance(a)).qty,10);assert.equal((await balance(k)).qty,0)
  return {circularBlocked:true,nestedBlocked:true,halfKitConsumes:1,returnRestores:1,parentStock:0}
 })
 await scenario('Reembolso seguido de cancelamento preserva a contrapartida',async()=>{
  const customer=await party('clientes','REFUND');await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,customer]);const s=await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:100}],{cliente_id:customer});await cashReceipt(s.saleId,100)
  const ret=await returnItem(s.saleId,Number(s.details.items[0].id),1,'reembolso',{categoria_id:128,data_vencimento:today});await rejectSafely(async()=>repo.cancelErpSale({...actor,id:s.saleId,expectedVersion:2,reason:'QA-OTTO reembolso'}),e=>e.code==='SALE_HAS_RETURNS')
  const ap=(await client.query('SELECT valor_total,status FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2',[2,ret.record.conta_pagar_id])).rows[0];assert.equal(Number(ap.valor_total),100);assert.equal((await rowsAR(s.saleId))[0].status,'pago')
  return {cancelBlocked:true,receivablePaid:100,payable:100,cashReceived:100}
 })
 await scenario('Transporte inválido e parcelas divergentes são recusados',async()=>{
  await rejectSafely(async()=>makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:100}],{transportadora_id:294}));await rejectSafely(async()=>makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:100}],{modalidade_frete:'invalido'}));await rejectSafely(async()=>makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:100}],{parcelas:[{numero_parcela:1,data_vencimento:today,valor:99}]}))
  return {wrongCarrierBlocked:true,wrongFreightModeBlocked:true,installmentsMismatchBlocked:true}
 })
 await scenario('Devolução e entrega não aceitam quantidade excedente ou item alheio',async()=>{
  const p=await product('BOUNDARIES');await entry(p,5,20);const s=await makeSale([{tipo:'produto',item_id:p,quantidade:2,valor_unitario:100}]),item=Number(s.details.items[0].id)
  await rejectSafely(async()=>deliver(s.saleId,[{item_id:item,quantidade:3}]));await rejectSafely(async()=>deliver(s.saleId,[{item_id:999999999,quantidade:1}]));await rejectSafely(async()=>returnItem(s.saleId,item,1));await deliver(s.saleId,[{item_id:item,quantidade:1}]);await rejectSafely(async()=>returnItem(s.saleId,item,2));await rejectSafely(async()=>returnItem(s.saleId,999999999,1))
  assert.deepEqual(await balance(p),{qty:4,reserved:1,cost:20});return {overDeliveryBlocked:true,undeliveredReturnBlocked:true,overReturnBlocked:true,foreignItemsBlocked:true,stock:4,reserved:1}
 })
 await scenario('Comissão provisionada antes de devolução integral',async()=>{
  const seller=Number((await repo.createErpEntityRecord({...actor,entityId:'vendedores',idempotencyKey:key('SELLER'),values:{nome:key('QA-SELLER-RETURN'),tipo:'PF',status:'ativo'}})).id);await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,seller]);const p=await product('COMMISSION-RETURN');await entry(p,5,20);await commercial.saveCommissionRule({...actor,values:{nome:key('RULE'),vendedor_id:seller,produto_id:p,percentual:10,base:'faturamento',ativo:true}})
  const s=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{vendedor_id:seller});const provision=await commercial.payCommissions({...actor,idempotencyKey:key('PAY-COMM'),values:{vendedor_id:seller,ate:today,categoria_id:128,data_vencimento:today,conta_financeira_id:21}});await deliver(s.saleId,[{item_id:Number(s.details.items[0].id),quantidade:1}]);await returnItem(s.saleId,Number(s.details.items[0].id),1,'abater')
  const row=(await commercial.commissionReport(2,{inicio:today,fim:today,vendedor_id:seller})).records[0],ap=(await client.query('SELECT status,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2',[2,provision.conta_pagar_id])).rows[0]
  assert.equal(Number(row.valor_base),0);assert.equal(Number(row.valor),0);assert.equal(Number(row.valor_pago),0);assert.equal(ap.status,'cancelado')
  return {commission:row,payable:ap}
 })


 await scenario('Provisão agrupada preserva outra venda e ajusta devoluções parciais',async()=>{
 const seller=await party('vendedores','GROUPED');await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,seller]);const p=await product('GROUPED');await entry(p,10,20);await rule(seller,p);
 const a=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{vendedor_id:seller});const b=await makeSale([{tipo:'produto',item_id:p,quantidade:2,valor_unitario:100}],{vendedor_id:seller});
 const provision=await commercial.payCommissions({...actor,idempotencyKey:key('GROUP-PAY'),values:{vendedor_id:seller,ate:today,categoria_id:128,data_vencimento:today,conta_financeira_id:21}});
 const ap=async()=>(await client.query('SELECT status,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2',[2,provision.conta_pagar_id])).rows[0];assert.equal(Number((await ap()).valor_total),30);
 await repo.cancelErpSale({...actor,id:a.saleId,expectedVersion:2,reason:'QA-OTTO agrupamento'});assert.equal(Number((await ap()).valor_total),20);
 const item=Number(b.details.items[0].id);await deliver(b.saleId,[{item_id:item,quantidade:2}]);await returnItem(b.saleId,item,1,'abater');assert.equal(Number((await ap()).valor_total),10);await returnItem(b.saleId,item,1,'abater');assert.equal((await ap()).status,'cancelado');
 const adj=(await client.query('SELECT valor,valor_ajustado FROM erp.comissoes_pagamentos WHERE empresa_id=$1 AND id=$2',[2,provision.id])).rows[0];assert.equal(Number(adj.valor),30);assert.equal(Number(adj.valor_ajustado),30);return {original:30,afterCancel:20,afterPartialReturn:10,afterFullReturn:'cancelado',auditedAdjustment:30};
 })

 await scenario('Comissão com baixa parcial bloqueia cancelamento e devolução sem efeitos',async()=>{
 const seller=await party('vendedores','SETTLED');await client.query('UPDATE erp.entidades SET eh_fornecedor=true WHERE empresa_id=$1 AND id=$2',[2,seller]);const p=await product('SETTLED');await entry(p,10,20);await rule(seller,p);
 const a=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{vendedor_id:seller});const b=await makeSale([{tipo:'produto',item_id:p,quantidade:1,valor_unitario:100}],{vendedor_id:seller});const provision=await commercial.payCommissions({...actor,idempotencyKey:key('SETTLED-PAY'),values:{vendedor_id:seller,ate:today,categoria_id:128,data_vencimento:today,conta_financeira_id:21}});
 const part=(await client.query('SELECT id FROM erp.contas_pagar_parcelas WHERE empresa_id=$1 AND conta_pagar_id=$2',[2,provision.conta_pagar_id])).rows[0];await repo.settlePayableInstallment({...actor,id:Number(part.id),idempotencyKey:key('SETTLE'),values:{valor:5,conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today}});
 await rejectSafely(()=>repo.cancelErpSale({...actor,id:a.saleId,expectedVersion:2,reason:'QA-OTTO pagamento parcial'}),e=>e.code==='COMMISSION_PROVISION_SETTLED');assert.equal((await repo.getErpSaleDetails(2,a.saleId)).sale.status,'confirmada');
 const item=Number(b.details.items[0].id);await deliver(b.saleId,[{item_id:item,quantidade:1}]);const before=await balance(p);await rejectSafely(()=>returnItem(b.saleId,item,1,'abater'),e=>e.code==='COMMISSION_PROVISION_SETTLED');assert.deepEqual(await balance(p),before);assert.equal(Number((await client.query('SELECT count(*) AS n FROM erp.devolucoes WHERE empresa_id=$1 AND venda_id=$2',[2,b.saleId])).rows[0].n),0);
 await repo.settlePayableInstallment({...actor,id:Number(part.id),idempotencyKey:key('SETTLE-FULL'),values:{valor:15,conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today}});await rejectSafely(()=>repo.cancelErpSale({...actor,id:a.saleId,expectedVersion:2,reason:'QA-OTTO comissão paga'}),e=>e.code==='COMMISSION_PROVISION_SETTLED');await rejectSafely(()=>returnItem(b.saleId,item,1,'abater'),e=>e.code==='COMMISSION_PROVISION_SETTLED');assert.deepEqual(await balance(p),before);
 return {payable:20,partiallyPaid:5,fullyPaid:20,cancelBlocked:true,returnBlocked:true,stockUnchanged:true,noPartialReturn:true};
 })

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'regressao-cinco-falhas.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
