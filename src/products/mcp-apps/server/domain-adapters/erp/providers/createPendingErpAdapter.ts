import type { ErpAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/ErpAdapter'
import type {
  ConnectedErpAction,
  ConnectedErpAdapterResult,
  ConnectedErpResource,
} from '@/products/mcp-apps/server/domain-adapters/erp/erpTypes'
import { DomainAdapterError } from '@/products/mcp-apps/server/domain-adapters/shared/adapterErrors'

export function createPendingErpAdapter(
  provider: string,
  supportedResources: readonly ConnectedErpResource[],
): ErpAdapter {
  function supports(resource: ConnectedErpResource, action: ConnectedErpAction) {
    return (action === 'listar' || action === 'ler') && supportedResources.includes(resource)
  }

  async function pending(resource: ConnectedErpResource): Promise<ConnectedErpAdapterResult> {
    throw new DomainAdapterError(
      `Adapter connected_erp para ${provider}/${resource} ainda nao implementa leitura de dados.`,
      {
        code: 'connected_erp_adapter_pending',
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
