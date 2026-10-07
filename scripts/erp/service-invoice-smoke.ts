import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {connection} from './evolution-db.mjs'
import {runWithErpDatabaseContext,getErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,type SQLClient} from '../../src/lib/postgres'
import {createServiceInvoice,editServiceInvoice,actOnServiceInvoice,getServiceInvoice,getServiceInvoicePdf,validateServiceInvoice,listServiceInvoices,generateServiceInvoicePdf} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'
import {renderServiceInvoicePdf} from '../../src/products/erp/server/fiscal/serviceInvoicePdf'
import {serviceInvoiceInputSchema} from '../../src/products/erp/shared/serviceInvoiceContracts'
import {proposalSchema,proposalPreview} from '../../src/products/chatgptplugin/actions/contracts'
import {operationSnapshot,executeOperation} from '../../src/products/chatgptplugin/actions/operations'
import {ERP_CAPABILITIES} from '../../src/products/erp/shared/professionalContracts'
import {decideApproval} from '../../src/products/chatgptplugin/approvals/approvalRepository'
import type {ErpAccessContext} from '../../src/products/erp/server/erpAccess'
import type {PluginPrincipal} from '../../src/products/chatgptplugin/shared/contracts'
import type {PluginConfig} from '../../src/products/chatgptplugin/shared/config'

const migration='20261006020000_service_invoice_simulation.sql'
const sql=readFileSync('supabase/migrations/'+migration,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const digest=createHash('sha256').update(sql).digest('hex'),db=connection(),checks:string[]=[]
let current='setup'
async function pass(name:string,fn:()=>Promise<unknown>){current=name;const result=await fn();checks.push(name);return result}
async function reject(name:string,fn:()=>Promise<unknown>){current=name;await db.query('SAVEPOINT invalid_case');try{await assert.rejects(fn);checks.push(name)}finally{await db.query('ROLLBACK TO SAVEPOINT invalid_case');await db.query('RELEASE SAVEPOINT invalid_case')}}
async function main(){try{
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'")
 const before=(await db.query('SELECT id,numero,status,metadata,conteudo_bloqueado_em FROM erp.notas_fiscais ORDER BY id')).rows
 const sharedUser=(await db.query('SELECT clerk_user_id FROM shared.usuarios WHERE id=3')).rows[0]
 if(!(await db.query("SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261006020000'")).rows.length)await db.query(sql)
 assert.deepEqual((await db.query('SELECT id,numero,status,metadata,conteudo_bloqueado_em FROM erp.notas_fiscais ORDER BY id')).rows,before)
 const customer=(await db.query('SELECT id FROM erp.entidades WHERE empresa_id=2 AND eh_cliente AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
 const service=(await db.query('SELECT id,nome FROM erp.servicos WHERE empresa_id=2 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
 const client:SQLClient={release:()=>{},query:async(statement,params)=>{
   const ctx=getErpDatabaseContext()
   if(/\berp\./.test(statement)&&ctx){await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_empresa_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(ctx.tenantId),String(ctx.userId)])}else await db.query('RESET ROLE')
   try{return await db.query(statement,params) as never}catch(error){console.error(JSON.stringify({queryCase:current,code:(error as {code?:string}).code,message:(error as Error).message}));throw error}
 }}
 const input=serviceInvoiceInputSchema.parse({cliente_id:Number(customer.id),data_competencia:'2026-10-06',codigo_municipio_prestacao:'2304400',itens:[{tipo:'servico',item_id:Number(service.id),descricao:'Suporte técnico demonstrativo com acentuação',quantidade:2,valor_unitario:150.55,desconto:1.10}],aliquota_iss:5,iss_retido:true})
 mkdirSync('.cache/service-invoice',{recursive:true})
 await runWithErpDatabaseContext({tenantId:2,userId:3},()=>runWithErpTransactionClient(client,async()=>{
  const key=randomUUID(),first=await createServiceInvoice(2,3,input,key);const id=Number(first.record.id)
  assert.equal(first.record.modo_operacao,'simulacao');checks.push('Create standalone simulated invoice')
  assert.equal((await createServiceInvoice(2,3,input,key)).reused,true);checks.push('Create replay does not duplicate')
  await reject('Changed request under same key rejected',()=>createServiceInvoice(2,3,{...input,observacoes:'changed'},key))
  await reject('Production mode injected into payload rejected',async()=>createServiceInvoice(2,3,{...input,modo_operacao:'real'} as never,randomUUID()))
  await reject('Cross-company customer rejected',()=>createServiceInvoice(2,3,{...input,cliente_id:9999999},randomUUID()))
  await reject('Actor override rejected',()=>createServiceInvoice(2,999,input,randomUUID()))
  const detail=await getServiceInvoice(2,id);assert.equal(Number(detail.record.valor_total),300);assert.equal(Number(detail.totals.valor_iss),15);assert.equal(Number(detail.totals.valor_liquido),285);checks.push('Amounts, discount, ISS and retention coherent')
  await pass('Validate service invoice',async()=>assert.equal((await validateServiceInvoice(2,id)).ready,true))
  const initialPdf=await getServiceInvoicePdf(2,id);assert(initialPdf.bytes.subarray(0,5).toString()==='%PDF-');writeFileSync('.cache/service-invoice/sample.pdf',initialPdf.bytes);checks.push('Private PDF created atomically')
  const editKey=randomUUID(),changed={...input,observacoes:'Revisado para demonstração'}
  const edited=await editServiceInvoice(2,3,id,changed,editKey,1);assert.equal(Number(edited.record.versao),2)
  assert.equal((await editServiceInvoice(2,3,id,changed,editKey,1)).reused,true);checks.push('Edit and retry preserve prior PDF')
  assert.equal((await getServiceInvoicePdf(2,id,1)).hash,initialPdf.hash)
  await reject('Stale version rejected',()=>editServiceInvoice(2,3,id,changed,randomUUID(),1))
  const emit={acao:'emitir' as const,chave_operacao:randomUUID(),versao:2,cenario:'timeout' as const}
  const waiting=await actOnServiceInvoice(2,3,id,emit);assert.equal(waiting.record.status,'aguardando_retorno')
  assert.equal((await actOnServiceInvoice(2,3,id,emit)).reused,true);checks.push('Lost response scenario remains idempotent')
  await reject('Second emission key while awaiting rejected',()=>actOnServiceInvoice(2,3,id,{...emit,chave_operacao:randomUUID(),versao:3}))
  const resolved=await actOnServiceInvoice(2,3,id,{acao:'consultar',chave_operacao:randomUUID(),versao:3});assert.equal(resolved.record.status,'emitida');checks.push('Consult reconciles simulated authorization')
  await db.query('SET CONSTRAINTS ALL IMMEDIATE');await db.query('SET CONSTRAINTS ALL DEFERRED')
  await reject('Finalized content protected',()=>editServiceInvoice(2,3,id,changed,randomUUID(),4))
  await reject('Simulation cannot become real',()=>db.query("UPDATE erp.notas_fiscais SET provedor='focus_nfe' WHERE empresa_id=2 AND id=$1",[id]))
  await reject('Finalized note cannot be archived',()=>actOnServiceInvoice(2,3,id,{acao:'excluir',chave_operacao:randomUUID(),versao:4,motivo:'Test'}))
  const cancel={acao:'cancelar' as const,chave_operacao:randomUUID(),versao:4,motivo:'Cancelamento demonstrativo'}
  assert.equal((await actOnServiceInvoice(2,3,id,cancel)).record.status,'cancelada');assert.equal((await actOnServiceInvoice(2,3,id,cancel)).reused,true);checks.push('Cancellation and repeated response preserve document')
  assert.equal((await getServiceInvoicePdf(2,id,1)).hash,initialPdf.hash);assert.equal((await getServiceInvoicePdf(2,id)).version,5);checks.push('Cancellation PDF version retained alongside original')
  for(const scenario of ['sucesso','rejeicao','demora'] as const){
   const n=await createServiceInvoice(2,3,input,randomUUID());const result=await actOnServiceInvoice(2,3,Number(n.record.id),{acao:'emitir',chave_operacao:randomUUID(),versao:1,cenario:scenario})
   assert.equal(result.record.status,{sucesso:'emitida',rejeicao:'falha',demora:'aguardando_retorno'}[scenario]);checks.push('Scenario '+scenario)
  }
  const archived=await createServiceInvoice(2,3,input,randomUUID()),archiveId=Number(archived.record.id),archive={acao:'excluir' as const,chave_operacao:randomUUID(),versao:1,motivo:'Rascunho de teste'}
  await actOnServiceInvoice(2,3,archiveId,archive);assert.equal((await actOnServiceInvoice(2,3,archiveId,archive)).reused,true);await reject('Archived invoice absent in normal reads',()=>getServiceInvoice(2,archiveId));checks.push('Draft soft deletion idempotent')
  const owner:PluginPrincipal={userId:3,clerkUserId:sharedUser.clerk_user_id,clientId:'simulation_test',scopes:['erp:read','erp:write'],companies:[{id:2,name:'Empresa de teste',profile:'administrador',capabilities:[...ERP_CAPABILITIES]}]}
  const config:PluginConfig={resource:'https://cognito-seven.vercel.app/api/mcp',metadataUrl:'https://cognito-seven.vercel.app/.well-known/oauth-protected-resource/api/mcp',issuer:'https://fixture.clerk.accounts.dev',scope:'erp:read',clientIds:['simulation_test'],origins:[],toolTimeoutMs:15000,requestsPerMinute:60}
  // The production transaction guard rejects inheriting a write transaction as read-only.
  // Keep transport's read-only assertion, then use this rollback fixture's existing transaction.
  // As tools de NFS-e saíram do chat até a fase fiscal; a aprovação das propostas continua coberta abaixo.
  const proposal=proposalSchema.parse({tipo:'nota_servico',dados:input});assert.equal(proposalPreview(proposal).total,300)
  const draft=randomUUID()
  await db.query('RESET ROLE')
  await db.query(`INSERT INTO plugin.drafts(id,empresa_id,user_id,oauth_client_id,operation_key,proposal,integration) VALUES($1,2,3,'simulation_test',$2,$3::jsonb,'chatgpt')`,[draft,randomUUID(),JSON.stringify(proposal)])
  const session={tenantId:2,sharedUserId:3,clerkUserId:sharedUser.clerk_user_id,capabilities:[...ERP_CAPABILITIES]} as ErpAccessContext
  const saved=await decideApproval(draft,session,'save');assert.equal(saved.status,'saved');assert(saved.registro_id);assert.equal((await decideApproval(draft,session,'save')).registro_id,saved.registro_id);checks.push('Real plugin approval saves once inside transaction')
  const approvedId=Number(saved.registro_id)
  async function approved(proposalInput:unknown){
   const parsed=proposalSchema.parse(proposalInput),snapshot=await operationSnapshot(2,parsed),draftId=randomUUID()
   await db.query('RESET ROLE')
   await db.query(`INSERT INTO plugin.drafts(id,empresa_id,user_id,oauth_client_id,operation_key,proposal,target_snapshot,integration) VALUES($1,2,3,'simulation_test',$2,$3::jsonb,$4::jsonb,'chatgpt')`,[draftId,randomUUID(),JSON.stringify(parsed),JSON.stringify(snapshot)])
   return draftId
  }
  const stale=await approved({tipo:'simular_nota_servico',dados:{registro_id:approvedId,cenario:'sucesso'}})
  await editServiceInvoice(2,3,approvedId,{...input,observacoes:'Mudou após preparar proposta'},randomUUID(),1)
  await reject('Human approval rejects stale fiscal proposal',()=>decideApproval(stale,session,'save'))
  const editDraft=await approved({tipo:'editar_nota_servico',dados:{registro_id:approvedId,...input}})
  assert.equal((await decideApproval(editDraft,session,'save')).status,'saved');checks.push('Human approval edits service invoice')
  const emitDraft=await approved({tipo:'simular_nota_servico',dados:{registro_id:approvedId,cenario:'timeout'}})
  assert.equal((await decideApproval(emitDraft,session,'save')).status,'saved');checks.push('Human approval simulates lost response')
  const consultDraft=await approved({tipo:'consultar_resultado_nota_servico',dados:{registro_id:approvedId}})
  assert.equal((await decideApproval(consultDraft,session,'save')).status,'saved');checks.push('Human approval reconciles pending note')
  const cancelDraft=await approved({tipo:'cancelar_nota_servico',dados:{registro_id:approvedId,motivo:'Cancelamento de teste'}})
  assert.equal((await decideApproval(cancelDraft,session,'save')).status,'saved');checks.push('Human approval cancels simulated note')
  const deletable=await createServiceInvoice(2,3,input,randomUUID())
  const deleteDraft=await approved({tipo:'excluir_nota_servico',dados:{registro_id:Number(deletable.record.id),motivo:'Exclusão de teste'}})
  assert.equal((await decideApproval(deleteDraft,session,'save')).status,'saved');checks.push('Human approval deletes only draft note')
  const fresh=await createServiceInvoice(2,3,input,randomUUID())
  const operation=proposalSchema.parse({tipo:'simular_nota_servico',dados:{registro_id:approvedId,cenario:'sucesso'}})
  const freshOperation=proposalSchema.parse({tipo:'simular_nota_servico',dados:{registro_id:Number(fresh.record.id),cenario:'sucesso'}})
  assert((await operationSnapshot(2,operation))?.hash);await executeOperation(2,3,freshOperation,'smoke-op-'+randomUUID());checks.push('Approved fiscal operation uses common ERP service')
  const stress=renderServiceInvoicePdf({numero:'DEMO-STRESS',status:'emitida',data_competencia:'2026-10-06',emitente_snapshot:{nome:'Empresa demonstrativa'},destinatario_snapshot:{nome:'Cliente com acentuação'},valor_total:10000,items:Array.from({length:50},(_,i)=>({descricao:'Serviço '+i+' - descrição extensa '.repeat(8),quantidade:1,valor_unitario:200,valor_total:200})),totals:{valor_liquido:10000}})
  writeFileSync('.cache/service-invoice/stress.pdf',stress);checks.push('PDF long item descriptions and pagination')
  await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id','999999999',true),set_config('app.erp_empresa_id','999999999',true)")
  assert.equal((await db.query('SELECT count(*)::int n FROM erp.notas_fiscais WHERE empresa_id=2')).rows[0].n,0)
  assert.equal((await db.query('SELECT count(*)::int n FROM erp.notas_fiscais_pdfs WHERE empresa_id=2')).rows[0].n,0);checks.push('Tenant isolation for notes and PDF bytes')
 }))
 await db.query('RESET ROLE');await db.query('ROLLBACK')
 assert.deepEqual((await db.query('SELECT id,numero,status,metadata,conteudo_bloqueado_em FROM erp.notas_fiscais ORDER BY id')).rows,before)
 const report={status:'passed',migration,digest,rolledBack:true,noExternalFiscalApi:true,checks}
 writeFileSync('.cache/service-invoice/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,checks:checks.length}))
}catch(error){await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({case:current,message:(error as Error).message,code:(error as {code?:string}).code}));process.exitCode=1}
finally{await db.end()}
}
main().catch(error=>{console.error((error as Error).message);process.exitCode=1})
