import { createOAuthRestCrmConnector } from '@/products/integracoes/connectors/crm/common/oauthRestCrmConnector'
import { RD_STATION_RESOURCES } from '@/products/integracoes/connectors/crm/rdStation/rdStationResources'

export const rdStationConnector = createOAuthRestCrmConnector({
  provider: 'rd_station_crm',
  defaultBaseUrl: 'https://crm.rdstation.com',
  envBaseUrlKey: 'RD_STATION_CRM_API_BASE_URL',
  resources: RD_STATION_RESOURCES,
  testResource: 'contatos',
  rateLimitMs: Number(process.env.INTEGRATIONS_RATE_LIMIT_RD_STATION_CRM_MS || 300),
})
