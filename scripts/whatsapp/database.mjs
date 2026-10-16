import assert from 'node:assert/strict'
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { connection,project } from '../erp/evolution-db.mjs'
const file='20261017010000_whatsapp_domain.sql',sql=readFileSync('supabase/migrations/'+file,'utf8'),body=sql.replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''),version=file.slice(0,14),name=file.slice(15,-4),digest=createHash('sha256').update(sql).digest('hex'),db=connection(),mode=process.argv[2]||'--check'
assert(['--check','--apply'].includes(mode))
try{await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73017,10000) ok')).rows[0].ok,true)
 const applied=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
 if(applied){assert.equal(applied.name,name);assert.deepEqual(applied.statements,[body]);await db.query('ROLLBACK');console.log(JSON.stringify({status:'already_applied',project,version}));}
 else{
  const schema=(await db.query("SELECT count(*)::int n FROM pg_namespace WHERE nspname='whatsapp'")).rows[0];assert.equal(schema.n,0,'Unexpected existing whatsapp schema')
  const constraints=(await db.query("SELECT conname FROM pg_constraint WHERE conrelid='plugin.drafts'::regclass")).rows.map(r=>r.conname);for(const expected of ['drafts_domain_check','drafts_domain_result','drafts_domain_operation_key'])assert(constraints.includes(expected))
  const before=(await db.query("SELECT count(*)::int n,md5(coalesce(string_agg(md5(to_jsonb(d)::text),'' ORDER BY id),'')) hash FROM plugin.drafts d")).rows[0]
  await db.query(body)
  assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='whatsapp'")).rows[0].n,5)
  assert.equal((await db.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='whatsapp' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity")).rows[0].n,5)
  assert.deepEqual((await db.query("SELECT count(*)::int n,md5(coalesce(string_agg(md5(to_jsonb(d)::text),'' ORDER BY id),'')) hash FROM plugin.drafts d")).rows[0],before)
  if(mode==='--apply'){const proof=JSON.parse(readFileSync('.cache/whatsapp/smoke.json','utf8'));assert.equal(proof.status,'passed');assert.equal(proof.migrationDigest,digest);await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[body]]);await db.query('COMMIT')}else await db.query('ROLLBACK')
  const report={status:mode==='--apply'?'applied':'preflight_passed',project,version,digest,legacyOperationsPreserved:true,tables:5,generatedAt:new Date().toISOString()};mkdirSync('.cache/whatsapp',{recursive:true});writeFileSync('.cache/whatsapp/database'+(mode==='--check'?'-check':'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
 }
}catch(e){await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:'failed',code:e.code||e.name,message:e instanceof assert.AssertionError?e.message:'Database verification failed; credentials omitted.'}));process.exitCode=1}finally{await db.end()}
