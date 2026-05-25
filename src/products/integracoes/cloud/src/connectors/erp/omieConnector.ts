import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const omieConnector = createStubConnector({
  domain: 'erp',
  provider: 'omie',
})
