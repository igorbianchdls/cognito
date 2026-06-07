import { eduzzConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/eduzzConnector'
import { hotmartConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/hotmartConnector'
import { ifoodConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/ifoodConnector'
import { kiwifyConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/kiwifyConnector'
import { nuvemshopConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/nuvemshopConnector'
import { olistConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/olistConnector'
import { shopifyConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/shopifyConnector'
import { woocommerceConnector } from '@/products/integracoes/cloud/src/connectors/ecommerce/woocommerceConnector'

export const ECOMMERCE_CONNECTORS = [
  shopifyConnector,
  nuvemshopConnector,
  olistConnector,
  woocommerceConnector,
  eduzzConnector,
  hotmartConnector,
  kiwifyConnector,
  ifoodConnector,
]
