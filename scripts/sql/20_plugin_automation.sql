CREATE SCHEMA IF NOT EXISTS plugin;

CREATE TABLE IF NOT EXISTS plugin.alerts (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  condition_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  frequency text NOT NULL DEFAULT 'daily',
  channels_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_run_at timestamptz NULL,
  next_run_at timestamptz NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plugin.schedules (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  artifact_kind text NULL,
  prompt text NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly',
  day_of_week text NULL,
  time_of_day text NULL,
  channels_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_run_at timestamptz NULL,
  next_run_at timestamptz NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alerts_tenant_status_idx ON plugin.alerts (tenant_id, status);
CREATE INDEX IF NOT EXISTS alerts_tenant_next_run_idx ON plugin.alerts (tenant_id, next_run_at);
CREATE INDEX IF NOT EXISTS schedules_tenant_status_idx ON plugin.schedules (tenant_id, status);
CREATE INDEX IF NOT EXISTS schedules_tenant_next_run_idx ON plugin.schedules (tenant_id, next_run_at);
