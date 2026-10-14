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

 const cash=load('@/products/erp/server/erpCashReport'),rules=load('@/products/erp/server/erpBankRules')
 const totalAt=async(date)=>Number((await client.query(cash.cashResultSql,[2,date,date])).rows.reduce((s,r)=>s+Number(r.valor),0).toFixed(2))
 for(const side of ['receber','pagar'])await scenario('Estorno em outro mês preserva resultado original — '+side,async()=>{const past='2026-09-30',beforePast=await totalAt(past),beforeToday=await totalAt(today),t=await title(side,100);const pay=await settle(side,t.id,{valor:100,data_pagamento:past});const sign=side==='receber'?1:-1;assert.equal(Number(((await totalAt(past))-beforePast).toFixed(2)),sign*100);await repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO meses distintos',idempotencyKey:key('REV-DATE')});assert.equal(Number(((await totalAt(past))-beforePast).toFixed(2)),sign*100);assert.equal(Number(((await totalAt(today))-beforeToday).toFixed(2)),-sign*100);assert.equal((await composition(side,t.id)).saldo,100);return {paymentDate:past,reversalDate:today,originalPeriodDelta:sign*100,reversalPeriodDelta:-sign*100,restoredBalance:100};})
 const ruleIds=[],transactionIds=[];const q=client.query.bind(client);client.query=async(sql,args)=>{if(sql.includes('FROM erp.regras_lancamento_bancario WHERE empresa_id = $1 AND ativo'))sql=sql.replace('WHERE empresa_id = $1','WHERE empresa_id = $1 AND id IN ('+(ruleIds.length?ruleIds.join(','):'0')+')');if(sql.includes('FROM erp.transacoes_bancarias t')&&sql.includes('LIMIT 2000'))sql=sql.replace('WHERE t.empresa_id = $1','WHERE t.empresa_id = $1 AND t.id IN ('+(transactionIds.length?transactionIds.join(','):'0')+')');return q(sql,args)}
 await scenario('Empate de regras usa ordem estável e regra inativa não lança',async()=>{const label=key('QA-OTTO-RULE-TIE');for(const cat of [128,129]){const rule=await rules.saveLaunchRule({...actor,values:{nome:key('TIE'),conta_financeira_id:21,descricao_contem:label,tipo_transacao:'debito',categoria_id:cat,entidade_id:295}});ruleIds.push(Number(rule.id));}const tx=await management.createManagementOperation({...actor,resource:'conciliacao-bancaria',idempotencyKey:key('BANK'),values:{conta_financeira_id:21,data:today,tipo:'debito',valor:10,descricao:label}});transactionIds.push(Number(tx.id));const launched=await rules.applyLaunchRules({...actor,accountId:21});assert.equal(launched.lancadas,1);const title=(await client.query('SELECT categoria_id FROM erp.contas_pagar WHERE empresa_id=$1 AND chave_idempotencia=$2',[2,'extrato:'+tx.id])).rows[0];assert.equal(Number(title.categoria_id),128);await rules.deleteLaunchRule({...actor,id:ruleIds[ruleIds.length-2]});await rules.deleteLaunchRule({...actor,id:ruleIds[ruleIds.length-1]});const next=await management.createManagementOperation({...actor,resource:'conciliacao-bancaria',idempotencyKey:key('BANK'),values:{conta_financeira_id:21,data:today,tipo:'debito',valor:10,descricao:label}});transactionIds.push(Number(next.id));assert.equal((await rules.applyLaunchRules({...actor,accountId:21})).lancadas,0);return {tieCategory:128,stableFirstRule:true,removedRulesLaunchNothing:true};})

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'financeiro-datas-regras.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
