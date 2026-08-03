BEGIN;

INSERT INTO erp.naturezas_operacao_compra (
  tenant_id, nome, codigo, atualiza_estoque, gera_financeiro_padrao, metadata
)
SELECT
  tenants.id,
  defaults.nome,
  defaults.codigo,
  defaults.atualiza_estoque,
  defaults.gera_financeiro_padrao,
  jsonb_build_object('sistema', true)
FROM shared.tenants AS tenants
CROSS JOIN (VALUES
  ('Compra para revenda', 'revenda', true, true),
  ('Compra para industrializacao', 'industrializacao', true, true),
  ('Uso e consumo', 'uso_consumo', false, true),
  ('Ativo imobilizado', 'ativo_imobilizado', false, true),
  ('Outras entradas', 'outras_entradas', false, true),
  ('Remessa sem financeiro', 'remessa', false, false)
) AS defaults(nome, codigo, atualiza_estoque, gera_financeiro_padrao)
WHERE NOT EXISTS (
  SELECT 1
  FROM erp.naturezas_operacao_compra AS existing
  WHERE existing.tenant_id = tenants.id
    AND existing.codigo = defaults.codigo
    AND existing.excluido_em IS NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS naturezas_operacao_compra_codigo_unico_idx
  ON erp.naturezas_operacao_compra (tenant_id, codigo)
  WHERE codigo IS NOT NULL AND excluido_em IS NULL;

COMMIT;
