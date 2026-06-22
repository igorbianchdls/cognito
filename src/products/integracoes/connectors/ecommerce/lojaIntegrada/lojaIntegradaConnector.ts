import { createPaginatedEcommerceConnector } from '@/products/integracoes/connectors/ecommerce/common/paginatedEcommerceConnector'
import { LOJA_INTEGRADA_RESOURCES } from '@/products/integracoes/connectors/ecommerce/lojaIntegrada/lojaIntegradaResources'

export const lojaIntegradaConnector = createPaginatedEcommerceConnector({
  provider: 'loja_integrada',
  defaultBaseUrl: 'https://api.awsli.com.br',
  envBaseUrlKey: 'LOJA_INTEGRADA_API_BASE_URL',
  resources: LOJA_INTEGRADA_RESOURCES,
  testResource: 'stores',
  authMode: 'custom',
  rateLimitMs: Number(process.env.INTEGRATIONS_RATE_LIMIT_LOJA_INTEGRADA_MS || 300),
})
