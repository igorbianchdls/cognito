import { createPaginatedEcommerceConnector } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { WOOCOMMERCE_RESOURCES } from '@/products/integracoes/connectors/ecommerce/woocommerce/woocommerceResources'

export const woocommerceConnector = createPaginatedEcommerceConnector({
  provider: 'woocommerce',
  defaultBaseUrl: 'https://missing-woocommerce-store.example',
  envBaseUrlKey: 'WOOCOMMERCE_API_BASE_URL',
  resources: WOOCOMMERCE_RESOURCES,
  testResource: 'stores',
  rateLimitMs: Number(process.env.WOOCOMMERCE_RATE_LIMIT_MS || 250),
  authMode: 'basic',
})
