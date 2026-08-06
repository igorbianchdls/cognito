BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS fechamentos_periodos_ativo_unico_idx
  ON erp.fechamentos_periodos (tenant_id, modulo, periodo_inicio, periodo_fim)
  WHERE reaberto_em IS NULL;

DROP POLICY IF EXISTS fechamentos_periodos_insert_policy ON erp.fechamentos_periodos;
DROP POLICY IF EXISTS fechamentos_periodos_update_policy ON erp.fechamentos_periodos;
DROP POLICY IF EXISTS fechamentos_periodos_delete_policy ON erp.fechamentos_periodos;
CREATE POLICY fechamentos_periodos_insert_policy ON erp.fechamentos_periodos FOR INSERT
  WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'));
CREATE POLICY fechamentos_periodos_update_policy ON erp.fechamentos_periodos FOR UPDATE
  USING (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'))
  WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'));
CREATE POLICY fechamentos_periodos_delete_policy ON erp.fechamentos_periodos FOR DELETE
  USING (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'));

COMMIT;
