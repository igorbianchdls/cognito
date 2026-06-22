import type { EcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'
import { lojaIntegradaEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/lojaIntegradaEcommerceConnectedAdapter'
import { nuvemshopEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/nuvemshopEcommerceConnectedAdapter'
import { shopifyEcommerceConnectedAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/shopifyEcommerceConnectedAdapter'

const ECOMMERCE_CONNECTED_ADAPTERS = new Map<string, EcommerceConnectedAdapter>(
  [
    shopifyEcommerceConnectedAdapter,
    nuvemshopEcommerceConnectedAdapter,
    lojaIntegradaEcommerceConnectedAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getEcommerceConnectedAdapter(provider: string) {
  return ECOMMERCE_CONNECTED_ADAPTERS.get(provider)
}

export function listEcommerceConnectedAdapterProviders() {
  return [...ECOMMERCE_CONNECTED_ADAPTERS.keys()]
}
