import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {connection} from '../erp/evolution-db.mjs'
import {migrationFile} from './schema-contract.mjs'

// Two real PostgreSQL sessions, fictitious identities in uniquely named schemas.
// No inserts, updates or renames in the application's shared/erp/plugin schemas.
const stamp=Date.now().toString(),names={shared:'codex_shared_'+stamp,erp:'codex_erp_'+stamp,plugin:'codex_plugin_'+stamp}
const map=sql=>sql.replace(/\b(shared|erp|plugin)\b/g,name=>names[name])
const ident=s=>'"'+s.replaceAll('"','""')+'"',a=connection(),b=connection(),observer=connection()
const snapshot=JSON.parse(readFileSync('.cache/shared/backup-before.json','utf8'))
const results=[];let created=false
try{
 await a.connect();await b.connect();await observer.connect()
 const pid=Number((await b.query('SELECT pg_backend_pid() id')).rows[0].id)
 await a.query('BEGIN')
 for(const name of Object.values(names))await a.query('CREATE SCHEMA '+ident(name))
 created=true
 for(const sequence of snapshot.sequences.filter(x=>x.schemaname==='shared'))await a.query('CREATE SEQUENCE '+ident(names.shared)+'.'+ident(sequence.sequencename))
 for(const table of snapshot.structure.rls.filter(x=>x.schema==='shared'&&x.relkind==='r')){
  const columns=snapshot.structure.columns.filter(x=>x.table_schema==='shared'&&x.table_name===table.relname)
  const definitions=columns.map(c=>`${ident(c.column_name)} ${c.data_type}${c.column_default?' DEFAULT '+map(c.column_default):''}${c.is_nullable==='NO'?' NOT NULL':''}`)
  await a.query(`CREATE TABLE ${ident(names.shared)}.${ident(table.relname)}(${definitions.join(',')})`)
 }
 for(const type of ['p','u','c','f'])for(const c of snapshot.structure.constraints.filter(x=>x.schema==='shared'&&x.type===type))await a.query(`ALTER TABLE ${ident(names.shared)}.${ident(c.table_name)} ADD CONSTRAINT ${ident(c.name)} ${map(c.definition)}`)
 await a.query('SET LOCAL check_function_bodies=off')
 for(const fn of snapshot.structure.functions.filter(x=>x.schema==='shared'))await a.query(map(fn.definition))
 await a.query('SET LOCAL check_function_bodies=on')
 await a.query(map("INSERT INTO shared.erp_permission_profiles(id,nome) VALUES('administrador','Administrador'),('consulta','Consulta');INSERT INTO shared.users(id,email,full_name) VALUES(1,'owner1@example.invalid','Owner1'),(2,'owner2@example.invalid','Owner2');INSERT INTO shared.tenants(id,name,slug) VALUES(1,'Concurrency fixture','concurrency');INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status) VALUES(1,1,'owner','active'),(1,2,'owner','active')"))
 // Strip only outer transaction delimiters; all DDL remains in this transaction.
 const migration=readFileSync('supabase/migrations/'+migrationFile,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
 await a.query(map(migration));await a.query('COMMIT')
 const change=id=>map(`UPDATE shared.usuarios_empresas SET role='member',perfil_acesso_id='consulta' WHERE empresa_id=1 AND usuario_id=${id}`)
 for(const commit of [true,false]){
  await a.query(map("UPDATE shared.usuarios_empresas SET role='owner',status='active' WHERE empresa_id=1"))
  await a.query('BEGIN');await b.query('BEGIN')
  await a.query(change(1))
  let done=false
  const second=b.query(change(2)).then(()=>({ok:true}),error=>({ok:false,code:error.code})).finally(()=>{done=true})
  const deadline=Date.now()+10000;let blocked=false
  while(Date.now()<deadline&&!done){
   const state=(await observer.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid])).rows[0]
   if(state?.wait_event_type==='Lock'){blocked=true;break}
   await new Promise(r=>setTimeout(r,50))
  }
  assert(blocked,'Second independent session must wait for the company lock')
  await a.query(commit?'COMMIT':'ROLLBACK')
  const result=await second
  if(commit){assert.equal(result.ok,false);assert.equal(result.code,'23514');await b.query('ROLLBACK')}
  else{assert.equal(result.ok,true);await b.query('COMMIT')}
  const count=Number((await a.query(map("SELECT count(*) n FROM shared.usuarios_empresas WHERE empresa_id=1 AND role='owner' AND status='active'"))).rows[0].n)
  assert.equal(count,1)
  results.push({case:commit?'Competing removals preserve last owner':'Rollback releases lock without losing owner',blockedSecondSession:true,activeOwners:count})
 }
 const report={status:'passed',independentPostgresSessions:true,applicationDataChanges:0,isolatedSchemas:true,results}
 mkdirSync('.cache/shared',{recursive:true});writeFileSync('.cache/shared/concurrency.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}catch(error){console.error(JSON.stringify({status:'failed',code:error.code,message:error.message}));process.exitCode=1}
finally{
 await a.query('ROLLBACK').catch(()=>{});await b.query('ROLLBACK').catch(()=>{});await b.end();await observer.end()
 if(created){
  for(const name of Object.values(names)){
   assert(/^codex_(shared|erp|plugin)_\d{13}$/.test(name))
   const row=(await a.query('SELECT nspname,pg_get_userbyid(nspowner)=current_user owns FROM pg_namespace WHERE nspname=$1',[name])).rows[0]
   if(row){assert(row.owns);assert.equal(row.nspname,name)}
  }
  await a.query('DROP SCHEMA IF EXISTS '+Object.values(names).map(ident).join(',')+' CASCADE')
 }
 await a.end()
}
