import {readFileSync} from 'node:fs'
import {connection,project} from './evolution-db.mjs'
const db=connection(),version='20261010120000',name='propostas_ordens_documentos'
const sql=readFileSync(`supabase/migrations/${version}_${name}.sql`,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
await db.connect()
try{
 if((await db.query('SELECT 1 FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows.length)console.log(JSON.stringify({status:'already_applied',project,version}))
 else{await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'");await db.query(sql)
  if(process.argv.includes('--apply')){await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[sql]]);await db.query('COMMIT');console.log(JSON.stringify({status:'applied',project,version}))}
  else{await db.query('ROLLBACK');console.log(JSON.stringify({status:'validated_and_rolled_back',project,version}))}
 }
}finally{await db.query('ROLLBACK').catch(()=>{});await db.end()}
