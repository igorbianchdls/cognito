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

 const methods=load('@/products/erp/server/erpPaymentMethods'),rules=load('@/products/erp/server/erpBankRules')
 const cardSetup=async(repasse='parcelado')=>{const id=Number((await client.query("INSERT INTO erp.contas_financeiras(empresa_id,nome,tipo,saldo_inicial,data_saldo_inicial,criado_por,atualizado_por) VALUES($1,$2,'maquininha',0,$3,$4,$4) RETURNING id",[2,key('QA-OTTO-MACHINE'),today,3])).rows[0].id);const values={nome:key('QA-OTTO-CARD'),tipo:'cartao_credito',conta_maquininha_id:id,conta_destino_id:21,categoria_taxa_id:128,adquirente_id:295,taxa_percentual:3,taxa_fixa:0.30,prazo_repasse_dias:2,repasse};const method=await methods.savePaymentMethod({...actor,values});return {machine:id,method:Number(method.id),values}}
 const transfers=async(pay)=>(await client.query('SELECT id,status,valor,data_transferencia::text AS date FROM erp.transferencias_financeiras WHERE empresa_id=$1 AND pagamento_origem_id=$2 ORDER BY id',[2,pay])).rows
 const bankTransaction=async(value=50,type='credito',account=21,description=key('QA-OTTO-BANK'))=>management.createManagementOperation({...actor,resource:'conciliacao-bancaria',idempotencyKey:key('BANK'),values:{conta_financeira_id:account,data:today,tipo:type,valor:value,descricao:description}})

 await scenario('Alterar configuração de cartão preserva taxas e repasses anteriores',async()=>{const c=await cardSetup('unico'),a=await title('receber',100),payA=await settle('receber',a.id,{valor:100,metodo_pagamento_id:c.method});assert.equal(payA.cartao.taxa,3.30);const oldTransfers=await transfers(payA.payment.id);await methods.savePaymentMethod({...actor,id:c.method,expectedVersion:1,values:{...c.values,taxa_percentual:10,conta_destino_id:22}});const b=await title('receber',100),payB=await settle('receber',b.id,{valor:100,metodo_pagamento_id:c.method});assert.equal(payB.cartao.taxa,10.30);assert.deepEqual(await transfers(payA.payment.id),oldTransfers);const destinations=(await client.query('SELECT pagamento_origem_id,conta_destino_id,valor FROM erp.transferencias_financeiras WHERE empresa_id=$1 AND pagamento_origem_id=ANY($2::bigint[]) ORDER BY pagamento_origem_id',[2,[payA.payment.id,payB.payment.id]])).rows;assert.deepEqual(destinations.map(x=>Number(x.conta_destino_id)),[21,22]);assert.deepEqual(destinations.map(x=>Number(x.valor)),[96.7,89.7]);return {oldFee:3.30,newFee:10.30,oldDestination:21,newDestination:22,oldTransferPreserved:true};})

 })
 throw rollback
}))
}catch(error){if(error!==rollback){console.error({message:error.message,code:error.code,lastQuery});process.exitCode=1}}
finally{await pg.closePool();const evidence={at:new Date().toISOString(),date:today,rolledBack:true,results,findings};await writeFile('docs/avaliacao-erp/20261014-auditoria/'+(process.argv[3]||'financeiro-cartao-configuracao.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(results.some(r=>!r.passed))process.exitCode=1}
