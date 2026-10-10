BEGIN;

-- As revisões comerciais existentes usam "orcamento" nos metadados.
-- Resolver o alias preserva arquivos imutáveis e atende revisões antigas e novas.
CREATE OR REPLACE FUNCTION erp.anexo_destino(p_tipo text)
RETURNS TABLE (tabela text, vinculo text, coluna text, leitura text, escrita text, tem_finalidade boolean)
LANGUAGE sql IMMUTABLE SET search_path TO 'pg_catalog' AS $$
  SELECT d.tabela, d.vinculo, d.coluna, d.leitura, d.escrita, d.tem_finalidade FROM (VALUES
    ('conta_pagar', 'contas_pagar', 'contas_pagar_arquivos', 'conta_pagar_id', 'erp.financeiro.visualizar', 'erp.financeiro.gerenciar', false),
    ('conta_receber', 'contas_receber', 'contas_receber_arquivos', 'conta_receber_id', 'erp.financeiro.visualizar', 'erp.financeiro.gerenciar', true),
    ('pagamento', 'pagamentos', 'pagamentos_arquivos', 'pagamento_id', 'erp.financeiro.visualizar', 'erp.financeiro.baixar', true),
    ('venda', 'vendas', 'vendas_arquivos', 'venda_id', 'erp.vendas.visualizar', 'erp.vendas.gerenciar', true),
    ('orcamento', 'vendas', 'vendas_arquivos', 'venda_id', 'erp.vendas.visualizar', 'erp.vendas.gerenciar', true),
    ('compra', 'compras', 'compras_arquivos', 'compra_id', 'erp.compras.visualizar', 'erp.compras.gerenciar', false),
    ('contrato', 'contratos_vendas', 'contratos_vendas_arquivos', 'contrato_id', 'erp.vendas.visualizar', 'erp.vendas.gerenciar', true),
    ('ordem_servico', 'ordens_servico', 'ordens_servico_arquivos', 'ordem_servico_id', 'erp.vendas.visualizar', 'erp.vendas.gerenciar', true)
  ) AS d(tipo, tabela, vinculo, coluna, leitura, escrita, tem_finalidade) WHERE d.tipo = p_tipo
$$;

COMMIT;
