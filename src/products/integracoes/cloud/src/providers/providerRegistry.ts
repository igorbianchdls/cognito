import type { Connector } from '@/products/integracoes/cloud/src/connectors/base/Connector'
import { ADVERTISING_CONNECTORS } from '@/products/integracoes/cloud/src/providers/advertisingProviderRegistry'
import { ANALYTICS_CONNECTORS } from '@/products/integracoes/cloud/src/providers/analyticsProviderRegistry'
import { CRM_CONNECTORS } from '@/products/integracoes/cloud/src/providers/crmProviderRegistry'
import { ECOMMERCE_CONNECTORS } from '@/products/integracoes/cloud/src/providers/ecommerceProviderRegistry'
import { ERP_CONNECTORS } from '@/products/integracoes/cloud/src/providers/erpProviderRegistry'
import { MARKETING_CONNECTORS } from '@/products/integracoes/cloud/src/providers/marketingProviderRegistry'

export const CLOUD_CONNECTORS: Connector[] = [
  ...ERP_CONNECTORS,
  ...CRM_CONNECTORS,
  ...ECOMMERCE_CONNECTORS,
  ...ANALYTICS_CONNECTORS,
  ...MARKETING_CONNECTORS,
  ...ADVERTISING_CONNECTORS,
]

export function getCloudConnector(provider: string): Connector | undefined {
  return CLOUD_CONNECTORS.find((connector) => connector.provider === provider)
}
