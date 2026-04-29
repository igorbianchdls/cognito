CREATE SCHEMA IF NOT EXISTS artifacts;

CREATE TABLE IF NOT EXISTS artifacts.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE artifacts.dashboards
  ADD COLUMN IF NOT EXISTS thumbnail_data_url text NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_artifacts_dashboards_workspace_slug
  ON artifacts.dashboards(workspace_id, slug);

CREATE INDEX IF NOT EXISTS idx_artifacts_dashboards_workspace_updated_at
  ON artifacts.dashboards(workspace_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_artifacts_dashboards_chat_id
  ON artifacts.dashboards(created_from_chat_id);

CREATE TABLE IF NOT EXISTS artifacts.dashboard_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES artifacts.dashboards(id) ON DELETE CASCADE,
  version integer NOT NULL CHECK (version > 0),
  kind text NOT NULL CHECK (kind IN ('draft', 'published')),
  source text NOT NULL CHECK (length(btrim(source)) > 0),
  change_summary text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_artifacts_dashboard_sources_dashboard_kind_version
  ON artifacts.dashboard_sources(dashboard_id, kind, version);

CREATE INDEX IF NOT EXISTS idx_artifacts_dashboard_sources_dashboard_kind_latest
  ON artifacts.dashboard_sources(dashboard_id, kind, version DESC);

CREATE INDEX IF NOT EXISTS idx_artifacts_dashboard_sources_dashboard_created_at
  ON artifacts.dashboard_sources(dashboard_id, created_at DESC);
