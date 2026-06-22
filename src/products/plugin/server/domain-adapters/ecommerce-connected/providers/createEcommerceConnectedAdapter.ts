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
    table: 'ecommerce_stores',
    datasetKind: 'normalized',
  },
  {
    resource: 'pedidos',
    providerResource: 'orders',
    table: 'ecommerce_orders',
    datasetKind: 'normalized',
    dateField: 'data_pedido',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'itens-pedido',
    providerResource: 'order_items',
    table: 'ecommerce_order_items',
    datasetKind: 'normalized',
  },
  {
    resource: 'produtos',
    providerResource: 'products',
    table: 'ecommerce_products',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'variantes',
    providerResource: 'variants',
    table: 'ecommerce_variants',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'clientes',
    providerResource: 'customers',
    table: 'ecommerce_customers',
    datasetKind: 'normalized',
  },
  {
    resource: 'pagamentos',
    providerResource: 'payments',
    table: 'ecommerce_payments',
    datasetKind: 'normalized',
    dateField: 'data_pagamento',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'reembolsos',
    providerResource: 'refunds',
    table: 'ecommerce_refunds',
    datasetKind: 'normalized',
    dateField: 'data_reembolso',
    statusField: 'status',
    orderBy: 'date_field',
  },
  {
    resource: 'frete',
    providerResource: 'shipping',
    table: 'ecommerce_shipping',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'estoque',
    providerResource: 'inventory',
    table: 'ecommerce_inventory',
    datasetKind: 'normalized',
  },
  {
    resource: 'categorias',
    providerResource: 'categories',
    table: 'ecommerce_categories',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'cupons',
    providerResource: 'coupons',
    table: 'ecommerce_coupons',
    datasetKind: 'normalized',
    statusField: 'status',
  },
  {
    resource: 'carrinhos-abandonados',
    providerResource: 'abandoned_checkouts',
    table: 'ecommerce_abandoned_checkouts',
    datasetKind: 'normalized',
    dateField: 'data_abandono',
    statusField: 'status',
    orderBy: 'date_field',
  },
]

export function createEcommerceConnectedAdapter(provider: string): EcommerceConnectedAdapter {
  const unsupportedByProvider: Record<string, EcommerceConnectedResource[]> = {
    loja_integrada: ['reembolsos', 'cupons', 'carrinhos-abandonados'],
  }
  const unsupported = new Set(unsupportedByProvider[provider] || [])
  return createBigQueryAdapter(provider, ECOMMERCE_CONNECTED_CONFIGS.filter((config) => !unsupported.has(config.resource)))
}
