import {config} from 'dotenv'
import {randomUUID} from 'node:crypto'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,withTransaction,runQuery,closePool} from '../../src/lib/postgres'
import {createServiceInvoice,getServiceInvoice,actOnServiceInvoice} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'
config({path:'.env.local',quiet:true})
async function main(){try{await runWithErpDatabaseContext({tenantId:2,userId:3,statementTimeoutMs:30000},async()=>{
 const customer=(await runQuery('SELECT id FROM erp.entidades WHERE empresa_id=$1 AND eh_cliente AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1',[2]))[0]
 const service=(await runQuery('SELECT id FROM erp.servicos WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1',[2]))[0]
 if(process.argv.includes('--standalone')){
  const note=await createServiceInvoice(2,3,{cliente_id:Number(customer.id),data_competencia:'2026-10-06',codigo_municipio_prestacao:'2304400',itens:[{tipo:'servico',item_id:Number(service.id),descricao:'Teste real do contexto restrito',quantidade:1,valor_unitario:100}],aliquota_iss:5,iss_retido:false},randomUUID())
  await actOnServiceInvoice(2,3,Number(note.record.id),{acao:'excluir',chave_operacao:randomUUID(),versao:1,motivo:'Limpeza de verificação do contexto restrito'})
  console.log(JSON.stringify({status:'passed',standalone:true,archived:note.record.id}));return
 }
 await withTransaction(async client=>{
  await runWithErpTransactionClient(client,async()=>{
   const note=await createServiceInvoice(2,3,{cliente_id:Number(customer.id),data_competencia:'2026-10-06',codigo_municipio_prestacao:'2304400',itens:[{tipo:'servico',item_id:Number(service.id),descricao:'Teste real do contexto restrito',quantidade:1,valor_unitario:100}],aliquota_iss:5,iss_retido:false},randomUUID())
   await getServiceInvoice(2,Number(note.record.id))
   await actOnServiceInvoice(2,3,Number(note.record.id),{acao:'emitir',chave_operacao:randomUUID(),versao:1})
  })
  await client.query('SET CONSTRAINTS ALL IMMEDIATE')
  throw new Error('EXPECTED_ROLLBACK')
 })
})}catch(error){if((error as Error).message==='EXPECTED_ROLLBACK')console.log(JSON.stringify({status:'passed',realRuntimeContext:true,rolledBack:true}));else{console.error(JSON.stringify({status:'failed',message:(error as Error).message,code:(error as {code?:string}).code,stack:(error as Error).stack?.split('\n').slice(0,6)}));process.exitCode=1}}finally{await closePool()}}
main()
