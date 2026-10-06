import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
import {connection,project} from './evolution-db.mjs'

const version='20261006010000',name='prepare_erp_fiscal_integration'
const apply=process.argv.includes('--apply')
assert(process.argv.slice(2).every(arg=>['--check','--apply','--project='+project].includes(arg)))
if(apply)assert(process.argv.includes('--project='+project),'Explicit verified project required')
const sql=readFileSync('supabase/migrations/'+version+'_'+name+'.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const digest=createHash('sha256').update(sql).digest('hex')
for(const file of ['smoke.json','repository-smoke.json']){
  const proof=JSON.parse(readFileSync('.cache/fiscal-preparation/'+file));assert.equal(proof.status,'passed');assert.equal(proof.digest||proof.migrationDigest,digest);assert.equal(proof.rolledBack,true)
}
if(apply){
  const staged=JSON.parse(readFileSync('.cache/shared/deployment.json')),manifest=JSON.parse(readFileSync('.cache/shared/deploy-manifest.json'))
  const cfg=dotenv.parse(readFileSync('.env.local'))
  assert.equal(staged.project,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');assert.equal(staged.sourceDigest,manifest.sourceDigest)
  for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,'Staged source changed')
  const response=await fetch('https://api.vercel.com/v13/deployments/'+staged.id+'?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+cfg.VERCEL_TOKEN},signal:AbortSignal.timeout(20000)})
  assert(response.ok);const metadata=await response.json();assert.equal(metadata.readyState,'READY');assert.equal(metadata.projectId,staged.project)
  assert.equal(metadata.meta.sharedSourceDigest,staged.sourceDigest)
}
const oldTables=['configuracoes_fiscais','notas_fiscais','notas_fiscais_itens','notas_fiscais_totais','notas_fiscais_eventos']
const newTables=['notas_fiscais_tentativas','notas_fiscais_retornos','notas_fiscais_arquivos']
const business=['entidades','produtos','servicos','vendas','vendas_itens','compras','compras_itens','contas_pagar','contas_receber','contas_pagar_parcelas','contas_receber_parcelas','pagamentos','arquivos']
const db=connection();let committed=false
async function businessFingerprint(){
  const result={};for(const table of business){const rows=(await db.query('SELECT row_to_json(t) AS value FROM erp.'+table+' t')).rows.map(r=>JSON.stringify(r.value)).sort();result[table]={count:rows.length,digest:createHash('sha256').update(JSON.stringify(rows)).digest('hex')}}return result
}
async function verify(){
  for(const table of [...oldTables,...newTables])assert.equal((await db.query('SELECT count(*)::int n FROM erp.'+table)).rows[0].n,0,'Unexpected fiscal records')
  const rls=(await db.query(`SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='erp'::regnamespace AND relname=ANY($1)`,[[...oldTables,...newTables]])).rows
  assert.equal(rls.length,8);assert(rls.every(row=>row.relrowsecurity))
  assert.equal((await db.query(`SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='erp' AND table_name=ANY($1) AND column_name IN ('ref_focus','resposta_focus','focus_empresa_ref')`,[oldTables])).rows[0].n,0)
  assert.equal((await db.query(`SELECT count(*)::int n FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relnamespace='erp'::regnamespace AND t.relname=ANY($1) AND NOT c.convalidated`,[[...oldTables,...newTables]])).rows[0].n,0)
  assert.equal((await db.query(`SELECT count(*)::int n FROM information_schema.table_privileges WHERE table_schema='erp' AND table_name=ANY($1) AND grantee IN ('PUBLIC','anon','authenticated')`,[newTables])).rows[0].n,0)
}
try{
  await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ')
  await db.query("SET LOCAL lock_timeout='5s'")
  const previous=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
  if(previous){assert.equal(previous.name,name);assert.deepEqual(previous.statements,[sql]);await verify();await db.query('ROLLBACK');console.log(JSON.stringify({status:'already_applied_and_verified',version,digest}))}
  else{
    assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73008,20261006) ok')).rows[0].ok,true)
    for(const table of oldTables)assert.equal((await db.query('SELECT count(*)::int n FROM erp.'+table)).rows[0].n,0,'Fiscal data appeared; refresh backfill plan')
    const fingerprints=await businessFingerprint()
    const before={date:new Date().toISOString(),project,fiscalTables:oldTables,business:fingerprints,
      columns:(await db.query(`SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='erp' AND table_name=ANY($1) ORDER BY table_name,ordinal_position`,[oldTables])).rows,
      constraints:(await db.query(`SELECT t.relname AS table_name,c.conname,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relnamespace='erp'::regnamespace AND t.relname=ANY($1) ORDER BY t.relname,c.conname`,[oldTables])).rows,
      indexes:(await db.query(`SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='erp' AND tablename=ANY($1) ORDER BY tablename,indexname`,[oldTables])).rows}
    mkdirSync('.cache/fiscal-preparation',{recursive:true});writeFileSync('.cache/fiscal-preparation/before-metadata.json',JSON.stringify(before,null,2))
    if(!apply){await db.query('ROLLBACK');console.log(JSON.stringify({status:'preflight_passed',version,digest,allFiscalTablesEmpty:true}))}
    else{
      await db.query(sql);await db.query('SET CONSTRAINTS ALL IMMEDIATE');await verify();assert.deepEqual(await businessFingerprint(),fingerprints,'Existing business records changed')
      await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[sql]])
      await db.query('COMMIT');committed=true
      await verify()
      const report={status:'applied_and_verified',date:new Date().toISOString(),project,version,digest,fiscalTables:8,businessRecordsPreserved:true,noFiscalRecordsCreated:true,noExternalApiEnabled:true,committed}
      writeFileSync('.cache/fiscal-preparation/application.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
    }
  }
}catch(error){if(!committed)await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:committed?'committed_requires_attention':'rolled_back',code:error.code,message:error.message}));process.exitCode=1}
finally{await db.end()}
