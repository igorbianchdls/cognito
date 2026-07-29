BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS contas_pagar_compra_unica_idx
  ON erp.contas_pagar (tenant_id, compra_id)
  WHERE compra_id IS NOT NULL
    AND excluido_em IS NULL;

ALTER TABLE erp.pagamentos
  ADD COLUMN IF NOT EXISTS estornado_em timestamptz,
  ADD COLUMN IF NOT EXISTS estorno_de_pagamento_id bigint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pagamentos_estorno_fk'
      AND conrelid = 'erp.pagamentos'::regclass
  ) THEN
    ALTER TABLE erp.pagamentos
      ADD CONSTRAINT pagamentos_estorno_fk
      FOREIGN KEY (tenant_id, estorno_de_pagamento_id)
      REFERENCES erp.pagamentos (tenant_id, id)
      ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS pagamentos_estorno_idx
  ON erp.pagamentos (tenant_id, estorno_de_pagamento_id)
  WHERE estorno_de_pagamento_id IS NOT NULL;

COMMENT ON INDEX erp.contas_pagar_compra_unica_idx IS
  'Garante que cada compra ativa gere no maximo uma conta a pagar por tenant.';

COMMENT ON COLUMN erp.pagamentos.estornado_em IS
  'Data/hora em que o pagamento foi estornado.';

COMMENT ON COLUMN erp.pagamentos.estorno_de_pagamento_id IS
  'Pagamento original relacionado quando este registro representar um estorno.';

COMMIT;
