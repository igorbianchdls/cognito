import { blingConnector } from '@/products/integracoes/connectors/erp/blingConnector'
import { contaAzulConnector } from '@/products/integracoes/connectors/erp/contaAzulConnector'
import { omieConnector } from '@/products/integracoes/connectors/erp/omieConnector'

export const ERP_CONNECTORS = [
  contaAzulConnector,
  omieConnector,
  blingConnector,
]
