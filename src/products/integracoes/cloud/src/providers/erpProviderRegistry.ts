import { blingConnector } from '@/products/integracoes/cloud/src/connectors/erp/blingConnector'
import { contaAzulConnector } from '@/products/integracoes/cloud/src/connectors/erp/contaAzulConnector'
import { linxConnector } from '@/products/integracoes/cloud/src/connectors/erp/linxConnector'
import { omieConnector } from '@/products/integracoes/cloud/src/connectors/erp/omieConnector'
import { tinyConnector } from '@/products/integracoes/cloud/src/connectors/erp/tinyConnector'
import { totvsConnector } from '@/products/integracoes/cloud/src/connectors/erp/totvsConnector'

export const ERP_CONNECTORS = [
  contaAzulConnector,
  omieConnector,
  blingConnector,
  tinyConnector,
  linxConnector,
  totvsConnector,
]
