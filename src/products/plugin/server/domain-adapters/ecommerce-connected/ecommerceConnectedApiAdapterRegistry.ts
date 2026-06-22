import {
  lojaIntegradaEcommerceConnectedApiAdapter,
  nuvemshopEcommerceConnectedApiAdapter,
  shopifyEcommerceConnectedApiAdapter,
} from '@/products/plugin/server/domain-adapters/ecommerce-connected/providers/ecommerceConnectedApiAdapters'
import type { EcommerceConnectedApiAdapter } from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'

const ECOMMERCE_CONNECTED_API_ADAPTERS = new Map<string, EcommerceConnectedApiAdapter>(
  [
    shopifyEcommerceConnectedApiAdapter,
    nuvemshopEcommerceConnectedApiAdapter,
    lojaIntegradaEcommerceConnectedApiAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getEcommerceConnectedApiAdapter(provider: string) {
  return ECOMMERCE_CONNECTED_API_ADAPTERS.get(provider)
}

export function listEcommerceConnectedApiAdapterProviders() {
  return [...ECOMMERCE_CONNECTED_API_ADAPTERS.keys()]
}
