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
updates AS (
  SELECT 'erp'::text AS domain, 'conta_azul'::text AS provider, resources_json FROM conta_azul_resources
  UNION ALL
  SELECT 'erp'::text AS domain, 'bling'::text AS provider, resources_json FROM bling_resources
)
UPDATE mcp_app.integration_provider_capabilities capabilities
SET
  resources_json = updates.resources_json,
  sync_modes_json = jsonb_build_array('manual', 'scheduled'),
  supports_incremental_sync = false,
  status = 'available',
  updated_at = now()
FROM updates
WHERE capabilities.domain = updates.domain
  AND capabilities.provider = updates.provider;
