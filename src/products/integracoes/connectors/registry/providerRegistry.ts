import type { Connector } from '@/products/integracoes/connectors/base/Connector'
import { ADVERTISING_CONNECTORS } from '@/products/integracoes/connectors/registry/advertisingProviderRegistry'
import { ANALYTICS_CONNECTORS } from '@/products/integracoes/connectors/registry/analyticsProviderRegistry'
import { CRM_CONNECTORS } from '@/products/integracoes/connectors/registry/crmProviderRegistry'
import { ECOMMERCE_CONNECTORS } from '@/products/integracoes/connectors/registry/ecommerceProviderRegistry'
import { ERP_CONNECTORS } from '@/products/integracoes/connectors/registry/erpProviderRegistry'
import { MARKETING_CONNECTORS } from '@/products/integracoes/connectors/registry/marketingProviderRegistry'
import { SOCIAL_CONNECTORS } from '@/products/integracoes/connectors/registry/socialProviderRegistry'

export const CLOUD_CONNECTORS: Connector[] = [
  ...ERP_CONNECTORS,
  ...CRM_CONNECTORS,
  ...ECOMMERCE_CONNECTORS,
  ...ANALYTICS_CONNECTORS,
  ...SOCIAL_CONNECTORS,
  ...MARKETING_CONNECTORS,
  ...ADVERTISING_CONNECTORS,
]

export function getCloudConnector(provider: string): Connector | undefined {
  return CLOUD_CONNECTORS.find((connector) => connector.provider === provider)
}
