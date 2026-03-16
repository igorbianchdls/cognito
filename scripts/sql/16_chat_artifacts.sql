CREATE SCHEMA IF NOT EXISTS chat;

CREATE TABLE IF NOT EXISTS chat.artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('dashboard', 'report', 'slide')),
  title text NOT NULL,
  chat_id text NOT NULL REFERENCES chat.chats(id) ON DELETE CASCADE,
  snapshot_id text NULL,
  file_path text NOT NULL,
  thumbnail_data_url text NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_opened_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_artifacts_type
  ON chat.artifacts(type);

CREATE INDEX IF NOT EXISTS idx_chat_artifacts_chat_id
  ON chat.artifacts(chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_artifacts_updated_at
  ON chat.artifacts(updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_artifacts_chat_path
  ON chat.artifacts(chat_id, file_path);
