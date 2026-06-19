import type { ConnectedErpProviderAction, ConnectedErpResource } from '@/products/plugin/server/domain-adapters/erp/erpTypes'
import { blingErpApiAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/blingErpApiAdapter'
import { contaAzulErpApiAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/contaAzulErpApiAdapter'
import { omieErpApiAdapter } from '@/products/plugin/server/domain-adapters/erp/providers/omieErpApiAdapter'
import type { ConnectedProviderApiAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

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
