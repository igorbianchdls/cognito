import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
import {connection,project} from '../erp/evolution-db.mjs'
import {migrationFile,tableNames} from './schema-contract.mjs'

const args=process.argv.slice(2),apply=args.includes('--apply')
assert(args.every(arg=>arg==='--check'||arg==='--apply'||arg==='--project='+project))
if(apply)assert(args.includes('--project='+project),'Explicit verified project required')
const hash=value=>createHash('sha256').update(value).digest('hex'),ident=value=>'"'+value.replaceAll('"','""')+'"'
const sql=readFileSync('supabase/migrations/'+migrationFile,'utf8'),migrationDigest=hash(sql)
const body=sql.replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const version=migrationFile.slice(0,14),name=migrationFile.slice(15,-4)
const proof=JSON.parse(readFileSync('.cache/shared/backup-proof.json'))
const smoke=JSON.parse(readFileSync('.cache/shared/smoke.json'))
const concurrency=JSON.parse(readFileSync('.cache/shared/concurrency.json'))
for(const result of [proof,smoke,concurrency])assert.equal(result.status,'passed')
assert.equal(proof.project,project);assert.equal(proof.backupDigest,hash(readFileSync('.cache/shared/backup-before.json')))
assert.equal(proof.backupDigest,hash(readFileSync(proof.durableBackupPath)))
assert(proof.migratedFullSnapshot&&proof.businessAndPluginRecordsPreserved)
assert.equal(proof.migrationDigest,migrationDigest);assert.equal(smoke.migrationDigest,migrationDigest)
assert(concurrency.independentPostgresSessions)
const backup=JSON.parse(readFileSync('.cache/shared/backup-before.json'))
const config=dotenv.parse(readFileSync('.env.local')),headers={Authorization:'Bearer '+config.VERCEL_TOKEN}
let deployment
if(apply){
 deployment=JSON.parse(readFileSync('.cache/shared/deployment.json'))
 const manifest=JSON.parse(readFileSync('.cache/shared/deploy-manifest.json'))
 assert.equal(deployment.project,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');assert.equal(deployment.migrationDigest,migrationDigest)
 assert.equal(manifest.sourceDigest,hash(JSON.stringify(manifest.files)))
 assert.equal(deployment.sourceDigest,manifest.sourceDigest)
 for(const file of manifest.files)assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'),file.sha,'Rebuild changed application source: '+file.file)
 const response=await fetch('https://api.vercel.com/v13/deployments/'+deployment.id,{headers})
 assert(response.ok);const current=await response.json()
 assert.equal(current.projectId,deployment.project);assert.equal(current.readyState,'READY');assert.equal(current.target,'production')
 assert.equal(current.meta?.sharedMigrationDigest,migrationDigest)
 assert.equal(current.meta?.sharedSourceDigest,manifest.sourceDigest)
}
const client=connection();let committed=false
try{
 await client.connect();await client.query(apply?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
 const applied=(await client.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
 if(applied){assert.equal(applied.name,name);assert.deepEqual(applied.statements,[body]);console.log(JSON.stringify({status:'already_applied',version}));await client.query('ROLLBACK')}
 else{
  if(apply){
   await client.query("SET LOCAL lock_timeout='10s'")
   assert.equal((await client.query('SELECT pg_try_advisory_xact_lock(73008,20261005) ok')).rows[0].ok,true)
   await client.query('LOCK TABLE '+backup.tables.map(t=>ident(t.schema)+'.'+ident(t.name)).join(',')+' IN SHARE MODE')
  }
  // Verify the backup still covers the exact current records before any rename.
  for(const table of backup.tables){
   const rows=(await client.query(`SELECT ${table.columns.map(c=>`${ident(c)}::text AS ${ident(c)}`).join(',')} FROM ${ident(table.schema)}.${ident(table.name)}`)).rows
   const digest=createHash('sha256').update(JSON.stringify(rows.map(row=>JSON.stringify(row)).sort())).digest('hex')
   assert.equal(digest,table.digest,'Refresh backup; current records changed: '+table.schema+'.'+table.name)
  }
  if(!apply){await client.query('ROLLBACK');console.log(JSON.stringify({status:'preflight_passed',version,migrationDigest,restoredBackup:true,independentConcurrency:true}))}
  else{
   await client.query(body)
   for(const table of backup.tables){
    const tableName=table.schema==='shared'?tableNames[table.name]||table.name:table.name
    const columns=table.columns.map(c=>c==='tenant_id'?'empresa_id':table.name==='tenant_memberships'&&c==='user_id'?'usuario_id':c==='erp_profile_id'||table.name==='erp_profile_permissions'&&c==='profile_id'?'perfil_acesso_id':c)
    const rows=(await client.query(`SELECT ${columns.map((c,i)=>`${ident(c)}::text AS ${ident(table.columns[i])}`).join(',')} FROM ${ident(table.schema)}.${ident(tableName)}`)).rows
    if(table.name==='erp_profile_permissions'){
     const baseline=new Set(rows.map(row=>JSON.stringify(row)))
     for(const old of table.rows)assert(baseline.has(JSON.stringify(old)),'Existing capability removed')
    }else{
     const expected=table.rows.map(row=>({...row,...(table.name==='users'?{email:row.email.trim().toLowerCase()}:{}),...(table.name==='tenant_memberships'&&['owner','admin'].includes(row.role)?{erp_profile_id:'administrador'}:{})}))
     assert.deepEqual(rows.map(row=>JSON.stringify(row)).sort(),expected.map(row=>JSON.stringify(row)).sort(),'Records changed unexpectedly: '+table.schema+'.'+table.name)
    }
   }
   assert.equal((await client.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='shared'")).rows[0].n,8)
   assert.equal((await client.query("SELECT count(*)::int n FROM information_schema.columns WHERE table_schema IN ('shared','erp','plugin') AND column_name='tenant_id'")).rows[0].n,0)
   await client.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]])
   await client.query('COMMIT');committed=true
   // Built using production env and deliberately staged without domain assignment.
   const promoted=await fetch(`https://api.vercel.com/v10/projects/${deployment.project}/promote/${deployment.id}`,{method:'POST',headers:{...headers,'content-type':'application/json'},body:'{}'})
   const report={status:promoted.ok?'applied_and_promotion_requested':'applied_promotion_failed',version,project,migrationDigest,deploymentId:deployment.id,promotionHTTP:promoted.status,erpAndPluginRecordsPreserved:true,sharedTables:8,committed:true}
   writeFileSync('.cache/shared/application.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!promoted.ok)process.exitCode=1
  }
 }
}catch(error){if(!committed)await client.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:committed?'committed_release_needs_attention':'rolled_back',code:error.code,message:error.message}));process.exitCode=1}
finally{await client.end()}
