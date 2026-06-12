import { createPaginatedEcommerceConnector } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { OLIST_RESOURCES } from '@/products/integracoes/connectors/ecommerce/olist/olistResources'

export const olistConnector = createPaginatedEcommerceConnector({
  provider: 'olist',
  defaultBaseUrl: 'https://api.olist.com',
  envBaseUrlKey: 'OLIST_API_BASE_URL',
  resources: OLIST_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.OLIST_RATE_LIMIT_MS || 250),
  authMode: 'bearer',
})
