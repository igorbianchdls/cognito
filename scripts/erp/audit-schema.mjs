import { readFileSync,writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

// Inventario atual independente do catalogo historico usado pelas suites locais.
// Sem DDL/DML nem leitura de registros comerciais.
const config=dotenv.parse(readFileSync('.env.local','utf8'));
const uri=new URL(config.SUPABASE_DB_URL);
for(const key of ['sslmode','sslrootcert','sslcert','sslkey'])uri.searchParams.delete(key);
const ca=config.SUPABASE_DB_CA?.replaceAll('\\n','\n')||readFileSync(config.SUPABASE_DB_CA_FILE||'certificates/supabase-prod-ca-2021.crt','utf8');
const client=new pg.Client({connectionString:uri.toString(),ssl:{ca,rejectUnauthorized:true},connectionTimeoutMillis:10000,statement_timeout:15000,query_timeout:15000,application_name:'cognito_schema_audit_readonly'});
const queries={
  columns:`SELECT table_schema,table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale,is_identity,is_generated FROM information_schema.columns WHERE table_schema IN ('erp','shared') ORDER BY 1,2,4`,
  constraints:`SELECT n.nspname AS schema,t.relname AS table_name,c.conname AS name,c.contype AS type,c.convalidated AS validated,c.condeferrable,c.condeferred,c.conkey,c.confkey,c.confrelid::regclass::text AS target,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname IN ('erp','shared') ORDER BY 1,2,3`,
  indexes:`SELECT n.nspname AS schemaname,t.relname AS tablename,i.relname AS indexname,pg_get_indexdef(i.oid) AS indexdef,x.indisunique,x.indisvalid,x.indisready,x.indnkeyatts,x.indkey::text,x.indclass::text,x.indcollation::text,x.indoption::text,pg_get_expr(x.indpred,x.indrelid) AS predicate,pg_get_expr(x.indexprs,x.indrelid) AS expressions FROM pg_index x JOIN pg_class i ON i.oid=x.indexrelid JOIN pg_class t ON t.oid=x.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname IN ('erp','shared') ORDER BY 1,2,3`,
  policies:`SELECT * FROM pg_policies WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,policyname`,
  rls:`SELECT n.nspname AS schema,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relkind,c.reloptions,pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND c.relkind IN ('r','p','v','m') ORDER BY 1,2`,
  triggers:`SELECT n.nspname AS schema,c.relname AS table_name,t.tgname AS name,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND NOT t.tgisinternal ORDER BY 1,2,3`,
  views:`SELECT * FROM pg_views WHERE schemaname IN ('erp','shared') ORDER BY schemaname,viewname`,
  functions:`SELECT n.nspname AS schema,p.proname AS name,pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_function_result(p.oid) AS returns,p.prosecdef,p.proconfig,has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,has_function_privilege('erp_runtime',p.oid,'EXECUTE') AS runtime_execute,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('erp','shared') AND p.prokind='f' ORDER BY 1,2,3`,
  grants:`SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema IN ('erp','shared') AND grantee IN ('anon','authenticated','erp_runtime','PUBLIC') ORDER BY 1,2,3,4`,
  roles:`SELECT rolname,rolbypassrls,rolsuper,rolcanlogin,rolinherit,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname IN ('postgres','erp_runtime','anon','authenticated','service_role') ORDER BY 1`,
  schemaPrivileges:`SELECT n.nspname,r.rolname,has_schema_privilege(r.rolname,n.oid,'USAGE') AS usage,has_schema_privilege(r.rolname,n.oid,'CREATE') AS create FROM pg_namespace n CROSS JOIN pg_roles r WHERE n.nspname IN ('erp','shared','public') AND r.rolname IN ('anon','authenticated','erp_runtime') ORDER BY 1,2`,
  migrationHistory:`SELECT version,name FROM supabase_migrations.schema_migrations ORDER BY version`,
  tableStatistics:`SELECT relname,n_live_tup,n_dead_tup,last_analyze,last_autoanalyze,pg_total_relation_size(relid)::text AS bytes FROM pg_stat_user_tables WHERE schemaname='erp' ORDER BY relname`,
};
try{
  await client.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const catalog={date:new Date().toISOString(),scope:'catalogos erp/shared; sem dados comerciais'};
  for(const [name,sql]of Object.entries(queries))catalog[name]=(await client.query(sql)).rows;
  await client.query('ROLLBACK');
  mkdirSync('.cache/erp-audit',{recursive:true});
  const requestedOutput=process.argv.find(arg=>arg.startsWith('--output='))?.slice('--output='.length)||'catalog-20261003.json';
  if(!/^[a-zA-Z0-9_-]+\.json$/.test(requestedOutput))throw new Error('Nome de inventario invalido');
  const output=resolve('.cache/erp-audit',requestedOutput);
  writeFileSync(output,JSON.stringify(catalog,null,2)+'\n');
  const erpTables=catalog.rls.filter(r=>r.schema==='erp'&&['r','p'].includes(r.relkind));
  console.log(JSON.stringify({output,date:catalog.date,counts:Object.fromEntries(Object.entries(queries).map(([key])=>[key,catalog[key].length])),erpTables:erpTables.length,
    tablesWithoutRls:erpTables.filter(t=>!t.relrowsecurity).map(t=>t.relname),unvalidatedConstraints:catalog.constraints.filter(c=>c.schema==='erp'&&!c.validated).map(c=>({table:c.table_name,constraint:c.name})),
    invalidIndexes:catalog.indexes.filter(i=>i.schemaname==='erp'&&(!i.indisvalid||!i.indisready)).map(i=>i.indexname),disabledTriggers:catalog.triggers.filter(t=>t.schema==='erp'&&t.tgenabled==='D').map(t=>({table:t.table_name,trigger:t.name})),roles:catalog.roles}));
}catch(error){await client.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({audit:false,code:error.code||error.name}));process.exitCode=1;}
finally{await client.end().catch(()=>{});}
