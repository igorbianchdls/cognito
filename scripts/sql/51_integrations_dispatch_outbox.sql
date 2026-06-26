CREATE TABLE IF NOT EXISTS integrations.sync_dispatch_outbox (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL,
  connection_id bigint NOT NULL,
  pipeline_id bigint,
  destination_id bigint,
  run_id bigint NOT NULL,
  trigger text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  lock_token text,
  published_at timestamptz,
  message_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_dispatch_outbox_status_check
    CHECK (status IN ('pending', 'publishing', 'published', 'failed')),
  CONSTRAINT sync_dispatch_outbox_trigger_check
    CHECK (trigger IN ('manual', 'scheduled', 'webhook', 'initial')),
  CONSTRAINT sync_dispatch_outbox_attempts_check CHECK (attempts >= 0),
  CONSTRAINT sync_dispatch_outbox_payload_object_check CHECK (jsonb_typeof(payload) = 'object'),
  CONSTRAINT sync_dispatch_outbox_run_unique UNIQUE (run_id),
  CONSTRAINT sync_dispatch_outbox_connection_fkey
    FOREIGN KEY (tenant_id, connection_id)
    REFERENCES integrations.connections(tenant_id, id)
    ON DELETE CASCADE,
  CONSTRAINT sync_dispatch_outbox_pipeline_fkey
    FOREIGN KEY (pipeline_id)
    REFERENCES integrations.pipelines(id)
    ON DELETE SET NULL,
  CONSTRAINT sync_dispatch_outbox_destination_fkey
    FOREIGN KEY (destination_id)
    REFERENCES integrations.destinations(id)
    ON DELETE SET NULL,
  CONSTRAINT sync_dispatch_outbox_run_fkey
    FOREIGN KEY (run_id)
    REFERENCES integrations.sync_runs(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sync_dispatch_outbox_due_idx
  ON integrations.sync_dispatch_outbox(status, next_attempt_at, id)
  WHERE status IN ('pending', 'publishing');

INSERT INTO integrations.sync_dispatch_outbox
  (tenant_id, connection_id, pipeline_id, destination_id, run_id, trigger, payload)
SELECT
  tenant_id,
  connection_id,
  pipeline_id,
  destination_id,
  id,
  trigger,
  jsonb_build_object(
    'tenantId', tenant_id,
    'connectionId', connection_id::text,
    'pipelineId', pipeline_id::text,
    'destinationId', destination_id::text,
    'runId', id::text,
    'trigger', trigger,
    'resources', COALESCE(metadata->'resources', '[]'::jsonb),
    'requestedBy', COALESCE(metadata->>'requestedBy', 'outbox-backfill')
  )
FROM integrations.sync_runs
WHERE status = 'queued'
ON CONFLICT (run_id) DO NOTHING;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    first_value(id) OVER (PARTITION BY tenant_id ORDER BY id) AS canonical_id,
    row_number() OVER (PARTITION BY tenant_id ORDER BY id) AS position
  FROM integrations.destinations
  WHERE type = 'bigquery'
    AND metadata->>'isDefault' = 'true'
)
UPDATE integrations.pipelines pipeline
SET destination_id = ranked.canonical_id
FROM ranked
WHERE ranked.position > 1
  AND pipeline.tenant_id = ranked.tenant_id
  AND pipeline.destination_id = ranked.id;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    first_value(id) OVER (PARTITION BY tenant_id ORDER BY id) AS canonical_id,
    row_number() OVER (PARTITION BY tenant_id ORDER BY id) AS position
  FROM integrations.destinations
  WHERE type = 'bigquery'
    AND metadata->>'isDefault' = 'true'
)
UPDATE integrations.sync_runs run
SET destination_id = ranked.canonical_id
FROM ranked
WHERE ranked.position > 1
  AND run.tenant_id = ranked.tenant_id
  AND run.destination_id = ranked.id;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    first_value(id) OVER (PARTITION BY tenant_id ORDER BY id) AS canonical_id,
    row_number() OVER (PARTITION BY tenant_id ORDER BY id) AS position
  FROM integrations.destinations
  WHERE type = 'bigquery'
    AND metadata->>'isDefault' = 'true'
)
UPDATE integrations.sync_dispatch_outbox dispatch
SET destination_id = ranked.canonical_id
FROM ranked
WHERE ranked.position > 1
  AND dispatch.tenant_id = ranked.tenant_id
  AND dispatch.destination_id = ranked.id;

DELETE FROM integrations.destinations destination
USING (
  SELECT id
  FROM (
    SELECT id, row_number() OVER (PARTITION BY tenant_id ORDER BY id) AS position
    FROM integrations.destinations
    WHERE type = 'bigquery'
      AND metadata->>'isDefault' = 'true'
  ) ranked
  WHERE position > 1
) duplicate
WHERE destination.id = duplicate.id;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    first_value(id) OVER (
      PARTITION BY tenant_id, source_connection_id, destination_id
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY tenant_id, source_connection_id, destination_id
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    ) AS position
  FROM integrations.pipelines
)
UPDATE integrations.sync_runs run
SET pipeline_id = ranked.canonical_id
FROM ranked
WHERE ranked.position > 1
  AND run.tenant_id = ranked.tenant_id
  AND run.pipeline_id = ranked.id;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    first_value(id) OVER (
      PARTITION BY tenant_id, source_connection_id, destination_id
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY tenant_id, source_connection_id, destination_id
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    ) AS position
  FROM integrations.pipelines
)
UPDATE integrations.events event
SET pipeline_id = ranked.canonical_id
FROM ranked
WHERE ranked.position > 1
  AND event.tenant_id = ranked.tenant_id
  AND event.pipeline_id = ranked.id;

WITH ranked AS (
  SELECT
    id,
    tenant_id,
    first_value(id) OVER (
      PARTITION BY tenant_id, source_connection_id, destination_id
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    ) AS canonical_id,
    row_number() OVER (
      PARTITION BY tenant_id, source_connection_id, destination_id
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
    ) AS position
  FROM integrations.pipelines
)
UPDATE integrations.sync_dispatch_outbox dispatch
SET pipeline_id = ranked.canonical_id
FROM ranked
WHERE ranked.position > 1
  AND dispatch.tenant_id = ranked.tenant_id
  AND dispatch.pipeline_id = ranked.id;

DELETE FROM integrations.pipelines pipeline
USING (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY tenant_id, source_connection_id, destination_id
        ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END, id
      ) AS position
    FROM integrations.pipelines
  ) ranked
  WHERE position > 1
) duplicate
WHERE pipeline.id = duplicate.id;

CREATE UNIQUE INDEX IF NOT EXISTS integrations_default_bigquery_destination_uidx
  ON integrations.destinations(tenant_id)
  WHERE type = 'bigquery'
    AND metadata->>'isDefault' = 'true';

CREATE UNIQUE INDEX IF NOT EXISTS integrations_pipeline_connection_destination_uidx
  ON integrations.pipelines(tenant_id, source_connection_id, destination_id);
