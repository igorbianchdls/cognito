BEGIN;

UPDATE erp.vendas
SET status = 'confirmada'
WHERE status = 'aprovada';

ALTER TABLE erp.vendas
  ADD COLUMN IF NOT EXISTS confirmada_em timestamptz,
  ADD COLUMN IF NOT EXISTS faturada_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelada_em timestamptz;

ALTER TABLE erp.vendas
  DROP CONSTRAINT IF EXISTS vendas_status_chk;

ALTER TABLE erp.vendas
  ADD CONSTRAINT vendas_status_chk
  CHECK (status IN ('rascunho', 'confirmada', 'faturada', 'cancelada'));

UPDATE erp.compras
SET status = 'confirmada'
WHERE status = 'aprovada';

ALTER TABLE erp.compras
  ADD COLUMN IF NOT EXISTS gera_financeiro boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confirmada_em timestamptz,
  ADD COLUMN IF NOT EXISTS recebida_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelada_em timestamptz;

ALTER TABLE erp.compras
  DROP CONSTRAINT IF EXISTS compras_status_chk;

ALTER TABLE erp.compras
  ADD CONSTRAINT compras_status_chk
  CHECK (status IN ('rascunho', 'confirmada', 'recebida', 'cancelada'));

COMMENT ON COLUMN erp.vendas.confirmada_em IS 'Data/hora em que a venda foi confirmada e ficou apta a gerar financeiro.';
COMMENT ON COLUMN erp.vendas.faturada_em IS 'Data/hora em que a venda foi faturada.';
COMMENT ON COLUMN erp.vendas.cancelada_em IS 'Data/hora em que a venda foi cancelada.';
COMMENT ON COLUMN erp.compras.gera_financeiro IS 'Define se a compra deve gerar contas a pagar ao ser confirmada.';
COMMENT ON COLUMN erp.compras.confirmada_em IS 'Data/hora em que a compra foi confirmada e ficou apta a gerar financeiro.';
COMMENT ON COLUMN erp.compras.recebida_em IS 'Data/hora em que a compra foi recebida/concluida operacionalmente.';
COMMENT ON COLUMN erp.compras.cancelada_em IS 'Data/hora em que a compra foi cancelada.';

COMMIT;
