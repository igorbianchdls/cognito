import { getIntegrationProviderPluginCapabilities } from '@/products/integracoes/shared/providers/pluginProviderCapabilities'
import type { CrmApiAdapter } from '@/products/plugin/server/domain-adapters/crm/crmApiAdapterRegistry'
import { createCredentialPendingApiAdapter } from '@/products/plugin/server/domain-adapters/shared/createCredentialPendingApiAdapter'

function requireCrmCapability(provider: string) {
  const capability = getIntegrationProviderPluginCapabilities(provider)
  if (!capability || capability.domain !== 'crm') {
    throw new Error(`Capabilities MCP CRM nao configuradas para ${provider}`)
  }
  return capability
}

export const bitrix24CrmApiAdapter = createCredentialPendingApiAdapter(requireCrmCapability('bitrix24')) as CrmApiAdapter
export const hubspotCrmApiAdapter = createCredentialPendingApiAdapter(requireCrmCapability('hubspot')) as CrmApiAdapter
export const pipedriveCrmApiAdapter = createCredentialPendingApiAdapter(requireCrmCapability('pipedrive')) as CrmApiAdapter
export const salesforceCrmApiAdapter = createCredentialPendingApiAdapter(requireCrmCapability('salesforce')) as CrmApiAdapter
export const rdStationCrmApiAdapter = createCredentialPendingApiAdapter(requireCrmCapability('rd_station_crm')) as CrmApiAdapter
