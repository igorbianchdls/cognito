BEGIN;

-- Functional access profiles live with tenant memberships, not with ERP data.
CREATE TABLE IF NOT EXISTS shared.erp_permission_profiles (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared.erp_profile_permissions (
  profile_id text NOT NULL REFERENCES shared.erp_permission_profiles (id) ON DELETE CASCADE,
  capability text NOT NULL,
  PRIMARY KEY (profile_id, capability),
  CONSTRAINT erp_profile_permissions_capability_chk CHECK (capability ~ '^erp\.[a-z-]+\.[a-z-]+$')
);

INSERT INTO shared.erp_permission_profiles (id, nome, descricao) VALUES
  ('administrador', 'Administrador', 'Acesso completo ao ERP.'),
  ('financeiro', 'Financeiro', 'Contas, baixas, estornos, conciliacao e relatorios.'),
  ('vendas', 'Vendas', 'Clientes, orcamentos, vendas, contratos e ordens de servico.'),
  ('compras', 'Compras', 'Fornecedores, cotacoes, compras e recebimentos.'),
  ('estoque', 'Estoque', 'Saldos, reservas, ajustes, inventarios e transferencias.'),
  ('consulta', 'Consulta', 'Acesso somente leitura.')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

INSERT INTO shared.erp_profile_permissions (profile_id, capability) VALUES
  ('financeiro', 'erp.vendas.visualizar'), ('financeiro', 'erp.compras.visualizar'),
  ('financeiro', 'erp.financeiro.visualizar'), ('financeiro', 'erp.financeiro.gerenciar'),
  ('financeiro', 'erp.financeiro.baixar'), ('financeiro', 'erp.financeiro.estornar'),
  ('financeiro', 'erp.relatorios.visualizar'),
  ('vendas', 'erp.vendas.visualizar'), ('vendas', 'erp.vendas.gerenciar'),
  ('vendas', 'erp.cadastros.visualizar'), ('vendas', 'erp.cadastros.gerenciar'),
  ('compras', 'erp.compras.visualizar'), ('compras', 'erp.compras.gerenciar'),
  ('compras', 'erp.cadastros.visualizar'), ('compras', 'erp.cadastros.gerenciar'),
  ('compras', 'erp.estoque.visualizar'),
  ('estoque', 'erp.estoque.visualizar'), ('estoque', 'erp.estoque.movimentar'),
  ('estoque', 'erp.estoque.ajustar'), ('estoque', 'erp.cadastros.visualizar'),
  ('consulta', 'erp.vendas.visualizar'), ('consulta', 'erp.compras.visualizar'),
  ('consulta', 'erp.financeiro.visualizar'), ('consulta', 'erp.estoque.visualizar'),
  ('consulta', 'erp.cadastros.visualizar'), ('consulta', 'erp.relatorios.visualizar')
ON CONFLICT DO NOTHING;

ALTER TABLE shared.tenant_memberships
  ADD COLUMN IF NOT EXISTS erp_profile_id text REFERENCES shared.erp_permission_profiles (id) ON DELETE RESTRICT;

UPDATE shared.tenant_memberships
SET erp_profile_id = CASE WHEN role IN ('owner', 'admin') THEN 'administrador' ELSE 'consulta' END
WHERE erp_profile_id IS NULL;

ALTER TABLE shared.tenant_memberships ALTER COLUMN erp_profile_id SET DEFAULT 'consulta';
ALTER TABLE shared.tenant_memberships ALTER COLUMN erp_profile_id SET NOT NULL;

CREATE OR REPLACE FUNCTION shared.has_erp_capability(input_tenant_id bigint, input_capability text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = shared, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shared.tenant_memberships AS memberships
    LEFT JOIN shared.erp_profile_permissions AS permissions
      ON permissions.profile_id = memberships.erp_profile_id
     AND permissions.capability = input_capability
    WHERE memberships.tenant_id = input_tenant_id
      AND memberships.user_id = shared.current_user_id()
      AND memberships.status = 'active'
      AND (memberships.role IN ('owner', 'admin') OR permissions.capability IS NOT NULL)
  )
$$;

-- Commercial documents: budgets reuse the sales aggregate and never generate finance/stock.
ALTER TABLE erp.vendas
  ADD COLUMN IF NOT EXISTS previsao_entrega date,
  ADD COLUMN IF NOT EXISTS enviada_em timestamptz,
  ADD COLUMN IF NOT EXISTS recusada_em timestamptz;

ALTER TABLE erp.vendas DROP CONSTRAINT IF EXISTS vendas_status_chk;
ALTER TABLE erp.vendas ADD CONSTRAINT vendas_status_chk CHECK (
  status IN ('rascunho', 'confirmada', 'parcialmente_faturada', 'cancelada', 'faturada')
);

ALTER TABLE erp.compras DROP CONSTRAINT IF EXISTS compras_status_chk;
ALTER TABLE erp.compras ADD CONSTRAINT compras_status_chk CHECK (
  status IN ('rascunho', 'confirmada', 'parcialmente_recebida', 'recebida', 'cancelada')
);

ALTER TABLE erp.vendas_itens
  ADD COLUMN IF NOT EXISTS quantidade_faturada numeric(18,4) NOT NULL DEFAULT 0;
ALTER TABLE erp.vendas_itens DROP CONSTRAINT IF EXISTS vendas_itens_quantidade_faturada_chk;
ALTER TABLE erp.vendas_itens ADD CONSTRAINT vendas_itens_quantidade_faturada_chk
  CHECK (quantidade_faturada >= 0 AND quantidade_faturada <= quantidade);

ALTER TABLE erp.compras_itens
  ADD COLUMN IF NOT EXISTS quantidade_recebida numeric(18,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS local_estoque_id bigint;
ALTER TABLE erp.compras_itens DROP CONSTRAINT IF EXISTS compras_itens_quantidade_recebida_chk;
ALTER TABLE erp.compras_itens ADD CONSTRAINT compras_itens_quantidade_recebida_chk
  CHECK (quantidade_recebida >= 0 AND quantidade_recebida <= quantidade);
ALTER TABLE erp.compras_itens DROP CONSTRAINT IF EXISTS compras_itens_local_estoque_fk;
ALTER TABLE erp.compras_itens ADD CONSTRAINT compras_itens_local_estoque_fk
  FOREIGN KEY (tenant_id, local_estoque_id) REFERENCES erp.locais_estoque (tenant_id, id) ON DELETE RESTRICT;

ALTER TABLE erp.documentos_estoque_itens
  ADD COLUMN IF NOT EXISTS venda_item_id bigint,
  ADD COLUMN IF NOT EXISTS compra_item_id bigint;
ALTER TABLE erp.documentos_estoque_itens DROP CONSTRAINT IF EXISTS documentos_estoque_itens_venda_item_fk;
ALTER TABLE erp.documentos_estoque_itens ADD CONSTRAINT documentos_estoque_itens_venda_item_fk
  FOREIGN KEY (tenant_id, venda_item_id) REFERENCES erp.vendas_itens (tenant_id, id) ON DELETE RESTRICT;
ALTER TABLE erp.documentos_estoque_itens DROP CONSTRAINT IF EXISTS documentos_estoque_itens_compra_item_fk;
ALTER TABLE erp.documentos_estoque_itens ADD CONSTRAINT documentos_estoque_itens_compra_item_fk
  FOREIGN KEY (tenant_id, compra_item_id) REFERENCES erp.compras_itens (tenant_id, id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS erp.ordens_servico (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants (id) ON DELETE RESTRICT,
  cliente_id bigint NOT NULL,
  responsavel_id bigint,
  numero text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  previsao_entrega date,
  concluida_em timestamptz,
  equipamento text,
  marca text,
  modelo text,
  numero_serie text,
  problema_informado text,
  diagnostico text,
  observacoes_publicas text,
  observacoes_internas text,
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  desconto numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0,
  orcamento_id bigint,
  venda_id bigint,
  chave_idempotencia text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  excluido_em timestamptz,
  criado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  atualizado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  versao integer NOT NULL DEFAULT 1,
  CONSTRAINT ordens_servico_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT ordens_servico_status_chk CHECK (status IN ('rascunho', 'orcamento_pendente', 'aprovada', 'em_execucao', 'concluida', 'cancelada')),
  CONSTRAINT ordens_servico_datas_chk CHECK (previsao_entrega IS NULL OR previsao_entrega >= data_inicio),
  CONSTRAINT ordens_servico_valores_chk CHECK (subtotal >= 0 AND desconto >= 0 AND total >= 0),
  CONSTRAINT ordens_servico_metadata_chk CHECK (jsonb_typeof(metadata) = 'object'),
  CONSTRAINT ordens_servico_cliente_fk FOREIGN KEY (tenant_id, cliente_id) REFERENCES erp.entidades (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT ordens_servico_responsavel_fk FOREIGN KEY (tenant_id, responsavel_id) REFERENCES erp.entidades (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT ordens_servico_orcamento_fk FOREIGN KEY (tenant_id, orcamento_id) REFERENCES erp.vendas (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT ordens_servico_venda_fk FOREIGN KEY (tenant_id, venda_id) REFERENCES erp.vendas (tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS erp.ordens_servico_itens (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants (id) ON DELETE RESTRICT,
  ordem_servico_id bigint NOT NULL,
  produto_id bigint,
  servico_id bigint,
  descricao text NOT NULL,
  quantidade numeric(18,4) NOT NULL DEFAULT 1,
  valor_unitario numeric(18,4) NOT NULL DEFAULT 0,
  desconto numeric(18,2) NOT NULL DEFAULT 0,
  total numeric(18,2) NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  excluido_em timestamptz,
  criado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  atualizado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT ordens_servico_itens_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT ordens_servico_itens_origem_chk CHECK ((produto_id IS NOT NULL)::int + (servico_id IS NOT NULL)::int = 1),
  CONSTRAINT ordens_servico_itens_valores_chk CHECK (quantidade > 0 AND valor_unitario >= 0 AND desconto >= 0 AND total >= 0),
  CONSTRAINT ordens_servico_itens_ordem_fk FOREIGN KEY (tenant_id, ordem_servico_id) REFERENCES erp.ordens_servico (tenant_id, id) ON DELETE CASCADE,
  CONSTRAINT ordens_servico_itens_produto_fk FOREIGN KEY (tenant_id, produto_id) REFERENCES erp.produtos (tenant_id, id) ON DELETE RESTRICT,
  CONSTRAINT ordens_servico_itens_servico_fk FOREIGN KEY (tenant_id, servico_id) REFERENCES erp.servicos (tenant_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS erp.ordens_servico_eventos (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants (id) ON DELETE RESTRICT,
  ordem_servico_id bigint NOT NULL,
  evento text NOT NULL,
  status_anterior text,
  status_novo text,
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  CONSTRAINT ordens_servico_eventos_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT ordens_servico_eventos_dados_chk CHECK (jsonb_typeof(dados) = 'object'),
  CONSTRAINT ordens_servico_eventos_ordem_fk FOREIGN KEY (tenant_id, ordem_servico_id) REFERENCES erp.ordens_servico (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS erp.regras_conciliacao_bancaria (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants (id) ON DELETE RESTRICT,
  conta_financeira_id bigint,
  nome text NOT NULL,
  correspondencia_exata boolean NOT NULL DEFAULT true,
  correspondencia_aproximada boolean NOT NULL DEFAULT true,
  tolerancia_dias integer NOT NULL DEFAULT 5,
  tolerancia_valor numeric(18,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  excluido_em timestamptz,
  criado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  atualizado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT regras_conciliacao_bancaria_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT regras_conciliacao_bancaria_tolerancia_chk CHECK (tolerancia_dias BETWEEN 0 AND 30 AND tolerancia_valor >= 0),
  CONSTRAINT regras_conciliacao_bancaria_conta_fk FOREIGN KEY (tenant_id, conta_financeira_id) REFERENCES erp.contas_financeiras (tenant_id, id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS erp.execucoes_automacao (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tenant_id bigint NOT NULL REFERENCES shared.tenants (id) ON DELETE RESTRICT,
  tipo text NOT NULL,
  competencia date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pendente',
  tentativas integer NOT NULL DEFAULT 0,
  resultado jsonb NOT NULL DEFAULT '{}'::jsonb,
  erro text,
  chave_idempotencia text NOT NULL,
  iniciado_em timestamptz,
  finalizado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  criado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  atualizado_por bigint REFERENCES shared.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT execucoes_automacao_tenant_id_id_key UNIQUE (tenant_id, id),
  CONSTRAINT execucoes_automacao_tipo_chk CHECK (tipo IN ('contratos', 'recorrencias_financeiras', 'titulos_vencidos', 'indicadores', 'estoque_minimo')),
  CONSTRAINT execucoes_automacao_status_chk CHECK (status IN ('pendente', 'processando', 'concluida', 'falha')),
  CONSTRAINT execucoes_automacao_tentativas_chk CHECK (tentativas >= 0),
  CONSTRAINT execucoes_automacao_json_chk CHECK (jsonb_typeof(resultado) = 'object' AND jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS ordens_servico_numero_unico_idx ON erp.ordens_servico (tenant_id, numero) WHERE excluido_em IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ordens_servico_idempotencia_idx ON erp.ordens_servico (tenant_id, chave_idempotencia) WHERE chave_idempotencia IS NOT NULL AND excluido_em IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS execucoes_automacao_idempotencia_idx ON erp.execucoes_automacao (tenant_id, chave_idempotencia);
CREATE UNIQUE INDEX IF NOT EXISTS regras_conciliacao_conta_unica_idx ON erp.regras_conciliacao_bancaria (tenant_id, COALESCE(conta_financeira_id, 0)) WHERE excluido_em IS NULL AND ativo = true;
CREATE INDEX IF NOT EXISTS ordens_servico_status_idx ON erp.ordens_servico (tenant_id, status, previsao_entrega) WHERE excluido_em IS NULL;
CREATE INDEX IF NOT EXISTS vendas_tipo_documento_idx ON erp.vendas (tenant_id, tipo_documento, status, data_venda DESC) WHERE excluido_em IS NULL;

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['ordens_servico', 'ordens_servico_itens', 'regras_conciliacao_bancaria', 'execucoes_automacao'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_atualizado_em ON erp.%I', tabela);
    EXECUTE format('CREATE TRIGGER set_atualizado_em BEFORE UPDATE ON erp.%I FOR EACH ROW EXECUTE FUNCTION erp.set_atualizado_em()', tabela);
  END LOOP;

  FOREACH tabela IN ARRAY ARRAY['ordens_servico', 'ordens_servico_itens', 'ordens_servico_eventos', 'regras_conciliacao_bancaria', 'execucoes_automacao'] LOOP
    EXECUTE format('ALTER TABLE erp.%I ENABLE ROW LEVEL SECURITY', tabela);
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR SELECT USING (shared.is_tenant_member(tenant_id))', tabela || '_select_policy', tabela);
  END LOOP;

  FOREACH tabela IN ARRAY ARRAY['ordens_servico', 'ordens_servico_itens'] LOOP
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR INSERT WITH CHECK (shared.has_erp_capability(tenant_id, ''erp.vendas.gerenciar''))', tabela || '_insert_policy', tabela);
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR UPDATE USING (shared.has_erp_capability(tenant_id, ''erp.vendas.gerenciar'')) WITH CHECK (shared.has_erp_capability(tenant_id, ''erp.vendas.gerenciar''))', tabela || '_update_policy', tabela);
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR DELETE USING (shared.has_erp_capability(tenant_id, ''erp.vendas.gerenciar''))', tabela || '_delete_policy', tabela);
  END LOOP;

  CREATE POLICY ordens_servico_eventos_insert_policy ON erp.ordens_servico_eventos FOR INSERT
    WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.vendas.gerenciar'));
  CREATE POLICY regras_conciliacao_bancaria_insert_policy ON erp.regras_conciliacao_bancaria FOR INSERT
    WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'));
  CREATE POLICY regras_conciliacao_bancaria_update_policy ON erp.regras_conciliacao_bancaria FOR UPDATE
    USING (shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar')) WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'));
  CREATE POLICY regras_conciliacao_bancaria_delete_policy ON erp.regras_conciliacao_bancaria FOR DELETE
    USING (shared.has_erp_capability(tenant_id, 'erp.financeiro.gerenciar'));
  CREATE POLICY execucoes_automacao_insert_policy ON erp.execucoes_automacao FOR INSERT
    WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'));
  CREATE POLICY execucoes_automacao_update_policy ON erp.execucoes_automacao FOR UPDATE
    USING (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar')) WITH CHECK (shared.has_erp_capability(tenant_id, 'erp.configuracoes.gerenciar'));
END $$;

-- Replace broad member write policies on the critical aggregates with capability checks.
DO $$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('vendas', 'erp.vendas.gerenciar'),
      ('vendas_itens', 'erp.vendas.gerenciar'),
      ('vendas_recebimentos_previstos', 'erp.vendas.gerenciar'),
      ('contratos_venda', 'erp.vendas.gerenciar'),
      ('contratos_venda_itens', 'erp.vendas.gerenciar'),
      ('compras', 'erp.compras.gerenciar'),
      ('compras_itens', 'erp.compras.gerenciar'),
      ('compras_parcelas_previstas', 'erp.compras.gerenciar'),
      ('notas_fiscais', 'erp.compras.gerenciar'),
      ('contas_receber', 'erp.financeiro.gerenciar'),
      ('contas_receber_parcelas', 'erp.financeiro.gerenciar'),
      ('contas_pagar', 'erp.financeiro.gerenciar'),
      ('contas_pagar_parcelas', 'erp.financeiro.gerenciar'),
      ('pagamentos', 'erp.financeiro.gerenciar'),
      ('contas_financeiras', 'erp.financeiro.gerenciar'),
      ('transacoes_bancarias', 'erp.financeiro.gerenciar'),
      ('conciliacoes_bancarias', 'erp.financeiro.gerenciar'),
      ('conciliacoes_bancarias_itens', 'erp.financeiro.gerenciar'),
      ('locais_estoque', 'erp.estoque.ajustar'),
      ('saldos_estoque', 'erp.estoque.movimentar'),
      ('movimentacoes_estoque', 'erp.estoque.movimentar'),
      ('reservas_estoque', 'erp.estoque.movimentar'),
      ('documentos_estoque', 'erp.estoque.movimentar'),
      ('documentos_estoque_itens', 'erp.estoque.movimentar'),
      ('inventarios', 'erp.estoque.ajustar'),
      ('inventarios_itens', 'erp.estoque.ajustar'),
      ('transferencias_estoque', 'erp.estoque.movimentar'),
      ('entidades', 'erp.cadastros.gerenciar'),
      ('produtos', 'erp.cadastros.gerenciar'),
      ('servicos', 'erp.cadastros.gerenciar'),
      ('categorias', 'erp.cadastros.gerenciar'),
      ('centros_custo', 'erp.cadastros.gerenciar')
    ) AS policies(table_name, capability)
  LOOP
    IF to_regclass(format('erp.%I', item.table_name)) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', item.table_name || '_insert_policy', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', item.table_name || '_update_policy', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON erp.%I', item.table_name || '_delete_policy', item.table_name);
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR INSERT WITH CHECK (shared.has_erp_capability(tenant_id, %L))', item.table_name || '_insert_policy', item.table_name, item.capability);
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR UPDATE USING (shared.has_erp_capability(tenant_id, %L)) WITH CHECK (shared.has_erp_capability(tenant_id, %L))', item.table_name || '_update_policy', item.table_name, item.capability, item.capability);
    EXECUTE format('CREATE POLICY %I ON erp.%I FOR DELETE USING (shared.has_erp_capability(tenant_id, %L))', item.table_name || '_delete_policy', item.table_name, item.capability);
  END LOOP;
END $$;

GRANT SELECT ON shared.erp_permission_profiles, shared.erp_profile_permissions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON erp.ordens_servico, erp.ordens_servico_itens,
  erp.regras_conciliacao_bancaria, erp.execucoes_automacao TO authenticated, service_role;
GRANT SELECT, INSERT ON erp.ordens_servico_eventos TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA erp TO authenticated, service_role;

COMMIT;
