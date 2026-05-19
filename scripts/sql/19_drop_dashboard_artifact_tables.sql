CREATE SCHEMA IF NOT EXISTS artifacts;

CREATE TABLE IF NOT EXISTS artifacts.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_type text NOT NULL CHECK (artifact_type IN ('dashboard', 'report', 'slide')),
  workspace_id uuid NULL,
  created_from_chat_id text NULL,
  title text NOT NULL,
  slug text NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  current_draft_version integer NULL CHECK (current_draft_version IS NULL OR current_draft_version > 0),
  current_published_version integer NULL CHECK (current_published_version IS NULL OR current_published_version > 0),
  thumbnail_data_url text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL,
  updated_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artifacts_artifacts_type_workspace_slug
  ON artifacts.artifacts(artifact_type, workspace_id, slug);

CREATE INDEX IF NOT EXISTS idx_artifacts_artifacts_type_updated_at
  ON artifacts.artifacts(artifact_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_artifacts_artifacts_chat_id
  ON artifacts.artifacts(created_from_chat_id);

CREATE TABLE IF NOT EXISTS artifacts.artifact_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id uuid NOT NULL REFERENCES artifacts.artifacts(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  kind text NOT NULL CHECK (kind IN ('draft', 'published')),
  source text NOT NULL CHECK (length(btrim(source)) > 0),
  change_summary text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artifacts_artifact_sources_artifact_kind_version
  ON artifacts.artifact_sources(artifact_id, kind, version);

CREATE INDEX IF NOT EXISTS idx_artifacts_artifact_sources_artifact_kind_latest
  ON artifacts.artifact_sources(artifact_id, kind, version DESC);

DO $$
BEGIN
  IF to_regclass('artifacts.dashboards') IS NOT NULL THEN
    INSERT INTO artifacts.artifacts (
      id,
      artifact_type,
      workspace_id,
      created_from_chat_id,
      title,
      slug,
      status,
      current_draft_version,
      current_published_version,
      thumbnail_data_url,
      metadata,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    SELECT
      id,
      'dashboard',
      workspace_id,
      created_from_chat_id,
      title,
      slug,
      status,
      current_draft_version,
      current_published_version,
      thumbnail_data_url,
      metadata,
      created_by,
      updated_by,
      created_at,
      updated_at
    FROM artifacts.dashboards
    ON CONFLICT (id) DO UPDATE SET
      artifact_type = 'dashboard',
      workspace_id = EXCLUDED.workspace_id,
      created_from_chat_id = EXCLUDED.created_from_chat_id,
      title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      status = EXCLUDED.status,
      current_draft_version = EXCLUDED.current_draft_version,
      current_published_version = EXCLUDED.current_published_version,
      thumbnail_data_url = EXCLUDED.thumbnail_data_url,
      metadata = EXCLUDED.metadata,
      created_by = EXCLUDED.created_by,
      updated_by = EXCLUDED.updated_by,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at;
  END IF;

  IF to_regclass('artifacts.dashboard_sources') IS NOT NULL THEN
    INSERT INTO artifacts.artifact_sources (
      id,
      artifact_id,
      version,
      kind,
      source,
      change_summary,
      created_by,
      created_at
    )
    SELECT
      id,
      dashboard_id,
      version,
      kind,
      source,
      change_summary,
      created_by,
      created_at
    FROM artifacts.dashboard_sources
    ON CONFLICT (artifact_id, kind, version) DO UPDATE SET
      source = EXCLUDED.source,
      change_summary = EXCLUDED.change_summary,
      created_by = EXCLUDED.created_by,
      created_at = EXCLUDED.created_at;
  END IF;

  IF to_regclass('artifacts.dashboards') IS NOT NULL AND EXISTS (
    SELECT 1
    FROM artifacts.dashboards legacy
    WHERE NOT EXISTS (
      SELECT 1
      FROM artifacts.artifacts generic
      WHERE generic.id = legacy.id
        AND generic.artifact_type = 'dashboard'
    )
  ) THEN
    RAISE EXCEPTION 'dashboard migration incomplete: missing artifacts rows';
  END IF;

  IF to_regclass('artifacts.dashboard_sources') IS NOT NULL AND EXISTS (
    SELECT 1
    FROM artifacts.dashboard_sources legacy
    WHERE NOT EXISTS (
      SELECT 1
      FROM artifacts.artifact_sources generic
      WHERE generic.artifact_id = legacy.dashboard_id
        AND generic.kind = legacy.kind
        AND generic.version = legacy.version
    )
  ) THEN
    RAISE EXCEPTION 'dashboard source migration incomplete: missing artifact_sources rows';
  END IF;
END $$;

DROP TABLE IF EXISTS artifacts.dashboard_sources;
DROP TABLE IF EXISTS artifacts.dashboards;
