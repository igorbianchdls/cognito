-- Inbox mais confiável e os índices que o Supabase apontou.
--   * inbox_private.webhook_events: cada aviso da Meta é guardado ANTES de responder "recebido". Se o processamento
--     falhar, ele fica pendente e é processado de novo (no próximo aviso e uma vez por dia), em vez de se perder.
--     Avisos processados são apagados depois de 7 dias.
--   * Canais e contatos deixam de ser apagados direto pelo navegador: passam pelo servidor, que também apaga do
--     armazenamento os arquivos recebidos (LGPD). Desconectar um canal (sem apagar o histórico) também é pelo servidor.
--   * Índices: conversas por contato (Inbox) e experimentos por site (Analytics).
BEGIN;

CREATE TABLE inbox_private.webhook_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source text NOT NULL DEFAULT 'meta',
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  claimed_at timestamptz,                    -- quem está processando agora (evita processar duas vezes ao mesmo tempo)
  last_error text
);
CREATE INDEX ON inbox_private.webhook_events (received_at) WHERE processed_at IS NULL;
ALTER TABLE inbox_private.webhook_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON inbox_private.webhook_events TO service_role;

REVOKE DELETE ON inbox.channels, inbox.contacts FROM authenticated;
DROP POLICY "channels: delete" ON inbox.channels;
DROP POLICY "contacts: delete" ON inbox.contacts;

CREATE INDEX ON inbox.conversations (contact_id);
CREATE INDEX ON analytics.experiments (property_id);

COMMIT;
