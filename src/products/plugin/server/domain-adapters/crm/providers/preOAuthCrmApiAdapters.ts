import { getIntegrationProviderPluginCapabilities } from '@/products/integracoes/shared/providers/pluginProviderCapabilities'
import type { CrmApiAdapter } from '@/products/plugin/server/domain-adapters/crm/crmApiAdapterRegistry'
import {
  bitrix24CrmApiAdapter,
  pipedriveCrmApiAdapter,
} from '@/products/plugin/server/domain-adapters/crm/providers/restCrmApiAdapters'
import {
  hubspotCrmApiAdapter,
  rdStationCrmApiAdapter,
} from '@/products/plugin/server/domain-adapters/crm/providers/hubspotRdCrmApiAdapters'
import { createCredentialPendingApiAdapter } from '@/products/plugin/server/domain-adapters/shared/createCredentialPendingApiAdapter'

function requireCrmCapability(provider: string) {
  const capability = getIntegrationProviderPluginCapabilities(provider)
  if (!capability || capability.domain !== 'crm') {
    throw new Error(`Capabilities MCP CRM nao configuradas para ${provider}`)
  }
  return capability
}

export const salesforceCrmApiAdapter = createCredentialPendingApiAdapter(requireCrmCapability('salesforce')) as CrmApiAdapter
export { bitrix24CrmApiAdapter, pipedriveCrmApiAdapter }
export { hubspotCrmApiAdapter, rdStationCrmApiAdapter }
