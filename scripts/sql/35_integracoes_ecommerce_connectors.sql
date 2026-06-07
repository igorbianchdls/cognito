BEGIN;

WITH
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
providers AS (
  SELECT 'ecommerce'::text AS domain, 'shopify'::text AS provider, 'Shopify'::text AS name, 'Loja online com pedidos, produtos, clientes, estoque, pagamentos e checkouts.'::text AS description, 'oauth2'::text AS auth_type, true AS supports_oauth_callback, true AS supports_incremental_sync, jsonb_build_array('manual', 'scheduled') AS sync_modes_json, ecommerce_resources.resources_json, jsonb_build_array('ecommerce', 'loja-online', 'global') AS tags_json, 'available'::text AS status, jsonb_build_object('toolkitSlug', 'SHOPIFY') AS metadata_json
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

COMMIT;
