CREATE SCHEMA IF NOT EXISTS mcp_app;

CREATE TABLE IF NOT EXISTS mcp_app.integration_connections (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  domain text NOT NULL,
  provider text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  auth_type text NULL,
  external_account_id text NULL,
  secret_ref text NULL,
  selected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  sync_frequency text NOT NULL DEFAULT 'manual',
  sync_enabled boolean NOT NULL DEFAULT true,
  next_sync_at timestamptz NULL,
  sync_locked_until timestamptz NULL,
  sync_lock_token text NULL,
  sync_lock_owner text NULL,
  sync_modes_json jsonb NOT NULL DEFAULT '["manual"]'::jsonb,
  last_sync_at timestamptz NULL,
  last_success_at timestamptz NULL,
  last_error text NULL,
  records_synced integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_connections_domain_check
    CHECK (domain IN ('erp', 'crm', 'ecommerce', 'analytics', 'marketing', 'advertising', 'database', 'bi', 'automation')),
  CONSTRAINT integration_connections_status_check
    CHECK (status IN ('draft', 'pending_auth', 'connected', 'syncing', 'warning', 'error', 'disabled')),
  CONSTRAINT integration_connections_auth_type_check
    CHECK (auth_type IS NULL OR auth_type IN ('oauth2', 'api_key', 'basic', 'manual')),
  CONSTRAINT integration_connections_selected_resources_array_check
    CHECK (jsonb_typeof(selected_resources) = 'array'),
  CONSTRAINT integration_connections_sync_modes_array_check
    CHECK (jsonb_typeof(sync_modes_json) = 'array'),
  CONSTRAINT integration_connections_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object'),
  CONSTRAINT integration_connections_records_synced_check
    CHECK (records_synced >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS integration_connections_external_account_uidx
  ON mcp_app.integration_connections (tenant_id, domain, provider, external_account_id)
  WHERE external_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS integration_connections_tenant_domain_idx
  ON mcp_app.integration_connections (tenant_id, domain);

CREATE INDEX IF NOT EXISTS integration_connections_tenant_provider_idx
  ON mcp_app.integration_connections (tenant_id, provider);

CREATE INDEX IF NOT EXISTS integration_connections_tenant_status_idx
  ON mcp_app.integration_connections (tenant_id, status);

CREATE INDEX IF NOT EXISTS integration_connections_last_sync_idx
  ON mcp_app.integration_connections (tenant_id, last_sync_at DESC);

CREATE INDEX IF NOT EXISTS integration_connections_due_sync_idx
  ON mcp_app.integration_connections (tenant_id, next_sync_at)
  WHERE sync_enabled = true
    AND next_sync_at IS NOT NULL
    AND sync_frequency <> 'manual'
    AND status IN ('connected', 'warning');

CREATE INDEX IF NOT EXISTS integration_connections_sync_lock_idx
  ON mcp_app.integration_connections (sync_locked_until)
  WHERE sync_locked_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS mcp_app.integration_destinations (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  type text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ref text NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_destinations_type_check
    CHECK (type IN ('bigquery', 'google_sheets', 'excel', 'postgres', 'supabase', 'snowflake', 's3')),
  CONSTRAINT integration_destinations_status_check
    CHECK (status IN ('active', 'disabled', 'error')),
  CONSTRAINT integration_destinations_config_object_check
    CHECK (jsonb_typeof(config_json) = 'object'),
  CONSTRAINT integration_destinations_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS integration_destinations_default_bigquery_uidx
  ON mcp_app.integration_destinations (tenant_id, type)
  WHERE type = 'bigquery' AND (metadata_json->>'isDefault') = 'true';

CREATE INDEX IF NOT EXISTS integration_destinations_tenant_type_idx
  ON mcp_app.integration_destinations (tenant_id, type, status);

CREATE TABLE IF NOT EXISTS mcp_app.integration_pipelines (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  source_connection_id bigint NOT NULL REFERENCES mcp_app.integration_connections(id) ON DELETE CASCADE,
  destination_id bigint NOT NULL REFERENCES mcp_app.integration_destinations(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  selected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  sync_frequency text NOT NULL DEFAULT 'manual',
  sync_enabled boolean NOT NULL DEFAULT true,
  next_sync_at timestamptz NULL,
  sync_locked_until timestamptz NULL,
  sync_lock_token text NULL,
  sync_lock_owner text NULL,
  last_sync_at timestamptz NULL,
  last_success_at timestamptz NULL,
  last_error text NULL,
  records_synced integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_pipelines_status_check
    CHECK (status IN ('draft', 'active', 'paused', 'error', 'disabled')),
  CONSTRAINT integration_pipelines_selected_resources_array_check
    CHECK (jsonb_typeof(selected_resources) = 'array'),
  CONSTRAINT integration_pipelines_records_synced_check
    CHECK (records_synced >= 0),
  CONSTRAINT integration_pipelines_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object')
);

CREATE INDEX IF NOT EXISTS integration_pipelines_tenant_source_idx
  ON mcp_app.integration_pipelines (tenant_id, source_connection_id);

CREATE INDEX IF NOT EXISTS integration_pipelines_tenant_destination_idx
  ON mcp_app.integration_pipelines (tenant_id, destination_id);

CREATE INDEX IF NOT EXISTS integration_pipelines_due_sync_idx
  ON mcp_app.integration_pipelines (tenant_id, next_sync_at)
  WHERE sync_enabled = true
    AND next_sync_at IS NOT NULL
    AND sync_frequency <> 'manual'
    AND status = 'active';

CREATE INDEX IF NOT EXISTS integration_pipelines_sync_lock_idx
  ON mcp_app.integration_pipelines (sync_locked_until)
  WHERE sync_locked_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS mcp_app.integration_mcp_permissions (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  connection_id bigint NOT NULL REFERENCES mcp_app.integration_connections(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  read_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  write_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  destructive_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  require_confirmation boolean NOT NULL DEFAULT true,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_mcp_permissions_read_array_check
    CHECK (jsonb_typeof(read_resources) = 'array'),
  CONSTRAINT integration_mcp_permissions_write_array_check
    CHECK (jsonb_typeof(write_resources) = 'array'),
  CONSTRAINT integration_mcp_permissions_destructive_array_check
    CHECK (jsonb_typeof(destructive_resources) = 'array'),
  CONSTRAINT integration_mcp_permissions_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object'),
  CONSTRAINT integration_mcp_permissions_connection_unique
    UNIQUE (tenant_id, connection_id)
);

CREATE TABLE IF NOT EXISTS mcp_app.integration_sync_runs (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  connection_id bigint NOT NULL REFERENCES mcp_app.integration_connections(id) ON DELETE CASCADE,
  pipeline_id bigint NULL REFERENCES mcp_app.integration_pipelines(id) ON DELETE SET NULL,
  destination_id bigint NULL REFERENCES mcp_app.integration_destinations(id) ON DELETE SET NULL,
  trigger text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'queued',
  resource text NULL,
  external_job_id text NULL,
  started_at timestamptz NULL,
  finished_at timestamptz NULL,
  records_in integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  records_failed integer NOT NULL DEFAULT 0,
  error_message text NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_sync_runs_trigger_check
    CHECK (trigger IN ('manual', 'scheduled', 'webhook', 'initial')),
  CONSTRAINT integration_sync_runs_status_check
    CHECK (status IN ('queued', 'running', 'success', 'warning', 'error', 'cancelled')),
  CONSTRAINT integration_sync_runs_counts_check
    CHECK (records_in >= 0 AND records_updated >= 0 AND records_failed >= 0),
  CONSTRAINT integration_sync_runs_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object')
);

CREATE INDEX IF NOT EXISTS integration_sync_runs_connection_created_idx
  ON mcp_app.integration_sync_runs (connection_id, created_at DESC);

CREATE INDEX IF NOT EXISTS integration_sync_runs_tenant_status_idx
  ON mcp_app.integration_sync_runs (tenant_id, status);

CREATE INDEX IF NOT EXISTS integration_sync_runs_tenant_created_idx
  ON mcp_app.integration_sync_runs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS integration_sync_runs_external_job_idx
  ON mcp_app.integration_sync_runs (external_job_id)
  WHERE external_job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS integration_sync_runs_pipeline_created_idx
  ON mcp_app.integration_sync_runs (pipeline_id, created_at DESC)
  WHERE pipeline_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS integration_sync_runs_destination_created_idx
  ON mcp_app.integration_sync_runs (destination_id, created_at DESC)
  WHERE destination_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS mcp_app.integration_sync_cursors (
  id bigserial PRIMARY KEY,
  tenant_id integer NOT NULL DEFAULT 1,
  connection_id bigint NOT NULL REFERENCES mcp_app.integration_connections(id) ON DELETE CASCADE,
  resource text NOT NULL,
  cursor_key text NOT NULL DEFAULT 'default',
  cursor_value text NULL,
  cursor_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_sync_cursors_cursor_json_object_check
    CHECK (jsonb_typeof(cursor_json) = 'object'),
  CONSTRAINT integration_sync_cursors_unique_resource_key
    UNIQUE (tenant_id, connection_id, resource, cursor_key)
);

CREATE INDEX IF NOT EXISTS integration_sync_cursors_connection_idx
  ON mcp_app.integration_sync_cursors (connection_id);

CREATE INDEX IF NOT EXISTS integration_sync_cursors_tenant_resource_idx
  ON mcp_app.integration_sync_cursors (tenant_id, resource);

CREATE TABLE IF NOT EXISTS mcp_app.integration_provider_capabilities (
  id bigserial PRIMARY KEY,
  domain text NOT NULL,
  provider text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  auth_type text NOT NULL,
  supports_oauth_callback boolean NOT NULL DEFAULT false,
  supports_incremental_sync boolean NOT NULL DEFAULT false,
  sync_modes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  resources_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'available',
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_provider_capabilities_domain_check
    CHECK (domain IN ('erp', 'crm', 'ecommerce', 'analytics', 'marketing', 'advertising', 'database', 'bi', 'automation')),
  CONSTRAINT integration_provider_capabilities_auth_type_check
    CHECK (auth_type IN ('oauth2', 'api_key', 'basic', 'manual')),
  CONSTRAINT integration_provider_capabilities_status_check
    CHECK (status IN ('available', 'planned', 'disabled')),
  CONSTRAINT integration_provider_capabilities_sync_modes_array_check
    CHECK (jsonb_typeof(sync_modes_json) = 'array'),
  CONSTRAINT integration_provider_capabilities_resources_array_check
    CHECK (jsonb_typeof(resources_json) = 'array'),
  CONSTRAINT integration_provider_capabilities_tags_array_check
    CHECK (jsonb_typeof(tags_json) = 'array'),
  CONSTRAINT integration_provider_capabilities_metadata_object_check
    CHECK (jsonb_typeof(metadata_json) = 'object'),
  CONSTRAINT integration_provider_capabilities_unique_provider
    UNIQUE (domain, provider)
);

CREATE INDEX IF NOT EXISTS integration_provider_capabilities_domain_idx
  ON mcp_app.integration_provider_capabilities (domain, status);

WITH conta_azul_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'clientes', 'name', 'Clientes', 'defaultEnabled', true),
    jsonb_build_object('slug', 'fornecedores', 'name', 'Fornecedores', 'defaultEnabled', true),
    jsonb_build_object('slug', 'produtos', 'name', 'Produtos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contas_receber', 'name', 'Contas a receber', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contas_pagar', 'name', 'Contas a pagar', 'defaultEnabled', true),
    jsonb_build_object('slug', 'categorias', 'name', 'Categorias', 'defaultEnabled', false),
    jsonb_build_object('slug', 'centros_custo', 'name', 'Centros de custo', 'defaultEnabled', false),
    jsonb_build_object('slug', 'servicos', 'name', 'Servicos', 'defaultEnabled', false),
    jsonb_build_object('slug', 'vendas', 'name', 'Vendas', 'defaultEnabled', false),
    jsonb_build_object('slug', 'itens_venda', 'name', 'Itens de venda', 'defaultEnabled', false),
    jsonb_build_object('slug', 'parcelas_venda', 'name', 'Parcelas de venda', 'defaultEnabled', false),
    jsonb_build_object('slug', 'contratos', 'name', 'Contratos', 'defaultEnabled', false),
    jsonb_build_object('slug', 'contas_bancarias', 'name', 'Contas bancarias', 'defaultEnabled', false),
    jsonb_build_object('slug', 'vendedores', 'name', 'Vendedores', 'defaultEnabled', false),
    jsonb_build_object('slug', 'notas_fiscais', 'name', 'Notas fiscais', 'defaultEnabled', false),
    jsonb_build_object('slug', 'estoque', 'name', 'Estoque', 'defaultEnabled', false),
    jsonb_build_object('slug', 'movimentacoes_estoque', 'name', 'Movimentacoes de estoque', 'defaultEnabled', false)
  ) AS resources_json
),
omie_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'clientes', 'name', 'Clientes', 'defaultEnabled', true),
    jsonb_build_object('slug', 'fornecedores', 'name', 'Fornecedores', 'defaultEnabled', true),
    jsonb_build_object('slug', 'produtos', 'name', 'Produtos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pedidos_venda', 'name', 'Pedidos de venda', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contas_receber', 'name', 'Contas a receber', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contas_pagar', 'name', 'Contas a pagar', 'defaultEnabled', true),
    jsonb_build_object('slug', 'categorias', 'name', 'Categorias', 'defaultEnabled', false),
    jsonb_build_object('slug', 'pedidos_compra', 'name', 'Pedidos de compra', 'defaultEnabled', false),
    jsonb_build_object('slug', 'notas_fiscais', 'name', 'Notas fiscais', 'defaultEnabled', false),
    jsonb_build_object('slug', 'notas_servico', 'name', 'Notas de servico', 'defaultEnabled', false),
    jsonb_build_object('slug', 'estoque_saldos', 'name', 'Saldos de estoque', 'defaultEnabled', false),
    jsonb_build_object('slug', 'estoque_movimentacoes', 'name', 'Movimentacoes de estoque', 'defaultEnabled', false),
    jsonb_build_object('slug', 'lancamentos_financeiros', 'name', 'Lancamentos financeiros', 'defaultEnabled', false),
    jsonb_build_object('slug', 'contas_correntes', 'name', 'Contas correntes', 'defaultEnabled', false)
  ) AS resources_json
),
bling_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'clientes', 'name', 'Clientes', 'defaultEnabled', true),
    jsonb_build_object('slug', 'fornecedores', 'name', 'Fornecedores', 'defaultEnabled', true),
    jsonb_build_object('slug', 'produtos', 'name', 'Produtos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pedidos_venda', 'name', 'Pedidos de venda', 'defaultEnabled', true),
    jsonb_build_object('slug', 'compras', 'name', 'Pedidos de compra', 'defaultEnabled', false),
    jsonb_build_object('slug', 'contas_receber', 'name', 'Contas a receber', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contas_pagar', 'name', 'Contas a pagar', 'defaultEnabled', true),
    jsonb_build_object('slug', 'notas_fiscais', 'name', 'Notas fiscais', 'defaultEnabled', false),
    jsonb_build_object('slug', 'estoque', 'name', 'Estoque', 'defaultEnabled', false),
    jsonb_build_object('slug', 'categorias', 'name', 'Categorias', 'defaultEnabled', false),
    jsonb_build_object('slug', 'servicos', 'name', 'Servicos', 'defaultEnabled', false),
    jsonb_build_object('slug', 'notas_servico', 'name', 'Notas de servico', 'defaultEnabled', false),
    jsonb_build_object('slug', 'notas_consumidor', 'name', 'Notas de consumidor', 'defaultEnabled', false),
    jsonb_build_object('slug', 'formas_pagamento', 'name', 'Formas de pagamento', 'defaultEnabled', false),
    jsonb_build_object('slug', 'vendedores', 'name', 'Vendedores', 'defaultEnabled', false),
    jsonb_build_object('slug', 'transportadoras', 'name', 'Transportadoras', 'defaultEnabled', false),
    jsonb_build_object('slug', 'canais_venda', 'name', 'Canais de venda', 'defaultEnabled', false),
    jsonb_build_object('slug', 'lojas', 'name', 'Lojas', 'defaultEnabled', false),
    jsonb_build_object('slug', 'categorias_receitas_despesas', 'name', 'Categorias financeiras', 'defaultEnabled', false),
    jsonb_build_object('slug', 'depositos', 'name', 'Depositos', 'defaultEnabled', false)
  ) AS resources_json
),
erp_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'clientes', 'name', 'Clientes', 'defaultEnabled', true),
    jsonb_build_object('slug', 'fornecedores', 'name', 'Fornecedores', 'defaultEnabled', true),
    jsonb_build_object('slug', 'produtos', 'name', 'Produtos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pedidos_venda', 'name', 'Pedidos de venda', 'defaultEnabled', true),
    jsonb_build_object('slug', 'compras', 'name', 'Compras', 'defaultEnabled', false),
    jsonb_build_object('slug', 'contas_receber', 'name', 'Contas a receber', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contas_pagar', 'name', 'Contas a pagar', 'defaultEnabled', true),
    jsonb_build_object('slug', 'notas_fiscais', 'name', 'Notas fiscais', 'defaultEnabled', false),
    jsonb_build_object('slug', 'estoque', 'name', 'Estoque', 'defaultEnabled', false),
    jsonb_build_object('slug', 'categorias', 'name', 'Categorias', 'defaultEnabled', false),
    jsonb_build_object('slug', 'centros_custo', 'name', 'Centros de custo', 'defaultEnabled', false)
  ) AS resources_json
),
crm_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'contas', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'contatos', 'name', 'Contatos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'leads', 'name', 'Leads', 'defaultEnabled', true),
    jsonb_build_object('slug', 'oportunidades', 'name', 'Oportunidades', 'defaultEnabled', true),
    jsonb_build_object('slug', 'atividades', 'name', 'Atividades', 'defaultEnabled', false),
    jsonb_build_object('slug', 'usuarios', 'name', 'Usuarios', 'defaultEnabled', false),
    jsonb_build_object('slug', 'pipelines', 'name', 'Pipelines', 'defaultEnabled', false),
    jsonb_build_object('slug', 'fases_pipeline', 'name', 'Fases do pipeline', 'defaultEnabled', false)
  ) AS resources_json
),
ecommerce_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'stores', 'name', 'Lojas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'customers', 'name', 'Clientes', 'defaultEnabled', true),
    jsonb_build_object('slug', 'products', 'name', 'Produtos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'variants', 'name', 'Variantes', 'defaultEnabled', false),
    jsonb_build_object('slug', 'orders', 'name', 'Pedidos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'order_items', 'name', 'Itens de pedido', 'defaultEnabled', true),
    jsonb_build_object('slug', 'payments', 'name', 'Pagamentos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'refunds', 'name', 'Reembolsos', 'defaultEnabled', false),
    jsonb_build_object('slug', 'shipping', 'name', 'Entregas', 'defaultEnabled', false),
    jsonb_build_object('slug', 'inventory', 'name', 'Estoque', 'defaultEnabled', false),
    jsonb_build_object('slug', 'categories', 'name', 'Categorias', 'defaultEnabled', false),
    jsonb_build_object('slug', 'coupons', 'name', 'Cupons', 'defaultEnabled', false),
    jsonb_build_object('slug', 'abandoned_checkouts', 'name', 'Carrinhos abandonados', 'defaultEnabled', false)
  ) AS resources_json
),
digital_commerce_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'stores', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'customers', 'name', 'Clientes', 'defaultEnabled', true),
    jsonb_build_object('slug', 'products', 'name', 'Produtos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'orders', 'name', 'Vendas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'order_items', 'name', 'Itens de venda', 'defaultEnabled', true),
    jsonb_build_object('slug', 'payments', 'name', 'Pagamentos', 'defaultEnabled', true),
    jsonb_build_object('slug', 'refunds', 'name', 'Reembolsos', 'defaultEnabled', false)
  ) AS resources_json
),
marketing_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas e propriedades', 'defaultEnabled', true),
    jsonb_build_object('slug', 'traffic_daily', 'name', 'Trafego diario', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pages_daily', 'name', 'Paginas por dia', 'defaultEnabled', true),
    jsonb_build_object('slug', 'queries_daily', 'name', 'Consultas por dia', 'defaultEnabled', false),
    jsonb_build_object('slug', 'events_daily', 'name', 'Eventos por dia', 'defaultEnabled', false)
  ) AS resources_json
),
analytics_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'traffic_daily', 'name', 'Trafego diario', 'defaultEnabled', true),
    jsonb_build_object('slug', 'pages_daily', 'name', 'Paginas por dia', 'defaultEnabled', true),
    jsonb_build_object('slug', 'queries_daily', 'name', 'Consultas por dia', 'defaultEnabled', false),
    jsonb_build_object('slug', 'events_daily', 'name', 'Eventos por dia', 'defaultEnabled', false)
  ) AS resources_json
),
google_business_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'locations', 'name', 'Locais', 'defaultEnabled', true),
    jsonb_build_object('slug', 'traffic_daily', 'name', 'Performance diaria', 'defaultEnabled', true),
    jsonb_build_object('slug', 'reviews', 'name', 'Avaliacoes', 'defaultEnabled', false),
    jsonb_build_object('slug', 'local_posts', 'name', 'Posts locais', 'defaultEnabled', false)
  ) AS resources_json
),
advertising_resources AS (
  SELECT jsonb_build_array(
    jsonb_build_object('slug', 'accounts', 'name', 'Contas de anuncio', 'defaultEnabled', true),
    jsonb_build_object('slug', 'campaigns', 'name', 'Campanhas', 'defaultEnabled', true),
    jsonb_build_object('slug', 'ad_groups', 'name', 'Grupos de anuncios', 'defaultEnabled', true),
    jsonb_build_object('slug', 'ads', 'name', 'Anuncios', 'defaultEnabled', true),
    jsonb_build_object('slug', 'insights_campaign_daily', 'name', 'Metricas de campanha por dia', 'defaultEnabled', true),
    jsonb_build_object('slug', 'insights_ad_daily', 'name', 'Metricas de anuncio por dia', 'defaultEnabled', false)
  ) AS resources_json
),
providers AS (
  SELECT
    'erp'::text AS domain,
    'conta_azul'::text AS provider,
    'Conta Azul'::text AS name,
    'ERP financeiro, faturamento, vendas e conciliacao para pequenas e medias empresas.'::text AS description,
    'oauth2'::text AS auth_type,
    true AS supports_oauth_callback,
    false AS supports_incremental_sync,
    jsonb_build_array('manual', 'scheduled') AS sync_modes_json,
    conta_azul_resources.resources_json,
    jsonb_build_array('erp', 'financeiro', 'operacional', 'brasil', 'pme') AS tags_json,
    'available'::text AS status,
    jsonb_build_object('toolkitSlug', 'CONTA_AZUL') AS metadata_json
  FROM conta_azul_resources
  UNION ALL
  SELECT 'erp', 'omie', 'Omie', 'ERP com financeiro, fiscal, pedidos, estoque e automacao operacional.', 'api_key', false, false, jsonb_build_array('manual', 'scheduled'), omie_resources.resources_json, jsonb_build_array('erp', 'financeiro', 'operacional', 'brasil', 'pme', 'fiscal'), 'available', jsonb_build_object('toolkitSlug', 'OMIE')
  FROM omie_resources
  UNION ALL
  SELECT 'erp', 'bling', 'Bling', 'ERP para ecommerce, estoque, pedidos, notas fiscais e marketplaces.', 'oauth2', true, false, jsonb_build_array('manual', 'scheduled'), bling_resources.resources_json, jsonb_build_array('erp', 'ecommerce', 'marketplace', 'brasil'), 'available', jsonb_build_object('toolkitSlug', 'BLING')
  FROM bling_resources
  UNION ALL
  SELECT 'erp', 'tiny', 'Tiny', 'ERP para vendas online, catalogo, estoque, pedidos e emissao fiscal.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), erp_resources.resources_json, jsonb_build_array('erp', 'ecommerce', 'marketplace', 'brasil'), 'planned', jsonb_build_object('toolkitSlug', 'TINY')
  FROM erp_resources
  UNION ALL
  SELECT 'erp', 'linx', 'Linx', 'ERP e plataforma de varejo para lojas, PDV, estoque, vendas e operacao omnichannel.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), erp_resources.resources_json, jsonb_build_array('erp', 'varejo', 'loja-fisica', 'omnichannel', 'brasil', 'pme'), 'planned', jsonb_build_object('toolkitSlug', 'LINX')
  FROM erp_resources
  UNION ALL
  SELECT 'erp', 'totvs', 'TOTVS', 'ERP corporativo para dados financeiros, comerciais, fiscais e operacionais.', 'manual', false, true, jsonb_build_array('manual', 'scheduled'), erp_resources.resources_json, jsonb_build_array('erp', 'enterprise', 'operacional', 'brasil'), 'planned', jsonb_build_object('toolkitSlug', 'TOTVS')
  FROM erp_resources
  UNION ALL
  SELECT 'crm', 'bitrix24', 'Bitrix24', 'CRM e plataforma operacional para leads, contatos, empresas, negocios e atividades.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'pipeline', 'sales', 'operacional'), 'available', jsonb_build_object('toolkitSlug', 'BITRIX24')
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'hubspot', 'HubSpot', 'CRM para contatos, empresas, negocios, atividades e automacao comercial.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'marketing', 'sales'), 'available', jsonb_build_object('toolkitSlug', 'HUBSPOT')
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'pipedrive', 'Pipedrive', 'CRM de vendas com pipeline, negocios, atividades e previsibilidade comercial.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'pipeline', 'sales'), 'available', jsonb_build_object('toolkitSlug', 'PIPEDRIVE')
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'salesforce', 'Salesforce', 'CRM corporativo para contas, contatos, leads, oportunidades e atividades.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'enterprise', 'sales'), 'planned', jsonb_build_object('toolkitSlug', 'SALESFORCE')
  FROM crm_resources
  UNION ALL
  SELECT 'crm', 'rd_station_crm', 'RD Station CRM', 'CRM brasileiro para leads, contatos, oportunidades, funis e atividades.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), crm_resources.resources_json, jsonb_build_array('crm', 'vendas', 'relacionamento', 'brasil', 'sales'), 'available', jsonb_build_object('toolkitSlug', 'RD_STATION_CRM')
  FROM crm_resources
  UNION ALL
  SELECT 'ecommerce', 'shopify', 'Shopify', 'Loja online com pedidos, produtos, clientes, estoque, pagamentos e checkouts.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), ecommerce_resources.resources_json, jsonb_build_array('ecommerce', 'loja-online', 'global'), 'available', jsonb_build_object('toolkitSlug', 'SHOPIFY')
  FROM ecommerce_resources
  UNION ALL
  SELECT 'ecommerce', 'nuvemshop', 'Nuvemshop', 'Ecommerce brasileiro com pedidos, produtos, clientes, categorias e variantes.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), ecommerce_resources.resources_json, jsonb_build_array('ecommerce', 'loja-online', 'brasil'), 'available', jsonb_build_object('toolkitSlug', 'NUVEMSHOP')
  FROM ecommerce_resources
  UNION ALL
  SELECT 'ecommerce', 'olist', 'Olist', 'Operacao de ecommerce e marketplace com pedidos, produtos, estoque e entregas.', 'api_key', false, true, jsonb_build_array('manual', 'scheduled'), ecommerce_resources.resources_json, jsonb_build_array('ecommerce', 'marketplace', 'brasil'), 'available', jsonb_build_object('toolkitSlug', 'OLIST')
  FROM ecommerce_resources
  UNION ALL
  SELECT 'ecommerce', 'woocommerce', 'WooCommerce', 'Loja WooCommerce com pedidos, produtos, clientes, cupons e reembolsos.', 'basic', false, true, jsonb_build_array('manual', 'scheduled'), ecommerce_resources.resources_json, jsonb_build_array('ecommerce', 'loja-online', 'wordpress'), 'available', jsonb_build_object('toolkitSlug', 'WOOCOMMERCE')
  FROM ecommerce_resources
  UNION ALL
  SELECT 'ecommerce', 'eduzz', 'Eduzz', 'Infoprodutos e vendas digitais com compradores, vendas, transacoes e reembolsos.', 'api_key', false, true, jsonb_build_array('manual', 'scheduled'), digital_commerce_resources.resources_json, jsonb_build_array('ecommerce', 'infoprodutos', 'brasil'), 'available', jsonb_build_object('toolkitSlug', 'EDUZZ')
  FROM digital_commerce_resources
  UNION ALL
  SELECT 'ecommerce', 'hotmart', 'Hotmart', 'Infoprodutos, assinaturas e vendas digitais com compras, compradores e reembolsos.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), digital_commerce_resources.resources_json, jsonb_build_array('ecommerce', 'infoprodutos', 'global'), 'available', jsonb_build_object('toolkitSlug', 'HOTMART')
  FROM digital_commerce_resources
  UNION ALL
  SELECT 'ecommerce', 'kiwify', 'Kiwify', 'Vendas digitais e infoprodutos com pedidos, produtos, compradores e transacoes.', 'api_key', false, true, jsonb_build_array('manual', 'scheduled'), digital_commerce_resources.resources_json, jsonb_build_array('ecommerce', 'infoprodutos', 'brasil'), 'available', jsonb_build_object('toolkitSlug', 'KIWIFY')
  FROM digital_commerce_resources
  UNION ALL
  SELECT 'ecommerce', 'ifood', 'iFood', 'Pedidos, lojas, itens, pagamentos e operacao de delivery.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), ecommerce_resources.resources_json, jsonb_build_array('ecommerce', 'delivery', 'brasil'), 'available', jsonb_build_object('toolkitSlug', 'IFOOD')
  FROM ecommerce_resources
  UNION ALL
  SELECT 'analytics', 'google_analytics_4', 'Google Analytics', 'Trafego, paginas, eventos e conversoes de propriedades GA4.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), analytics_resources.resources_json, jsonb_build_array('analytics', 'web-analytics', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_ANALYTICS_4')
  FROM analytics_resources
  UNION ALL
  SELECT 'analytics', 'google_my_business', 'Google My Business', 'Perfis locais do Google com locais, avaliacoes, posts e metricas de performance.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), google_business_resources.resources_json, jsonb_build_array('analytics', 'local', 'business-profile', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_MY_BUSINESS')
  FROM google_business_resources
  UNION ALL
  SELECT 'analytics', 'google_search_console', 'Google Search Console', 'Performance organica de busca, consultas, paginas, paises e dispositivos.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), analytics_resources.resources_json, jsonb_build_array('analytics', 'seo', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_SEARCH_CONSOLE')
  FROM analytics_resources
  UNION ALL
  SELECT 'advertising', 'meta_ads', 'Meta Ads', 'Publicidade paga em Facebook e Instagram com campanhas, anuncios e metricas diarias.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), advertising_resources.resources_json, jsonb_build_array('advertising', 'publicidade', 'paid-media', 'meta'), 'available', jsonb_build_object('toolkitSlug', 'META_ADS')
  FROM advertising_resources
  UNION ALL
  SELECT 'advertising', 'google_ads', 'Google Ads', 'Publicidade paga no Google Ads com campanhas, grupos, anuncios e metricas diarias.', 'oauth2', true, true, jsonb_build_array('manual', 'scheduled'), advertising_resources.resources_json, jsonb_build_array('advertising', 'publicidade', 'paid-media', 'google'), 'available', jsonb_build_object('toolkitSlug', 'GOOGLE_ADS')
  FROM advertising_resources
)
INSERT INTO mcp_app.integration_provider_capabilities
  (domain, provider, name, description, auth_type, supports_oauth_callback, supports_incremental_sync, sync_modes_json, resources_json, tags_json, status, metadata_json, updated_at)
SELECT
  domain, provider, name, description, auth_type, supports_oauth_callback, supports_incremental_sync, sync_modes_json, resources_json, tags_json, status, metadata_json, now()
FROM providers
ON CONFLICT (domain, provider)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  auth_type = EXCLUDED.auth_type,
  supports_oauth_callback = EXCLUDED.supports_oauth_callback,
  supports_incremental_sync = EXCLUDED.supports_incremental_sync,
  sync_modes_json = EXCLUDED.sync_modes_json,
  resources_json = EXCLUDED.resources_json,
  tags_json = EXCLUDED.tags_json,
  status = EXCLUDED.status,
  metadata_json = EXCLUDED.metadata_json,
  updated_at = now();
