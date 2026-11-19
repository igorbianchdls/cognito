-- Produto Social: posts e agendamento, contas sociais, notificações e o plugin, vindos do Otto Social.
--   * Mesmo modelo do schema editor: workspace_id é a organização do Clerk e o acesso vem do token de sessão
--     (editor.is_member / editor.uid), já que o Social usa o Editor (os posts apontam para editor.files).
--   * Os segredos das contas (tokens) e as sincronizações de dados vêm depois, em social_private, com os conectores.
--   * Nada do ERP é tocado. Para desfazer: DROP SCHEMA social CASCADE.
-- Depois de aplicar, o schema "social" precisa estar na lista de schemas expostos da API (Settings → API).
BEGIN;

CREATE SCHEMA social;
GRANT USAGE ON SCHEMA social TO authenticated, service_role;

CREATE TYPE social.network AS ENUM ('instagram', 'tiktok', 'linkedin', 'youtube');
CREATE TYPE social.account_status AS ENUM ('conectada', 'reconectar', 'desconectada');
CREATE TYPE social.post_format AS ENUM ('reel', 'story', 'feed');
CREATE TYPE social.post_status AS ENUM ('rascunho', 'agendado', 'publicado', 'erro');
CREATE TYPE social.notification_kind AS ENUM ('publicado', 'erro', 'comentario', 'agendado', 'armazenamento', 'conta', 'plugin', 'arquivos');
CREATE TYPE social.tool_mode AS ENUM ('livre', 'confirmar', 'bloqueado');

-- ---------- contas sociais ----------
CREATE TABLE social.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  network social.network NOT NULL,
  handle text NOT NULL,
  name text NOT NULL DEFAULT '',
  status social.account_status NOT NULL DEFAULT 'desconectada',
  external_id text,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, network, handle)
);

-- ---------- posts ----------
CREATE TABLE social.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  caption text NOT NULL DEFAULT '',
  format social.post_format NOT NULL DEFAULT 'reel',
  status social.post_status NOT NULL DEFAULT 'rascunho',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'agendado' OR scheduled_at IS NOT NULL)
);
CREATE INDEX ON social.posts (workspace_id, scheduled_at);
CREATE TRIGGER touch BEFORE UPDATE ON social.posts FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

-- A mídia do post vem dos Spaces do Editor.
CREATE TABLE social.post_files (
  post_id uuid NOT NULL REFERENCES social.posts (id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES editor.files (id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, file_id)
);

-- Em quais contas o post sai, e como foi em cada uma.
CREATE TABLE social.post_accounts (
  post_id uuid NOT NULL REFERENCES social.posts (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES social.social_accounts (id) ON DELETE CASCADE,
  status social.post_status NOT NULL DEFAULT 'agendado',
  external_id text,
  url text,
  metrics jsonb NOT NULL DEFAULT '{}',
  error text,
  published_at timestamptz,
  PRIMARY KEY (post_id, account_id)
);

-- ---------- notificações (da empresa toda, ou de uma pessoa quando user_id está preenchido) ----------
CREATE TABLE social.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  user_id text,
  kind social.notification_kind NOT NULL,
  title text NOT NULL,
  text text NOT NULL DEFAULT '',
  href text,
  action text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON social.notifications (workspace_id, created_at DESC);

-- ---------- plugin (ChatGPT e Claude): o que cada ferramenta pode fazer e o que foi feito ----------
CREATE TABLE social.plugin_tool_modes (
  workspace_id text NOT NULL,
  tool_id text NOT NULL,
  mode social.tool_mode NOT NULL,
  PRIMARY KEY (workspace_id, tool_id)
);
CREATE TABLE social.plugin_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  assistant text NOT NULL CHECK (assistant IN ('chatgpt', 'claude')),
  tool_id text NOT NULL,
  text text NOT NULL,
  status text NOT NULL CHECK (status IN ('feito', 'aguardando', 'recusado')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- acesso ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA social TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA social TO service_role;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['social_accounts', 'posts', 'plugin_tool_modes', 'plugin_activity'] LOOP
    EXECUTE format('ALTER TABLE social.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: members" ON social.%I FOR ALL TO authenticated USING (editor.is_member(workspace_id)) WITH CHECK (editor.is_member(workspace_id))', t, t);
  END LOOP;
END $$;

-- Mídia e contas de um post: valem as regras do post. A mídia e a conta também precisam ser da mesma empresa.
ALTER TABLE social.post_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_files: members" ON social.post_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.is_member(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.is_member(p.workspace_id))
    AND EXISTS (SELECT 1 FROM editor.files f WHERE f.id = file_id AND editor.is_member(f.workspace_id)));
ALTER TABLE social.post_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_accounts: members" ON social.post_accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.is_member(p.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM social.posts p WHERE p.id = post_id AND editor.is_member(p.workspace_id))
    AND EXISTS (SELECT 1 FROM social.social_accounts a WHERE a.id = account_id AND editor.is_member(a.workspace_id)));

-- Notificações: as da empresa e as da própria pessoa.
ALTER TABLE social.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: read" ON social.notifications FOR SELECT TO authenticated
  USING (editor.is_member(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));
CREATE POLICY "notifications: insert" ON social.notifications FOR INSERT TO authenticated
  WITH CHECK (editor.is_member(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));
CREATE POLICY "notifications: update" ON social.notifications FOR UPDATE TO authenticated
  USING (editor.is_member(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()))
  WITH CHECK (editor.is_member(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));
CREATE POLICY "notifications: delete" ON social.notifications FOR DELETE TO authenticated
  USING (editor.is_member(workspace_id) AND (user_id IS NULL OR user_id = editor.uid()));

COMMIT;
