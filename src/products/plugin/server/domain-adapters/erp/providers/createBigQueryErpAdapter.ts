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
    },
    {
      resource: 'fornecedores',
    },
    {
      resource: 'contas-a-receber',
      dateField: 'data_vencimento',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'contas-a-pagar',
      dateField: 'data_vencimento',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'pedidos-venda',
      dateField: 'data_pedido',
      statusField: 'status',
      orderBy: 'date_field',
    },
    {
      resource: 'produtos',
    },
    {
      resource: 'estoque-atual',
    },
  ]

  return base
    .map((config) => {
      const providerResource = providerResources[config.resource]
      return providerResource ? { ...config, providerResource } : null
    })
    .filter((config): config is ConnectedBigQueryResourceConfig<ConnectedErpResource> => Boolean(config))
}
