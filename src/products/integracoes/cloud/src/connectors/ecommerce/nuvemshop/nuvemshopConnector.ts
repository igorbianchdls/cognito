import { createPaginatedEcommerceConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/common/paginatedEcommerceConnector'
import { NUVEMSHOP_RESOURCES } from '@/products/integracoes/cloud/src/connectors/ecommerce/nuvemshop/nuvemshopResources'

export const nuvemshopConnector = createPaginatedEcommerceConnector({
  provider: 'nuvemshop',
  defaultBaseUrl: 'https://api.tiendanube.com/v1',
  envBaseUrlKey: 'NUVEMSHOP_API_BASE_URL',
  resources: NUVEMSHOP_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.NUVEMSHOP_RATE_LIMIT_MS || 250),
  authMode: 'bearer',
})
