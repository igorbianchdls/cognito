CREATE TABLE IF NOT EXISTS plugin.integration_destinations (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ref text NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_destinations_type_check
    CHECK (type IN ('bigquery', 'google_sheets', 'excel', 'postgres', 'supabase', 'snowflake', 's3')),
  CONSTRAINT integration_destinations_status_check
    CHECK (status IN ('active', 'disabled', 'error')),
  CONSTRAINT integration_destinations_config_object_check
    CHECK (jsonb_typeof(config_json) = 'object'),
  CONSTRAINT integration_destinations_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS integration_destinations_default_bigquery_uidx
  ON plugin.integration_destinations (tenant_id, type)
  WHERE type = 'bigquery' AND (metadata_json->>'isDefault') = 'true';

CREATE INDEX IF NOT EXISTS integration_destinations_tenant_type_idx
  ON plugin.integration_destinations (tenant_id, type, status);

CREATE TABLE IF NOT EXISTS plugin.integration_pipelines (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  source_connection_id bigint NOT NULL REFERENCES plugin.integration_connections(id) ON DELETE CASCADE,
  destination_id bigint NOT NULL REFERENCES plugin.integration_destinations(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  selected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  sync_frequency text NOT NULL DEFAULT 'manual',
  sync_enabled boolean NOT NULL DEFAULT true,
  next_sync_at timestamptz NULL,
  sync_locked_until timestamptz NULL,
  sync_lock_token text NULL,
  sync_lock_owner text NULL,
  last_sync_at timestamptz NULL,
  last_success_at timestamptz NULL,
  last_error text NULL,
  records_synced integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_pipelines_status_check
    CHECK (status IN ('draft', 'active', 'paused', 'error', 'disabled')),
  CONSTRAINT integration_pipelines_selected_resources_array_check
    CHECK (jsonb_typeof(selected_resources) = 'array'),
  CONSTRAINT integration_pipelines_records_synced_check
    CHECK (records_synced >= 0),
  CONSTRAINT integration_pipelines_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object')
);

CREATE INDEX IF NOT EXISTS integration_pipelines_tenant_source_idx
  ON plugin.integration_pipelines (tenant_id, source_connection_id);

CREATE INDEX IF NOT EXISTS integration_pipelines_tenant_destination_idx
  ON plugin.integration_pipelines (tenant_id, destination_id);

CREATE INDEX IF NOT EXISTS integration_pipelines_due_sync_idx
  ON plugin.integration_pipelines (tenant_id, next_sync_at)
  WHERE sync_enabled = true
    AND next_sync_at IS NOT NULL
    AND sync_frequency <> 'manual'
    AND status = 'active';

CREATE INDEX IF NOT EXISTS integration_pipelines_sync_lock_idx
  ON plugin.integration_pipelines (sync_locked_until)
  WHERE sync_locked_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS plugin.integration_plugin_permissions (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  connection_id bigint NOT NULL REFERENCES plugin.integration_connections(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  read_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  write_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  destructive_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  require_confirmation boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_plugin_permissions_read_array_check
    CHECK (jsonb_typeof(read_resources) = 'array'),
  CONSTRAINT integration_plugin_permissions_write_array_check
    CHECK (jsonb_typeof(write_resources) = 'array'),
  CONSTRAINT integration_plugin_permissions_destructive_array_check
    CHECK (jsonb_typeof(destructive_resources) = 'array'),
  CONSTRAINT integration_plugin_permissions_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object'),
  CONSTRAINT integration_plugin_permissions_connection_unique
    UNIQUE (tenant_id, connection_id)
);

ALTER TABLE plugin.integration_sync_runs
  ADD COLUMN IF NOT EXISTS pipeline_id bigint NULL REFERENCES plugin.integration_pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS destination_id bigint NULL REFERENCES plugin.integration_destinations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS integration_sync_runs_pipeline_created_idx
  ON plugin.integration_sync_runs (pipeline_id, created_at DESC)
  WHERE pipeline_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS integration_sync_runs_destination_created_idx
  ON plugin.integration_sync_runs (destination_id, created_at DESC)
  WHERE destination_id IS NOT NULL;

WITH tenants AS (
  SELECT DISTINCT tenant_id
  FROM plugin.integration_connections
),
default_bigquery AS (
  INSERT INTO plugin.integration_destinations
    (tenant_id, type, name, status, config_json, metadata_json, updated_at)
  SELECT
    tenant_id,
    'bigquery',
    'BigQuery padrao',
    'active',
    jsonb_build_object(
      'projectId', 'creatto-463117',
      'rawDataset', 'integrations_custom_raw',
      'normalizedDataset', 'integrations_normalized'
    ),
    jsonb_build_object('isDefault', true, 'createdBy', 'migration_32'),
    now()
  FROM tenants
  ON CONFLICT DO NOTHING
  RETURNING id, tenant_id
),
all_default_bigquery AS (
  SELECT id, tenant_id
  FROM default_bigquery
  UNION
  SELECT id, tenant_id
  FROM plugin.integration_destinations
  WHERE type = 'bigquery'
    AND (metadata_json->>'isDefault') = 'true'
),
scheduled_connections AS (
  SELECT
    connections.*,
    destinations.id AS destination_id
  FROM plugin.integration_connections connections
  JOIN all_default_bigquery destinations
    ON destinations.tenant_id = connections.tenant_id
  WHERE jsonb_array_length(COALESCE(connections.selected_resources, '[]'::jsonb)) > 0
    AND connections.sync_frequency <> 'manual'
    AND NOT EXISTS (
      SELECT 1
      FROM plugin.integration_pipelines pipelines
      WHERE pipelines.tenant_id = connections.tenant_id
        AND pipelines.source_connection_id = connections.id
        AND pipelines.destination_id = destinations.id
    )
)
INSERT INTO plugin.integration_pipelines
  (tenant_id, source_connection_id, destination_id, name, status, selected_resources, sync_frequency, sync_enabled, next_sync_at, metadata_json, updated_at)
SELECT
  tenant_id,
  id,
  destination_id,
  display_name || ' -> BigQuery',
  CASE WHEN status IN ('connected', 'warning') THEN 'active' ELSE 'draft' END,
  selected_resources,
  sync_frequency,
  sync_enabled,
  next_sync_at,
  jsonb_build_object('createdBy', 'migration_32', 'legacyConnectionSchedule', true),
  now()
FROM scheduled_connections;
