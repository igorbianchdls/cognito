BEGIN;

DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('arquivos', 'erp.configuracoes.gerenciar'),
      ('cobrancas', 'erp.financeiro.gerenciar'),
      ('cobrancas_eventos', 'erp.financeiro.gerenciar'),
      ('cobrancas_notificacoes', 'erp.financeiro.gerenciar'),
      ('compras_arquivos', 'erp.compras.gerenciar'),
      ('compras_eventos', 'erp.compras.gerenciar'),
      ('compras_recorrencias', 'erp.compras.gerenciar'),
      ('compras_recorrencias_geracoes', 'erp.compras.gerenciar'),
      ('configuracoes_fiscais', 'erp.configuracoes.gerenciar'),
      ('contas_pagar_arquivos', 'erp.financeiro.gerenciar'),
      ('contas_pagar_eventos', 'erp.financeiro.gerenciar'),
      ('contratos_vendas', 'erp.vendas.gerenciar'),
      ('contratos_vendas_geracoes', 'erp.vendas.gerenciar'),
      ('contratos_vendas_itens', 'erp.vendas.gerenciar'),
      ('conversoes_unidades_produto', 'erp.estoque.ajustar'),
      ('importacoes_bancarias', 'erp.financeiro.gerenciar'),
      ('importacoes_dados', 'erp.cadastros.gerenciar'),
      ('importacoes_dados_linhas', 'erp.cadastros.gerenciar'),
      ('kits_produtos', 'erp.estoque.ajustar'),
      ('kits_produtos_itens', 'erp.estoque.ajustar'),
      ('metodos_pagamento', 'erp.configuracoes.gerenciar'),
      ('naturezas_operacao_compra', 'erp.compras.gerenciar'),
      ('notas_fiscais_eventos', 'erp.configuracoes.gerenciar'),
      ('notas_fiscais_itens', 'erp.configuracoes.gerenciar'),
      ('rateios_financeiros', 'erp.financeiro.gerenciar'),
      ('recorrencias_financeiras', 'erp.financeiro.gerenciar'),
      ('transferencias_estoque_itens', 'erp.estoque.movimentar'),
      ('transferencias_financeiras', 'erp.financeiro.gerenciar')
    ) AS policies(table_name, capability)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', item.table_name || '_insert_policy', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', item.table_name || '_update_policy', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', item.table_name || '_delete_policy', item.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON erp.%I FOR INSERT WITH CHECK (shared.has_erp_capability(tenant_id, %L))',
      item.table_name || '_insert_policy', item.table_name, item.capability
    );
    EXECUTE format(
      'CREATE POLICY %I ON erp.%I FOR UPDATE USING (shared.has_erp_capability(tenant_id, %L)) WITH CHECK (shared.has_erp_capability(tenant_id, %L))',
      item.table_name || '_update_policy', item.table_name, item.capability, item.capability
    );
    EXECUTE format(
      'CREATE POLICY %I ON erp.%I FOR DELETE USING (shared.has_erp_capability(tenant_id, %L))',
      item.table_name || '_delete_policy', item.table_name, item.capability
    );
  END LOOP;
END $$;

ALTER TABLE shared.ai_action_approvals
  ADD COLUMN IF NOT EXISTS processing_at timestamptz,
  ADD COLUMN IF NOT EXISTS processing_attempts integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ai_action_approvals_processing_idx
  ON shared.ai_action_approvals (status, processing_at)
  WHERE status = 'processing';

COMMIT;
