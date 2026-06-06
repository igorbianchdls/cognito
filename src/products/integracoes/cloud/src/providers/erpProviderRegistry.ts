import { blingConnector } from '@/products/integracoes/cloud/src/connectors/erp/blingConnector'
import { contaAzulConnector } from '@/products/integracoes/cloud/src/connectors/erp/contaAzulConnector'
import { omieConnector } from '@/products/integracoes/cloud/src/connectors/erp/omieConnector'

export const ERP_CONNECTORS = [
  contaAzulConnector,
  omieConnector,
  blingConnector,
]
