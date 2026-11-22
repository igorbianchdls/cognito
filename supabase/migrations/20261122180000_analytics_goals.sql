-- Analytics: metas (conversões acompanhadas) e definições de eventos (nome amigável e descrição de cada evento).
-- Mesmas regras de acesso das outras tabelas do schema analytics (20261122150000_analytics_schema.sql).
BEGIN;

CREATE TABLE analytics.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  event text NOT NULL CHECK (char_length(event) BETWEEN 1 AND 120),   -- evento que conta como conversão (ex.: assinou)
  path text CHECK (path IS NULL OR char_length(path) <= 500),          -- para $pageview: a página (ex.: /obrigado)
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON analytics.goals (property_id);

CREATE TABLE analytics.event_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  property_id uuid NOT NULL REFERENCES analytics.properties (id) ON DELETE CASCADE,
  event text NOT NULL CHECK (char_length(event) BETWEEN 1 AND 120),
  label text NOT NULL DEFAULT '' CHECK (char_length(label) <= 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, event)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['goals', 'event_definitions'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON analytics.%I FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at()', t);
    EXECUTE format('ALTER TABLE analytics.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON analytics.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
    EXECUTE format('CREATE POLICY "%1$s: insert" ON analytics.%1$I FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
      AND EXISTS (SELECT 1 FROM analytics.properties p WHERE p.id = property_id AND p.workspace_id = %1$I.workspace_id))', t);
    EXECUTE format('CREATE POLICY "%1$s: update" ON analytics.%1$I FOR UPDATE TO authenticated USING (editor.can_write(workspace_id))
      WITH CHECK (editor.can_write(workspace_id) AND EXISTS (SELECT 1 FROM analytics.properties p WHERE p.id = property_id AND p.workspace_id = %1$I.workspace_id))', t);
    EXECUTE format('CREATE POLICY "%1$s: delete" ON analytics.%1$I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t);
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON analytics.goals, analytics.event_definitions TO authenticated;
GRANT ALL ON analytics.goals, analytics.event_definitions TO service_role;

COMMIT;
