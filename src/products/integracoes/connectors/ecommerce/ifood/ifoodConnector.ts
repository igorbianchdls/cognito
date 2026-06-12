import { createPaginatedEcommerceConnector } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { IFOOD_RESOURCES } from '@/products/integracoes/connectors/ecommerce/ifood/ifoodResources'

export const ifoodConnector = createPaginatedEcommerceConnector({
  provider: 'ifood',
  defaultBaseUrl: 'https://merchant-api.ifood.com.br',
  envBaseUrlKey: 'IFOOD_API_BASE_URL',
  resources: IFOOD_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.IFOOD_RATE_LIMIT_MS || 250),
  authMode: 'bearer',
})
