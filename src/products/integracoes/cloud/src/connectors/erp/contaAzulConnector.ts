import { createStubConnector } from '@/products/integracoes/cloud/src/connectors/stubConnector'

export const contaAzulConnector = createStubConnector({
  domain: 'erp',
  provider: 'conta_azul',
})
