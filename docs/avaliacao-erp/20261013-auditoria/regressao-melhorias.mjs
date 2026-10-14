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
let lastQuery = ''
const results = [], rollback = new Error('QA_ROLLBACK_ONLY')
try {
  await context.runWithErpDatabaseContext({ tenantId: 2, userId: 3, timeZone: 'America/Sao_Paulo', statementTimeoutMs: 30000 }, () => pg.withTransaction(async client => {
    const query = client.query.bind(client)
    client.query = async (sql, params) => { lastQuery = sql.slice(0, 160); return query(sql, params) }
    console.log('Starting isolated regression')
    await pg.runWithErpTransactionClient(client, async () => {
      const guard = await client.query("SELECT id,nome FROM erp.produtos WHERE empresa_id=$1 AND id=$2", [2,111])
      assert.equal(guard.rows[0]?.nome, 'QA-OTTO Produto Cenário')
      const opening=(await client.query('SELECT quantidade_fisica FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[2,111,10])).rows[0]
      await stockRepo.applyStockMovement(client,{tenantId:2,actorId:3,produtoId:111,localEstoqueId:10,quantidade:-Number(opening.quantidade_fisica),tipo:'ajuste_saida',origemTipo:'ajuste',chaveIdempotencia:'QA-OTTO-ROLLBACK-OPENING',motivo:'QA-OTTO preparação transacional com rollback'})
      const purchase = await repo.createErpEntityRecord({tenantId:2,actorId:3,entityId:'pedidos-compra',idempotencyKey:'QA-OTTO-ROLLBACK-DIRECT',values:{
        fornecedor_id:295,numero:'QA-OTTO-ROLLBACK-DIRECT',tipo_compra:'produto',tipo_movimento:'compra',natureza_operacao_id:15,
        desconto:100,frete:200,categoria_id:129,conta_financeira_id:21,metodo_pagamento_id:21,data_compra:'2026-10-13',data_competencia:'2026-10-13',gera_financeiro:true,
        itens:[{produto_id:111,descricao:'QA-OTTO Produto Cenário',quantidade:10,valor_unitario:100}],
        parcelas:[{numero_parcela:1,data_vencimento:'2026-10-13',valor:1100,conta_financeira_id:21,metodo_pagamento_id:21}],
      }})
      const purchaseId = Number(purchase.id), details = await repo.getErpPurchaseDetails(2,purchaseId)
      assert.equal(details.purchase.status,'confirmada')
      assert.ok(details.purchase.confirmada_em)
      assert.equal(details.purchase.recebida_em,null)
      const itemId=Number(details.items[0].id)
      const seven={tenantId:2,actorId:3,purchaseId,values:{items:[{item_id:itemId,quantidade:7,local_estoque_id:10}]},idempotencyKey:'QA-OTTO-ROLLBACK-SEVEN'}
      const partial=await professional.receivePurchaseItems(seven)
      assert.equal(partial.status,'parcialmente_recebida')
      const repeated=await professional.receivePurchaseItems(seven)
      assert.equal(repeated.reused,true)
      assert.equal(Number(repeated.documents[0].id),Number(partial.documents[0].id))
      await assert.rejects(professional.receivePurchaseItems({...seven,idempotencyKey:'QA-OTTO-ROLLBACK-TOO-MANY',values:{items:[{item_id:itemId,quantidade:4,local_estoque_id:10}]}}),e=>e.code==='QUANTITY_EXCEEDS_PENDING')
      const full=await professional.receivePurchaseItems({...seven,idempotencyKey:'QA-OTTO-ROLLBACK-THREE',values:{items:[{item_id:itemId,quantidade:3,local_estoque_id:10}]}})
      assert.equal(full.status,'recebida')
      const received=await repo.getErpPurchaseDetails(2,purchaseId)
      assert.equal(Number(received.items[0].quantidade_recebida),10)
      assert.ok(received.purchase.recebida_em)
      const balance=async()=> (await client.query('SELECT quantidade_fisica,quantidade_reservada,custo_medio FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[2,111,10])).rows[0]
      const beforeSale=await balance()
      assert.equal(Number(beforeSale.quantidade_fisica),10)
      assert.equal(Number(beforeSale.custo_medio),110)
      const titles=await client.query('SELECT count(*)::int n FROM erp.contas_pagar WHERE empresa_id=$1 AND compra_id=$2 AND excluido_em IS NULL',[2,purchaseId])
      assert.equal(titles.rows[0].n,1)
      results.push({name:'Direct purchase, 7+3 receipts, replay and quantity guard',stock:10,unitCost:110,payableTitles:1})
      const sale=await repo.createErpEntityRecord({tenantId:2,actorId:3,entityId:'pedidos',idempotencyKey:'QA-OTTO-ROLLBACK-SALE',values:{
        cliente_id:294,numero:'QA-OTTO-ROLLBACK-SALE',tipo_documento:'venda',categoria_id:127,local_estoque_id:10,
        data_venda:'2026-10-13',data_competencia:'2026-10-13',itens:[{tipo:'produto',item_id:111,quantidade:4,valor_unitario:180}],
        parcelas:[{numero_parcela:1,data_vencimento:'2026-10-13',valor:720,conta_financeira_id:21,metodo_pagamento_id:21}],
      }})
      const saleId=Number(sale.id)
      await repo.confirmErpSale({tenantId:2,actorId:3,saleId,expectedVersion:1})
      const saleDetails=await repo.getErpSaleDetails(2,saleId),saleItem=Number(saleDetails.items[0].id)
      const attend=quantity=>professional.attendSaleItems({tenantId:2,actorId:3,saleId,idempotencyKey:'QA-OTTO-ROLLBACK-ATTEND-'+quantity,values:{items:[{item_id:saleItem,quantidade:quantity,local_estoque_id:10}]}})
      await attend(1)
      await attend(3)
      const afterSale=await balance()
      assert.equal(Number(afterSale.quantidade_fisica),6)
      assert.equal(Number(afterSale.quantidade_reservada),0)
      assert.equal(Number(afterSale.custo_medio),110)
      const cost=await client.query("SELECT sum(-quantidade*custo_unitario) cost FROM erp.movimentacoes_estoque WHERE empresa_id=$1 AND origem_tipo='venda' AND origem_id=$2",[2,saleId])
      assert.equal(Number(cost.rows[0].cost),440)
      results.push({name:'Partial sale delivery 1+3',stock:6,reserved:0,stockValue:660,costOfSales:440})
      const payableRows=await repo.listErpEntityPage({tenantId:2,entityId:'contas-a-pagar',query:'QA-OTTO-ROLLBACK-DIRECT'})
      console.log(JSON.stringify({stage:'payable-defaults',records:payableRows.records.map(row=>({id:row.id,account:row.conta_financeira_id,method:row.metodo_pagamento_id})),results}))
      assert.equal(payableRows.records[0].conta_financeira_id,'21')
      assert.equal(payableRows.records[0].metodo_pagamento_id,'21')
      const receivableRows=await repo.listErpEntityPage({tenantId:2,entityId:'contas-a-receber',query:'QA-OTTO-ROLLBACK-SALE'})
      console.log(JSON.stringify({stage:'receivable-defaults',records:receivableRows.records.map(row=>({id:row.id,account:row.conta_financeira_id,method:row.metodo_pagamento_id}))}))
      assert.equal(receivableRows.records[0].conta_financeira_id,'21')
      assert.equal(receivableRows.records[0].metodo_pagamento_id,'21')
      await assert.rejects(repo.deactivateErpEntityRecord({tenantId:2,actorId:3,entityId:'contas-contabeis',id:47,expectedVersion:1}),e=>e.code==='ACCOUNTING_ACTIVE_CHILDREN')
      results.push({name:'Settlement defaults and clear accounting block',account:'21',method:'21'})
      assert.equal(receivableRows.records[0].entidade_id,'294')
      const returned=await returns.createSaleReturn({tenantId:2,actorId:3,saleId,idempotencyKey:'QA-OTTO-ROLLBACK-RETURN',values:{itens:[{venda_item_id:saleItem,quantidade:1}],tratamento:'credito',motivo:'QA-OTTO custo real',data_devolucao:'2026-10-13'}})
      const credit=await returns.useCustomerCredit({tenantId:2,actorId:3,returnId:Number(returned.record.id),idempotencyKey:'QA-OTTO-ROLLBACK-CREDIT2',values:{parcela_id:Number(receivableRows.records[0].parcela_id),valor:180,data:'2026-10-13'}})
      assert.ok(credit)
      const afterReturn=await balance();assert.equal(Number(afterReturn.quantidade_fisica),7);assert.equal(Number(afterReturn.custo_medio),110)
      assert.equal(Number(afterReturn.quantidade_fisica)*Number(afterReturn.custo_medio),770)
      const cmv=(await client.query("SELECT sum(quantidade*custo_unitario) AS custo FROM erp.movimentacoes_estoque m LEFT JOIN erp.documentos_estoque d ON d.empresa_id=m.empresa_id AND d.id=m.documento_estoque_id WHERE m.empresa_id=$1 AND (m.origem_tipo='venda' AND m.origem_id=$2 OR d.venda_id=$2)",[2,saleId])).rows[0];assert.equal(Number(cmv.custo),-330)
      const renInput={tenantId:2,actorId:3,idempotencyKey:'QA-OTTO-ROLLBACK-REN2',values:{lado:'pagar',entidade_id:295,origens:[859],destinos:[{valor:95,data_vencimento:'2026-10-20'}],desconto:10,encargos:5,numero:'QA-OTTO-ROLLBACK-REN2',data_acordo:'2026-10-13',motivo:'QA-OTTO regressao',categoria_ajuste_id:128}}
      const ren=await finance.createRenegotiation(renInput);const renAgain=await finance.createRenegotiation(renInput);assert.equal(renAgain.id,ren.id);assert.equal(renAgain.reused,true)
      await assert.rejects(finance.createRenegotiation({...renInput,values:{...renInput.values,numero:'QA-OTTO-other'}}),e=>e.code==='IDEMPOTENCY_CONFLICT')
      await finance.reverseRenegotiation({tenantId:2,actorId:3,agreementId:Number(ren.id),values:{motivo:'QA-OTTO rollback'}})
      await professional.undoBankReconciliation({tenantId:2,actorId:3,transactionId:1})
      await client.query('SET CONSTRAINTS ALL IMMEDIATE'); await client.query('SET CONSTRAINTS ALL DEFERRED')
      const reconInput={tenantId:2,actorId:3,resource:'conciliar-transacao',idempotencyKey:'QA-OTTO-ROLLBACK-RECON2',values:{transacao_bancaria_id:1,pagamento_id:1001,valor_conciliado:60}}
      const recon=await management.createManagementOperation(reconInput);const reconAgain=await management.createManagementOperation(reconInput);assert.equal(recon.id,reconAgain.id)
      await assert.rejects(management.createManagementOperation({...reconInput,values:{...reconInput.values,valor_conciliado:59}}),e=>e.code==='IDEMPOTENCY_CONFLICT')
      results.push({name:'Acquisition cost, returned cost/CMV, customer ID and financial replay guards',unitCost:110,stockValue:770,netCMV:330})
      const summary=await repo.listErpEntityPage({tenantId:2,entityId:'contas-a-pagar',query:'QA-OTTO',pageSize:100})
      const activeTotal=summary.records.filter(r=>!['cancelado','renegociado'].includes(r.status)).reduce((sum,r)=>sum+Number(r.valor),0)
      assert.equal(summary.summary.total,activeTotal)
      await client.query('SET CONSTRAINTS ALL IMMEDIATE')
    })
    throw rollback
  }))
} catch(error) {
  if(error!==rollback){console.error(JSON.stringify({code:error.code,message:error.message,detail:error.detail,where:error.where,lastQuery},null,2));process.exitCode=1}
  else console.log(JSON.stringify({passed:true,rolledBack:true,results},null,2))
} finally {await pg.closePool()}
