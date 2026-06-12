import { eduzzConnector } from '@/products/integracoes/connectors/ecommerce/eduzzConnector'
import { hotmartConnector } from '@/products/integracoes/connectors/ecommerce/hotmartConnector'
import { ifoodConnector } from '@/products/integracoes/connectors/ecommerce/ifoodConnector'
import { kiwifyConnector } from '@/products/integracoes/connectors/ecommerce/kiwifyConnector'
import { nuvemshopConnector } from '@/products/integracoes/connectors/ecommerce/nuvemshopConnector'
import { olistConnector } from '@/products/integracoes/connectors/ecommerce/olistConnector'
import { shopifyConnector } from '@/products/integracoes/connectors/ecommerce/shopifyConnector'
import { woocommerceConnector } from '@/products/integracoes/connectors/ecommerce/woocommerceConnector'

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
