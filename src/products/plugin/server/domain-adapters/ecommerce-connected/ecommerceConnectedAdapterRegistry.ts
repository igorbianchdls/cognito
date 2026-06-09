import type { EcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'
import { eduzzEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/eduzzEcommerceConnectedAdapter'
import { hotmartEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/hotmartEcommerceConnectedAdapter'
import { ifoodEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/ifoodEcommerceConnectedAdapter'
import { kiwifyEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/kiwifyEcommerceConnectedAdapter'
import { nuvemshopEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/nuvemshopEcommerceConnectedAdapter'
import { olistEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/olistEcommerceConnectedAdapter'
import { shopifyEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/shopifyEcommerceConnectedAdapter'
import { woocommerceEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/woocommerceEcommerceConnectedAdapter'

const ECOMMERCE_CONNECTED_ADAPTERS = new Map<string, EcommerceConnectedAdapter>(
  [
    shopifyEcommerceConnectedAdapter,
    nuvemshopEcommerceConnectedAdapter,
    olistEcommerceConnectedAdapter,
    woocommerceEcommerceConnectedAdapter,
    eduzzEcommerceConnectedAdapter,
    hotmartEcommerceConnectedAdapter,
    kiwifyEcommerceConnectedAdapter,
    ifoodEcommerceConnectedAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getEcommerceConnectedAdapter(provider: string) {
  return ECOMMERCE_CONNECTED_ADAPTERS.get(provider)
}

export function listEcommerceConnectedAdapterProviders() {
  return [...ECOMMERCE_CONNECTED_ADAPTERS.keys()]
}
