import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import dotenv from 'dotenv'
import {connection} from './evolution-db.mjs'
import {catalog} from './evolution-catalog.mjs'
const folder='.cache/accounting/',apply=process.argv.includes('--apply');assert(process.argv.slice(2).every(a=>a==='--apply'||a==='--check'))
mkdirSync(folder,{recursive:true})
const migrations=['20261012110000_erp_contas_contabeis.sql','20261012111000_erp_classificacao_contabil_demo.sql'].map(file=>{
 const source=readFileSync('supabase/migrations/'+file,'utf8');return{file,version:file.slice(0,14),name:file.slice(15,-4),digest:createHash('sha256').update(source).digest('hex'),body:source.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'')}
})
const db=connection(),allowed=['dre_grupo_id','fora_dre','conta_contabil_id','versao','atualizado_por','atualizado_em'],clean=row=>Object.fromEntries(Object.entries(row).filter(([key])=>!allowed.includes(key)))
async function fingerprints(tables){for(const t of tables)assert(/^[a-z_]+$/.test(t));return(await db.query(tables.map(t=>`SELECT '${t}' AS table_name,count(*)::int n,md5(coalesce(string_agg(to_jsonb(r)::text,'|' ORDER BY to_jsonb(r)::text),'')) hash FROM erp.${t} r`).join(' UNION ALL ')+' ORDER BY table_name')).rows}
try{
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(20261012,110000) ok')).rows[0].ok,true)
 const history=(await db.query('SELECT version,name,statements FROM supabase_migrations.schema_migrations WHERE version=ANY($1::text[])',[migrations.map(m=>m.version)])).rows
 for(const h of history){const m=migrations.find(m=>m.version===h.version);assert.equal(h.name,m.name);assert.deepEqual(h.statements,[m.body])}
 if(history.length===migrations.length){await db.query('ROLLBACK');console.log(JSON.stringify({status:'already_applied',versions:history.map(h=>h.version)}))}
 else{
  assert.equal(history.length,0,'Both migrations must be applied together')
  const tests=JSON.parse(readFileSync(folder+'regression.json','utf8'));assert.equal(tests.status,'passed');assert.equal(tests.rolledBack,true);assert(Date.now()-Date.parse(tests.generatedAt)<3600000)
  for(const m of migrations)assert.equal(tests.digests[m.file],m.digest)
  for(const name of ['reconciliation.json','ui-regression.json'])assert.equal(JSON.parse(readFileSync(folder+name,'utf8')).status,'passed')
  if(apply){const status=JSON.parse(readFileSync(folder+'deployment/status.json','utf8')),staged=JSON.parse(readFileSync(folder+'deployment/deployment.json','utf8'));assert.equal(status.id,staged.id);assert.equal(status.state,'READY');assert.equal(staged.migrationDigest,migrations[0].digest)}
  const structure=await catalog(db),tables=structure.rls.filter(t=>t.schema==='erp'&&t.relkind==='r').map(t=>t.relname).filter(t=>!['categorias','contas_financeiras','cadastros_eventos'].includes(t))
  // Prevent business writes during backup, validation and the short data update.
  await db.query('LOCK TABLE '+tables.map(t=>'erp.'+t).join(',')+' IN SHARE MODE')
  const business=await fingerprints(tables),categories=(await db.query('SELECT to_jsonb(r) row FROM erp.categorias r ORDER BY id')).rows.map(r=>r.row),banks=(await db.query('SELECT to_jsonb(r) row FROM erp.contas_financeiras r ORDER BY id')).rows.map(r=>r.row)
  if(apply)writeFileSync(folder+'before-application.json',JSON.stringify({generatedAt:new Date().toISOString(),structure,categories,banks,business},null,2),{flag:'wx'})
  for(const m of migrations){await db.query(m.body);if(apply)await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[m.version,m.name,[m.body]])}
  const afterCategories=(await db.query('SELECT to_jsonb(r) row FROM erp.categorias r ORDER BY id')).rows.map(r=>r.row),afterBanks=(await db.query('SELECT to_jsonb(r) row FROM erp.contas_financeiras r ORDER BY id')).rows.map(r=>r.row)
  assert.deepEqual(afterCategories.map(clean),categories.map(clean));assert.deepEqual(afterBanks.map(clean),banks.map(clean))
  assert.deepEqual(afterCategories.filter(r=>r.empresa_id!==2).map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>k!=='conta_contabil_id'))),categories.filter(r=>r.empresa_id!==2))
  assert.deepEqual(afterBanks.filter(r=>r.empresa_id!==2).map(r=>Object.fromEntries(Object.entries(r).filter(([k])=>k!=='conta_contabil_id'))),banks.filter(r=>r.empresa_id!==2))
  assert.deepEqual(await fingerprints(tables),business)
  const after=await catalog(db);assert.deepEqual(after.policies.filter(p=>p.tablename!=='contas_contabeis'),structure.policies);assert.deepEqual(after.rls.filter(t=>t.relname!=='contas_contabeis'),structure.rls)
  assert.equal(after.rls.find(t=>t.relname==='contas_contabeis').relrowsecurity,true)
  const counts=(await db.query(`SELECT (SELECT count(*)::int FROM erp.contas_contabeis WHERE empresa_id=2) contas,
   (SELECT count(*)::int FROM erp.categorias WHERE empresa_id=2 AND conta_contabil_id IS NOT NULL AND (dre_grupo_id IS NOT NULL OR fora_dre)) categorias,
   (SELECT count(*)::int FROM erp.contas_financeiras WHERE empresa_id=2 AND ativo AND conta_contabil_id IS NOT NULL) bancos`)).rows[0]
  assert.deepEqual(counts,{contas:46,categorias:12,bancos:3})
  await db.query(apply?'COMMIT':'ROLLBACK')
  const report={status:apply?'applied_and_verified':'check_passed',generatedAt:new Date().toISOString(),digests:Object.fromEntries(migrations.map(m=>[m.file,m.digest])),counts,businessTablesPreserved:tables.length,existingPoliciesUnchanged:true,otherCompaniesUnchanged:true}
  writeFileSync(folder+(apply?'application.json':'migration-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))
 }
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.end()}
