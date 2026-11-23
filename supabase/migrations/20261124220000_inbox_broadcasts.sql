-- Inbox, etapa 5: disparos em massa (modelos do WhatsApp e e-mail).
--   * wa_templates: modelos de mensagem do WhatsApp; a Meta aprova antes de usar. Status e id da Meta só pelo servidor.
--   * email_settings: remetente e endereço do rodapé (exigido por lei em e-mail de marketing).
--   * broadcasts: um disparo (canal, modelo ou assunto/texto, segmento, agendamento); depois de iniciado só o servidor mexe.
--   * broadcast_recipients: quem recebe e o resultado de cada envio; montada no início, enviada aos poucos pelo relógio.
--   * optouts: quem pediu para não receber mais (palavra SAIR no WhatsApp, link no e-mail, ou marcado pela equipe).
BEGIN;

CREATE TYPE inbox.template_status AS ENUM ('rascunho', 'pendente', 'aprovado', 'rejeitado', 'pausado');
CREATE TABLE inbox.wa_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  channel_id uuid NOT NULL REFERENCES inbox.channels (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (name ~ '^[a-z0-9_]{1,200}$'),
  language text NOT NULL DEFAULT 'pt_BR' CHECK (language ~ '^[a-z]{2}(_[A-Z]{2})?$'),
  category text NOT NULL DEFAULT 'MARKETING' CHECK (category IN ('MARKETING', 'UTILITY')),
  header text CHECK (header IS NULL OR char_length(header) <= 60),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1024),
  footer text CHECK (footer IS NULL OR char_length(footer) <= 60),
  buttons jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(buttons) = 'array' AND jsonb_array_length(buttons) <= 3),
  variables jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(variables) = 'array' AND jsonb_array_length(variables) <= 10),
  status inbox.template_status NOT NULL DEFAULT 'rascunho',
  meta_id text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, name, language)
);
CREATE INDEX ON inbox.wa_templates (workspace_id);
CREATE TRIGGER touch BEFORE UPDATE ON inbox.wa_templates FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

CREATE TABLE inbox.email_settings (
  workspace_id text PRIMARY KEY,
  from_name text CHECK (from_name IS NULL OR char_length(from_name) <= 80),
  from_email text CHECK (from_email IS NULL OR (from_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(from_email) <= 200)),
  reply_to text CHECK (reply_to IS NULL OR (reply_to ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND char_length(reply_to) <= 200)),
  address text CHECK (address IS NULL OR char_length(address) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER touch BEFORE UPDATE ON inbox.email_settings FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

CREATE TYPE inbox.broadcast_kind AS ENUM ('whatsapp', 'email');
CREATE TYPE inbox.broadcast_status AS ENUM ('rascunho', 'agendado', 'enviando', 'concluido', 'cancelado', 'erro');
CREATE TABLE inbox.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  kind inbox.broadcast_kind NOT NULL,
  channel_id uuid REFERENCES inbox.channels (id) ON DELETE SET NULL,
  template_id uuid REFERENCES inbox.wa_templates (id) ON DELETE SET NULL,
  segment_id uuid REFERENCES inbox.segments (id) ON DELETE SET NULL,
  rules jsonb,                                -- cópia das regras no início (o segmento pode mudar depois)
  subject text CHECK (subject IS NULL OR char_length(subject) <= 200),
  body text CHECK (body IS NULL OR char_length(body) <= 50000),
  status inbox.broadcast_status NOT NULL DEFAULT 'rascunho',
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  total int NOT NULL DEFAULT 0,
  sent int NOT NULL DEFAULT 0,
  failed int NOT NULL DEFAULT 0,
  skipped int NOT NULL DEFAULT 0,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.broadcasts (workspace_id, created_at DESC);
CREATE INDEX ON inbox.broadcasts (status, scheduled_at) WHERE status IN ('agendado', 'enviando');
CREATE TRIGGER touch BEFORE UPDATE ON inbox.broadcasts FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

CREATE TYPE inbox.recipient_status AS ENUM ('pendente', 'enviando', 'enviado', 'falhou', 'ignorado');
CREATE TABLE inbox.broadcast_recipients (
  broadcast_id uuid NOT NULL REFERENCES inbox.broadcasts (id) ON DELETE CASCADE,
  workspace_id text NOT NULL,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  status inbox.recipient_status NOT NULL DEFAULT 'pendente',
  error text,
  message_id uuid REFERENCES inbox.messages (id) ON DELETE SET NULL,
  external_id text,
  sent_at timestamptz,
  PRIMARY KEY (broadcast_id, contact_id)
);
CREATE INDEX ON inbox.broadcast_recipients (broadcast_id) WHERE status IN ('pendente', 'enviando');
CREATE INDEX ON inbox.broadcast_recipients (contact_id);

CREATE TABLE inbox.optouts (
  workspace_id text NOT NULL,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  kind inbox.broadcast_kind NOT NULL,
  reason text CHECK (reason IS NULL OR char_length(reason) <= 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contact_id, kind)
);
CREATE INDEX ON inbox.optouts (workspace_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['wa_templates', 'email_settings', 'broadcasts', 'broadcast_recipients', 'optouts'] LOOP
    EXECUTE format('ALTER TABLE inbox.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON inbox.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
END $$;

-- Modelos: a equipe escreve enquanto é rascunho ou foi rejeitado; enviar para a Meta e o status são do servidor.
CREATE POLICY "wa_templates: insert" ON inbox.wa_templates FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.channels c WHERE c.id = channel_id AND c.workspace_id = wa_templates.workspace_id AND c.kind IN ('whatsapp', 'teste')));
CREATE POLICY "wa_templates: update" ON inbox.wa_templates FOR UPDATE TO authenticated
  USING (editor.can_write(workspace_id) AND status IN ('rascunho', 'rejeitado')) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "wa_templates: delete" ON inbox.wa_templates FOR DELETE TO authenticated USING (editor.can_write(workspace_id));
GRANT INSERT (id, workspace_id, channel_id, name, language, category, header, body, footer, buttons, variables) ON inbox.wa_templates TO authenticated;
GRANT UPDATE (name, language, category, header, body, footer, buttons, variables) ON inbox.wa_templates TO authenticated;

CREATE POLICY "email_settings: insert" ON inbox.email_settings FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "email_settings: update" ON inbox.email_settings FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
GRANT INSERT (workspace_id, from_name, from_email, reply_to, address), UPDATE (workspace_id, from_name, from_email, reply_to, address) ON inbox.email_settings TO authenticated;

-- Disparos: rascunho pelo navegador, sempre apontando para canal, modelo e segmento da mesma empresa.
CREATE FUNCTION inbox.broadcast_refs_ok(b inbox.broadcasts) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT (b.channel_id IS NULL OR EXISTS (SELECT 1 FROM inbox.channels c WHERE c.id = b.channel_id AND c.workspace_id = b.workspace_id))
    AND (b.template_id IS NULL OR EXISTS (SELECT 1 FROM inbox.wa_templates t WHERE t.id = b.template_id AND t.workspace_id = b.workspace_id))
    AND (b.segment_id IS NULL OR EXISTS (SELECT 1 FROM inbox.segments s WHERE s.id = b.segment_id AND s.workspace_id = b.workspace_id))
$$;
REVOKE ALL ON FUNCTION inbox.broadcast_refs_ok(inbox.broadcasts) FROM public;
GRANT EXECUTE ON FUNCTION inbox.broadcast_refs_ok(inbox.broadcasts) TO authenticated;
CREATE POLICY "broadcasts: insert" ON inbox.broadcasts FOR INSERT TO authenticated
  WITH CHECK (editor.can_write(workspace_id) AND status = 'rascunho' AND inbox.broadcast_refs_ok(broadcasts));
CREATE POLICY "broadcasts: update" ON inbox.broadcasts FOR UPDATE TO authenticated
  USING (editor.can_write(workspace_id) AND status = 'rascunho') WITH CHECK (editor.can_write(workspace_id) AND status = 'rascunho' AND inbox.broadcast_refs_ok(broadcasts));
CREATE POLICY "broadcasts: delete" ON inbox.broadcasts FOR DELETE TO authenticated USING (editor.can_write(workspace_id) AND status IN ('rascunho', 'concluido', 'cancelado', 'erro'));
GRANT INSERT (id, workspace_id, name, kind, channel_id, template_id, segment_id, subject, body, scheduled_at) ON inbox.broadcasts TO authenticated;
GRANT UPDATE (name, kind, channel_id, template_id, segment_id, subject, body, scheduled_at) ON inbox.broadcasts TO authenticated;

CREATE POLICY "optouts: insert" ON inbox.optouts FOR INSERT TO authenticated WITH CHECK (editor.can_write(workspace_id)
  AND EXISTS (SELECT 1 FROM inbox.contacts c WHERE c.id = contact_id AND c.workspace_id = optouts.workspace_id));
CREATE POLICY "optouts: delete" ON inbox.optouts FOR DELETE TO authenticated USING (editor.can_write(workspace_id));
GRANT INSERT (workspace_id, contact_id, kind, reason) ON inbox.optouts TO authenticated;

GRANT SELECT ON inbox.wa_templates, inbox.email_settings, inbox.broadcasts, inbox.broadcast_recipients, inbox.optouts TO authenticated;
GRANT DELETE ON inbox.wa_templates, inbox.broadcasts, inbox.optouts TO authenticated;
GRANT ALL ON inbox.wa_templates, inbox.email_settings, inbox.broadcasts, inbox.broadcast_recipients, inbox.optouts TO service_role;

COMMIT;
