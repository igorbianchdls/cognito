import type {
  ConnectedDomainAction,
} from '@/products/plugin/server/domain-adapters/shared/adapterTypes'
import {
  readConnectedPostgresResource,
  type ConnectedPostgresResourceConfig,
} from '@/products/plugin/server/domain-adapters/shared/connectedPostgresReader'
import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'

export function createPostgresAdapter<Resource extends string>(
  provider: string,
  configs: readonly ConnectedPostgresResourceConfig<Resource>[],
): GenericConnectedAdapter<Resource> {
  const configByResource = new Map(configs.map((config) => [config.resource, config] as const))

  function supports(resource: Resource, action: ConnectedDomainAction) {
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
