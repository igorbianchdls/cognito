-- Inbox, etapa 6: equipes, distribuição automática, prazo de resposta (SLA) e avaliação do atendimento.
--   * teams / team_members: times e quem atende em cada um (available = recebe conversas novas agora).
--   * channels.team_id: o time que cuida das conversas novas do canal.
--   * conversations ganha team_id, waiting_since (cliente esperando resposta de uma pessoa desde), first_response_at,
--     closed_at, sla_alerted_at e rating_requested_at; o próprio banco mantém os tempos a cada mensagem.
--   * ratings: nota de 1 a 5 que o cliente deu ao fim do atendimento.
--   * settings ganha sla_minutes (prazo padrão) e csat_enabled/csat_text (pedir avaliação ao fechar).
BEGIN;

CREATE TABLE inbox.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  auto_assign boolean NOT NULL DEFAULT true,
  sla_minutes int CHECK (sla_minutes IS NULL OR sla_minutes BETWEEN 1 AND 10080),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.teams (workspace_id);

CREATE TABLE inbox.team_members (
  team_id uuid NOT NULL REFERENCES inbox.teams (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  user_id text NOT NULL CHECK (char_length(user_id) BETWEEN 1 AND 80),
  available boolean NOT NULL DEFAULT true,
  last_assigned_at timestamptz,
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX ON inbox.team_members (workspace_id, user_id);

ALTER TABLE inbox.channels ADD COLUMN team_id uuid REFERENCES inbox.teams (id) ON DELETE SET NULL;
ALTER TABLE inbox.conversations
  ADD COLUMN team_id uuid REFERENCES inbox.teams (id) ON DELETE SET NULL,
  ADD COLUMN waiting_since timestamptz,
  ADD COLUMN first_response_at timestamptz,
  ADD COLUMN closed_at timestamptz,
  ADD COLUMN sla_alerted_at timestamptz,
  ADD COLUMN rating_requested_at timestamptz;
CREATE INDEX ON inbox.conversations (workspace_id, waiting_since) WHERE waiting_since IS NOT NULL AND status <> 'fechada';
CREATE INDEX ON inbox.conversations (closed_at) WHERE status = 'fechada';

ALTER TABLE inbox.settings
  ADD COLUMN sla_minutes int CHECK (sla_minutes IS NULL OR sla_minutes BETWEEN 1 AND 10080),
  ADD COLUMN csat_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN csat_text text CHECK (csat_text IS NULL OR char_length(csat_text) <= 500);

CREATE TABLE inbox.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  conversation_id uuid NOT NULL REFERENCES inbox.conversations (id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  assignee text,
  team_id uuid REFERENCES inbox.teams (id) ON DELETE SET NULL,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.ratings (workspace_id, created_at DESC);
CREATE INDEX ON inbox.ratings (conversation_id);

-- Tempos mantidos pelo banco: mensagem do cliente começa a espera; resposta de uma pessoa termina (automação não conta).
CREATE FUNCTION inbox.message_clock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.direction = 'entrada' THEN
    UPDATE inbox.conversations SET waiting_since = coalesce(waiting_since, NEW.created_at) WHERE id = NEW.conversation_id;
  ELSIF NEW.sent_by IS NOT NULL THEN
    UPDATE inbox.conversations SET waiting_since = NULL, sla_alerted_at = NULL,
      first_response_at = coalesce(first_response_at, NEW.created_at) WHERE id = NEW.conversation_id;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER message_clock AFTER INSERT ON inbox.messages FOR EACH ROW EXECUTE FUNCTION inbox.message_clock();

CREATE FUNCTION inbox.conversation_closed() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'fechada' AND OLD.status IS DISTINCT FROM 'fechada' THEN
    NEW.closed_at := now(); NEW.waiting_since := NULL;
  ELSIF NEW.status <> 'fechada' AND OLD.status = 'fechada' THEN
    NEW.closed_at := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER conversation_closed BEFORE UPDATE OF status ON inbox.conversations FOR EACH ROW EXECUTE FUNCTION inbox.conversation_closed();

-- O time escolhido num canal ou conversa é sempre da mesma empresa.
CREATE FUNCTION inbox.team_same_workspace() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.team_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM inbox.teams t WHERE t.id = NEW.team_id AND t.workspace_id = NEW.workspace_id) THEN
    RAISE EXCEPTION 'time de outra empresa' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER team_same_workspace BEFORE INSERT OR UPDATE OF team_id ON inbox.channels FOR EACH ROW EXECUTE FUNCTION inbox.team_same_workspace();
CREATE TRIGGER team_same_workspace BEFORE INSERT OR UPDATE OF team_id ON inbox.conversations FOR EACH ROW EXECUTE FUNCTION inbox.team_same_workspace();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['teams', 'team_members', 'ratings'] LOOP
    EXECUTE format('ALTER TABLE inbox.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON inbox.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
END $$;
CREATE POLICY "teams: insert" ON inbox.teams FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "teams: update" ON inbox.teams FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "teams: delete" ON inbox.teams FOR DELETE TO authenticated USING (editor.can_write(workspace_id));
CREATE POLICY "team_members: insert" ON inbox.team_members FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.teams t WHERE t.id = team_id AND t.workspace_id = team_members.workspace_id));
-- Cada pessoa pode marcar a si mesma como disponível ou ausente; quem escreve na empresa muda qualquer um.
CREATE POLICY "team_members: update" ON inbox.team_members FOR UPDATE TO authenticated
  USING (editor.can_write(workspace_id) OR (user_id = editor.uid() AND editor.can_read(workspace_id))) WITH CHECK (editor.can_read(workspace_id));
CREATE POLICY "team_members: delete" ON inbox.team_members FOR DELETE TO authenticated USING (editor.can_write(workspace_id));

GRANT SELECT ON inbox.teams, inbox.team_members, inbox.ratings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON inbox.teams TO authenticated;
GRANT INSERT (team_id, workspace_id, user_id, available), DELETE ON inbox.team_members TO authenticated;
GRANT UPDATE (available) ON inbox.team_members TO authenticated;
GRANT UPDATE (team_id) ON inbox.channels, inbox.conversations TO authenticated;
GRANT UPDATE (sla_minutes, csat_enabled, csat_text) ON inbox.settings TO authenticated;
GRANT ALL ON inbox.teams, inbox.team_members, inbox.ratings TO service_role;

COMMIT;
