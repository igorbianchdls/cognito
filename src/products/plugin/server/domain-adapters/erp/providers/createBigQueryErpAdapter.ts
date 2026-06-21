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
    },
    {
      resource: 'contas-a-pagar',
      table: 'contas_pagar',
      dateField: 'data_vencimento',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'pedidos-venda',
      table: 'vendas',
      dateField: 'data_pedido',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'pedidos-compra',
      table: 'compras',
      dateField: 'data_compra',
      statusField: 'status',
      orderBy: 'date_field',
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
    },
    {
      resource: 'notas-fiscais',
      table: 'notas_fiscais',
      dateField: 'data_emissao',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'notas-consumidor',
      table: 'notas_consumidor',
      dateField: 'data_emissao',
      statusField: 'status',
      orderBy: 'date_field',
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
      resource: 'categorias',
      table: 'categorias',
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
