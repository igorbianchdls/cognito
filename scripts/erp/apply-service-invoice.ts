import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
import {connection,project} from './evolution-db.mjs'
import {runWithErpDatabaseContext,getErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,type SQLClient} from '../../src/lib/postgres'
import {generateServiceInvoicePdf} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'

const version='20261006020000',name='service_invoice_simulation',cache='.cache/service-invoice/'
const json=(path:string)=>JSON.parse(readFileSync(path,'utf8'))
const sql=readFileSync(`supabase/migrations/${version}_${name}.sql`,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const digest=createHash('sha256').update(sql).digest('hex'),test=json(cache+'smoke.json')
assert.equal(test.status,'passed');assert.equal(test.digest,digest);assert.equal(test.rolledBack,true)
assert(process.argv.includes('--apply')&&process.argv.includes('--project='+project),'Explicit verified project required')
const staged=json('.cache/shared/deployment.json'),manifest=json('.cache/shared/deploy-manifest.json')
assert.equal(staged.project,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');assert.equal(staged.sourceDigest,manifest.sourceDigest)
for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,'Staged source changed: '+file.file)
const cfg=dotenv.parse(readFileSync('.env.local'))
const tables=['entidades','produtos','servicos','vendas','vendas_itens','compras','compras_itens','contas_pagar','contas_receber','contas_pagar_parcelas','contas_receber_parcelas','pagamentos','movimentacoes_estoque','arquivos']
const db=connection();let committed=false
async function fingerprint(){
 const result:Record<string,string>={}
 for(const table of tables){const rows=(await db.query('SELECT to_jsonb(t)::text value FROM erp.'+table+' t')).rows.map((r:{value:string})=>r.value).sort();result[table]=createHash('sha256').update(JSON.stringify(rows)).digest('hex')}
 return result
}
async function main(){try{
 const response=await fetch('https://api.vercel.com/v13/deployments/'+staged.id+'?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+cfg.VERCEL_TOKEN},signal:AbortSignal.timeout(20000)})
 assert(response.ok);const deployment=await response.json();assert.equal(deployment.readyState,'READY');assert.equal(deployment.projectId,staged.project);assert.equal(deployment.meta.sharedSourceDigest,staged.sourceDigest)
 await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await db.query("SET LOCAL lock_timeout='5s'")
 assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73008,20261007) ok')).rows[0].ok,true)
 const before=await fingerprint(),oldNotes=(await db.query('SELECT to_jsonb(n) value FROM erp.notas_fiscais n ORDER BY id')).rows
 const prior=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
 if(prior){assert.equal(prior.name,name);assert.deepEqual(prior.statements,[sql])}else await db.query(sql)
 const afterNotes=(await db.query("SELECT to_jsonb(n)-'modo_operacao'-'simulacao_cenario' value FROM erp.notas_fiscais n ORDER BY id")).rows
 assert.deepEqual(afterNotes,oldNotes.map((r:{value:Record<string,unknown>})=>{const {modo_operacao:_,simulacao_cenario:__,...value}=r.value;return {value}}),'Existing notes changed')
 const client:SQLClient={release:()=>{},query:async(statement,params)=>{
  const ctx=getErpDatabaseContext();if(/\berp\./.test(statement)&&ctx){await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(ctx.tenantId),String(ctx.userId)])}else await db.query('RESET ROLE')
  return await db.query(statement,params) as never
 }}
 const notes=(await db.query("SELECT id FROM erp.notas_fiscais WHERE empresa_id=2 AND tipo='nfse' AND direcao='saida' AND modo_operacao='simulacao' AND excluido_em IS NULL ORDER BY id")).rows
 await runWithErpDatabaseContext({tenantId:2,userId:3},()=>runWithErpTransactionClient(client,async()=>{for(const note of notes)await generateServiceInvoicePdf(2,3,Number(note.id))}))
 await db.query('RESET ROLE');await db.query('SET CONSTRAINTS ALL IMMEDIATE')
 assert.deepEqual(await fingerprint(),before,'Financial, commercial or stock records changed')
 assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE oid='erp.notas_fiscais_pdfs'::regclass")).rows[0].relrowsecurity,true)
 assert.equal((await db.query("SELECT count(*)::int n FROM information_schema.table_privileges WHERE table_schema='erp' AND table_name='notas_fiscais_pdfs' AND grantee IN ('PUBLIC','anon','authenticated')")).rows[0].n,0)
 if(!prior)await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[sql]])
 await db.query('COMMIT');committed=true
 const report={status:'applied_and_verified',project,version,digest,deploymentId:staged.id,businessRecordsPreserved:true,existingNotesPreserved:true,pdfsGenerated:notes.length,noExternalFiscalApi:true,committed}
 mkdirSync(cache,{recursive:true});writeFileSync(cache+'application.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}catch(error){if(!committed)await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:committed?'requires_attention':'rolled_back',message:(error as Error).message,code:(error as {code?:string}).code}));process.exitCode=1}finally{await db.end()}}
main().catch(error=>{console.error((error as Error).message);process.exitCode=1})
