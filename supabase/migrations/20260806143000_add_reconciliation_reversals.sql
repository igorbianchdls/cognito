BEGIN;

ALTER TABLE erp.conciliacoes_bancarias_itens
  ADD COLUMN IF NOT EXISTS origem_conciliacao text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS desfeito_em timestamptz,
  ADD COLUMN IF NOT EXISTS desfeito_por bigint REFERENCES shared.users (id) ON DELETE SET NULL;

ALTER TABLE erp.conciliacoes_bancarias_itens
  DROP CONSTRAINT IF EXISTS conciliacoes_bancarias_itens_transacao_key;
ALTER TABLE erp.conciliacoes_bancarias_itens
  DROP CONSTRAINT IF EXISTS conciliacoes_bancarias_itens_origem_conciliacao_chk;
ALTER TABLE erp.conciliacoes_bancarias_itens
  ADD CONSTRAINT conciliacoes_bancarias_itens_origem_conciliacao_chk
  CHECK (origem_conciliacao IN ('manual', 'sugerida'));

CREATE UNIQUE INDEX IF NOT EXISTS conciliacoes_bancarias_itens_transacao_ativa_idx
  ON erp.conciliacoes_bancarias_itens (tenant_id, transacao_bancaria_id)
  WHERE desfeito_em IS NULL;

COMMIT;
