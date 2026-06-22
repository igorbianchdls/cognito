import { lojaIntegradaConnector } from '@/products/integracoes/connectors/ecommerce/lojaIntegradaConnector'
import { nuvemshopConnector } from '@/products/integracoes/connectors/ecommerce/nuvemshopConnector'
import { shopifyConnector } from '@/products/integracoes/connectors/ecommerce/shopifyConnector'

export const ECOMMERCE_CONNECTORS = [
  shopifyConnector,
  nuvemshopConnector,
  lojaIntegradaConnector,
]
