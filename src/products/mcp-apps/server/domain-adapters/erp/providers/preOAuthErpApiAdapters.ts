import { getIntegrationProviderMcpCapabilities } from '@/products/integracoes/shared/providers/mcpProviderCapabilities'
import type { ErpApiAdapter } from '@/products/mcp-apps/server/domain-adapters/erp/erpApiAdapterRegistry'
import { createCredentialPendingApiAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createCredentialPendingApiAdapter'

function requireErpCapability(provider: string) {
  const capability = getIntegrationProviderMcpCapabilities(provider)
  if (!capability || capability.domain !== 'erp') {
    throw new Error(`Capabilities MCP ERP nao configuradas para ${provider}`)
  }
  return capability
}

export const omieErpApiAdapter = createCredentialPendingApiAdapter(requireErpCapability('omie')) as ErpApiAdapter
export const contaAzulErpApiAdapter = createCredentialPendingApiAdapter(requireErpCapability('conta_azul')) as ErpApiAdapter
export const blingErpApiAdapter = createCredentialPendingApiAdapter(requireErpCapability('bling')) as ErpApiAdapter
