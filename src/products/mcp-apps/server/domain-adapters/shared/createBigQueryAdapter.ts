import type {
  ConnectedDomainAction,
} from '@/products/mcp-apps/server/domain-adapters/shared/adapterTypes'
import {
  readConnectedBigQueryResource,
  type ConnectedBigQueryResourceConfig,
} from '@/products/mcp-apps/server/domain-adapters/shared/connectedBigQueryReader'
import type { GenericConnectedAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/connectedDomainService'

export function createBigQueryAdapter<Resource extends string>(
  provider: string,
  configs: readonly ConnectedBigQueryResourceConfig<Resource>[],
): GenericConnectedAdapter<Resource> {
  const configByResource = new Map(configs.map((config) => [config.resource, config] as const))

  function supports(resource: Resource, action: ConnectedDomainAction) {
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
