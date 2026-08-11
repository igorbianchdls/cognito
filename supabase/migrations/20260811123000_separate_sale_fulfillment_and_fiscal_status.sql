BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erp' AND table_name = 'vendas_itens' AND column_name = 'quantidade_faturada'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erp' AND table_name = 'vendas_itens' AND column_name = 'quantidade_atendida'
  ) THEN
    ALTER TABLE erp.vendas_itens RENAME COLUMN quantidade_faturada TO quantidade_atendida;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erp' AND table_name = 'vendas' AND column_name = 'faturada_em'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'erp' AND table_name = 'vendas' AND column_name = 'atendida_em'
  ) THEN
    ALTER TABLE erp.vendas RENAME COLUMN faturada_em TO atendida_em;
  END IF;
END
$$;

ALTER TABLE erp.vendas
  ADD COLUMN IF NOT EXISTS atendimento_status text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS fiscal_status text NOT NULL DEFAULT 'nao_emitida';

ALTER TABLE erp.vendas DROP CONSTRAINT IF EXISTS vendas_status_chk;
ALTER TABLE erp.vendas ADD CONSTRAINT vendas_status_chk
  CHECK (status IN ('rascunho', 'confirmada', 'cancelada')) NOT VALID;
ALTER TABLE erp.vendas DROP CONSTRAINT IF EXISTS vendas_atendimento_status_chk;
ALTER TABLE erp.vendas ADD CONSTRAINT vendas_atendimento_status_chk
  CHECK (atendimento_status IN ('pendente', 'parcial', 'atendido', 'nao_aplicavel', 'cancelado')) NOT VALID;
ALTER TABLE erp.vendas DROP CONSTRAINT IF EXISTS vendas_fiscal_status_chk;
ALTER TABLE erp.vendas ADD CONSTRAINT vendas_fiscal_status_chk
  CHECK (fiscal_status IN ('nao_emitida', 'pronta_emissao', 'processando', 'emitida', 'falha', 'cancelada')) NOT VALID;

ALTER TABLE erp.vendas_itens DROP CONSTRAINT IF EXISTS vendas_itens_quantidade_faturada_chk;
ALTER TABLE erp.vendas_itens DROP CONSTRAINT IF EXISTS vendas_itens_quantidade_atendida_chk;
ALTER TABLE erp.vendas_itens ADD CONSTRAINT vendas_itens_quantidade_atendida_chk
  CHECK (quantidade_atendida >= 0 AND quantidade_atendida <= quantidade) NOT VALID;

CREATE INDEX IF NOT EXISTS vendas_tenant_atendimento_status_idx
  ON erp.vendas (tenant_id, atendimento_status, data_venda DESC)
  WHERE excluido_em IS NULL;
CREATE INDEX IF NOT EXISTS vendas_tenant_fiscal_status_idx
  ON erp.vendas (tenant_id, fiscal_status, data_venda DESC)
  WHERE excluido_em IS NULL;

COMMENT ON COLUMN erp.vendas.atendimento_status IS 'Estado da separacao, entrega ou saida operacional, independente do documento fiscal.';
COMMENT ON COLUMN erp.vendas.fiscal_status IS 'Estado da emissao fiscal, independente do atendimento operacional.';
COMMENT ON COLUMN erp.vendas.atendida_em IS 'Data/hora em que todos os produtos da venda foram atendidos.';
COMMENT ON COLUMN erp.vendas_itens.quantidade_atendida IS 'Quantidade entregue ou retirada do estoque; nao representa emissao fiscal.';

ALTER TABLE erp.vendas DISABLE TRIGGER validar_documento_diferido;

UPDATE erp.vendas AS vendas
SET atendimento_status = CASE
      WHEN vendas.status = 'cancelada' THEN 'cancelado'
      WHEN vendas.status = 'faturada' THEN 'atendido'
      WHEN vendas.status = 'parcialmente_faturada' THEN 'parcial'
      WHEN NOT EXISTS (
        SELECT 1 FROM erp.vendas_itens AS itens
        WHERE itens.tenant_id = vendas.tenant_id AND itens.venda_id = vendas.id
          AND itens.produto_id IS NOT NULL AND itens.excluido_em IS NULL
      ) THEN 'nao_aplicavel'
      ELSE 'pendente'
    END,
    fiscal_status = CASE
      WHEN EXISTS (
        SELECT 1 FROM erp.notas_fiscais AS notas
        WHERE notas.tenant_id = vendas.tenant_id AND notas.venda_id = vendas.id
          AND notas.direcao = 'saida' AND notas.status IN ('emitida', 'corrigida')
          AND notas.excluido_em IS NULL
      ) THEN 'emitida'
      WHEN EXISTS (
        SELECT 1 FROM erp.notas_fiscais AS notas
        WHERE notas.tenant_id = vendas.tenant_id AND notas.venda_id = vendas.id
          AND notas.direcao = 'saida' AND notas.status = 'falha'
          AND notas.excluido_em IS NULL
      ) THEN 'falha'
      ELSE 'nao_emitida'
    END,
    status = CASE
      WHEN vendas.status = 'cancelada' THEN 'cancelada'
      WHEN vendas.status = 'rascunho' THEN 'rascunho'
      ELSE 'confirmada'
    END;

ALTER TABLE erp.vendas ENABLE TRIGGER validar_documento_diferido;

COMMIT;
