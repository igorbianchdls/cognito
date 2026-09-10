import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

// Apenas metadados: nenhuma consulta a registros comerciais ou execução de DDL.
const env = dotenv.parse(fs.readFileSync('.env.local'));
const client = new pg.Client({
  connectionString: env.SUPABASE_DB_URL,
  ssl: { ca: fs.readFileSync('certificates/supabase-prod-ca-2021.crt', 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 20000,
  application_name: 'creatto_avaliacao_estrutura_readonly',
});
const queries = {
  columns: `SELECT table_schema, table_name, column_name, data_type, udt_name, is_nullable, column_default, numeric_precision, numeric_scale, is_identity, is_generated FROM information_schema.columns WHERE table_schema IN ('erp','shared') ORDER BY table_schema,table_name,ordinal_position`,
  constraints: `SELECT n.nspname AS schema, t.relname AS table_name, c.conname AS name, c.contype AS type, c.convalidated AS validated, pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname IN ('erp','shared') ORDER BY 1,2,3`,
  indexes: `SELECT * FROM pg_indexes WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,indexname`,
  policies: `SELECT * FROM pg_policies WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,policyname`,
  rls: `SELECT n.nspname AS schema,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relkind,c.reloptions FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND c.relkind IN ('r','p','v') ORDER BY 1,2`,
  triggers: `SELECT n.nspname AS schema,c.relname AS table_name,t.tgname AS name,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND NOT t.tgisinternal ORDER BY 1,2,3`,
  views: `SELECT * FROM pg_views WHERE schemaname IN ('erp','shared') ORDER BY schemaname,viewname`,
  functions: `SELECT n.nspname AS schema,p.proname AS name,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('erp','shared') AND p.prokind='f' ORDER BY 1,2`,
  grants: `SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema IN ('erp','shared') AND grantee IN ('anon','authenticated','erp_runtime','PUBLIC') ORDER BY 1,2,3,4`,
  roles: `SELECT rolname,rolbypassrls,rolsuper FROM pg_roles WHERE rolname IN ('postgres','erp_runtime','anon','authenticated')`,
};
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const result = { date: new Date().toISOString(), scope: 'catalogos erp/shared; sem dados comerciais' };
  for (const [key, sql] of Object.entries(queries)) result[key] = (await client.query(sql)).rows;
  await client.query('ROLLBACK');
  const output = path.resolve('docs/avaliacao-erp/catalogo-revisao-tabelas.json');
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ output, date: result.date, counts: Object.fromEntries(Object.keys(queries).map(k => [k, result[k].length])) }));
} catch (error) {
  // Não imprimir a configuração nem valores de conexão em caso de falha.
  console.error('Falha na consulta de metadados:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await client.end();
}
