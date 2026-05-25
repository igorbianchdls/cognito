import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const tinyConnector = createStubConnector({
  domain: 'erp',
  provider: 'tiny',
})
