import { retiredRelations } from './targets.mjs'

export async function inspectRetirementCatalog(db) {
  const relations = await db.query(`
    SELECT n.nspname AS schema, c.relname AS name, c.relkind AS kind,
      c.reltuples::bigint AS estimated_rows, c.relrowsecurity AS rls,
      n.nspname || '.' || c.relname = ANY($1::text[]) AS retirement_target
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'integrations'
       OR n.nspname || '.' || c.relname = ANY($1::text[])
    ORDER BY n.nspname, c.relname`, [retiredRelations])
  const dependencies = await db.query(`
    SELECT n.nspname || '.' || c.relname AS target,
      pg_describe_object(d.classid, d.objid, d.objsubid) AS dependent, d.deptype
    FROM pg_depend d JOIN pg_class c ON d.refclassid = 'pg_class'::regclass AND c.oid = d.refobjid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname || '.' || c.relname = ANY($1::text[])
    ORDER BY target, dependent`, [retiredRelations])
  const foreignKeys = await db.query(`
    SELECT con.conname AS name, con.conrelid::regclass::text AS source,
      con.confrelid::regclass::text AS target
    FROM pg_constraint con WHERE con.contype = 'f'
      AND (con.conrelid = ANY(SELECT to_regclass(x) FROM unnest($1::text[]) x)
        OR con.confrelid = ANY(SELECT to_regclass(x) FROM unnest($1::text[]) x))
    ORDER BY source, name`, [retiredRelations])
  const functions = await db.query(`
    SELECT n.nspname AS schema, p.proname AS name, pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind IN ('f','p') AND n.nspname NOT IN ('pg_catalog','information_schema')
      AND (n.nspname = 'integrations' OR p.prosrc ~* '(integrations[.]|integration_connections|connector_sync_runs)')
    ORDER BY n.nspname, p.proname`)
  const triggers = await db.query(`
    SELECT t.tgname AS name, t.tgrelid::regclass::text AS relation, t.tgfoid::regprocedure::text AS function
    FROM pg_trigger t WHERE NOT t.tgisinternal
      AND t.tgrelid = ANY(SELECT to_regclass(x) FROM unnest($1::text[]) x)`, [retiredRelations])
  const grants = await db.query(`
    SELECT table_schema, table_name, grantee, privilege_type
    FROM information_schema.table_privileges
    WHERE table_schema || '.' || table_name = ANY($1::text[])
    ORDER BY table_schema, table_name, grantee, privilege_type`, [retiredRelations])
  const cron = await db.query("SELECT to_regclass('cron.job')::text AS relation")
  let jobs = { status: 'not_installed', rows: [] }
  if (cron.rows[0]?.relation) {
    const access = await db.query("SELECT has_table_privilege(current_user, 'cron.job', 'SELECT') AS allowed")
    jobs = access.rows[0]?.allowed
      ? { status: 'inspected', rows: (await db.query("SELECT jobid, schedule, active FROM cron.job WHERE command ~* '(integrations|integration_|connector_sync|scheduled-sync)' ORDER BY jobid")).rows }
      : { status: 'permission_denied', rows: [] }
  }
  return { generatedAt: new Date().toISOString(), relations: relations.rows, dependencies: dependencies.rows,
    foreignKeys: foreignKeys.rows, functions: functions.rows, triggers: triggers.rows, grants: grants.rows, jobs,
    limitations: ['Row estimates are not exact counts.', 'Function and job text matching cannot prove absence of dynamic or external consumers.', 'No business rows, credentials or function/job bodies are exported.'] }
}
