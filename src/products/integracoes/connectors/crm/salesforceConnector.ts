import { createStubConnector } from '@/products/integracoes/connectors/stubConnector'

export const salesforceConnector = createStubConnector({
  domain: 'crm',
  provider: 'salesforce',
})
