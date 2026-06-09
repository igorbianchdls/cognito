BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'mcp_app'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'plugin'
  ) THEN
    ALTER SCHEMA mcp_app RENAME TO plugin;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS plugin;

DO $$
BEGIN
  IF to_regclass('plugin.integration_mcp_permissions') IS NOT NULL
     AND to_regclass('plugin.integration_plugin_permissions') IS NULL THEN
    ALTER TABLE plugin.integration_mcp_permissions RENAME TO integration_plugin_permissions;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('integrations.mcp_permissions') IS NOT NULL
     AND to_regclass('integrations.plugin_permissions') IS NULL THEN
    ALTER TABLE integrations.mcp_permissions RENAME TO plugin_permissions;
  END IF;

  IF to_regclass('integrations.mcp_action_audit') IS NOT NULL
     AND to_regclass('integrations.plugin_action_audit') IS NULL THEN
    ALTER TABLE integrations.mcp_action_audit RENAME TO plugin_action_audit;
  END IF;
END $$;

DO $$
DECLARE
  pair text[];
  constraint_pairs text[][] := ARRAY[
    ARRAY['integration_mcp_permissions_read_array_check', 'integration_plugin_permissions_read_array_check'],
    ARRAY['integration_mcp_permissions_write_array_check', 'integration_plugin_permissions_write_array_check'],
    ARRAY['integration_mcp_permissions_destructive_array_check', 'integration_plugin_permissions_destructive_array_check'],
    ARRAY['integration_mcp_permissions_metadata_object_check', 'integration_plugin_permissions_metadata_object_check'],
    ARRAY['integration_mcp_permissions_connection_unique', 'integration_plugin_permissions_connection_unique']
  ];
BEGIN
  IF to_regclass('plugin.integration_plugin_permissions') IS NULL THEN
    RETURN;
  END IF;

  FOREACH pair SLICE 1 IN ARRAY constraint_pairs LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = pair[1]
        AND conrelid = 'plugin.integration_plugin_permissions'::regclass
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = pair[2]
        AND conrelid = 'plugin.integration_plugin_permissions'::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE plugin.integration_plugin_permissions RENAME CONSTRAINT %I TO %I',
        pair[1],
        pair[2]
      );
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  pair text[];
  constraint_pairs text[][] := ARRAY[
    ARRAY['mcp_permissions_read_array_check', 'plugin_permissions_read_array_check'],
    ARRAY['mcp_permissions_live_read_array_check', 'plugin_permissions_live_read_array_check'],
    ARRAY['mcp_permissions_write_array_check', 'plugin_permissions_write_array_check'],
    ARRAY['mcp_permissions_destructive_array_check', 'plugin_permissions_destructive_array_check'],
    ARRAY['mcp_permissions_metadata_object_check', 'plugin_permissions_metadata_object_check'],
    ARRAY['mcp_permissions_connection_unique', 'plugin_permissions_connection_unique'],
    ARRAY['mcp_permissions_connection_fkey', 'plugin_permissions_connection_fkey']
  ];
BEGIN
  IF to_regclass('integrations.plugin_permissions') IS NULL THEN
    RETURN;
  END IF;

  FOREACH pair SLICE 1 IN ARRAY constraint_pairs LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = pair[1]
        AND conrelid = 'integrations.plugin_permissions'::regclass
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = pair[2]
        AND conrelid = 'integrations.plugin_permissions'::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE integrations.plugin_permissions RENAME CONSTRAINT %I TO %I',
        pair[1],
        pair[2]
      );
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  pair text[];
  constraint_pairs text[][] := ARRAY[
    ARRAY['mcp_action_audit_domain_check', 'plugin_action_audit_domain_check'],
    ARRAY['mcp_action_audit_permission_kind_check', 'plugin_action_audit_permission_kind_check'],
    ARRAY['mcp_action_audit_status_check', 'plugin_action_audit_status_check'],
    ARRAY['mcp_action_audit_payload_object_check', 'plugin_action_audit_payload_object_check'],
    ARRAY['mcp_action_audit_metadata_object_check', 'plugin_action_audit_metadata_object_check'],
    ARRAY['mcp_action_audit_connection_fkey', 'plugin_action_audit_connection_fkey']
  ];
BEGIN
  IF to_regclass('integrations.plugin_action_audit') IS NULL THEN
    RETURN;
  END IF;

  FOREACH pair SLICE 1 IN ARRAY constraint_pairs LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = pair[1]
        AND conrelid = 'integrations.plugin_action_audit'::regclass
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = pair[2]
        AND conrelid = 'integrations.plugin_action_audit'::regclass
    ) THEN
      EXECUTE format(
        'ALTER TABLE integrations.plugin_action_audit RENAME CONSTRAINT %I TO %I',
        pair[1],
        pair[2]
      );
    END IF;
  END LOOP;
END $$;

ALTER INDEX IF EXISTS integrations.mcp_action_audit_connection_created_idx RENAME TO plugin_action_audit_connection_created_idx;
ALTER INDEX IF EXISTS integrations.mcp_action_audit_tenant_created_idx RENAME TO plugin_action_audit_tenant_created_idx;
ALTER INDEX IF EXISTS integrations.mcp_action_audit_tenant_status_idx RENAME TO plugin_action_audit_tenant_status_idx;
ALTER INDEX IF EXISTS integrations.mcp_action_audit_idempotency_idx RENAME TO plugin_action_audit_idempotency_idx;

CREATE SCHEMA IF NOT EXISTS mcp_app;

DO $$
DECLARE
  relation_name text;
  relation_names text[] := ARRAY[
    'alerts',
    'schedules',
    'action_runs',
    'alert_runs',
    'schedule_runs',
    'connectors',
    'connector_sync_runs',
    'integration_connections',
    'integration_destinations',
    'integration_pipelines',
    'integration_plugin_permissions',
    'integration_sync_runs',
    'integration_sync_cursors',
    'integration_provider_capabilities',
    'integration_events'
  ];
BEGIN
  FOREACH relation_name IN ARRAY relation_names LOOP
    IF to_regclass(format('plugin.%I', relation_name)) IS NOT NULL
       AND to_regclass(format('mcp_app.%I', relation_name)) IS NULL THEN
      EXECUTE format('CREATE VIEW mcp_app.%I AS SELECT * FROM plugin.%I', relation_name, relation_name);
    END IF;
  END LOOP;

  IF to_regclass('plugin.integration_plugin_permissions') IS NOT NULL
     AND to_regclass('mcp_app.integration_mcp_permissions') IS NULL THEN
    CREATE VIEW mcp_app.integration_mcp_permissions AS
      SELECT * FROM plugin.integration_plugin_permissions;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('integrations.plugin_permissions') IS NOT NULL
     AND to_regclass('integrations.mcp_permissions') IS NULL THEN
    CREATE VIEW integrations.mcp_permissions AS
      SELECT * FROM integrations.plugin_permissions;
  END IF;

  IF to_regclass('integrations.plugin_action_audit') IS NOT NULL
     AND to_regclass('integrations.mcp_action_audit') IS NULL THEN
    CREATE VIEW integrations.mcp_action_audit AS
      SELECT * FROM integrations.plugin_action_audit;
  END IF;
END $$;

COMMIT;
