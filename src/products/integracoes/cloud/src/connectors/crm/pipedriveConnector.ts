import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const pipedriveConnector = createStubConnector({
  domain: 'crm',
  provider: 'pipedrive',
})
