CREATE TABLE IF NOT EXISTS mcp_app.integration_events (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  connection_id bigint REFERENCES mcp_app.integration_connections(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  actor text,
  message text NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_events_severity_check
    CHECK (severity IN ('info', 'warning', 'error')),
  CONSTRAINT integration_events_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object')
);

CREATE INDEX IF NOT EXISTS integration_events_connection_created_idx
  ON mcp_app.integration_events (connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS integration_events_tenant_created_idx
  ON mcp_app.integration_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS integration_events_tenant_type_idx
  ON mcp_app.integration_events (tenant_id, event_type, created_at DESC);
