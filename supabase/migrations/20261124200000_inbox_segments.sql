-- Inbox, etapa 4: segmentos (listas de contatos por regras) e origem.
--   * segments: nome + regras em JSON; quem pertence é calculado na hora pelo servidor, então a lista se mantém atualizada.
--   * contacts.source já existe (etapa 1); aqui ganha índice para filtrar e agrupar por origem.
-- Pelo navegador com os papéis do ERP: quem só visualiza lê.
BEGIN;

CREATE TABLE inbox.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  rules jsonb NOT NULL DEFAULT '{"modo":"todas","condicoes":[]}' CHECK (jsonb_typeof(rules) = 'object' AND pg_column_size(rules) <= 16384),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.segments (workspace_id, name);
CREATE TRIGGER touch BEFORE UPDATE ON inbox.segments FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

CREATE INDEX ON inbox.contacts (workspace_id, source);

ALTER TABLE inbox.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segments: read" ON inbox.segments FOR SELECT TO authenticated USING (editor.can_read(workspace_id));
CREATE POLICY "segments: insert" ON inbox.segments FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "segments: update" ON inbox.segments FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "segments: delete" ON inbox.segments FOR DELETE TO authenticated USING (editor.can_write(workspace_id));
GRANT SELECT, DELETE ON inbox.segments TO authenticated;
GRANT INSERT (id, workspace_id, name, rules, created_by) ON inbox.segments TO authenticated;
GRANT UPDATE (name, rules) ON inbox.segments TO authenticated;
GRANT ALL ON inbox.segments TO service_role;

COMMIT;
