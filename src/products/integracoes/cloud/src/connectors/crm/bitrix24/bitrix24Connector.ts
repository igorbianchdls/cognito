import { createOAuthRestCrmConnector } from '@/products/integracoes/cloud/src/connectors/crm/common/oauthRestCrmConnector'
import { BITRIX24_RESOURCES } from '@/products/integracoes/cloud/src/connectors/crm/bitrix24/bitrix24Resources'

export const bitrix24Connector = createOAuthRestCrmConnector({
  provider: 'bitrix24',
  defaultBaseUrl: 'https://example.bitrix24.com',
  envBaseUrlKey: 'BITRIX24_API_BASE_URL',
  resources: BITRIX24_RESOURCES,
  testResource: 'contatos',
  rateLimitMs: Number(process.env.INTEGRATIONS_RATE_LIMIT_BITRIX24_MS || 300),
  authPlacement: 'query_auth',
})
