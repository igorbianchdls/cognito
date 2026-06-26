DELETE FROM artifacts.artifacts
WHERE artifact_type = 'dashboard';

ALTER TABLE artifacts.artifacts
  DROP CONSTRAINT IF EXISTS artifacts_dashboard_tenant_required;

ALTER TABLE artifacts.artifacts
  ADD CONSTRAINT artifacts_dashboard_tenant_required
  CHECK (artifact_type <> 'dashboard' OR tenant_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS artifacts.dashboard_query_audit (
  id bigserial PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants(id) ON DELETE CASCADE,
  artifact_id uuid NOT NULL REFERENCES artifacts.artifacts(id) ON DELETE CASCADE,
  actor_id bigint,
  query_hash text NOT NULL,
  bytes_processed bigint NOT NULL DEFAULT 0,
  duration_ms integer,
  status text NOT NULL CHECK (status IN ('started', 'success', 'rejected', 'error')),
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dashboard_query_audit_tenant_created_idx
  ON artifacts.dashboard_query_audit(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS dashboard_query_audit_artifact_created_idx
  ON artifacts.dashboard_query_audit(artifact_id, created_at DESC);
