ALTER TABLE mcp_app.integration_connections
  ADD COLUMN IF NOT EXISTS sync_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS next_sync_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS sync_locked_until timestamptz NULL,
  ADD COLUMN IF NOT EXISTS sync_lock_token text NULL,
  ADD COLUMN IF NOT EXISTS sync_lock_owner text NULL;

CREATE INDEX IF NOT EXISTS integration_connections_due_sync_idx
  ON mcp_app.integration_connections (tenant_id, next_sync_at)
  WHERE sync_enabled = true
    AND next_sync_at IS NOT NULL
    AND sync_frequency <> 'manual'
    AND status IN ('connected', 'warning');

CREATE INDEX IF NOT EXISTS integration_connections_sync_lock_idx
  ON mcp_app.integration_connections (sync_locked_until)
  WHERE sync_locked_until IS NOT NULL;
