BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS contas_receber_venda_unica_idx
  ON erp.contas_receber (tenant_id, venda_id)
  WHERE venda_id IS NOT NULL
    AND excluido_em IS NULL;

COMMENT ON INDEX erp.contas_receber_venda_unica_idx IS
  'Garante que cada venda ativa gere no maximo uma conta a receber por tenant.';

COMMIT;
