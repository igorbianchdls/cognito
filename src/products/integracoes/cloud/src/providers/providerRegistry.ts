import type { Connector } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import { CRM_CONNECTORS } from '@/products/integracoes/cloud/src/providers/crmProviderRegistry'
import { ERP_CONNECTORS } from '@/products/integracoes/cloud/src/providers/erpProviderRegistry'

export const CLOUD_CONNECTORS: Connector[] = [
  ...ERP_CONNECTORS,
  ...CRM_CONNECTORS,
]

export function getCloudConnector(provider: string): Connector | undefined {
  return CLOUD_CONNECTORS.find((connector) => connector.provider === provider)
}
