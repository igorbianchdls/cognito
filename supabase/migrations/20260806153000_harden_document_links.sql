CREATE UNIQUE INDEX IF NOT EXISTS vendas_origem_documento_unica_idx
  ON erp.vendas (tenant_id, venda_origem_id)
  WHERE venda_origem_id IS NOT NULL AND excluido_em IS NULL;

COMMENT ON INDEX erp.vendas_origem_documento_unica_idx IS
  'Impede que um mesmo orcamento ou documento de origem gere mais de uma venda ativa.';
