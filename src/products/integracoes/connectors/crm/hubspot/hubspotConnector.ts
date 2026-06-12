import { createOAuthRestCrmConnector } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'
import { HUBSPOT_RESOURCES } from '@/products/integracoes/connectors/crm/hubspot/hubspotResources'

export const hubspotConnector = createOAuthRestCrmConnector({
  provider: 'hubspot',
  defaultBaseUrl: 'https://api.hubapi.com',
  envBaseUrlKey: 'HUBSPOT_API_BASE_URL',
  resources: HUBSPOT_RESOURCES,
  testResource: 'contatos',
  rateLimitMs: Number(process.env.INTEGRATIONS_RATE_LIMIT_HUBSPOT_MS || 150),
})
