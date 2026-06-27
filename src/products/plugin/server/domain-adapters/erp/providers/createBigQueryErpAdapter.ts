import type { ErpAdapter } from '@/products/plugin/server/domain-adapters/erp/ErpAdapter'
import type {
  ConnectedErpAction,
  ConnectedErpResource,
} from '@/products/plugin/server/domain-adapters/erp/erpTypes'
import {
  readConnectedBigQueryResource,
  type ConnectedBigQueryResourceConfig,
} from '@/products/plugin/server/domain-adapters/shared/connectedBigQueryReader'

export function createBigQueryErpAdapter(
  provider: string,
  configs: readonly ConnectedBigQueryResourceConfig<ConnectedErpResource>[],
): ErpAdapter {
  const configByResource = new Map(configs.map((config) => [config.resource, config] as const))

  function supports(resource: ConnectedErpResource, action: ConnectedErpAction) {
    return (action === 'listar' || action === 'ler') && configByResource.has(resource)
  }

  return {
    provider,
    supports,
    async list(input) {
      return readConnectedBigQueryResource('listar', input, configByResource.get(input.resource)!)
    },
    async read(input) {
      return readConnectedBigQueryResource('ler', input, configByResource.get(input.resource)!)
    },
  }
}

export function makeErpConfigs(
  providerResources: Partial<Record<ConnectedErpResource, string>>,
): ConnectedBigQueryResourceConfig<ConnectedErpResource>[] {
  const base: Omit<ConnectedBigQueryResourceConfig<ConnectedErpResource>, 'providerResource'>[] = [
    {
      resource: 'clientes',
      table: 'clientes',
    },
    {
      resource: 'fornecedores',
      table: 'fornecedores',
    },
    {
      resource: 'contas-a-receber',
      table: 'contas_receber',
      dateField: 'data_vencimento',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor',
    },
    {
      resource: 'contas-a-pagar',
      table: 'contas_pagar',
      dateField: 'data_vencimento',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor',
    },
    {
      resource: 'pedidos-venda',
      table: 'vendas',
      dateField: 'data_pedido',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor_total',
    },
    {
      resource: 'venda-detalhes',
      table: 'venda_detalhes',
      dateField: 'data_pedido',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor_total',
    },
    {
      resource: 'venda-proximo-numero',
      table: 'venda_proximo_numero',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'pedidos-compra',
      table: 'compras',
      dateField: 'data_compra',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor_total',
    },
    {
      resource: 'itens-venda',
      table: 'itens_venda',
    },
    {
      resource: 'parcelas-venda',
      table: 'parcelas_venda',
      dateField: 'data_vencimento',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor',
    },
    {
      resource: 'notas-fiscais',
      table: 'notas_fiscais',
      dateField: 'data_emissao',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor_total',
    },
    {
      resource: 'notas-fiscais-servico',
      table: 'notas_fiscais_servico',
      dateField: 'data_competencia',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor_total',
    },
    {
      resource: 'notas-consumidor',
      table: 'notas_consumidor',
      dateField: 'data_emissao',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor_total',
    },
    {
      resource: 'expedicoes',
      table: 'expedicoes',
      dateField: 'data_envio',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'separacoes',
      table: 'separacoes',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'movimentacoes-estoque',
      table: 'estoque_movimentacoes',
      dateField: 'data',
      orderBy: 'date_field',
    },
    {
      resource: 'vendedores',
      table: 'vendedores',
      statusField: 'status',
    },
    {
      resource: 'variacoes',
      table: 'variacoes',
      statusField: 'status',
    },
    {
      resource: 'marcas',
      table: 'marcas',
      statusField: 'status',
    },
    {
      resource: 'listas-preco',
      table: 'listas_preco',
      statusField: 'status',
    },
    {
      resource: 'formas-envio',
      table: 'formas_envio',
      statusField: 'status',
    },
    {
      resource: 'formas-pagamento',
      table: 'formas_pagamento',
      statusField: 'status',
    },
    {
      resource: 'intermediadores',
      table: 'intermediadores',
      statusField: 'status',
    },
    {
      resource: 'transportadoras',
      table: 'transportadoras',
      statusField: 'status',
    },
    {
      resource: 'canais-venda',
      table: 'canais_venda',
      statusField: 'status',
    },
    {
      resource: 'lojas',
      table: 'lojas',
      statusField: 'status',
    },
    {
      resource: 'depositos',
      table: 'depositos',
      statusField: 'status',
    },
    {
      resource: 'categorias',
      table: 'categorias',
      statusField: 'status',
    },
    {
      resource: 'categorias-dre',
      table: 'categorias_dre',
      statusField: 'status',
    },
    {
      resource: 'empresa-conectada',
      table: 'empresa_conectada',
      statusField: 'status',
    },
    {
      resource: 'uso-api',
      table: 'uso_api',
      statusField: 'status',
    },
    {
      resource: 'gatilhos',
      table: 'gatilhos',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'centros-custo',
      table: 'centros_custo',
    },
    {
      resource: 'contas-financeiras',
      table: 'contas_financeiras',
      statusField: 'status',
    },
    {
      resource: 'saldos-contas-financeiras',
      table: 'saldos_contas_financeiras',
      statusField: 'status',
    },
    {
      resource: 'transferencias',
      table: 'transferencias',
      dateField: 'data_transferencia',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor',
    },
    {
      resource: 'eventos-financeiros-alteracoes',
      table: 'eventos_financeiros_alteracoes',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor',
    },
    {
      resource: 'saldos-iniciais',
      table: 'saldos_iniciais',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
      defaultMetricField: 'valor',
    },
    {
      resource: 'contrato-proximo-numero',
      table: 'contrato_proximo_numero',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'lancamentos-financeiros',
      table: 'lancamentos_financeiros',
      dateField: 'data',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'contas-correntes',
      table: 'contas_correntes',
      statusField: 'status',
    },
    {
      resource: 'produto-categorias',
      table: 'produto_categorias',
      statusField: 'status',
    },
    {
      resource: 'produto-cest',
      table: 'produto_cest',
      statusField: 'status',
    },
    {
      resource: 'produto-ecommerce-marcas',
      table: 'produto_ecommerce_marcas',
      statusField: 'status',
    },
    {
      resource: 'produto-ncm',
      table: 'produto_ncm',
      statusField: 'status',
    },
    {
      resource: 'produto-unidades-medida',
      table: 'produto_unidades_medida',
      statusField: 'status',
    },
    {
      resource: 'produtos',
      table: 'produtos',
    },
    {
      resource: 'servicos',
      table: 'servicos',
    },
    {
      resource: 'contratos',
      table: 'contratos',
    },
    {
      resource: 'estoque-atual',
      table: 'estoque_atual',
    },
  ]

  const configs: ConnectedBigQueryResourceConfig<ConnectedErpResource>[] = []
  for (const config of base) {
    const providerResource = providerResources[config.resource]
    if (providerResource) {
      configs.push({ ...config, providerResource, datasetKind: 'normalized' })
    }
  }
  return configs
}
