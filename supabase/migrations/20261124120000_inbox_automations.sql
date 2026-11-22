-- Inbox, etapa 1: automações (estilo ManyChat).
--   * settings: ajustes do Inbox por empresa (aqui, o horário de atendimento; as próximas etapas acrescentam colunas).
--   * flows: cada automação. draft é o que está sendo editado; graph é a versão publicada, a única que roda.
--   * triggers: o que inicia um fluxo (palavra-chave, primeira mensagem, fora do horário, link com código,
--     comentário, story; e, nas próximas etapas, compra, reembolso, carrinho abandonado).
--   * flow_runs: em que bloco cada contato está, esperando resposta ou até quando (wake_at).
--   * flow_events: o que aconteceu em cada bloco, para o relatório (quantos entraram, clicaram, responderam).
--   * contacts.source: de onde o contato veio (código do link, anúncio); preenchido na primeira vez.
--   * messages.buttons: botões enviados junto com a mensagem (para mostrar na conversa).
-- Navegador: lê tudo da empresa; edita settings, flows e triggers (papéis com escrita). Execuções e eventos só o servidor.
BEGIN;

CREATE TABLE inbox.settings (
  workspace_id text PRIMARY KEY,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  -- {"seg": [["09:00","18:00"]], "ter": [...], ...}; dia ausente = fechado; null = sempre aberto
  business_hours jsonb CHECK (business_hours IS NULL OR jsonb_typeof(business_hours) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE inbox.flow_status AS ENUM ('rascunho', 'ativo', 'pausado');
CREATE TABLE inbox.flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  status inbox.flow_status NOT NULL DEFAULT 'rascunho',
  draft jsonb NOT NULL DEFAULT '{"start": null, "nodes": []}' CHECK (jsonb_typeof(draft) = 'object' AND pg_column_size(draft) < 500000),
  graph jsonb CHECK (graph IS NULL OR (jsonb_typeof(graph) = 'object' AND pg_column_size(graph) < 500000)),
  version int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.flows (workspace_id, updated_at DESC);

CREATE TYPE inbox.trigger_kind AS ENUM ('palavra_chave', 'primeira_mensagem', 'fora_do_horario', 'link_ref', 'comentario', 'story',
  'compra', 'reembolso', 'carrinho_abandonado');
CREATE TABLE inbox.triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  flow_id uuid NOT NULL REFERENCES inbox.flows (id) ON DELETE CASCADE,
  kind inbox.trigger_kind NOT NULL,
  channel_id uuid REFERENCES inbox.channels (id) ON DELETE CASCADE,   -- null: todos os canais
  config jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(config) = 'object'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.triggers (workspace_id, kind) WHERE active;
CREATE INDEX ON inbox.triggers (flow_id);

CREATE TYPE inbox.run_status AS ENUM ('ativo', 'esperando_resposta', 'aguardando', 'concluido', 'cancelado', 'erro', 'expirado');
CREATE TABLE inbox.flow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  flow_id uuid NOT NULL REFERENCES inbox.flows (id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES inbox.conversations (id) ON DELETE CASCADE,
  node_id text,
  status inbox.run_status NOT NULL DEFAULT 'ativo',
  wake_at timestamptz,
  vars jsonb NOT NULL DEFAULT '{}',
  steps int NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.flow_runs (contact_id) WHERE status IN ('ativo', 'esperando_resposta', 'aguardando');
CREATE INDEX ON inbox.flow_runs (wake_at) WHERE status = 'aguardando';
CREATE INDEX ON inbox.flow_runs (flow_id, started_at DESC);

CREATE TABLE inbox.flow_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  workspace_id text NOT NULL,
  flow_id uuid NOT NULL REFERENCES inbox.flows (id) ON DELETE CASCADE,
  run_id uuid REFERENCES inbox.flow_runs (id) ON DELETE CASCADE,
  node_id text,
  kind text NOT NULL CHECK (kind IN ('iniciou', 'entrou', 'clicou', 'respondeu', 'concluiu', 'saiu', 'erro')),
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.flow_events (flow_id, created_at DESC);

ALTER TABLE inbox.contacts ADD COLUMN source text CHECK (source IS NULL OR char_length(source) <= 120);
ALTER TABLE inbox.messages ADD COLUMN buttons text[];

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['settings', 'flows', 'triggers', 'flow_runs', 'flow_events'] LOOP
    EXECUTE format('ALTER TABLE inbox.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON inbox.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['settings', 'flows', 'triggers'] LOOP
    EXECUTE format('CREATE POLICY "%s: insert" ON inbox.%I FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id))', t, t);
    EXECUTE format('CREATE POLICY "%s: update" ON inbox.%I FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['flows', 'triggers'] LOOP
    EXECUTE format('CREATE POLICY "%s: delete" ON inbox.%I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['settings', 'flows', 'flow_runs'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON inbox.%I FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at()', t);
  END LOOP;
END $$;
-- Gatilho só aponta para fluxo e canal da mesma empresa.
DROP POLICY "triggers: insert" ON inbox.triggers;
DROP POLICY "triggers: update" ON inbox.triggers;
CREATE POLICY "triggers: insert" ON inbox.triggers FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.flows f WHERE f.id = flow_id AND f.workspace_id = triggers.workspace_id)
  AND (channel_id IS NULL OR EXISTS (SELECT 1 FROM inbox.channels c WHERE c.id = channel_id AND c.workspace_id = triggers.workspace_id)));
CREATE POLICY "triggers: update" ON inbox.triggers FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.flows f WHERE f.id = flow_id AND f.workspace_id = triggers.workspace_id)
  AND (channel_id IS NULL OR EXISTS (SELECT 1 FROM inbox.channels c WHERE c.id = channel_id AND c.workspace_id = triggers.workspace_id)));

GRANT SELECT ON inbox.settings, inbox.flows, inbox.triggers, inbox.flow_runs, inbox.flow_events TO authenticated;
GRANT INSERT, UPDATE ON inbox.settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON inbox.flows, inbox.triggers TO authenticated;
GRANT UPDATE (source) ON inbox.contacts TO authenticated;
GRANT ALL ON inbox.settings, inbox.flows, inbox.triggers, inbox.flow_runs, inbox.flow_events TO service_role;

COMMIT;
