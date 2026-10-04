import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { Client } from 'pg'
import { buildPostgresPoolConfig } from '../src/lib/postgres'

config({path:'.env.local',quiet:true})
const legacy=['ai_action_approvals','ai_tool_executions','ai_connections']
const migrations=[
  '20261003120000_retire_ai_platform.sql',
  '20261003130000_create_chatgptplugin.sql',
  '20261003140000_chatgptplugin_drafts.sql',
  '20261003150000_chatgptplugin_operations_settings.sql',
  '20261003160000_create_plugin_schema.sql',
]
const tables=['executions','rate_windows','drafts','settings']
async function main() {
  assert(process.argv.includes('--apply'),'Use --apply para aplicar as migracoes autorizadas.')
  assert(process.env.SUPABASE_DB_URL,'Conexao ausente.')
  const uri=new URL(process.env.SUPABASE_DB_URL)
  assert(decodeURIComponent(uri.username)==='postgres.mtadnxqoqxzbdksktwdr','Projeto diferente do autorizado.')
  const client=new Client({...buildPostgresPoolConfig(uri.toString()),connectionTimeoutMillis:10000,query_timeout:30000})
  let phase='connection',archivePath:string|undefined
  try {
    await client.connect()
    await client.query('BEGIN')
    await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'; SET LOCAL row_security=off")
    await client.query("SELECT pg_advisory_xact_lock(hashtext('cognito:plugin-schema'))")
    phase='dependencies'
    const functions=await client.query(`SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind IN ('f','p')
      AND p.prosrc ~ '(ai_connections|ai_tool_executions|ai_action_approvals)'`)
    assert.equal(functions.rows.length,0,'Funcoes dependentes da base antiga exigem revisao.')
    const applied=new Set((await client.query('SELECT version FROM supabase_migrations.schema_migrations')).rows.map((row:{version:string})=>row.version))
    const archiveTables:Record<string,unknown>[]=[]
    const existing:string[]=[]
    for(const name of legacy) {
      if(!(await client.query('SELECT to_regclass($1) IS NOT NULL AS present',[`shared.${name}`])).rows[0].present)continue
      // Nomes fixos; os locks mantem os dados arquivados iguais aos que serao retirados.
      await client.query(`LOCK TABLE shared.${name} IN ACCESS EXCLUSIVE MODE`)
      const rows=await client.query(`SELECT to_jsonb(row)::text AS row_json FROM shared.${name} row`)
      const columns=await client.query(`SELECT column_name,data_type,udt_name,is_nullable,column_default,is_identity,identity_generation
        FROM information_schema.columns WHERE table_schema='shared' AND table_name=$1 ORDER BY ordinal_position`,[name])
      const constraints=await client.query('SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid=to_regclass($1)',[`shared.${name}`])
      const indexes=await client.query("SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='shared' AND tablename=$1",[name])
      const policies=await client.query("SELECT * FROM pg_policies WHERE schemaname='shared' AND tablename=$1",[name])
      const triggers=await client.query('SELECT pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid=to_regclass($1) AND NOT tgisinternal',[`shared.${name}`])
      archiveTables.push({table:`shared.${name}`,rowCount:rows.rows.length,rows:rows.rows.map((row:{row_json:string})=>row.row_json),
        columns:columns.rows,constraints:constraints.rows,indexes:indexes.rows,policies:policies.rows,triggers:triggers.rows})
      existing.push(name)
    }
    phase='archive'
    if(existing.length) {
      const dir=resolve('.cache','database-backups');mkdirSync(dir,{recursive:true})
      archivePath=resolve(dir,`retired-ai-${new Date().toISOString().replace(/[:.]/g,'-')}.json`)
      const serialized=JSON.stringify({formatVersion:1,projectRef:'mtadnxqoqxzbdksktwdr',createdAt:new Date().toISOString(),tables:archiveTables},null,2)+'\n'
      const descriptor=openSync(archivePath,'wx',0o600)
      try{writeFileSync(descriptor,serialized);fsyncSync(descriptor)}finally{closeSync(descriptor)}
      const hash=(text:string)=>createHash('sha256').update(text).digest('hex')
      assert.equal(hash(readFileSync(archivePath,'utf8')),hash(serialized),'Arquivo de backup incompleto.')
      console.log(JSON.stringify({archive:archivePath,sha256:hash(serialized),tables:archiveTables.map(table=>({table:table.table,records:table.rowCount}))}))
      // Arquivo duravel e conferido antes de limpar; DROP RESTRICT da migracao
      // recusa dependencias externas e qualquer falha desfaz a transacao inteira.
      for(const name of existing)await client.query(`DELETE FROM shared.${name}`)
    }
    phase='migrations'
    const appliedNow:string[]=[]
    for(const file of migrations) {
      const version=file.split('_')[0]
      if(applied.has(version))continue
      const source=readFileSync(resolve('supabase','migrations',file),'utf8')
      // Todas as migracoes selecionadas pertencem a uma unica transacao.
      const sql=source.replace(/^\s*BEGIN;\s*$/gm,'').replace(/^\s*COMMIT;\s*$/gm,'')
      await client.query(sql)
      await client.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3::text[])',
        [version,file.slice(version.length+1,-4),[source]])
      appliedNow.push(version)
    }
    phase='verification'
    const state=await client.query(`SELECT c.relname,c.relrowsecurity,
      has_schema_privilege('anon','plugin','USAGE') AS anon_schema,
      has_schema_privilege('authenticated','plugin','USAGE') AS authenticated_schema,
      has_schema_privilege('service_role','plugin','USAGE') AS backend_schema,
      has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS anon_table,
      has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') AS authenticated_table,
      has_table_privilege('service_role',c.oid,'SELECT') AND has_table_privilege('service_role',c.oid,'INSERT')
        AND has_table_privilege('service_role',c.oid,'UPDATE') AND has_table_privilege('service_role',c.oid,'DELETE') AS backend_table
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='plugin' AND c.relkind IN ('r','p') ORDER BY c.relname`)
    assert.deepEqual(state.rows.map((row:{relname:string})=>row.relname).sort(),[...tables].sort())
    for(const row of state.rows) {
      assert(row.relrowsecurity&&row.backend_schema&&row.backend_table)
      assert(!row.anon_schema&&!row.authenticated_schema&&!row.anon_table&&!row.authenticated_table)
    }
    for(const name of legacy)assert.equal((await client.query('SELECT to_regclass($1) AS relation',[`shared.${name}`])).rows[0].relation,null)
    for(const name of ['shared.users','shared.tenants','erp.entidades'])assert((await client.query('SELECT to_regclass($1) AS relation',[name])).rows[0].relation)
    for(const name of tables)assert.equal((await client.query("SELECT count(*)::int AS count FROM information_schema.columns WHERE table_schema='plugin' AND table_name=$1 AND column_name='integration' AND is_nullable='NO'",[name])).rows[0].count,1)
    await client.query('COMMIT')
    console.log(JSON.stringify({applied:true,schema:'plugin',tables,removed:legacy.map(name=>`shared.${name}`),appliedMigrations:appliedNow,archive:archivePath,accessVerified:true}))
  } catch(error) {
    await client.query('ROLLBACK').catch(()=>undefined)
    console.error(JSON.stringify({applied:false,phase,code:(error as {code?:string}).code||'DATABASE_APPLY_FAILED',archive:archivePath}))
    process.exitCode=1
  } finally {await client.end().catch(()=>undefined)}
}
void main().catch(()=>{console.error('Configuracao indisponivel; banco nao alterado.');process.exitCode=1})
