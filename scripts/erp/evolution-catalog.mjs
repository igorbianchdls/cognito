const queries = {
  columns:`SELECT table_schema,table_name,column_name,data_type,udt_name,is_nullable,column_default,numeric_precision,numeric_scale,is_identity,is_generated FROM information_schema.columns WHERE table_schema IN ('erp','shared') ORDER BY table_schema,table_name,ordinal_position`,
  constraints:`SELECT n.nspname AS schema,t.relname AS table_name,c.conname AS name,c.contype AS type,c.convalidated AS validated,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname IN ('erp','shared') ORDER BY 1,2,3`,
  indexes:`SELECT * FROM pg_indexes WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,indexname`,
  policies:`SELECT * FROM pg_policies WHERE schemaname IN ('erp','shared') ORDER BY schemaname,tablename,policyname`,
  triggers:`SELECT n.nspname AS schema,c.relname AS table_name,t.tgname AS name,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND NOT t.tgisinternal ORDER BY 1,2,3`,
  functions:`SELECT n.nspname AS schema,p.proname AS name,p.prosecdef,p.proconfig,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('erp','shared') AND p.prokind='f' ORDER BY 1,2`,
  grants:`SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema IN ('erp','shared') AND grantee IN ('anon','authenticated','erp_runtime','PUBLIC') ORDER BY 1,2,3,4`,
  rls:`SELECT n.nspname AS schema,c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relkind,c.reloptions FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('erp','shared') AND c.relkind IN ('r','p','v') ORDER BY 1,2`,
  views:`SELECT * FROM pg_views WHERE schemaname IN ('erp','shared') ORDER BY schemaname,viewname`,
};
export async function catalog(client) {
  const result={date:new Date().toISOString()};
  for (const [key,sql] of Object.entries(queries)) result[key]=(await client.query(sql)).rows;
  return result;
}

