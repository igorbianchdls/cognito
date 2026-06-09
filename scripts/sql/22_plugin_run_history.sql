CREATE SCHEMA IF NOT EXISTS plugin;

CREATE TABLE IF NOT EXISTS plugin.action_runs (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  domain text NOT NULL,
  action text NOT NULL,
  resource text NULL,
  target_id text NULL,
  status text NOT NULL DEFAULT 'preview',
  dry_run boolean NOT NULL DEFAULT true,
  risk_level text NULL,
  confirmation_required boolean NOT NULL DEFAULT true,
  idempotency_key text NULL,
  target_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plugin.alert_runs (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  alert_id bigint NULL REFERENCES plugin.alerts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'success',
  triggered_by text NOT NULL DEFAULT 'manual',
  condition_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  matched_records integer NOT NULL DEFAULT 0,
  message text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plugin.schedule_runs (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  schedule_id bigint NULL REFERENCES plugin.schedules(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'success',
  triggered_by text NOT NULL DEFAULT 'manual',
  artifact_kind text NULL,
  artifact_id uuid NULL,
  prompt text NULL,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS action_runs_tenant_created_idx ON plugin.action_runs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS action_runs_tenant_domain_idx ON plugin.action_runs (tenant_id, domain, action);
CREATE UNIQUE INDEX IF NOT EXISTS action_runs_tenant_idempotency_key_idx
  ON plugin.action_runs (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS alert_runs_tenant_created_idx ON plugin.alert_runs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS alert_runs_alert_created_idx ON plugin.alert_runs (alert_id, created_at DESC);
CREATE INDEX IF NOT EXISTS alert_runs_tenant_status_idx ON plugin.alert_runs (tenant_id, status);

CREATE INDEX IF NOT EXISTS schedule_runs_tenant_created_idx ON plugin.schedule_runs (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS schedule_runs_schedule_created_idx ON plugin.schedule_runs (schedule_id, created_at DESC);
CREATE INDEX IF NOT EXISTS schedule_runs_tenant_status_idx ON plugin.schedule_runs (tenant_id, status);
