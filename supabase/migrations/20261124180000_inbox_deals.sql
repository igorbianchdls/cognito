-- Inbox, etapa 3: negócios (funil em kanban) e tarefas.
--   * pipelines / pipeline_stages: funis e suas etapas; cada etapa é "aberto", "ganho" ou "perdido".
--   * deals: um negócio (título, valor, previsão, responsável), ligado ao contato; position ordena dentro da coluna.
--   * deal_events: histórico de mudança de etapa, gravado pelo próprio banco quando a etapa muda.
--   * tasks: lembretes ligados a contato, negócio ou conversa.
-- Tudo pelo navegador com os papéis do ERP (quem só visualiza lê), sempre dentro da mesma empresa.
BEGIN;

CREATE TABLE inbox.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.pipelines (workspace_id);

CREATE TYPE inbox.stage_kind AS ENUM ('aberto', 'ganho', 'perdido');
CREATE TABLE inbox.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES inbox.pipelines (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  position int NOT NULL DEFAULT 0,
  kind inbox.stage_kind NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.pipeline_stages (pipeline_id, position);

CREATE TABLE inbox.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES inbox.pipelines (id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES inbox.pipeline_stages (id) ON DELETE RESTRICT,
  contact_id uuid REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  value numeric(14, 2) CHECK (value IS NULL OR value >= 0),
  expected_close date,
  owner text,
  position double precision NOT NULL DEFAULT 0,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 4000),
  lost_reason text CHECK (lost_reason IS NULL OR char_length(lost_reason) <= 300),
  closed_at timestamptz,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.deals (pipeline_id, stage_id, position);
CREATE INDEX ON inbox.deals (contact_id);
CREATE INDEX ON inbox.deals (stage_id);

CREATE TABLE inbox.deal_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id text NOT NULL,
  deal_id uuid NOT NULL REFERENCES inbox.deals (id) ON DELETE CASCADE,
  from_stage uuid,
  to_stage uuid NOT NULL,
  by text,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.deal_events (deal_id, at);

CREATE TABLE inbox.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  due_at timestamptz,
  done_at timestamptz,
  assignee text,
  contact_id uuid REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  deal_id uuid REFERENCES inbox.deals (id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES inbox.conversations (id) ON DELETE SET NULL,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.tasks (workspace_id, done_at, due_at);
CREATE INDEX ON inbox.tasks (deal_id);
CREATE INDEX ON inbox.tasks (contact_id);

-- Closing date (BEFORE) and stage history (AFTER, so the event can reference the new deal), whoever moves the deal.
CREATE FUNCTION inbox.deal_moved_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    INSERT INTO inbox.deal_events (workspace_id, deal_id, from_stage, to_stage, by)
      VALUES (NEW.workspace_id, NEW.id, CASE WHEN TG_OP = 'UPDATE' THEN OLD.stage_id END, NEW.stage_id, editor.uid());
  END IF;
  RETURN NULL;
END $$;
CREATE FUNCTION inbox.deal_moved() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE k inbox.stage_kind;
BEGIN
  IF TG_OP = 'INSERT' OR NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    SELECT kind INTO k FROM inbox.pipeline_stages WHERE id = NEW.stage_id;
    NEW.closed_at := CASE WHEN k = 'aberto' THEN NULL ELSE coalesce(NEW.closed_at, now()) END;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER moved BEFORE INSERT OR UPDATE ON inbox.deals FOR EACH ROW EXECUTE FUNCTION inbox.deal_moved();
CREATE TRIGGER moved_log AFTER INSERT OR UPDATE ON inbox.deals FOR EACH ROW EXECUTE FUNCTION inbox.deal_moved_after();
REVOKE EXECUTE ON FUNCTION inbox.deal_moved(), inbox.deal_moved_after() FROM PUBLIC;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pipelines', 'pipeline_stages', 'deals', 'deal_events', 'tasks'] LOOP
    EXECUTE format('ALTER TABLE inbox.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON inbox.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['pipelines', 'pipeline_stages', 'deals', 'tasks'] LOOP
    EXECUTE format('CREATE POLICY "%s: delete" ON inbox.%I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t, t);
  END LOOP;
END $$;
CREATE TRIGGER touch BEFORE UPDATE ON inbox.deals FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

CREATE POLICY "pipelines: insert" ON inbox.pipelines FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "pipelines: update" ON inbox.pipelines FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "pipeline_stages: insert" ON inbox.pipeline_stages FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.pipelines p WHERE p.id = pipeline_id AND p.workspace_id = pipeline_stages.workspace_id));
CREATE POLICY "pipeline_stages: update" ON inbox.pipeline_stages FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.pipelines p WHERE p.id = pipeline_id AND p.workspace_id = pipeline_stages.workspace_id));
-- A deal points only to a stage of its own pipeline and to a contact of the same company.
CREATE FUNCTION inbox.deal_refs_ok(d inbox.deals) RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM inbox.pipeline_stages s JOIN inbox.pipelines p ON p.id = s.pipeline_id
      WHERE s.id = d.stage_id AND p.id = d.pipeline_id AND p.workspace_id = d.workspace_id)
    AND (d.contact_id IS NULL OR EXISTS (SELECT 1 FROM inbox.contacts c WHERE c.id = d.contact_id AND c.workspace_id = d.workspace_id))
$$;
CREATE POLICY "deals: insert" ON inbox.deals FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id) AND inbox.deal_refs_ok(deals));
CREATE POLICY "deals: update" ON inbox.deals FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id) AND inbox.deal_refs_ok(deals));
CREATE POLICY "tasks: insert" ON inbox.tasks FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND (contact_id IS NULL OR EXISTS (SELECT 1 FROM inbox.contacts c WHERE c.id = contact_id AND c.workspace_id = tasks.workspace_id))
  AND (deal_id IS NULL OR EXISTS (SELECT 1 FROM inbox.deals d WHERE d.id = deal_id AND d.workspace_id = tasks.workspace_id)));
CREATE POLICY "tasks: update" ON inbox.tasks FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id)
  AND (contact_id IS NULL OR EXISTS (SELECT 1 FROM inbox.contacts c WHERE c.id = contact_id AND c.workspace_id = tasks.workspace_id))
  AND (deal_id IS NULL OR EXISTS (SELECT 1 FROM inbox.deals d WHERE d.id = deal_id AND d.workspace_id = tasks.workspace_id)));

GRANT SELECT ON inbox.pipelines, inbox.pipeline_stages, inbox.deals, inbox.deal_events, inbox.tasks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON inbox.pipelines, inbox.pipeline_stages, inbox.tasks TO authenticated;
GRANT INSERT (id, workspace_id, pipeline_id, stage_id, contact_id, title, value, expected_close, owner, position, notes, lost_reason) ON inbox.deals TO authenticated;
GRANT UPDATE (pipeline_id, stage_id, contact_id, title, value, expected_close, owner, position, notes, lost_reason) ON inbox.deals TO authenticated;
GRANT DELETE ON inbox.deals TO authenticated;
GRANT ALL ON inbox.pipelines, inbox.pipeline_stages, inbox.deals, inbox.deal_events, inbox.tasks TO service_role;

COMMIT;
