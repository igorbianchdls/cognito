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
 const rejectSafely=async(fn,predicate)=>{await client.query('SAVEPOINT qa_rejected');try{await assert.rejects(async()=>{const result=await fn();await client.query('SET CONSTRAINTS ALL IMMEDIATE');await client.query('SET CONSTRAINTS ALL DEFERRED');return result},predicate)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_rejected');await client.query('RELEASE SAVEPOINT qa_rejected')}}
 const scenario=async(name,fn)=>{if(process.argv[2]&&!name.includes(process.argv[2]))return;await client.query('SAVEPOINT qa_case');console.log('Testing '+name);try{const evidence=await fn();await client.query('SET CONSTRAINTS ALL IMMEDIATE');await client.query('SET CONSTRAINTS ALL DEFERRED');results.push({name,passed:true,evidence});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:{code:e.code,message:e.message,detail:e.detail,lastQuery}});console.log('FAIL '+name+' '+e.message)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_case');await client.query('RELEASE SAVEPOINT qa_case')}}

 const party=async(role,label)=>Number((await repo.createErpEntityRecord({...actor,entityId:role,idempotencyKey:key('PARTY'),values:{nome:key('QA-'+label),tipo:'PF',status:'ativo'}})).id)
 const rule=async(seller,p,base='faturamento')=>commercial.saveCommissionRule({...actor,values:{nome:key('COMMISSION'),vendedor_id:seller,produto_id:p,percentual:10,base,ativo:true}})
 const commissions=async(seller)=>commercial.commissionReport(2,{inicio:today,fim:today,vendedor_id:seller})
 const cashReceipt=async(saleId,value)=>{const ar=await rowsAR(saleId);return repo.settleReceivableInstallment({...actor,id:Number(ar[0].id),idempotencyKey:key('PAY'),values:{valor:value,conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today}})}

 const periods=load('@/products/erp/server/erpPeriodRepository')
 const title=async(side,value=1000,entity)=>{
  if(side==='receber'){const s=await makeSale([{tipo:'servico',item_id:65,quantidade:1,valor_unitario:value}],entity?{cliente_id:entity}:{});return {id:Number((await rowsAR(s.saleId))[0].id),saleId:s.saleId,entity:entity||294}}
  const t=await repo.createErpEntityRecord({...actor,entityId:'contas-a-pagar',idempotencyKey:key('AP'),values:{fornecedor_id:entity||295,descricao:key('QA-OTTO-FIN'),valor_total:value,categoria_id:128,data_competencia:today,data_vencimento:today,conta_financeira_id:21,metodo_pagamento_id:21}});return {id:Number(t.id),entity:entity||295}
 }
 const settle=(side,id,values,k=key('SETTLE'))=>(side==='receber'?repo.settleReceivableInstallment:repo.settlePayableInstallment)({...actor,id,idempotencyKey:k,values:{conta_financeira_id:21,metodo_pagamento_id:21,data_pagamento:today,...values}})
 const composition=(side,id)=>finance.getInstallmentComposition(2,side,id)
 for(const side of ['receber','pagar']){
 await scenario('Baixa parcial com juros multa desconto taxa e estorno — '+side,async()=>{
  const t=await title(side),k=key('PAY');const values={valor:400,juros:10,multa:5,desconto:20,taxa:3};const pay=await settle(side,t.id,values,k);assert.equal(Number(pay.payment.valor_liquido),side==='receber'?392:398);const again=await settle(side,t.id,values,k);assert.equal(String(again.payment.id),String(pay.payment.id));await rejectSafely(()=>settle(side,t.id,{...values,valor:401},k),e=>e.code==='IDEMPOTENCY_CONFLICT');
  let c=await composition(side,t.id);assert.equal(c.saldo,600);assert.equal(c.principal_pago,400);assert.equal(c.dinheiro_movimentado,side==='receber'?392:398);await rejectSafely(()=>settle(side,t.id,{valor:601}));await settle(side,t.id,{valor:600});assert.equal((await composition(side,t.id)).saldo,0);await repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO auditoria financeira',idempotencyKey:key('REV')});c=await composition(side,t.id);assert.equal(c.saldo,400);assert.equal(c.principal_pago,600);assert.equal(c.dinheiro_movimentado,600);assert.equal(c.juros_realizados,0);return {principal:1000,partial:400,partialCash:side==='receber'?392:398,remainingAfterReversal:400,cashAfterReversal:600,replaySafe:true};
 })
 await scenario('Adiantamento aplicação reversão e vínculo de entidade — '+side,async()=>{
  const t=await title(side,300),advanceInput={...actor,idempotencyKey:key('ADV'),values:{entidade_id:t.entity,lado:side,valor:200,tipo:'constituicao',conta_financeira_id:21,metodo_pagamento_id:21,data_movimento:today,motivo:'QA-OTTO auditoria'}};const adv=await finance.createAdvance(advanceInput);const repeated=await finance.createAdvance(advanceInput);assert.equal(adv.id,repeated.id);
  const apInput={...actor,idempotencyKey:key('APPLY'),values:{adiantamento_id:Number(adv.id),lado:side,parcela_id:t.id,valor:80,data_aplicacao:today,motivo:'QA-OTTO aplicação'}};const applied=await finance.applyAdvance(apInput);assert.equal((await finance.applyAdvance(apInput)).id,applied.id);let c=await composition(side,t.id);assert.equal(c.credito,80);assert.equal(c.saldo,220);assert.equal(c.dinheiro_movimentado,0);await rejectSafely(()=>finance.applyAdvance({...apInput,idempotencyKey:key('TOO-MUCH'),values:{...apInput.values,valor:121}}));
  const other=await party(side==='receber'?'clientes':'fornecedores','OTHER-FIN');const otherTitle=await title(side,50,other);await rejectSafely(()=>finance.applyAdvance({...apInput,idempotencyKey:key('OTHER'),values:{...apInput.values,parcela_id:otherTitle.id,valor:10}}));await finance.reverseAdvanceApplication({...actor,applicationId:Number(applied.id),idempotencyKey:key('REV-ADV'),values:{data_aplicacao:today,motivo:'QA-OTTO reversão'}});c=await composition(side,t.id);assert.equal(c.credito,0);assert.equal(c.saldo,300);return {advance:200,applied:80,remainingDebt:220,afterReversal:300,wrongEntityBlocked:true,noCashOnApplication:true};
 })
 await scenario('Renegociação de saldo parcial com encargos e reversão — '+side,async()=>{
  const t=await title(side,100);await settle(side,t.id,{valor:30});const input={...actor,idempotencyKey:key('REN'),values:{lado:side,entidade_id:t.entity,origens:[t.id],destinos:[{valor:67,data_vencimento:today}],desconto:5,encargos:2,numero:key('QA-REN'),data_acordo:today,motivo:'QA-OTTO auditoria',categoria_ajuste_id:side==='pagar'?128:127}};const ren=await finance.createRenegotiation(input);assert.equal((await composition(side,t.id)).saldo,0);assert.equal((await composition(side,t.id)).renegociado,70);assert.equal((await finance.createRenegotiation(input)).id,ren.id);await finance.reverseRenegotiation({...actor,agreementId:Number(ren.id),values:{motivo:'QA-OTTO reversão'}});assert.equal((await composition(side,t.id)).saldo,70);return {original:100,paid:30,transferred:70,discount:5,charges:2,newDebt:67,afterReversal:70};
 })
 }
 await scenario('Fechamento financeiro bloqueia baixa e estorno e reabertura libera',async()=>{
  const t=await title('receber',100),pay=await settle('receber',t.id,{valor:20});const closed=await periods.closeErpPeriod({...actor,modulo:'financeiro',periodo_inicio:today,periodo_fim:today,motivo:'QA-OTTO fechamento isolado'});await rejectSafely(()=>settle('receber',t.id,{valor:10}),e=>e.code==='PERIOD_CLOSED');await rejectSafely(()=>repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO',idempotencyKey:key('REV-CLOSED')}),e=>e.code==='PERIOD_CLOSED');await rejectSafely(()=>periods.closeErpPeriod({...actor,modulo:'todos',periodo_inicio:today,periodo_fim:today,motivo:'QA-OTTO'}),e=>e.code==='PERIOD_OVERLAP');await periods.reopenErpPeriod({...actor,id:Number(closed.id),reason:'QA-OTTO reabertura isolada'});await settle('receber',t.id,{valor:10});assert.equal((await composition('receber',t.id)).saldo,70);return {closedBlocksPayment:true,closedBlocksReversal:true,overlapBlocked:true,reopenedBalance:70};
 })
 await scenario('Criação manual de pagar não aceita chave repetida com conteúdo diferente',async()=>{
  const input={...actor,entityId:'contas-a-pagar',idempotencyKey:key('AP-REPLAY'),values:{fornecedor_id:295,descricao:key('QA-OTTO REPLAY'),valor_total:100,categoria_id:128,data_competencia:today,data_vencimento:today}};const a=await repo.createErpEntityRecord(input);assert.equal((await repo.createErpEntityRecord(input)).id,a.id);let changed;try{changed=await repo.createErpEntityRecord({...input,values:{...input.values,valor_total:150}})}catch(error){if(error.code==='IDEMPOTENCY_CONFLICT')return {sameBodyReused:true,changedBodyBlocked:true};throw error}findings.push({severity:'P2',code:'MANUAL_PAYABLE_REPLAY_BODY_UNCHECKED',message:'Mesma chave de criação com total diferente devolve a conta anterior sem conflito.',evidence:{requestedOriginal:100,requestedChanged:150,original:a,returned:changed}});assert.fail('Conteúdo diferente aceito sem IDEMPOTENCY_CONFLICT');
 })

 await scenario('Complemento — conciliação parcial preserva caixa e permite desfazer',async()=>{
 const t=await title('receber',100);const pay=await settle('receber',t.id,{valor:100});const transaction=await management.createManagementOperation({...actor,resource:'conciliacao-bancaria',idempotencyKey:key('BANK'),values:{conta_financeira_id:21,data:today,tipo:'credito',valor:60,descricao:'QA-OTTO extrato parcial'}});const input={...actor,resource:'conciliar-transacao',idempotencyKey:key('RECON'),values:{transacao_bancaria_id:Number(transaction.id),pagamento_id:Number(pay.payment.id),valor_conciliado:60}};const a=await management.createManagementOperation(input);assert.equal((await management.createManagementOperation(input)).id,a.id);await rejectSafely(()=>management.createManagementOperation({...input,idempotencyKey:key('EXCESS'),values:{...input.values,valor_conciliado:1}}));assert.equal((await composition('receber',t.id)).dinheiro_movimentado,100);await professional.undoBankReconciliation({...actor,transactionId:Number(transaction.id)});assert.equal((await composition('receber',t.id)).dinheiro_movimentado,100);const row=(await client.query('SELECT status FROM erp.transacoes_bancarias WHERE empresa_id=$1 AND id=$2',[2,transaction.id])).rows[0];assert.equal(row.status,'pendente');return {receipt:100,reconciled:60,cashBeforeAndAfterUndo:100,replaySafe:true,transactionAfterUndo:'pendente'};
 })
 await scenario('Complemento — parcelas com centavos e resumo paginado',async()=>{
 const label=key('QA-OTTO-FIN-CENTS');const record=await repo.createErpEntityRecord({...actor,entityId:'contas-a-pagar',idempotencyKey:key('CENT'),values:{fornecedor_id:295,descricao:label,valor_total:1000.01,categoria_id:128,data_competencia:today,data_vencimento:today,parcelas:[{numero_parcela:1,data_vencimento:today,valor:333.33},{numero_parcela:2,data_vencimento:today,valor:333.34},{numero_parcela:3,data_vencimento:today,valor:333.34}]}});const page=await repo.listErpEntityPage({tenantId:2,entityId:'contas-a-pagar',query:label,pageSize:10});assert.equal(page.records.length,3);assert.equal(page.summary.total,1000.01);await settle('pagar',Number(record.id),{valor:100});const after=await repo.listErpEntityPage({tenantId:2,entityId:'contas-a-pagar',query:label,pageSize:10});assert.equal(after.summary.total,1000.01);const far=await repo.listErpEntityPage({tenantId:2,entityId:'contas-a-pagar',query:label,page:999,pageSize:10});assert.equal(far.total,3);assert.equal(far.summary.total,after.summary.total);return {installments:3,total:1000.01,summaryPreservedBeyondLastPage:true};
 })

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'financeiro-ampliado.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
