import { createPaginatedEcommerceConnector } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { EDUZZ_RESOURCES } from '@/products/integracoes/connectors/ecommerce/eduzz/eduzzResources'

export const eduzzConnector = createPaginatedEcommerceConnector({
  provider: 'eduzz',
  defaultBaseUrl: 'https://api.eduzz.com',
  envBaseUrlKey: 'EDUZZ_API_BASE_URL',
  resources: EDUZZ_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.EDUZZ_RATE_LIMIT_MS || 250),
  authMode: 'api_key_header',
  apiKeyHeader: 'Authorization',
})
