-- Inbox, etapa 7: IA no atendimento.
--   * kb_articles: base de conhecimento da empresa (perguntas frequentes, políticas, produtos), com busca em português.
--   * settings.ai_instructions: tom e regras que a IA segue (ex.: "trate por você", "não prometa prazo").
-- As respostas vêm do Claude pelo servidor; a chave fica só na Vercel (ANTHROPIC_API_KEY).
BEGIN;

CREATE TABLE inbox.kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', title || ' ' || body)) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.kb_articles (workspace_id, updated_at DESC);
CREATE INDEX ON inbox.kb_articles USING gin (tsv);
CREATE TRIGGER touch BEFORE UPDATE ON inbox.kb_articles FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

ALTER TABLE inbox.flow_events DROP CONSTRAINT flow_events_kind_check,
  ADD CONSTRAINT flow_events_kind_check CHECK (kind IN ('iniciou', 'entrou', 'clicou', 'respondeu', 'concluiu', 'saiu', 'erro', 'ia_respondeu', 'ia_passou'));

ALTER TABLE inbox.settings ADD COLUMN ai_instructions text CHECK (ai_instructions IS NULL OR char_length(ai_instructions) <= 4000);

ALTER TABLE inbox.kb_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_articles: read" ON inbox.kb_articles FOR SELECT TO authenticated USING (editor.can_read(workspace_id));
CREATE POLICY "kb_articles: insert" ON inbox.kb_articles FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "kb_articles: update" ON inbox.kb_articles FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "kb_articles: delete" ON inbox.kb_articles FOR DELETE TO authenticated USING (editor.can_write(workspace_id));
GRANT SELECT, DELETE ON inbox.kb_articles TO authenticated;
GRANT INSERT (id, workspace_id, title, body), UPDATE (title, body) ON inbox.kb_articles TO authenticated;
GRANT UPDATE (ai_instructions) ON inbox.settings TO authenticated;
GRANT ALL ON inbox.kb_articles TO service_role;

COMMIT;
