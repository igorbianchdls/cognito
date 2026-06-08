import type { ConnectedCrmProviderAction, ConnectedCrmResource } from '@/products/mcp-apps/server/domain-adapters/crm/crmTypes'
import {
  bitrix24CrmApiAdapter,
  hubspotCrmApiAdapter,
  pipedriveCrmApiAdapter,
  rdStationCrmApiAdapter,
  salesforceCrmApiAdapter,
} from '@/products/mcp-apps/server/domain-adapters/crm/providers/preOAuthCrmApiAdapters'
import type { ConnectedProviderApiAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/connectedProviderApiAdapter'

export type CrmApiAdapter = ConnectedProviderApiAdapter<ConnectedCrmResource, ConnectedCrmProviderAction>

const CRM_API_ADAPTERS = new Map<string, CrmApiAdapter>(
  [
    bitrix24CrmApiAdapter,
    hubspotCrmApiAdapter,
    pipedriveCrmApiAdapter,
    salesforceCrmApiAdapter,
    rdStationCrmApiAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getCrmApiAdapter(provider: string) {
  return CRM_API_ADAPTERS.get(provider)
}

export function listCrmApiAdapterProviders() {
  return [...CRM_API_ADAPTERS.keys()]
}
