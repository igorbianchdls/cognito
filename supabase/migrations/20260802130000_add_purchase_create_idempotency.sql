BEGIN;

ALTER TABLE erp.compras
  ADD COLUMN IF NOT EXISTS chave_idempotencia text;

ALTER TABLE erp.contas_pagar
  ADD COLUMN IF NOT EXISTS chave_idempotencia text;

ALTER TABLE erp.compras
  ADD CONSTRAINT compras_chave_idempotencia_chk
  CHECK (chave_idempotencia IS NULL OR btrim(chave_idempotencia) <> '');

ALTER TABLE erp.contas_pagar
  ADD CONSTRAINT contas_pagar_chave_idempotencia_chk
  CHECK (chave_idempotencia IS NULL OR btrim(chave_idempotencia) <> '');

CREATE UNIQUE INDEX IF NOT EXISTS compras_chave_idempotencia_unica_idx
  ON erp.compras (tenant_id, chave_idempotencia)
  WHERE chave_idempotencia IS NOT NULL AND excluido_em IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS contas_pagar_chave_idempotencia_unica_idx
  ON erp.contas_pagar (tenant_id, chave_idempotencia)
  WHERE chave_idempotencia IS NOT NULL AND excluido_em IS NULL;

COMMIT;
