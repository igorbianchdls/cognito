import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const salesforceConnector = createStubConnector({
  domain: 'crm',
  provider: 'salesforce',
})
