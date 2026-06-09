import { createBigQueryAdapter } from '@/products/plugin/server/domain-adapters/shared/createBigQueryAdapter'
import type { ConnectedBigQueryResourceConfig } from '@/products/plugin/server/domain-adapters/shared/connectedBigQueryReader'
import type {
  EcommerceConnectedAdapter,
  EcommerceConnectedResource,
} from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'

const ECOMMERCE_CONNECTED_CONFIGS: ConnectedBigQueryResourceConfig<EcommerceConnectedResource>[] = [
  {
    resource: 'lojas',
    providerResource: 'stores',
  },
  {
    resource: 'pedidos',
    providerResource: 'orders',
    dateField: 'data_pedido',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'itens-pedido',
    providerResource: 'order_items',
  },
  {
    resource: 'produtos',
    providerResource: 'products',
  },
  {
    resource: 'clientes',
    providerResource: 'customers',
  },
  {
    resource: 'pagamentos',
    providerResource: 'payments',
    dateField: 'data_pagamento',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'frete',
    providerResource: 'shipping',
    statusField: 'status',
  },
  {
    resource: 'cupons',
    providerResource: 'coupons',
  },
  {
    resource: 'assinaturas',
    providerResource: 'subscriptions',
    statusField: 'status',
  },
]

export function createEcommerceConnectedAdapter(provider: string): EcommerceConnectedAdapter {
  return createBigQueryAdapter(provider, ECOMMERCE_CONNECTED_CONFIGS)
}
