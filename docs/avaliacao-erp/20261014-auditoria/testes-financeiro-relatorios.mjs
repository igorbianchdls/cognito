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

 const reports=load('@/products/erp/server/erpFinancialReports'),cash=load('@/products/erp/server/erpCashReport'),dre=load('@/products/erp/server/erpDreReport'),common=load('@/products/erp/server/dashboards/common'),bank=load('@/products/erp/server/erpBankImportRepository')
 const sum=rows=>Math.round(rows.reduce((s,r)=>s+Number(r.valor||0),0)*100)/100
 const flow=async()=>(await client.query(reports.cashFlowSql(),[2,today,today])).rows[0]
 const result=async(type)=>sum((await client.query(type==='caixa'?cash.cashResultSql:reports.accrualResultSql(),[2,today,today])).rows)
 const balanceReport=async()=>Number((await client.query('WITH params AS (SELECT $2::date,$3::date,$4::date,$5::date),cash AS ('+common.cashMovementsSql+') '+common.accountBalancesSql,[2,today,today,today,today,today])).rows.find(x=>Number(x.id)===21).saldo)
 const diff=(a,b)=>Math.round((a-b)*100)/100
 await scenario('Relatórios — caixa competência saldo bancário e estorno',async()=>{
 const before={flow:await flow(),cash:await result('caixa'),accrual:await result('competencia'),bank:await balanceReport()};const a=await title('receber',1000),b=await title('pagar',300);const pay=await settle('receber',a.id,{valor:400,juros:10,multa:5,desconto:20,taxa:3});await settle('pagar',b.id,{valor:100,taxa:2});let f=await flow();assert.equal(diff(f.entradas_realizadas,before.flow.entradas_realizadas),392);assert.equal(diff(f.saidas_realizadas,before.flow.saidas_realizadas),102);assert.equal(diff(await result('caixa'),before.cash),290);assert.equal(diff(await result('competencia'),before.accrual),700);assert.equal(diff(await balanceReport(),before.bank),290);await repo.reverseErpPayment({...actor,id:Number(pay.payment.id),reason:'QA-OTTO relatório',idempotencyKey:key('REV')});assert.equal(diff(await result('caixa'),before.cash),-102);assert.equal(diff(await balanceReport(),before.bank),-102);assert.equal(diff(await result('competencia'),before.accrual),700);return {receivable:1000,payable:300,cashIn:392,cashOut:102,cashNet:290,accrualNet:700,bankDelta:290,afterReceiptReversal:-102};
 })
 await scenario('Relatórios — adiantamento altera banco e fluxo mas não resultado',async()=>{
 const before={flow:await flow(),cash:await result('caixa'),accrual:await result('competencia'),bank:await balanceReport()};await finance.createAdvance({...actor,idempotencyKey:key('ADV-REPORT'),values:{entidade_id:294,lado:'receber',valor:200,tipo:'constituicao',conta_financeira_id:21,metodo_pagamento_id:21,data_movimento:today,motivo:'QA-OTTO relatório'}});assert.equal(diff(await balanceReport(),before.bank),200);assert.equal(diff((await flow()).entradas_realizadas,before.flow.entradas_realizadas),200);assert.equal(diff(await result('caixa'),before.cash),0);assert.equal(diff(await result('competencia'),before.accrual),0);return {bank:200,flow:200,cashResult:0,accrualResult:0};
 })
 await scenario('Relatórios — rateio e exclusão DRE preservam totais e centavos',async()=>{
 const outside=(await client.query('SELECT fora_dre FROM erp.categorias WHERE empresa_id=$1 AND id=$2',[2,129])).rows[0];assert.equal(outside.fora_dre,true);const before={cash:await result('caixa'),accrual:await result('competencia'),dreCash:await dre.dreReport(2,{inicio:today,fim:today,visao:'caixa'}),dreAcc:await dre.dreReport(2,{inicio:today,fim:today,visao:'competencia'})};const t=await title('pagar',100.01);const titleId=Number((await client.query('SELECT conta_pagar_id FROM erp.contas_pagar_parcelas WHERE empresa_id=$1 AND id=$2',[2,t.id])).rows[0].conta_pagar_id);await finance.replaceFinancialAllocations({...actor,financialSide:'pagar',titleId,values:{rateios:[{categoria_id:128,valor:60.01},{categoria_id:129,valor:40}]}});await settle('pagar',t.id,{valor:33.33});const acc=await dre.dreReport(2,{inicio:today,fim:today,visao:'competencia'}),ca=await dre.dreReport(2,{inicio:today,fim:today,visao:'caixa'});assert.equal(diff(await result('competencia'),before.accrual),-100.01);assert.equal(diff(await result('caixa'),before.cash),-33.33);assert.equal(diff(acc.fora_dre,before.dreAcc.fora_dre),-40);assert.equal(diff(acc.subtotais.lucro_liquido,before.dreAcc.subtotais.lucro_liquido),-60.01);assert.equal(diff(ca.fora_dre,before.dreCash.fora_dre),-13.33);assert.equal(diff(ca.subtotais.lucro_liquido,before.dreCash.subtotais.lucro_liquido),-20);return {accrual:-100.01,dreAccrual:-60.01,outsideAccrual:-40,cash:-33.33,dreCash:-20,outsideCash:-13.33};
 })
 for(const side of ['receber','pagar']) await scenario('Acordos — entidades diferentes saldo zero e destino pago — '+side,async()=>{
 const a=await title(side,100),other=await party(side==='receber'?'clientes':'fornecedores','REN-OTHER'),b=await title(side,100,other);const input={...actor,idempotencyKey:key('REN-BOUND'),values:{lado:side,entidade_id:a.entity,origens:[a.id,b.id],destinos:[{valor:200,data_vencimento:today}],desconto:0,encargos:0,numero:key('QA-REN-BOUND'),data_acordo:today,motivo:'QA-OTTO auditoria'}};await rejectSafely(()=>finance.createRenegotiation(input));await settle(side,a.id,{valor:100});await rejectSafely(()=>finance.createRenegotiation({...input,idempotencyKey:key('ZERO'),values:{...input.values,origens:[a.id],destinos:[{valor:100,data_vencimento:today}]}}));const c=await title(side,100);const ren=await finance.createRenegotiation({...input,idempotencyKey:key('VALID'),values:{...input.values,origens:[c.id],destinos:[{valor:100,data_vencimento:today}]}});const dest=Number((await client.query('SELECT conta_'+side+'_parcela_id AS id FROM erp.renegociacoes_parcelas WHERE empresa_id=$1 AND renegociacao_id=$2 AND papel=$3',[2,ren.id,'destino'])).rows[0].id);await settle(side,dest,{valor:20});await rejectSafely(()=>finance.reverseRenegotiation({...actor,agreementId:Number(ren.id),values:{motivo:'QA-OTTO destino pago'}}));assert.equal((await composition(side,c.id)).saldo,0);assert.equal((await composition(side,dest)).saldo,80);return {crossEntityBlocked:true,zeroBalanceBlocked:true,reversePaidDestinationBlocked:true,destinationBalance:80};
 })
 await scenario('Importação — CSV e OFX repetidos não duplicam movimentos',async()=>{
 const label=key('QA-OTTO-CSV'),content='data;descricao;valor\n14/10/2026;'+label+';100,00\n14/10/2026;'+label+';-20,50',mapping={separador:';',decimal:',',coluna_data:'data',coluna_descricao:'descricao',coluna_valor:'valor',formato_data:'dd/mm/aaaa'};const parsed=bank.parseCsvTransactions(content,mapping);assert.equal(parsed.length,2);assert.equal(parsed[1].amount,20.5);const input={...actor,accountId:21,fileName:label+'.csv',content,format:'csv',mapping};const a=await bank.importErpBankStatement(input),b=await bank.importErpBankStatement(input);const rows=(await client.query('SELECT tipo,valor FROM erp.transacoes_bancarias WHERE empresa_id=$1 AND descricao=$2',[2,label])).rows;assert.equal(rows.length,2);const ofx='<OFX><BANKTRANLIST><STMTTRN><DTPOSTED>20261014<TRNAMT>25.50<FITID>'+key('OFX')+'<MEMO>QA-OTTO OFX</STMTTRN></BANKTRANLIST></OFX>';const ofxInput={...actor,accountId:21,fileName:'QA-OTTO.ofx',content:ofx,format:'ofx'};await bank.importErpBankStatement(ofxInput);await bank.importErpBankStatement(ofxInput);assert.equal(Number((await client.query('SELECT count(*) AS n FROM erp.transacoes_bancarias WHERE empresa_id=$1 AND identificador_externo=$2',[2,bank.parseOfxTransactions(ofx)[0].externalId])).rows[0].n),1);return {csvCount:2,csvDebit:20.5,csvFirst:a,csvRepeated:b,ofxCount:1};
 })

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'financeiro-relatorios.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
