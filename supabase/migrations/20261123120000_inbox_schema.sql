-- Produto Inbox: atendimento de WhatsApp, Instagram e Messenger num lugar só (depois: automações e disparos).
--   * channels: cada número de WhatsApp, conta do Instagram ou página do Facebook conectada. external_id é o id na
--     Meta (phone_number_id, id da conta do Instagram ou da página) e é único: um número atende uma empresa só, e é
--     por ele que o webhook descobre de quem é a mensagem. "teste" é um canal simulado para conhecer o produto.
--   * inbox_private.channel_credentials: o token de cada canal, criptografado pelo servidor. Esse schema não é exposto.
--   * contacts / contact_identities: a pessoa e como ela aparece em cada canal (wa_id, id do Instagram ou Messenger).
--   * conversations: uma por canal e contato; last_inbound_at abre a janela de 24 h da Meta para responder livremente.
--   * messages: tudo o que entrou e saiu. Só o servidor grava (envio passa pela Meta; entrada chega pelo webhook).
--   * notes, tags, contact_tags, quick_replies: trabalho da equipe.
--   * Acesso pelos papéis do ERP (editor.can_read / editor.can_write), como Drive, Analytics e Video Hosting.
-- Depois de aplicar, o schema "inbox" precisa estar na lista de schemas expostos da API (Settings → API).
BEGIN;

CREATE SCHEMA inbox;
CREATE SCHEMA inbox_private;
GRANT USAGE ON SCHEMA inbox TO authenticated, service_role;
GRANT USAGE ON SCHEMA inbox_private TO service_role;

CREATE TYPE inbox.channel_kind AS ENUM ('whatsapp', 'instagram', 'messenger', 'teste');
CREATE TYPE inbox.channel_status AS ENUM ('conectado', 'erro', 'desconectado');
CREATE TYPE inbox.conversation_status AS ENUM ('aberta', 'pendente', 'fechada');
CREATE TYPE inbox.message_direction AS ENUM ('entrada', 'saida');
CREATE TYPE inbox.message_status AS ENUM ('recebida', 'enviando', 'enviada', 'entregue', 'lida', 'falhou');

CREATE TABLE inbox.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  kind inbox.channel_kind NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  external_id text NOT NULL CHECK (char_length(external_id) BETWEEN 1 AND 80),
  display text,                              -- número formatado, @usuário ou nome da página
  status inbox.channel_status NOT NULL DEFAULT 'conectado',
  last_error text,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, external_id)
);
CREATE INDEX ON inbox.channels (workspace_id);

CREATE TABLE inbox_private.channel_credentials (
  channel_id uuid PRIMARY KEY REFERENCES inbox.channels (id) ON DELETE CASCADE,
  token_sealed text NOT NULL,                -- AES-256-GCM, chave fora do banco
  business_account_id text,                  -- WABA do WhatsApp
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inbox.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL DEFAULT 'Sem nome' CHECK (char_length(name) BETWEEN 1 AND 120),
  phone text CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{8,15}$'),
  email text CHECK (email IS NULL OR (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(email) <= 200)),
  avatar_url text,
  fields jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(fields) = 'object'),
  erp_cliente_id bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.contacts (workspace_id, created_at DESC);
CREATE INDEX ON inbox.contacts (workspace_id, phone);

CREATE TABLE inbox.contact_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES inbox.channels (id) ON DELETE CASCADE,
  external_id text NOT NULL,                 -- wa_id, IGSID ou PSID
  username text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, external_id)
);
CREATE INDEX ON inbox.contact_identities (contact_id);

CREATE TABLE inbox.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  color text NOT NULL DEFAULT '#6b7280' CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON inbox.tags (workspace_id, lower(name));

CREATE TABLE inbox.contact_tags (
  workspace_id text NOT NULL,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES inbox.tags (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, tag_id)
);
CREATE INDEX ON inbox.contact_tags (tag_id);

CREATE TABLE inbox.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  channel_id uuid NOT NULL REFERENCES inbox.channels (id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  status inbox.conversation_status NOT NULL DEFAULT 'aberta',
  assignee text,                             -- usuário do Clerk
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_inbound_at timestamptz,
  last_preview text,
  unread int NOT NULL DEFAULT 0 CHECK (unread >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, contact_id)
);
CREATE INDEX ON inbox.conversations (workspace_id, last_message_at DESC);

CREATE TABLE inbox.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  conversation_id uuid NOT NULL REFERENCES inbox.conversations (id) ON DELETE CASCADE,
  direction inbox.message_direction NOT NULL,
  kind text NOT NULL DEFAULT 'texto' CHECK (kind IN ('texto', 'imagem', 'audio', 'video', 'documento', 'figurinha', 'localizacao', 'reacao', 'outro')),
  body text CHECK (body IS NULL OR char_length(body) <= 8000),
  media_path text,                           -- no bucket drive, em "<empresa>/inbox/…"
  media_mime text,
  media_name text,
  external_id text,                          -- wamid / mid da Meta
  status inbox.message_status NOT NULL,
  error text,
  sent_by text,                              -- quem respondeu (Clerk); null na entrada e em automações
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.messages (conversation_id, created_at);
CREATE UNIQUE INDEX ON inbox.messages (conversation_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX ON inbox.messages (external_id) WHERE external_id IS NOT NULL;

CREATE TABLE inbox.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  conversation_id uuid NOT NULL REFERENCES inbox.conversations (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  author text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.notes (conversation_id, created_at);

CREATE TABLE inbox.quick_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  shortcut text NOT NULL CHECK (shortcut ~ '^[a-z0-9_-]{1,30}$'),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, shortcut)
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['channels', 'contacts', 'contact_identities', 'tags', 'contact_tags', 'conversations', 'messages', 'notes', 'quick_replies'] LOOP
    EXECUTE format('ALTER TABLE inbox.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON inbox.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['channels', 'contacts', 'tags', 'contact_tags', 'notes', 'quick_replies'] LOOP
    EXECUTE format('CREATE POLICY "%s: delete" ON inbox.%I FOR DELETE TO authenticated USING (editor.can_write(workspace_id))', t, t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['channels', 'contacts', 'conversations', 'quick_replies'] LOOP
    EXECUTE format('CREATE TRIGGER touch BEFORE UPDATE ON inbox.%I FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at()', t);
  END LOOP;
END $$;
ALTER TABLE inbox_private.channel_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channels: update" ON inbox.channels FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "contacts: insert" ON inbox.contacts FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "contacts: update" ON inbox.contacts FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "tags: insert" ON inbox.tags FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "tags: update" ON inbox.tags FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "contact_tags: insert" ON inbox.contact_tags FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.contacts c WHERE c.id = contact_id AND c.workspace_id = contact_tags.workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.tags g WHERE g.id = tag_id AND g.workspace_id = contact_tags.workspace_id));
CREATE POLICY "conversations: update" ON inbox.conversations FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "notes: insert" ON inbox.notes FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND author = editor.uid()
  AND EXISTS (SELECT 1 FROM inbox.conversations c WHERE c.id = conversation_id AND c.workspace_id = notes.workspace_id));
CREATE POLICY "quick_replies: insert" ON inbox.quick_replies FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "quick_replies: update" ON inbox.quick_replies FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));

-- Canais, identidades e mensagens nascem no servidor (passam pela Meta). Pelo navegador, só o que está abaixo.
GRANT SELECT ON ALL TABLES IN SCHEMA inbox TO authenticated;
GRANT DELETE ON inbox.channels, inbox.contacts, inbox.tags, inbox.contact_tags, inbox.notes, inbox.quick_replies TO authenticated;
GRANT INSERT, UPDATE ON inbox.contacts, inbox.tags, inbox.quick_replies TO authenticated;
GRANT INSERT ON inbox.contact_tags TO authenticated;
GRANT INSERT (id, workspace_id, conversation_id, body, author) ON inbox.notes TO authenticated;
GRANT UPDATE (name) ON inbox.channels TO authenticated;
GRANT UPDATE (status, assignee, unread) ON inbox.conversations TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA inbox TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA inbox_private TO service_role;

-- Caixa de entrada ao vivo: o Supabase Realtime entrega as mudanças respeitando as mesmas regras de leitura.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inbox.conversations, inbox.messages;
  END IF;
END $$;

COMMIT;
