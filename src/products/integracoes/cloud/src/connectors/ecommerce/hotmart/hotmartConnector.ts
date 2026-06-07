import { createPaginatedEcommerceConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/common/paginatedEcommerceConnector'
import { HOTMART_RESOURCES } from '@/products/integracoes/cloud/src/connectors/ecommerce/hotmart/hotmartResources'

export const hotmartConnector = createPaginatedEcommerceConnector({
  provider: 'hotmart',
  defaultBaseUrl: 'https://developers.hotmart.com',
  envBaseUrlKey: 'HOTMART_API_BASE_URL',
  resources: HOTMART_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.HOTMART_RATE_LIMIT_MS || 250),
  authMode: 'bearer',
})
