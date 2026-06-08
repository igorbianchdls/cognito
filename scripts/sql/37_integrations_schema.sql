BEGIN;

CREATE SCHEMA IF NOT EXISTS integrations;

CREATE TABLE IF NOT EXISTS integrations.providers (
  id bigserial PRIMARY KEY,
  domain text NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  auth_type text NOT NULL,
  supports_oauth_callback boolean NOT NULL DEFAULT false,
  supports_incremental_sync boolean NOT NULL DEFAULT false,
  sync_modes jsonb NOT NULL DEFAULT '[]'::jsonb,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'available',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT providers_domain_check
    CHECK (domain IN ('erp', 'crm', 'ecommerce', 'analytics', 'marketing', 'advertising', 'database', 'bi', 'automation')),
  CONSTRAINT providers_auth_type_check
    CHECK (auth_type IN ('oauth2', 'api_key', 'basic', 'manual')),
  CONSTRAINT providers_status_check
    CHECK (status IN ('available', 'planned', 'disabled')),
  CONSTRAINT providers_sync_modes_array_check
    CHECK (jsonb_typeof(sync_modes) = 'array'),
  CONSTRAINT providers_resources_array_check
    CHECK (jsonb_typeof(resources) = 'array'),
  CONSTRAINT providers_tags_array_check
    CHECK (jsonb_typeof(tags) = 'array'),
  CONSTRAINT providers_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT providers_unique_provider UNIQUE (domain, provider)
);

CREATE TABLE IF NOT EXISTS integrations.connected_accounts (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  provider text NOT NULL,
  auth_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending_auth',
  external_account_id text,
  external_account_name text,
  external_account_email text,
  scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
  secret_ref text,
  token_expires_at timestamptz,
  last_auth_at timestamptz,
  last_refreshed_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connected_accounts_auth_type_check
    CHECK (auth_type IN ('oauth2', 'api_key', 'basic', 'manual')),
  CONSTRAINT connected_accounts_status_check
    CHECK (status IN ('pending_auth', 'connected', 'warning', 'error', 'disabled', 'revoked')),
  CONSTRAINT connected_accounts_scopes_array_check
    CHECK (jsonb_typeof(scopes) = 'array'),
  CONSTRAINT connected_accounts_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT connected_accounts_tenant_id_unique UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS integrations.connections (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  domain text NOT NULL,
  provider text NOT NULL,
  connected_account_id bigint,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  auth_type text,
  external_account_id text,
  secret_ref text,
  selected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  sync_frequency text NOT NULL DEFAULT 'manual',
  sync_modes jsonb NOT NULL DEFAULT '["manual"]'::jsonb,
  sync_enabled boolean NOT NULL DEFAULT true,
  next_sync_at timestamptz,
  sync_locked_until timestamptz,
  sync_lock_token text,
  sync_lock_owner text,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  records_synced integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT connections_domain_check
    CHECK (domain IN ('erp', 'crm', 'ecommerce', 'analytics', 'marketing', 'advertising', 'database', 'bi', 'automation')),
  CONSTRAINT connections_status_check
    CHECK (status IN ('draft', 'pending_auth', 'connected', 'syncing', 'warning', 'error', 'disabled')),
  CONSTRAINT connections_auth_type_check
    CHECK (auth_type IS NULL OR auth_type IN ('oauth2', 'api_key', 'basic', 'manual')),
  CONSTRAINT connections_selected_resources_array_check
    CHECK (jsonb_typeof(selected_resources) = 'array'),
  CONSTRAINT connections_sync_modes_array_check
    CHECK (jsonb_typeof(sync_modes) = 'array'),
  CONSTRAINT connections_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT connections_records_synced_check
    CHECK (records_synced >= 0),
  CONSTRAINT connections_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT connections_connected_account_fkey
    FOREIGN KEY (tenant_id, connected_account_id)
    REFERENCES integrations.connected_accounts (tenant_id, id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS integrations.destinations (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT destinations_type_check
    CHECK (type IN ('bigquery', 'google_sheets', 'excel', 'postgres', 'supabase', 'snowflake', 's3')),
  CONSTRAINT destinations_status_check
    CHECK (status IN ('active', 'disabled', 'error')),
  CONSTRAINT destinations_config_object_check
    CHECK (jsonb_typeof(config) = 'object'),
  CONSTRAINT destinations_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT destinations_tenant_id_unique UNIQUE (tenant_id, id)
);

CREATE TABLE IF NOT EXISTS integrations.pipelines (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  source_connection_id bigint NOT NULL,
  destination_id bigint NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  selected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  sync_frequency text NOT NULL DEFAULT 'manual',
  sync_enabled boolean NOT NULL DEFAULT true,
  next_sync_at timestamptz,
  sync_locked_until timestamptz,
  sync_lock_token text,
  sync_lock_owner text,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  records_synced integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pipelines_status_check
    CHECK (status IN ('draft', 'active', 'paused', 'error', 'disabled')),
  CONSTRAINT pipelines_selected_resources_array_check
    CHECK (jsonb_typeof(selected_resources) = 'array'),
  CONSTRAINT pipelines_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT pipelines_records_synced_check
    CHECK (records_synced >= 0),
  CONSTRAINT pipelines_tenant_id_unique UNIQUE (tenant_id, id),
  CONSTRAINT pipelines_source_connection_fkey
    FOREIGN KEY (tenant_id, source_connection_id)
    REFERENCES integrations.connections (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT pipelines_destination_fkey
    FOREIGN KEY (tenant_id, destination_id)
    REFERENCES integrations.destinations (tenant_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrations.mcp_permissions (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  connection_id bigint NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  read_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  live_read_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  write_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  destructive_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  require_confirmation boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mcp_permissions_read_array_check
    CHECK (jsonb_typeof(read_resources) = 'array'),
  CONSTRAINT mcp_permissions_live_read_array_check
    CHECK (jsonb_typeof(live_read_resources) = 'array'),
  CONSTRAINT mcp_permissions_write_array_check
    CHECK (jsonb_typeof(write_resources) = 'array'),
  CONSTRAINT mcp_permissions_destructive_array_check
    CHECK (jsonb_typeof(destructive_resources) = 'array'),
  CONSTRAINT mcp_permissions_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT mcp_permissions_connection_unique UNIQUE (tenant_id, connection_id),
  CONSTRAINT mcp_permissions_connection_fkey
    FOREIGN KEY (tenant_id, connection_id)
    REFERENCES integrations.connections (tenant_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrations.sync_runs (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  connection_id bigint NOT NULL,
  pipeline_id bigint,
  destination_id bigint,
  trigger text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'queued',
  resource text,
  external_job_id text,
  started_at timestamptz,
  finished_at timestamptz,
  records_in integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_runs_trigger_check
    CHECK (trigger IN ('manual', 'scheduled', 'webhook', 'initial')),
  CONSTRAINT sync_runs_status_check
    CHECK (status IN ('queued', 'running', 'success', 'warning', 'error', 'cancelled')),
  CONSTRAINT sync_runs_counts_check
    CHECK (records_in >= 0 AND records_updated >= 0 AND records_failed >= 0),
  CONSTRAINT sync_runs_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT sync_runs_connection_fkey
    FOREIGN KEY (tenant_id, connection_id)
    REFERENCES integrations.connections (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT sync_runs_pipeline_fkey
    FOREIGN KEY (tenant_id, pipeline_id)
    REFERENCES integrations.pipelines (tenant_id, id)
    ON DELETE SET NULL,
  CONSTRAINT sync_runs_destination_fkey
    FOREIGN KEY (tenant_id, destination_id)
    REFERENCES integrations.destinations (tenant_id, id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS integrations.sync_cursors (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  connection_id bigint NOT NULL,
  resource text NOT NULL,
  cursor_key text NOT NULL DEFAULT 'default',
  cursor_value text,
  cursor jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_cursors_cursor_object_check
    CHECK (jsonb_typeof(cursor) = 'object'),
  CONSTRAINT sync_cursors_unique_resource_key UNIQUE (tenant_id, connection_id, resource, cursor_key),
  CONSTRAINT sync_cursors_connection_fkey
    FOREIGN KEY (tenant_id, connection_id)
    REFERENCES integrations.connections (tenant_id, id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS integrations.events (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  connection_id bigint,
  connected_account_id bigint,
  pipeline_id bigint,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  actor text,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT events_severity_check
    CHECK (severity IN ('info', 'warning', 'error')),
  CONSTRAINT events_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT events_connection_fkey
    FOREIGN KEY (tenant_id, connection_id)
    REFERENCES integrations.connections (tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT events_connected_account_fkey
    FOREIGN KEY (tenant_id, connected_account_id)
    REFERENCES integrations.connected_accounts (tenant_id, id)
    ON DELETE SET NULL,
  CONSTRAINT events_pipeline_fkey
    FOREIGN KEY (tenant_id, pipeline_id)
    REFERENCES integrations.pipelines (tenant_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS providers_domain_idx
  ON integrations.providers (domain, status);

CREATE INDEX IF NOT EXISTS connected_accounts_tenant_provider_idx
  ON integrations.connected_accounts (tenant_id, provider, status);

CREATE UNIQUE INDEX IF NOT EXISTS connected_accounts_external_account_uidx
  ON integrations.connected_accounts (tenant_id, provider, external_account_id)
  WHERE external_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS connections_tenant_domain_idx
  ON integrations.connections (tenant_id, domain);

CREATE INDEX IF NOT EXISTS connections_tenant_provider_idx
  ON integrations.connections (tenant_id, provider);

CREATE INDEX IF NOT EXISTS connections_tenant_status_idx
  ON integrations.connections (tenant_id, status);

CREATE INDEX IF NOT EXISTS connections_last_sync_idx
  ON integrations.connections (tenant_id, last_sync_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS connections_external_account_uidx
  ON integrations.connections (tenant_id, domain, provider, external_account_id)
  WHERE external_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS connections_due_sync_idx
  ON integrations.connections (tenant_id, next_sync_at)
  WHERE sync_enabled = true
    AND next_sync_at IS NOT NULL
    AND sync_frequency <> 'manual'
    AND status IN ('connected', 'warning');

CREATE INDEX IF NOT EXISTS connections_sync_lock_idx
  ON integrations.connections (sync_locked_until)
  WHERE sync_locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS destinations_tenant_type_idx
  ON integrations.destinations (tenant_id, type, status);

CREATE UNIQUE INDEX IF NOT EXISTS destinations_default_bigquery_uidx
  ON integrations.destinations (tenant_id, type)
  WHERE type = 'bigquery' AND metadata ->> 'isDefault' = 'true';

CREATE INDEX IF NOT EXISTS pipelines_tenant_source_idx
  ON integrations.pipelines (tenant_id, source_connection_id);

CREATE INDEX IF NOT EXISTS pipelines_tenant_destination_idx
  ON integrations.pipelines (tenant_id, destination_id);

CREATE INDEX IF NOT EXISTS pipelines_due_sync_idx
  ON integrations.pipelines (tenant_id, next_sync_at)
  WHERE sync_enabled = true
    AND next_sync_at IS NOT NULL
    AND sync_frequency <> 'manual'
    AND status = 'active';

CREATE INDEX IF NOT EXISTS pipelines_sync_lock_idx
  ON integrations.pipelines (sync_locked_until)
  WHERE sync_locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS events_connection_created_idx
  ON integrations.events (connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS events_tenant_created_idx
  ON integrations.events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS events_tenant_type_idx
  ON integrations.events (tenant_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS sync_cursors_connection_idx
  ON integrations.sync_cursors (connection_id);

CREATE INDEX IF NOT EXISTS sync_cursors_tenant_resource_idx
  ON integrations.sync_cursors (tenant_id, resource);

CREATE INDEX IF NOT EXISTS sync_runs_connection_created_idx
  ON integrations.sync_runs (connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS sync_runs_tenant_created_idx
  ON integrations.sync_runs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS sync_runs_tenant_status_idx
  ON integrations.sync_runs (tenant_id, status);

CREATE INDEX IF NOT EXISTS sync_runs_external_job_idx
  ON integrations.sync_runs (external_job_id)
  WHERE external_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sync_runs_pipeline_created_idx
  ON integrations.sync_runs (pipeline_id, created_at DESC)
  WHERE pipeline_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sync_runs_destination_created_idx
  ON integrations.sync_runs (destination_id, created_at DESC)
  WHERE destination_id IS NOT NULL;

INSERT INTO integrations.providers
  (id, domain, provider, name, description, auth_type, supports_oauth_callback, supports_incremental_sync, sync_modes, resources, tags, status, metadata, created_at, updated_at)
SELECT
  id, domain, provider, name, description, auth_type, supports_oauth_callback, supports_incremental_sync, sync_modes_json, resources_json, tags_json, status, metadata_json, created_at, updated_at
FROM mcp_app.integration_provider_capabilities
ON CONFLICT (domain, provider)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  auth_type = EXCLUDED.auth_type,
  supports_oauth_callback = EXCLUDED.supports_oauth_callback,
  supports_incremental_sync = EXCLUDED.supports_incremental_sync,
  sync_modes = EXCLUDED.sync_modes,
  resources = EXCLUDED.resources,
  tags = EXCLUDED.tags,
  status = EXCLUDED.status,
  metadata = EXCLUDED.metadata,
  updated_at = EXCLUDED.updated_at;

INSERT INTO integrations.connections
  (id, tenant_id, domain, provider, display_name, status, auth_type, external_account_id, secret_ref, selected_resources, sync_frequency, sync_modes, sync_enabled, next_sync_at, sync_locked_until, sync_lock_token, sync_lock_owner, last_sync_at, last_success_at, last_error, records_synced, metadata, created_at, updated_at)
SELECT
  id, tenant_id, domain, provider, display_name, status, auth_type, external_account_id, secret_ref, selected_resources, sync_frequency, sync_modes_json, sync_enabled, next_sync_at, sync_locked_until, sync_lock_token, sync_lock_owner, last_sync_at, last_success_at, last_error, records_synced, metadata_json, created_at, updated_at
FROM mcp_app.integration_connections
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations.destinations
  (id, tenant_id, type, name, status, config, secret_ref, metadata, created_at, updated_at)
SELECT
  id, tenant_id, type, name, status, config_json, secret_ref, metadata_json, created_at, updated_at
FROM mcp_app.integration_destinations
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations.pipelines
  (id, tenant_id, source_connection_id, destination_id, name, status, selected_resources, sync_frequency, sync_enabled, next_sync_at, sync_locked_until, sync_lock_token, sync_lock_owner, last_sync_at, last_success_at, last_error, records_synced, metadata, created_at, updated_at)
SELECT
  id, tenant_id, source_connection_id, destination_id, name, status, selected_resources, sync_frequency, sync_enabled, next_sync_at, sync_locked_until, sync_lock_token, sync_lock_owner, last_sync_at, last_success_at, last_error, records_synced, metadata_json, created_at, updated_at
FROM mcp_app.integration_pipelines
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations.mcp_permissions
  (id, tenant_id, connection_id, enabled, read_resources, live_read_resources, write_resources, destructive_resources, require_confirmation, metadata, created_at, updated_at)
SELECT
  id, tenant_id, connection_id, enabled, read_resources, '[]'::jsonb, write_resources, destructive_resources, require_confirmation, metadata_json, created_at, updated_at
FROM mcp_app.integration_mcp_permissions
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations.sync_runs
  (id, tenant_id, connection_id, pipeline_id, destination_id, trigger, status, resource, external_job_id, started_at, finished_at, records_in, records_updated, records_failed, error_message, metadata, created_at)
SELECT
  id, tenant_id, connection_id, pipeline_id, destination_id, trigger, status, resource, external_job_id, started_at, finished_at, records_in, records_updated, records_failed, error_message, metadata_json, created_at
FROM mcp_app.integration_sync_runs
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations.sync_cursors
  (id, tenant_id, connection_id, resource, cursor_key, cursor_value, cursor, last_synced_at, created_at, updated_at)
SELECT
  id, tenant_id, connection_id, resource, cursor_key, cursor_value, cursor_json, last_synced_at, created_at, updated_at
FROM mcp_app.integration_sync_cursors
ON CONFLICT (id) DO NOTHING;

INSERT INTO integrations.events
  (id, tenant_id, connection_id, event_type, severity, actor, message, metadata, created_at)
SELECT
  id, tenant_id, connection_id, event_type, severity, actor, message, metadata_json, created_at
FROM mcp_app.integration_events
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('integrations.providers', 'id'), COALESCE((SELECT max(id) FROM integrations.providers), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.connected_accounts', 'id'), COALESCE((SELECT max(id) FROM integrations.connected_accounts), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.connections', 'id'), COALESCE((SELECT max(id) FROM integrations.connections), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.destinations', 'id'), COALESCE((SELECT max(id) FROM integrations.destinations), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.pipelines', 'id'), COALESCE((SELECT max(id) FROM integrations.pipelines), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.mcp_permissions', 'id'), COALESCE((SELECT max(id) FROM integrations.mcp_permissions), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.sync_runs', 'id'), COALESCE((SELECT max(id) FROM integrations.sync_runs), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.sync_cursors', 'id'), COALESCE((SELECT max(id) FROM integrations.sync_cursors), 1), true);
SELECT setval(pg_get_serial_sequence('integrations.events', 'id'), COALESCE((SELECT max(id) FROM integrations.events), 1), true);

COMMIT;
