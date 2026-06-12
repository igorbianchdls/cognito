import { createPaginatedEcommerceConnector } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { KIWIFY_RESOURCES } from '@/products/integracoes/connectors/ecommerce/kiwify/kiwifyResources'

export const kiwifyConnector = createPaginatedEcommerceConnector({
  provider: 'kiwify',
  defaultBaseUrl: 'https://public-api.kiwify.com',
  envBaseUrlKey: 'KIWIFY_API_BASE_URL',
  resources: KIWIFY_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.KIWIFY_RATE_LIMIT_MS || 250),
  authMode: 'bearer',
})
