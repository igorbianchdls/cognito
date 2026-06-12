import { createStubConnector } from '@/products/integracoes/connectors/stubConnector'

export const totvsConnector = createStubConnector({
  domain: 'erp',
  provider: 'totvs',
})
