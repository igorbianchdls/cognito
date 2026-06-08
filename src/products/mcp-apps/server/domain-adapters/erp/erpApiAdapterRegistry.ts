import type { ConnectedErpProviderAction, ConnectedErpResource } from '@/products/mcp-apps/server/domain-adapters/erp/erpTypes'
import {
  blingErpApiAdapter,
  contaAzulErpApiAdapter,
  omieErpApiAdapter,
} from '@/products/mcp-apps/server/domain-adapters/erp/providers/preOAuthErpApiAdapters'
import type { ConnectedProviderApiAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/connectedProviderApiAdapter'

export type ErpApiAdapter = ConnectedProviderApiAdapter<ConnectedErpResource, ConnectedErpProviderAction>

const ERP_API_ADAPTERS = new Map<string, ErpApiAdapter>(
  [omieErpApiAdapter, contaAzulErpApiAdapter, blingErpApiAdapter].map((adapter) => [adapter.provider, adapter] as const),
)

export function getErpApiAdapter(provider: string) {
  return ERP_API_ADAPTERS.get(provider)
}

export function listErpApiAdapterProviders() {
  return [...ERP_API_ADAPTERS.keys()]
}
