import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {connection,project} from '../erp/evolution-db.mjs'
const mode=process.argv[2]||'--check';assert(['--check','--apply','--finalize'].includes(mode))
const file=mode==='--finalize'?'20261016200000_mcp_domain_uniqueness.sql':'20261016193000_mcp_product_domains.sql',sql=readFileSync('supabase/migrations/'+file,'utf8'),version=file.slice(0,14),name=file.slice(15,-4),body=sql.replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''),digest=createHash('sha256').update(sql).digest('hex'),db=connection()
try {
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'")
 const applied=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
 if(applied){assert.equal(applied.name,name);assert.deepEqual(applied.statements,[body]);await db.query('ROLLBACK');console.log(JSON.stringify({status:'already_applied',project,version}));}
 else {
  assert((await db.query("SELECT to_regclass('plugin.drafts') present")).rows[0].present)
  const columns=(await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema='plugin' AND table_name='drafts'")).rows.map(r=>r.column_name)
  assert(columns.includes('empresa_id')&&columns.includes('target_snapshot'))
  const constraints=(await db.query("SELECT conname FROM pg_constraint WHERE conrelid='plugin.drafts'::regclass")).rows.map(r=>r.conname)
  assert(constraints.includes('drafts_integration_operation_key'))
  if(mode==='--check'){await db.query('ROLLBACK');console.log(JSON.stringify({status:'preflight_passed',project,version}));}
  else {
   const proof=JSON.parse(readFileSync('.cache/tables-mcp/smoke.json'));assert.equal(proof.status,'passed');assert.equal(proof.toolsExercised.length,31);assert.equal(proof.migrationDigests[file],digest)
   if(mode==='--finalize'){
    const published=JSON.parse(readFileSync('.cache/tables-mcp/deployment/published.json'));assert.equal(published.status,'published_and_verified')
    assert(columns.includes('domain')&&constraints.includes('drafts_domain_operation_key'))
   }
   assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73016,193000) ok')).rows[0].ok,true)
   const before=(await db.query("SELECT count(*)::int n,md5(coalesce(string_agg(md5((to_jsonb(d)-'domain'-'operation_type'-'result')::text),'' ORDER BY id),'')) digest FROM plugin.drafts d")).rows[0]
   await db.query(body)
   if(mode==='--finalize'){
    const sample=(await db.query("SELECT * FROM plugin.drafts WHERE domain='tables' ORDER BY created_at DESC LIMIT 1")).rows[0];assert(sample,'Validate a real Tables operation before finalizing')
    await db.query('SAVEPOINT verify_domain_key')
    const trial=(await db.query("INSERT INTO plugin.drafts(id,empresa_id,user_id,oauth_client_id,operation_key,proposal,integration) VALUES(gen_random_uuid(),$1,$2,$3,$4,'{}'::jsonb,$5) RETURNING domain",[sample.empresa_id,sample.user_id,sample.oauth_client_id,sample.operation_key,sample.integration])).rows[0]
    assert.equal(trial.domain,'erp','Legacy domain default changed')
    await db.query('ROLLBACK TO SAVEPOINT verify_domain_key');await db.query('RELEASE SAVEPOINT verify_domain_key')
   }
   const after=(await db.query("SELECT count(*)::int n,md5(coalesce(string_agg(md5((to_jsonb(d)-'domain'-'operation_type'-'result')::text),'' ORDER BY id),'')) digest FROM plugin.drafts d")).rows[0]
   assert.deepEqual(after,before,'Legacy operations changed')
   assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='tables'")).rows[0].n,14)
   await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]])
   await db.query('COMMIT')
   const report={status:'applied',project,version,file,digest,legacyOperationsPreserved:true,legacyCount:before.n,generatedAt:new Date().toISOString()}
   mkdirSync('.cache/tables-mcp',{recursive:true});writeFileSync('.cache/tables-mcp/'+(mode==='--finalize'?'database-final':'database')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
  }
 }
}catch(error){await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:'failed',code:error.code||error.name,message:error instanceof assert.AssertionError?error.message:'Database action failed; credentials omitted.'}));process.exitCode=1}finally{await db.end()}
