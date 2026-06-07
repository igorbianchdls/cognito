import type { ErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/ErpAdapter'
import type {
  ConnectedErpAction,
  ConnectedErpResource,
} from '@/products/mcp-apps/server/domain-adapters/erp/erpTypes'
import {
  readConnectedPostgresResource,
  type ConnectedPostgresResourceConfig,
} from '@/products/mcp-apps/server/domain-adapters/shared/connectedPostgresReader'

export function createPostgresErpAdapter(
  provider: string,
  configs: readonly ConnectedPostgresResourceConfig<ConnectedErpResource>[],
): ErpAdapter {
  const configByResource = new Map(configs.map((config) => [config.resource, config] as const))

  function supports(resource: ConnectedErpResource, action: ConnectedErpAction) {
    return (action === 'listar' || action === 'ler') && configByResource.has(resource)
  }

  return {
    provider,
    supports,
    async list(input) {
      return readConnectedPostgresResource('listar', input, configByResource.get(input.resource)!)
    },
    async read(input) {
      return readConnectedPostgresResource('ler', input, configByResource.get(input.resource)!)
    },
  }
}

export function makeErpConfigs(
  providerResources: Partial<Record<ConnectedErpResource, string>>,
): ConnectedPostgresResourceConfig<ConnectedErpResource>[] {
  const base: Omit<ConnectedPostgresResourceConfig<ConnectedErpResource>, 'providerResource'>[] = [
    {
      resource: 'clientes',
      table: 'entidades.clientes',
      orderBy: 't.nome_fantasia ASC NULLS LAST, t.id ASC',
    },
    {
      resource: 'fornecedores',
      table: 'entidades.fornecedores',
      orderBy: 't.nome_fantasia ASC NULLS LAST, t.id ASC',
    },
    {
      resource: 'contas-a-receber',
      table: 'financeiro.contas_receber',
      dateColumn: 'data_vencimento',
      statusColumn: 'status',
      orderBy: 't.data_vencimento ASC NULLS LAST, t.id DESC',
    },
    {
      resource: 'contas-a-pagar',
      table: 'financeiro.contas_pagar',
      dateColumn: 'data_vencimento',
      statusColumn: 'status',
      orderBy: 't.data_vencimento ASC NULLS LAST, t.id DESC',
    },
    {
      resource: 'pedidos-venda',
      table: 'vendas.pedidos',
      dateColumn: 'data_pedido',
      statusColumn: 'status',
      orderBy: 't.data_pedido DESC NULLS LAST, t.id DESC',
    },
    {
      resource: 'produtos',
      table: 'produtos.produto',
      orderBy: 't.nome ASC NULLS LAST, t.id ASC',
    },
    {
      resource: 'estoque-atual',
      table: 'estoque.estoques_atual',
      orderBy: 't.id DESC',
    },
  ]

  return base
    .map((config) => {
      const providerResource = providerResources[config.resource]
      return providerResource ? { ...config, providerResource } : null
    })
    .filter((config): config is ConnectedPostgresResourceConfig<ConnectedErpResource> => Boolean(config))
}
