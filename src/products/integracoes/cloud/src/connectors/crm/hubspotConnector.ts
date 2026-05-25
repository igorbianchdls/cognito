import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const hubspotConnector = createStubConnector({
  domain: 'crm',
  provider: 'hubspot',
})
