import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,constants} from 'node:fs'
import {createHash} from 'node:crypto'
import {connection,project} from '../erp/evolution-db.mjs'
import {catalog} from '../erp/evolution-catalog.mjs'
import {db,restoreCatalog} from '../erp/evolution-fixture.mjs'
import {applySharedMigration,migrationFile} from './schema-contract.mjs'
const client=connection(),folder='.cache/shared',ident=value=>'"'+value.replaceAll('"','""')+'"'
const digest=value=>createHash('sha256').update(JSON.stringify(value.map(row=>JSON.stringify(row)).sort())).digest('hex')
mkdirSync(folder,{recursive:true})
try{
 await client.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
 await client.query("SET LOCAL timezone='UTC';SET LOCAL datestyle='ISO,YMD'")
 const structure=await catalog(client)
 // The existing catalog covers ERP/shared. Append the operational plugin objects.
 const namespaces=['erp','shared','plugin']
 const queries={
 columns:"SELECT table_schema,table_name,column_name,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale,is_identity,is_generated FROM information_schema.columns WHERE table_schema=ANY($1) ORDER BY 1,2,ordinal_position",
 constraints:"SELECT n.nspname schema,t.relname table_name,c.conname name,c.contype type,c.convalidated validated,pg_get_constraintdef(c.oid) definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname=ANY($1) ORDER BY 1,2,3",
 indexes:"SELECT * FROM pg_indexes WHERE schemaname=ANY($1) ORDER BY 1,2,3",
 policies:"SELECT * FROM pg_policies WHERE schemaname=ANY($1) ORDER BY 1,2,3",
 triggers:"SELECT n.nspname schema,c.relname table_name,t.tgname name,t.tgenabled,pg_get_triggerdef(t.oid) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1) AND NOT t.tgisinternal ORDER BY 1,2,3",
 functions:"SELECT n.nspname schema,p.proname name,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=ANY($1) AND p.prokind='f' ORDER BY 1,2",
 grants:"SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema=ANY($1) AND grantee IN ('anon','authenticated','erp_runtime','PUBLIC') ORDER BY 1,2,3,4",
 rls:"SELECT n.nspname schema,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relkind,c.reloptions FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=ANY($1) AND c.relkind IN ('r','p','v') ORDER BY 1,2",
 views:"SELECT * FROM pg_views WHERE schemaname=ANY($1) ORDER BY 1,2"
 }
 for(const [key,sql] of Object.entries(queries))structure[key]=(await client.query(sql,[namespaces])).rows
 const tables=[]
 for(const table of structure.rls.filter(x=>['r','p'].includes(x.relkind))){
  const columns=structure.columns.filter(x=>x.table_schema===table.schema&&x.table_name===table.relname).map(x=>x.column_name)
  const rows=(await client.query(`SELECT ${columns.map(c=>`${ident(c)}::text AS ${ident(c)}`).join(',')} FROM ${ident(table.schema)}.${ident(table.relname)}`)).rows
  tables.push({schema:table.schema,name:table.relname,columns,rows,digest:digest(rows)})
 }
 const users=(await client.query('SELECT auth_user_id::text id FROM shared.users WHERE auth_user_id IS NOT NULL')).rows
 const sequences=[]
 for(const sequence of (await client.query('SELECT schemaname,sequencename FROM pg_sequences WHERE schemaname=ANY($1)',[namespaces])).rows){
  sequences.push({...sequence,...(await client.query(`SELECT last_value::text,is_called FROM ${ident(sequence.schemaname)}.${ident(sequence.sequencename)}`)).rows[0]})
 }
 await client.query('ROLLBACK')
 const snapshot={project,createdAt:new Date().toISOString(),structure,tables,users,sequences}
 const path=folder+'/backup-before.json';writeFileSync(path,JSON.stringify(snapshot))
 // Restore the bytes actually saved. Values never appear in the public report.
 const saved=JSON.parse(readFileSync(path,'utf8'))
 await restoreCatalog(saved.structure)
 await db.exec("SET timezone='UTC';SET datestyle='ISO,YMD';SET session_replication_role=replica;BEGIN")
 for(const user of saved.users)await db.query('INSERT INTO auth.users(id) VALUES($1)',[user.id])
 for(const table of saved.tables){
  const placeholders=table.columns.map((c,i)=>{const m=saved.structure.columns.find(x=>x.table_schema===table.schema&&x.table_name===table.name&&x.column_name===c);const type=m.data_type==='ARRAY'?m.udt_name.slice(1)+'[]':m.data_type;return '$'+(i+1)+'::text::'+type})
  for(const row of table.rows)await db.query(`INSERT INTO ${ident(table.schema)}.${ident(table.name)}(${table.columns.map(ident).join(',')}) OVERRIDING SYSTEM VALUE VALUES(${placeholders.join(',')})`,table.columns.map(c=>row[c]))
 }
 await db.exec('COMMIT;SET session_replication_role=origin')
 for(const seq of saved.sequences)await db.query('SELECT setval($1::regclass,$2::bigint,$3::boolean)',[seq.schemaname+'.'+seq.sequencename,seq.last_value,seq.is_called])
 for(const c of saved.structure.constraints.filter(x=>x.type==='f'))await db.exec(`ALTER TABLE ${ident(c.schema)}.${ident(c.table_name)} DROP CONSTRAINT ${ident(c.name)};ALTER TABLE ${ident(c.schema)}.${ident(c.table_name)} ADD CONSTRAINT ${ident(c.name)} ${c.definition}`)
 for(const table of saved.tables){const rows=(await db.query(`SELECT ${table.columns.map(c=>`${ident(c)}::text AS ${ident(c)}`).join(',')} FROM ${ident(table.schema)}.${ident(table.name)}`)).rows;assert.equal(digest(rows),table.digest)}
 await applySharedMigration(db)
 for(const table of saved.tables.filter(t=>['erp','plugin'].includes(t.schema))){
  const rows=(await db.query(`SELECT ${table.columns.map(c=>`${ident(c==='tenant_id'?'empresa_id':c)}::text AS ${ident(c)}`).join(',')} FROM ${ident(table.schema)}.${ident(table.name)}`)).rows
  assert.equal(digest(rows),table.digest,'Migration must preserve every ERP/plugin value')
 }
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='shared'")).rows[0].n,8)
 const privateFolder='credentials/backups/shared';mkdirSync(privateFolder,{recursive:true})
 const durableBackupPath=privateFolder+'/'+snapshot.createdAt.replaceAll(':','-')+'-before.json'
 copyFileSync(path,durableBackupPath,constants.COPYFILE_EXCL)
 assert.equal(readFileSync(durableBackupPath,'utf8'),readFileSync(path,'utf8'))
 const proof={status:'passed',project,tables:tables.length,rows:tables.reduce((n,t)=>n+t.rows.length,0),backupDigest:createHash('sha256').update(readFileSync(path)).digest('hex'),durableBackupPath,migrationDigest:createHash('sha256').update(readFileSync('supabase/migrations/'+migrationFile)).digest('hex'),restoredFromSavedFile:true,migratedFullSnapshot:true,businessAndPluginRecordsPreserved:true,schemas:namespaces}
 writeFileSync(folder+'/backup-proof.json',JSON.stringify(proof,null,2));writeFileSync(durableBackupPath+'.proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof))
}catch(e){await client.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:'failed',code:e.code,message:e.message}));process.exitCode=1}
finally{await client.end();await db.close()}
