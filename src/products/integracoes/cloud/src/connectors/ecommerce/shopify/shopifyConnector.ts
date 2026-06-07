import { createPaginatedEcommerceConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/common/paginatedEcommerceConnector'
import { SHOPIFY_RESOURCES } from '@/products/integracoes/cloud/src/connectors/ecommerce/shopify/shopifyResources'

export const shopifyConnector = createPaginatedEcommerceConnector({
  provider: 'shopify',
  defaultBaseUrl: 'https://missing-shop.myshopify.com',
  envBaseUrlKey: 'SHOPIFY_API_BASE_URL',
  resources: SHOPIFY_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.SHOPIFY_RATE_LIMIT_MS || 250),
  authMode: 'api_key_header',
  apiKeyHeader: 'X-Shopify-Access-Token',
})
