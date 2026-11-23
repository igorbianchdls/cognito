-- Inbox, etapa 2: vendas das plataformas (Hotmart, Kiwify, Eduzz, Stripe).
--   * integrations: cada conta de plataforma ligada. token é o pedaço secreto do endereço do webhook
--     (/api/inbox/vendas/<token>); o segredo de assinatura da plataforma fica cifrado em inbox_private.
--   * purchases: compras, com situação (aprovada, reembolsada…), valor e produto; uma por pedido da plataforma.
--   * abandoned_carts: carrinhos abandonados (com o link do checkout); recuperado quando a pessoa compra.
-- Compras e carrinhos só o servidor grava (vêm assinados pela plataforma). O navegador lê e gerencia as integrações.
BEGIN;

CREATE TYPE inbox.sales_provider AS ENUM ('hotmart', 'kiwify', 'eduzz', 'stripe');
CREATE TABLE inbox.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  provider inbox.sales_provider NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada')),
  last_event_at timestamptz,
  last_error text,
  events int NOT NULL DEFAULT 0,
  created_by text DEFAULT editor.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON inbox.integrations (workspace_id);

CREATE TABLE inbox_private.integration_secrets (
  integration_id uuid PRIMARY KEY REFERENCES inbox.integrations (id) ON DELETE CASCADE,
  secret_sealed text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE inbox_private.integration_secrets ENABLE ROW LEVEL SECURITY;

CREATE TYPE inbox.purchase_status AS ENUM ('aprovada', 'pendente', 'reembolsada', 'cancelada', 'chargeback');
CREATE TABLE inbox.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  integration_id uuid REFERENCES inbox.integrations (id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  provider inbox.sales_provider NOT NULL,
  external_id text NOT NULL,
  product text,
  amount numeric(14, 2),
  currency text NOT NULL DEFAULT 'BRL',
  status inbox.purchase_status NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, provider, external_id)
);
CREATE INDEX ON inbox.purchases (contact_id, occurred_at DESC);
CREATE INDEX ON inbox.purchases (workspace_id, occurred_at DESC);

CREATE TABLE inbox.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL,
  integration_id uuid REFERENCES inbox.integrations (id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES inbox.contacts (id) ON DELETE CASCADE,
  provider inbox.sales_provider NOT NULL,
  external_id text NOT NULL,
  product text,
  amount numeric(14, 2),
  checkout_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  recovered_at timestamptz,
  UNIQUE (workspace_id, provider, external_id)
);
CREATE INDEX ON inbox.abandoned_carts (contact_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['integrations', 'purchases', 'abandoned_carts'] LOOP
    EXECUTE format('ALTER TABLE inbox.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s: read" ON inbox.%I FOR SELECT TO authenticated USING (editor.can_read(workspace_id))', t, t);
  END LOOP;
END $$;
CREATE POLICY "integrations: update" ON inbox.integrations FOR UPDATE TO authenticated USING (editor.can_write(workspace_id)) WITH CHECK (editor.can_write(workspace_id));
CREATE POLICY "integrations: delete" ON inbox.integrations FOR DELETE TO authenticated USING (editor.can_write(workspace_id));
CREATE TRIGGER touch BEFORE UPDATE ON inbox.purchases FOR EACH ROW EXECUTE FUNCTION editor.touch_updated_at();

-- Integrações nascem pelo servidor (junto com o segredo cifrado); pelo navegador, só renomear, pausar e excluir.
GRANT SELECT ON inbox.integrations, inbox.purchases, inbox.abandoned_carts TO authenticated;
GRANT UPDATE (name, status) ON inbox.integrations TO authenticated;
GRANT DELETE ON inbox.integrations TO authenticated;
GRANT ALL ON inbox.integrations, inbox.purchases, inbox.abandoned_carts TO service_role;
GRANT ALL ON inbox_private.integration_secrets TO service_role;

COMMIT;
