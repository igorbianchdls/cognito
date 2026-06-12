import { createOAuthRestCrmConnector } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'
import { PIPEDRIVE_RESOURCES } from '@/products/integracoes/connectors/crm/pipedrive/pipedriveResources'

export const pipedriveConnector = createOAuthRestCrmConnector({
  provider: 'pipedrive',
  defaultBaseUrl: 'https://api.pipedrive.com',
  envBaseUrlKey: 'PIPEDRIVE_API_BASE_URL',
  resources: PIPEDRIVE_RESOURCES,
  testResource: 'contatos',
  rateLimitMs: Number(process.env.INTEGRATIONS_RATE_LIMIT_PIPEDRIVE_MS || 250),
})
