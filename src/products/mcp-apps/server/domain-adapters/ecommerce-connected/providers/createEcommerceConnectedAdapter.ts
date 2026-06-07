import { createPostgresAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/createPostgresAdapter'
import type { ConnectedPostgresResourceConfig } from '@/products/mcp-apps/server/domain-adapters/shared/connectedPostgresReader'
import type {
  EcommerceConnectedAdapter,
  EcommerceConnectedResource,
} from '@/products/mcp-apps/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'

const ECOMMERCE_CONNECTED_CONFIGS: ConnectedPostgresResourceConfig<EcommerceConnectedResource>[] = [
  {
    resource: 'lojas',
    providerResource: 'stores',
    table: 'ecommerce.canais_contas',
    orderBy: 't.nome ASC NULLS LAST, t.id ASC',
  },
  {
    resource: 'pedidos',
    providerResource: 'orders',
    table: 'ecommerce.pedidos',
    dateColumn: 'data_pedido',
    statusColumn: 'status',
    orderBy: 't.data_pedido DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'itens-pedido',
    providerResource: 'order_items',
    table: 'ecommerce.pedido_itens',
    orderBy: 't.id DESC',
  },
  {
    resource: 'produtos',
    providerResource: 'products',
    table: 'ecommerce.produtos',
    orderBy: 't.nome ASC NULLS LAST, t.id ASC',
  },
  {
    resource: 'clientes',
    providerResource: 'customers',
    table: 'ecommerce.clientes',
    orderBy: 't.nome ASC NULLS LAST, t.id ASC',
  },
  {
    resource: 'pagamentos',
    providerResource: 'payments',
    table: 'ecommerce.pagamentos',
    dateColumn: 'data_pagamento',
    statusColumn: 'status',
    orderBy: 't.data_pagamento DESC NULLS LAST, t.id DESC',
  },
  {
    resource: 'frete',
    providerResource: 'shipping',
    table: 'ecommerce.envios',
    statusColumn: 'status',
    orderBy: 't.id DESC',
  },
  {
    resource: 'cupons',
    providerResource: 'coupons',
    table: 'ecommerce.cupons',
    orderBy: 't.id DESC',
  },
  {
    resource: 'assinaturas',
    providerResource: 'subscriptions',
    table: 'ecommerce.assinaturas',
    statusColumn: 'status',
    orderBy: 't.id DESC',
  },
]

export function createEcommerceConnectedAdapter(provider: string): EcommerceConnectedAdapter {
  return createPostgresAdapter(provider, ECOMMERCE_CONNECTED_CONFIGS)
}
