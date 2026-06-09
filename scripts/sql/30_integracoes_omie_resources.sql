WITH omie_resources AS (
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
)
UPDATE plugin.integration_provider_capabilities
SET
  resources_json = omie_resources.resources_json,
  sync_modes_json = jsonb_build_array('manual', 'scheduled'),
  supports_incremental_sync = false,
  status = 'available',
  updated_at = now()
FROM omie_resources
WHERE domain = 'erp'
  AND provider = 'omie';
