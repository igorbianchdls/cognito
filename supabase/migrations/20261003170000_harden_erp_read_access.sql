BEGIN;

-- A empresa e o vinculo precisam estar ativos, inclusive para escrita.
CREATE OR REPLACE FUNCTION shared.is_tenant_member(input_tenant_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT (NULLIF(current_setting('app.erp_tenant_id', true), '') IS NULL
          OR NULLIF(current_setting('app.erp_tenant_id', true), '')::bigint = input_tenant_id)
    AND EXISTS (
      SELECT 1 FROM shared.tenant_memberships AS memberships
      JOIN shared.tenants AS tenants ON tenants.id = memberships.tenant_id AND tenants.status = 'active'
      WHERE memberships.tenant_id = input_tenant_id
        AND memberships.user_id = shared.current_user_id() AND memberships.status = 'active'
    )
$$;

CREATE OR REPLACE FUNCTION shared.has_erp_capability(input_tenant_id bigint, input_capability text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT (NULLIF(current_setting('app.erp_tenant_id', true), '') IS NULL
          OR NULLIF(current_setting('app.erp_tenant_id', true), '')::bigint = input_tenant_id)
    AND EXISTS (
      SELECT 1 FROM shared.tenant_memberships AS memberships
      JOIN shared.tenants AS tenants ON tenants.id = memberships.tenant_id AND tenants.status = 'active'
      LEFT JOIN shared.erp_profile_permissions AS permissions
        ON permissions.profile_id = memberships.erp_profile_id AND permissions.capability = input_capability
      WHERE memberships.tenant_id = input_tenant_id
        AND memberships.user_id = shared.current_user_id() AND memberships.status = 'active'
        AND (memberships.role IN ('owner', 'admin') OR permissions.capability IS NOT NULL)
    )
$$;

-- Gerenciar um modulo permite ler seus registros, necessario para UPDATE
-- RETURNING e para validacoes diferidas executadas pelo erp_runtime.
CREATE OR REPLACE FUNCTION shared.can_read_erp_module(input_tenant_id bigint, input_module text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM unnest(CASE input_module
      WHEN 'vendas' THEN ARRAY['erp.vendas.visualizar','erp.vendas.gerenciar']
      WHEN 'compras' THEN ARRAY['erp.compras.visualizar','erp.compras.gerenciar']
      WHEN 'financeiro' THEN ARRAY['erp.financeiro.visualizar','erp.financeiro.gerenciar','erp.financeiro.baixar','erp.financeiro.estornar']
      WHEN 'estoque' THEN ARRAY['erp.estoque.visualizar','erp.estoque.movimentar','erp.estoque.ajustar']
      WHEN 'cadastros' THEN ARRAY['erp.cadastros.visualizar','erp.cadastros.gerenciar']
      WHEN 'configuracoes' THEN ARRAY['erp.configuracoes.gerenciar']
      -- Somente cadastros de referencia; nunca titulos, saldos ou documentos.
      WHEN 'referencias' THEN ARRAY['erp.vendas.visualizar','erp.vendas.gerenciar','erp.compras.visualizar','erp.compras.gerenciar',
        'erp.financeiro.visualizar','erp.financeiro.gerenciar','erp.financeiro.baixar','erp.financeiro.estornar',
        'erp.estoque.visualizar','erp.estoque.movimentar','erp.estoque.ajustar','erp.cadastros.visualizar','erp.cadastros.gerenciar','erp.configuracoes.gerenciar']
      ELSE ARRAY[]::text[] END) AS capabilities(capability)
    WHERE shared.has_erp_capability(input_tenant_id, capabilities.capability)
  )
$$;

REVOKE ALL ON FUNCTION shared.is_tenant_member(bigint), shared.has_erp_capability(bigint,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION shared.is_tenant_member(bigint), shared.has_erp_capability(bigint,text) TO authenticated, service_role, erp_runtime;
REVOKE ALL ON FUNCTION shared.can_read_erp_module(bigint,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION shared.can_read_erp_module(bigint,text) TO erp_runtime, service_role;

-- Projecao limitada para pre-validacao de vendas e identificacao do destinatario
-- da NF-e de compra. Nao retorna referencias de segredos nem metadados.
CREATE OR REPLACE FUNCTION erp.fiscal_issuer_for_operations(input_tenant_id bigint)
RETURNS TABLE(tenant_id bigint, id bigint, cnpj text, inscricao_estadual text, endereco_codigo_municipio text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$
  SELECT configs.tenant_id, configs.id, configs.cnpj::text, configs.inscricao_estadual::text, configs.endereco_codigo_municipio::text
  FROM erp.configuracoes_fiscais AS configs
  WHERE configs.tenant_id = input_tenant_id AND configs.ativo AND configs.excluido_em IS NULL
    AND (shared.can_read_erp_module(input_tenant_id,'vendas')
      OR shared.can_read_erp_module(input_tenant_id,'compras')
      OR shared.can_read_erp_module(input_tenant_id,'configuracoes'))
$$;
REVOKE ALL ON FUNCTION erp.fiscal_issuer_for_operations(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION erp.fiscal_issuer_for_operations(bigint) TO erp_runtime, service_role;

-- Mapa fechado: a migracao aborta se alguma tabela/politica nao for conhecida.
-- As politicas de escrita, nomes, papeis e modalidade das politicas permanecem.
DO $migration$
DECLARE
  groups jsonb := '{
    "financeiro":["adiantamentos","adiantamentos_aplicacoes","cobrancas","cobrancas_eventos","cobrancas_notificacoes","conciliacoes_bancarias","conciliacoes_bancarias_itens","contas_financeiras","contas_pagar","contas_pagar_arquivos","contas_pagar_eventos","contas_pagar_parcelas","contas_receber","contas_receber_arquivos","contas_receber_eventos","contas_receber_parcelas","importacoes_bancarias","pagamentos","rateios_financeiros","recorrencias_financeiras","regras_conciliacao_bancaria","renegociacoes","renegociacoes_parcelas","transacoes_bancarias","transferencias_financeiras"],
    "vendas":["contratos_vendas","contratos_vendas_arquivos","contratos_vendas_eventos","contratos_vendas_geracoes","contratos_vendas_geracoes_tentativas","contratos_vendas_itens","contratos_vendas_versoes","ordens_servico","ordens_servico_arquivos","ordens_servico_eventos","ordens_servico_itens","vendas","vendas_arquivos","vendas_eventos","vendas_itens","vendas_recebimentos_previstos"],
    "compras":["compras","compras_arquivos","compras_eventos","compras_itens","compras_parcelas_previstas","compras_recorrencias","compras_recorrencias_geracoes","naturezas_operacao_compra"],
    "estoque":["conversoes_unidades_produto","documentos_estoque","documentos_estoque_itens","inventarios","inventarios_itens","kits_produtos","kits_produtos_itens","movimentacoes_estoque","reservas_estoque","saldos_estoque","transferencias_estoque","transferencias_estoque_itens"],
    "cadastros":["cadastros_eventos","importacoes_dados","importacoes_dados_linhas"],
    "referencias":["categorias","centros_custo","entidades","entidades_contatos","entidades_enderecos","fornecedores_produtos","metodos_pagamento","produtos","servicos","fechamentos_periodos"],
    "locais":["locais_estoque"],
    "configuracoes":["configuracoes_fiscais"],
    "especial":["arquivos","execucoes_automacao","notas_fiscais","notas_fiscais_eventos","notas_fiscais_itens","notas_fiscais_totais"]
  }'::jsonb;
  table_name text; module_name text; expression text; policy_name text;
  names text[]; count_tables integer; all_policy record; expected_write text;
BEGIN
  SELECT array_agg(x.value) INTO names FROM jsonb_each(groups) g CROSS JOIN LATERAL jsonb_array_elements_text(g.value) x;
  SELECT count(*) INTO count_tables FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='erp' AND c.relkind IN ('r','p');
  IF cardinality(names) <> 82 OR (SELECT count(DISTINCT name) FROM unnest(names) AS x(name)) <> 82 OR count_tables <> 82
    OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='erp' AND c.relkind IN ('r','p') AND NOT c.relname=ANY(names)) THEN
    RAISE EXCEPTION 'Mapa de leitura ERP precisa cobrir exatamente as 82 tabelas';
  END IF;
  -- As 14 politicas ALL existentes exigem gerenciar, que ja implica leitura.
  -- Validar cada uma evita uma segunda politica permissiva liberar outro perfil.
  FOR all_policy IN SELECT * FROM pg_policies WHERE schemaname='erp' AND cmd='ALL' LOOP
    SELECT CASE WHEN g.key='referencias' THEN 'cadastros' ELSE g.key END INTO module_name
      FROM jsonb_each(groups) g WHERE g.value ? all_policy.tablename;
    IF module_name NOT IN ('financeiro','vendas','cadastros') OR module_name IS NULL THEN
      RAISE EXCEPTION 'Politica ALL inesperada na tabela %',all_policy.tablename;
    END IF;
    expected_write := format('shared.has_erp_capability(tenant_id, %L::text)','erp.'||module_name||'.gerenciar');
    IF all_policy.qual IS DISTINCT FROM expected_write OR all_policy.with_check IS DISTINCT FROM expected_write THEN
      RAISE EXCEPTION 'Politica ALL inesperada na tabela %',all_policy.tablename;
    END IF;
  END LOOP;
  FOR module_name, table_name IN SELECT g.key,x.value FROM jsonb_each(groups) g CROSS JOIN LATERAL jsonb_array_elements_text(g.value) x LOOP
    IF (SELECT count(*) FROM pg_policies WHERE schemaname='erp' AND tablename=table_name AND cmd='SELECT') <> 1 THEN
      RAISE EXCEPTION 'Politica SELECT inesperada na tabela %', table_name;
    END IF;
    SELECT policyname INTO policy_name FROM pg_policies WHERE schemaname='erp' AND tablename=table_name AND cmd='SELECT';
    expression := format('shared.can_read_erp_module(tenant_id,%L)',module_name);
    IF module_name='locais' THEN
      expression := 'shared.can_read_erp_module(tenant_id,''estoque'') OR shared.can_read_erp_module(tenant_id,''vendas'') OR shared.can_read_erp_module(tenant_id,''compras'') OR shared.can_read_erp_module(tenant_id,''configuracoes'')';
    ELSIF table_name='notas_fiscais' THEN
      expression := 'shared.can_read_erp_module(tenant_id,''configuracoes'') OR (direcao=''saida'' AND shared.can_read_erp_module(tenant_id,''vendas'')) OR (direcao=''entrada'' AND shared.can_read_erp_module(tenant_id,''compras''))';
    ELSIF table_name IN ('notas_fiscais_eventos','notas_fiscais_itens','notas_fiscais_totais') THEN
      expression := format('EXISTS (SELECT 1 FROM erp.notas_fiscais nota WHERE nota.tenant_id=%I.tenant_id AND nota.id=%I.nota_fiscal_id)',table_name,table_name);
    ELSIF table_name='arquivos' THEN
      -- As consultas abaixo respeitam o RLS das associacoes. Sem recursao:
      -- nenhuma politica das associacoes consulta erp.arquivos.
      expression := 'shared.can_read_erp_module(tenant_id,''configuracoes'')
        OR EXISTS (SELECT 1 FROM erp.vendas_arquivos l WHERE l.tenant_id=arquivos.tenant_id AND l.arquivo_id=arquivos.id)
        OR EXISTS (SELECT 1 FROM erp.compras_arquivos l WHERE l.tenant_id=arquivos.tenant_id AND l.arquivo_id=arquivos.id)
        OR EXISTS (SELECT 1 FROM erp.contratos_vendas_arquivos l WHERE l.tenant_id=arquivos.tenant_id AND l.arquivo_id=arquivos.id)
        OR EXISTS (SELECT 1 FROM erp.ordens_servico_arquivos l WHERE l.tenant_id=arquivos.tenant_id AND l.arquivo_id=arquivos.id)
        OR EXISTS (SELECT 1 FROM erp.contas_receber_arquivos l WHERE l.tenant_id=arquivos.tenant_id AND l.arquivo_id=arquivos.id)
        OR EXISTS (SELECT 1 FROM erp.contas_pagar_arquivos l WHERE l.tenant_id=arquivos.tenant_id AND l.arquivo_id=arquivos.id)';
    ELSIF table_name='execucoes_automacao' THEN
      expression := 'shared.can_read_erp_module(tenant_id,''configuracoes'')
        OR (tipo=''contratos'' AND shared.can_read_erp_module(tenant_id,''vendas''))
        OR (tipo IN (''titulos_vencidos'',''cobrancas_eventos'') AND shared.can_read_erp_module(tenant_id,''financeiro''))
        OR (tipo=''recorrencias_financeiras'' AND shared.can_read_erp_module(tenant_id,''financeiro'') AND shared.can_read_erp_module(tenant_id,''compras''))
        OR (tipo=''estoque_minimo'' AND shared.can_read_erp_module(tenant_id,''estoque''))
        OR (tipo=''indicadores'' AND shared.can_read_erp_module(tenant_id,''financeiro'') AND shared.can_read_erp_module(tenant_id,''vendas'') AND shared.can_read_erp_module(tenant_id,''compras'') AND shared.can_read_erp_module(tenant_id,''estoque''))';
    END IF;
    EXECUTE format('ALTER POLICY %I ON erp.%I USING (%s)',policy_name,table_name,expression);
  END LOOP;
END
$migration$;

COMMIT;
