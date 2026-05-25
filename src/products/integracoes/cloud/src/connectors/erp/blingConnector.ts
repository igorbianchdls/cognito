import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const blingConnector = createStubConnector({
  domain: 'erp',
  provider: 'bling',
})
