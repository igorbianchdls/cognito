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
const actor={tenantId:2,actorId:3}, results=[], rollback=new Error('QA_ROLLBACK_ONLY')
let lastQuery=''
try {
 await context.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Sao_Paulo',statementTimeoutMs:30000},()=>pg.withTransaction(async client=>{
  const query=client.query.bind(client)
  client.query=async(sql,params)=>{
   lastQuery=sql.slice(0,200)
   if(sql.includes('FROM erp.contratos_vendas WHERE empresa_id=$1 AND status='))sql=sql.replace("AND status='ativo'","AND id=61 AND status='ativo'")
   return query(sql,params)
  }
  await pg.runWithErpTransactionClient(client,async()=>{
   const guard=(await client.query('SELECT numero FROM erp.contratos_vendas WHERE empresa_id=$1 AND id=$2',[2,61])).rows[0]
   assert.equal(guard.numero,'QA-OTTO-CTR-018')
   const generated=await contracts.generateContractSales({...actor,until:'2026-11-13'})
   assert.equal(generated.total,2,JSON.stringify(generated))
   for(const g of generated.generated){assert.equal(g.contractId,'61');const detail=await repo.getErpSaleDetails(2,Number(g.saleId));assert.equal(Number(detail.sale.total),180);assert.equal(detail.sale.status,'rascunho')}
   const again=await contracts.generateContractSales({...actor,until:'2026-11-13'});assert.equal(again.total,0)
   results.push({test:'Contrato mensal, dois ciclos e repetição sem duplicação',total:360,sales:2})
   const createProduct=async(suffix,unit)=>Number((await repo.createErpEntityRecord({...actor,entityId:'produtos',idempotencyKey:'QA-OTTO-ROLLBACK-PROD-'+suffix,values:{nome:'QA-OTTO ROLLBACK '+suffix,sku:'QA-OTTO-ROLLBACK-'+suffix,preco:100,unidade_medida:unit,controla_estoque:'sim',status:'ativo'}})).id)
   const a=await createProduct('A','UN'),b=await createProduct('B','KG'),kit=await createProduct('KIT','UN')
   const balance=async(prod,local=10)=>(await client.query('SELECT quantidade_fisica,quantidade_reservada,custo_medio FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[2,prod,local])).rows[0]
   const op=(resource,values,key)=>stockRepo.createStockOperation({...actor,resource,values,idempotencyKey:'QA-OTTO-ROLLBACK-'+key})
   await op('conversoes-unidades',{produto_id:a,unidade_origem:'CX',unidade_destino:'UN',fator:12},'CONV')
   await op('movimentacoes',{produto_id:a,local_estoque_id:10,tipo:'entrada',quantidade:1,unidade:'CX',custo_unitario:240,motivo:'QA-OTTO'},'CX')
   assert.equal(Number((await balance(a)).quantidade_fisica),12);assert.equal(Number((await balance(a)).custo_medio),20)
   await op('movimentacoes',{produto_id:b,local_estoque_id:10,tipo:'entrada',quantidade:10,unidade:'KG',custo_unitario:30,motivo:'QA-OTTO'},'B')
   await assert.rejects(op('conversoes-unidades',{produto_id:b,unidade_origem:'CX',unidade_destino:'UN',fator:12},'BADUNIT'),e=>e.message.includes('KG'))
   const product=await repo.getErpEntityRecord({tenantId:2,entityId:'produtos',id:a})
   assert.equal(product.unidade_medida,'UN')
   await assert.rejects(repo.updateErpEntityRecord({...actor,entityId:'produtos',id:a,expectedVersion:Number(product.versao),values:{...product,unidade_medida:'KG'}}),e=>e.code==='PRODUCT_UNIT_IN_USE')
   // Simula um produto antigo sem unidade e prova o padrão UN nas conversões.
   await client.query('UPDATE erp.produtos SET unidade_medida=NULL WHERE empresa_id=$1 AND id=$2',[2,a])
   await op('movimentacoes',{produto_id:a,local_estoque_id:10,tipo:'entrada',quantidade:1,unidade:'CX',custo_unitario:240,motivo:'QA-OTTO'},'LEGACY-CX')
   assert.equal(Number((await balance(a)).quantidade_fisica),24)
   results.push({test:'Unidade no cadastro, caixa de 12, custo convertido, legado e bloqueio de troca',quantity:24,cost:20})
   await op('kits',{produto_id:kit,produto_componente_id:a,quantidade:2},'KIT-A')
   await op('kits',{produto_id:kit,produto_componente_id:b,quantidade:1},'KIT-B')
   const sale=await repo.createErpEntityRecord({...actor,entityId:'pedidos',idempotencyKey:'QA-OTTO-ROLLBACK-KITSALE',values:{cliente_id:294,numero:'QA-OTTO-ROLLBACK-KITSALE',tipo_documento:'venda',categoria_id:127,local_estoque_id:10,data_venda:'2026-10-13',data_competencia:'2026-10-13',itens:[{tipo:'produto',item_id:kit,quantidade:2,valor_unitario:100},{tipo:'produto',item_id:a,quantidade:1,valor_unitario:100}],parcelas:[{numero_parcela:1,data_vencimento:'2026-10-20',valor:300,conta_financeira_id:21,metodo_pagamento_id:21}]}})
   const saleId=Number(sale.id);await repo.confirmErpSale({...actor,saleId,expectedVersion:1})
   const details=await repo.getErpSaleDetails(2,saleId), kitItem=Number(details.items.find(i=>Number(i.item_id)===kit).id),singleItem=Number(details.items.find(i=>Number(i.item_id)===a).id)
   const deliver=(key,items)=>professional.attendSaleItems({...actor,saleId,idempotencyKey:'QA-OTTO-ROLLBACK-DEL-'+key,values:{items}})
   await deliver('FIRST',[{item_id:kitItem,quantidade:1,local_estoque_id:10},{item_id:singleItem,quantidade:1,local_estoque_id:10}])
   const ret=(key,item,qty)=>returns.createSaleReturn({...actor,saleId,idempotencyKey:'QA-OTTO-ROLLBACK-RET-'+key,values:{itens:[{venda_item_id:item,quantidade:qty}],tratamento:'credito',motivo:'QA-OTTO rollback',data_devolucao:'2026-10-13'}})
   await assert.rejects(ret('EXCESS',kitItem,2),e=>e.message.includes('só 1'))
   // Composição alterada depois da entrega: devolução usa a saída original.
   await op('kits',{produto_id:kit,produto_componente_id:a,quantidade:7},'KIT-CHANGED')
   const returned=await ret('PARTIAL',kitItem,0.5)
   assert.equal(Number(returned.record.valor_credito),50)
   const returnedAgain=await ret('PARTIAL',kitItem,0.5);assert.equal(returnedAgain.repetido,true)
   assert.equal(Number((await balance(a)).quantidade_fisica),22);assert.equal(Number((await balance(b)).quantidade_fisica),9.5)
   assert.equal(Number((await balance(kit))?.quantidade_fisica||0),0)
   await ret('REST',kitItem,0.5)
   await ret('SINGLE',singleItem,1)
   assert.equal(Number((await balance(a)).quantidade_fisica),24);assert.equal(Number((await balance(b)).quantidade_fisica),10)
   results.push({test:'Kit parcial, componentes compartilhados, limite entregue, composição alterada, crédito e repetição',returnedKitUnits:1,returnedComponents:{a:2,b:1},parentStock:0})
   // Mantém o kit original antes da segunda entrega.
   await op('kits',{produto_id:kit,produto_componente_id:a,quantidade:2},'KIT-RESTORED')
   await deliver('LAST',[{item_id:kitItem,quantidade:1,local_estoque_id:10}])
   await ret('FINAL',kitItem,1)
   assert.equal(Number((await balance(a)).quantidade_fisica),24);assert.equal(Number((await balance(b)).quantidade_fisica),10)
   const cmv=(await client.query("SELECT sum(m.quantidade*m.custo_unitario) AS total FROM erp.movimentacoes_estoque m LEFT JOIN erp.documentos_estoque d ON d.empresa_id=m.empresa_id AND d.id=m.documento_estoque_id WHERE m.empresa_id=$1 AND (m.origem_tipo='venda' AND m.origem_id=$2 OR d.venda_id=$2)",[2,saleId])).rows[0]
   assert.equal(Number(cmv.total),0)
   results.push({test:'Devolução completa reverte CMV original',netCMV:0,stockValue:780})


   const otherLocal=Number((await client.query('SELECT id FROM erp.locais_estoque WHERE empresa_id=$1 AND id<>$2 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1',[2,10])).rows[0].id)
   await op('movimentacoes',{produto_id:b,local_estoque_id:otherLocal,tipo:'entrada',quantidade:2,custo_unitario:40,motivo:'QA-OTTO'},'OTHER-LOCAL')
   const legacy=await repo.createErpEntityRecord({...actor,entityId:'pedidos',idempotencyKey:'QA-OTTO-ROLLBACK-LEGACY',values:{cliente_id:294,numero:'QA-OTTO-ROLLBACK-LEGACY',tipo_documento:'venda',categoria_id:127,local_estoque_id:10,data_venda:'2026-10-13',data_competencia:'2026-10-13',itens:[{tipo:'produto',item_id:kit,quantidade:1,valor_unitario:100}],parcelas:[{numero_parcela:1,data_vencimento:'2026-10-20',valor:100}]}})
   const legacyId=Number(legacy.id);await repo.confirmErpSale({...actor,saleId:legacyId,expectedVersion:1})
   await stockRepo.attendStockForSale({...actor,saleId:legacyId})
   const legacyDetails=await repo.getErpSaleDetails(2,legacyId)
   const legacyReturn=await returns.createSaleReturn({...actor,saleId:legacyId,idempotencyKey:'QA-OTTO-ROLLBACK-LEGACYRET',values:{itens:[{venda_item_id:Number(legacyDetails.items[0].id),quantidade:1}],tratamento:'credito',motivo:'QA-OTTO dois locais',data_devolucao:'2026-10-13'}})
   assert.equal(Number(legacyReturn.record.valor_credito),100)
   assert.equal(Number((await balance(a)).quantidade_fisica),24);assert.equal(Number((await balance(b)).quantidade_fisica),10)
   assert.equal(Number((await balance(b,otherLocal)).quantidade_fisica),2);assert.equal(Number((await balance(b,otherLocal)).custo_medio),40)
   const returnDocs=(await client.query("SELECT count(*)::int AS n FROM erp.documentos_estoque WHERE empresa_id=$1 AND venda_id=$2 AND tipo='devolucao_cliente'",[2,legacyId])).rows[0]
   assert.equal(returnDocs.n,1)
   results.push({test:'Entrega legada sem documento, componentes e custo original',returnDocuments:1,componentCosts:[20,30]})
   const reserveSale=await repo.createErpEntityRecord({...actor,entityId:'pedidos',idempotencyKey:'QA-OTTO-ROLLBACK-RESERVE',values:{cliente_id:294,numero:'QA-OTTO-ROLLBACK-RESERVE',tipo_documento:'venda',categoria_id:127,local_estoque_id:10,data_venda:'2026-10-13',data_competencia:'2026-10-13',itens:[{tipo:'produto',item_id:a,quantidade:2,valor_unitario:100}],parcelas:[{numero_parcela:1,data_vencimento:'2026-10-20',valor:200}]}})
   await repo.confirmErpSale({...actor,saleId:Number(reserveSale.id),expectedVersion:1})
   await assert.rejects(op('movimentacoes',{produto_id:a,local_estoque_id:10,tipo:'saida',quantidade:23,motivo:'QA-OTTO'},'RESERVED-FAIL'),e=>e.message.includes('Disponível para saída: 22')&&e.message.includes('reservado: 2'))
   results.push({test:'Mensagem de saldo distingue físico, reservado e disponível',physical:24,reserved:2,available:22})
   await client.query('SET CONSTRAINTS ALL IMMEDIATE')
  })
  throw rollback
 }))
} catch(error){if(error!==rollback){console.error(JSON.stringify({code:error.code,message:error.message,detail:error.detail,lastQuery,stack:error.stack},null,2));process.exitCode=1}else console.log(JSON.stringify({passed:true,rolledBack:true,results},null,2))}finally{await pg.closePool()}
