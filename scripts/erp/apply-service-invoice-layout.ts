import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync} from 'node:fs'
import {config} from 'dotenv'
import {connection,project} from './evolution-db.mjs'
import {getErpDatabaseContext,runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,closePool,type SQLClient} from '../../src/lib/postgres'
import {generateServiceInvoicePdf} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'

config({path:'.env.local',quiet:true})
assert(process.argv.includes('--apply')&&process.argv.includes('--project='+project),'Informe --apply --project='+project)
const company=Number(process.argv.find(a=>a.startsWith('--company='))?.split('=')[1]),user=Number(process.argv.find(a=>a.startsWith('--user='))?.split('=')[1]);assert(company>0&&user>0)
const prepare=process.argv.includes('--prepare'),version=prepare?'20261009150000':'20261009150100',name=prepare?'service_invoice_pdf_layout':'service_invoice_pdf_layout_activate',folder='.cache/nfse-layout',db=connection(),json=(p:string)=>JSON.parse(readFileSync(p,'utf8'))
const readSql=(file:string)=>readFileSync('supabase/migrations/'+file,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const sql=readSql(`${version}_${name}.sql`),digest=createHash('sha256').update(readSql('20261009150000_service_invoice_pdf_layout.sql')+readSql('20261009150100_service_invoice_pdf_layout_activate.sql')).digest('hex'),test=json(folder+'/smoke.json'),staged=json('.cache/shared/deployment.json'),manifest=json('.cache/shared/deploy-manifest.json')
assert.equal(test.status,'passed');assert.equal(test.rolledBack,true);assert.equal(test.digest,digest);assert.equal(staged.sourceDigest,manifest.sourceDigest)
for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,'Staged source changed: '+file.file)
async function main(){let committed=false;try{
 const response=await fetch(`https://api.vercel.com/v13/deployments/${staged.id}?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua`,{headers:{Authorization:'Bearer '+process.env.VERCEL_TOKEN},signal:AbortSignal.timeout(25000)});assert(response.ok)
 const deployment=await response.json();assert.equal(deployment.readyState,'READY');assert.equal(deployment.projectId,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');assert.equal(deployment.meta.sharedSourceDigest,staged.sourceDigest)
 if(!prepare){const live=await(await fetch('https://api.vercel.com/v13/deployments/cognito-seven.vercel.app?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+process.env.VERCEL_TOKEN}})).json();assert.equal(live.id,staged.id,'Publique a aplicação nova antes de ativar o layout')}
 await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await db.query("SET LOCAL lock_timeout='5s'")
 assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73008,20261009) ok')).rows[0].ok,true)
 const notesBefore=(await db.query("SELECT md5(coalesce(string_agg(to_jsonb(n)::text,'|' ORDER BY id),'')) hash FROM erp.notas_fiscais n")).rows[0].hash
 const oldPdfs=(await db.query('SELECT id,versao,nome,hash_sha256,md5(conteudo) bytes_hash FROM erp.notas_fiscais_pdfs ORDER BY id')).rows
 const prior=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
 if(!prepare)assert((await db.query("SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261009150000'")).rows.length,'Prepare o schema primeiro')
 if(prior){assert.equal(prior.name,name);assert.deepEqual(prior.statements,[sql])}else await db.query(sql)
 const client:SQLClient={release:()=>{},query:async(statement,params)=>{const ctx=getErpDatabaseContext();assert(ctx);await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(ctx.tenantId),String(ctx.userId)]);return await db.query(statement,params) as never}}
 const notes=(await db.query("SELECT id FROM erp.notas_fiscais WHERE empresa_id=$1 AND tipo='nfse' AND direcao='saida' AND modo_operacao='simulacao' AND excluido_em IS NULL ORDER BY id",[company])).rows
 if(!prepare)await runWithErpDatabaseContext({tenantId:company,userId:user},()=>runWithErpTransactionClient(client,async()=>{for(const note of notes)await generateServiceInvoicePdf(company,user,Number(note.id))}))
 await db.query('RESET ROLE')
 assert.equal((await db.query("SELECT md5(coalesce(string_agg(to_jsonb(n)::text,'|' ORDER BY id),'')) hash FROM erp.notas_fiscais n")).rows[0].hash,notesBefore,'Notas alteradas')
 assert.deepEqual((await db.query('SELECT id,versao,nome,hash_sha256,md5(conteudo) bytes_hash FROM erp.notas_fiscais_pdfs WHERE id=ANY($1::bigint[]) ORDER BY id',[oldPdfs.map(p=>p.id)])).rows,oldPdfs,'PDF original alterado')
 if(!prepare)assert.equal((await db.query("SELECT count(*)::int n FROM erp.notas_fiscais n WHERE empresa_id=$1 AND tipo='nfse' AND direcao='saida' AND modo_operacao='simulacao' AND excluido_em IS NULL AND NOT EXISTS(SELECT 1 FROM erp.notas_fiscais_pdfs p WHERE p.empresa_id=n.empresa_id AND p.nota_fiscal_id=n.id AND p.versao=n.versao AND p.layout_versao=2)",[company])).rows[0].n,0)
 if(!prior)await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[sql]])
 await db.query('COMMIT');committed=true
 const report={status:'applied_and_verified',phase:prepare?'prepared':'activated',version,digest,deploymentId:staged.id,sourceDigest:staged.sourceDigest,company,notesPreserved:true,originalPdfsPreserved:true,notesWithCurrentLayout:prepare?0:notes.length,noExternalFiscalApi:true,committed}
 writeFileSync(folder+(prepare?'/preparation.json':'/application.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
}catch(e){if(!committed)await db.query('ROLLBACK').catch(()=>{});throw e}finally{await Promise.allSettled([db.end(),closePool()])}}
main().catch(e=>{console.error(e instanceof Error?e.message:'Falha na atualização de layout');process.exitCode=1})
