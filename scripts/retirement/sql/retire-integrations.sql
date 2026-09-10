-- Manual migration: intentionally outside supabase/migrations until deployed consumers are audited.
-- Requires app published without integrations, producers stopped and data disposition reviewed.
-- Set app.integrations_retirement_ready = 'true' in this session ONLY after those checks.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $retirement$
DECLARE
  targets text[] := ARRAY['integrations.providers',
    'integrations.connected_accounts',
    'integrations.connections',
    'integrations.destinations',
    'integrations.pipelines',
    'integrations.plugin_permissions',
    'integrations.plugin_action_audit',
    'integrations.mcp_permissions',
    'integrations.mcp_action_audit',
    'integrations.sync_runs',
    'integrations.sync_cursors',
    'integrations.events',
    'integrations.sync_dispatch_outbox',
    'plugin.connectors',
    'plugin.connector_sync_runs',
    'plugin.integration_connections',
    'plugin.integration_destinations',
    'plugin.integration_pipelines',
    'plugin.integration_plugin_permissions',
    'plugin.integration_mcp_permissions',
    'plugin.integration_sync_runs',
    'plugin.integration_sync_cursors',
    'plugin.integration_provider_capabilities',
    'plugin.integration_events',
    'mcp_app.connectors',
    'mcp_app.connector_sync_runs',
    'mcp_app.integration_connections',
    'mcp_app.integration_destinations',
    'mcp_app.integration_pipelines',
    'mcp_app.integration_plugin_permissions',
    'mcp_app.integration_mcp_permissions',
    'mcp_app.integration_sync_runs',
    'mcp_app.integration_sync_cursors',
    'mcp_app.integration_provider_capabilities',
    'mcp_app.integration_events'];
  target_oids oid[];
  names text;
  kind "char";
BEGIN
  SELECT array_agg(c.oid) INTO target_oids
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname || '.' || c.relname = ANY(targets);
  IF target_oids IS NULL THEN RETURN; END IF;
  IF current_setting('app.integrations_retirement_ready', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Retirement prerequisites not confirmed: deployed app, stopped producers, reviewed data';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid = ANY(target_oids) AND relkind NOT IN ('r','p','v','m')) THEN
    RAISE EXCEPTION 'Unexpected relation type in retirement allowlist; audit before continuing';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_inherits WHERE inhparent = ANY(target_oids) AND NOT (inhrelid = ANY(target_oids))) THEN
    RAISE EXCEPTION 'Unlisted inherited table or partition depends on a retirement target';
  END IF;
  -- RESTRICT preserves any unlisted dependents. Errors roll back all prior drops.
  -- Compatibility views are removed before their tables. Never use CASCADE.
  FOREACH kind IN ARRAY ARRAY['v','m','r']::"char"[] LOOP
    SELECT string_agg(format('%I.%I', n.nspname, c.relname), ', ' ORDER BY n.nspname, c.relname)
      INTO names
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.oid = ANY(target_oids)
      AND (c.relkind = kind OR (kind = 'r' AND c.relkind = 'p'));
    IF names IS NOT NULL THEN
      EXECUTE format('DROP %s %s RESTRICT',
        CASE kind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'TABLE' END, names);
    END IF;
  END LOOP;
END
$retirement$;
-- Empty namespaces are intentionally retained; unknown functions or objects are not removed.
COMMIT;
