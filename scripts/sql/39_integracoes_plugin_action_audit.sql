BEGIN;

CREATE TABLE IF NOT EXISTS integrations.plugin_action_audit (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  connection_id bigint,
  domain text NOT NULL,
  provider text,
  tool text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  dry_run boolean NOT NULL DEFAULT true,
  permission_kind text,
  status text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  target_id text,
  idempotency_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plugin_action_audit_domain_check
    CHECK (domain IN ('erp', 'crm')),
  CONSTRAINT plugin_action_audit_permission_kind_check
    CHECK (permission_kind IS NULL OR permission_kind IN ('write', 'destructive')),
  CONSTRAINT plugin_action_audit_status_check
    CHECK (status IN ('preview', 'executed', 'blocked', 'error')),
  CONSTRAINT plugin_action_audit_payload_object_check
    CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT plugin_action_audit_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT plugin_action_audit_connection_fkey
    FOREIGN KEY (connection_id)
    REFERENCES integrations.connections (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS plugin_action_audit_connection_created_idx
  ON integrations.plugin_action_audit (connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS plugin_action_audit_tenant_created_idx
  ON integrations.plugin_action_audit (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS plugin_action_audit_tenant_status_idx
  ON integrations.plugin_action_audit (tenant_id, status);

CREATE INDEX IF NOT EXISTS plugin_action_audit_idempotency_idx
  ON integrations.plugin_action_audit (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

COMMIT;
