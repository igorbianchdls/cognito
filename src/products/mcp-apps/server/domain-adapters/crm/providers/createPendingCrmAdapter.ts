import type { CrmAdapter } from '@/products/mcp-apps/server/domain-adapters/crm/CrmAdapter'
import type {
  ConnectedCrmAction,
  ConnectedCrmResource,
} from '@/products/mcp-apps/server/domain-adapters/crm/crmTypes'
import { DomainAdapterError } from '@/products/mcp-apps/server/domain-adapters/shared/adapterErrors'

export function createPendingCrmAdapter(
  provider: string,
  supportedResources: readonly ConnectedCrmResource[],
): CrmAdapter {
  function supports(resource: ConnectedCrmResource, action: ConnectedCrmAction) {
    return (action === 'listar' || action === 'ler') && supportedResources.includes(resource)
  }

  async function pending(resource: ConnectedCrmResource) {
    throw new DomainAdapterError(
      `Adapter connected_crm para ${provider}/${resource} ainda nao implementa leitura de dados.`,
      {
        code: 'connected_crm_adapter_pending',
        details: { provider, resource },
      },
    )
  }

  return {
    provider,
    supports,
    async list(input) {
      return pending(input.resource)
    },
    async read(input) {
      return pending(input.resource)
    },
  }
}
