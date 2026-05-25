import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const totvsConnector = createStubConnector({
  domain: 'erp',
  provider: 'totvs',
})
