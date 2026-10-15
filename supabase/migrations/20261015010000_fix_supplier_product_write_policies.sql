-- Purchase imports may maintain supplier item codes, within the same company and
-- only for operators who can manage purchases or registrations. No DELETE grant.
DROP POLICY IF EXISTS inserir_vinculo_fornecedor ON erp.fornecedores_produtos;
CREATE POLICY inserir_vinculo_fornecedor ON erp.fornecedores_produtos
FOR INSERT TO erp_runtime WITH CHECK (
 empresa_id = shared.erp_empresa_contexto() AND
 (shared.has_erp_capability(empresa_id,'erp.compras.gerenciar') OR shared.has_erp_capability(empresa_id,'erp.cadastros.gerenciar'))
);
DROP POLICY IF EXISTS atualizar_vinculo_fornecedor ON erp.fornecedores_produtos;
CREATE POLICY atualizar_vinculo_fornecedor ON erp.fornecedores_produtos
FOR UPDATE TO erp_runtime USING (
 empresa_id = shared.erp_empresa_contexto() AND
 (shared.has_erp_capability(empresa_id,'erp.compras.gerenciar') OR shared.has_erp_capability(empresa_id,'erp.cadastros.gerenciar'))
) WITH CHECK (
 empresa_id = shared.erp_empresa_contexto() AND
 (shared.has_erp_capability(empresa_id,'erp.compras.gerenciar') OR shared.has_erp_capability(empresa_id,'erp.cadastros.gerenciar'))
);