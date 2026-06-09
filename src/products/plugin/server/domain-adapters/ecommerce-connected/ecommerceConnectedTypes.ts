import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'

export const ECOMMERCE_CONNECTED_RESOURCES = [
  'lojas',
  'pedidos',
  'itens-pedido',
  'produtos',
  'clientes',
  'pagamentos',
  'frete',
  'cupons',
  'assinaturas',
] as const

export type EcommerceConnectedResource = (typeof ECOMMERCE_CONNECTED_RESOURCES)[number]
export type EcommerceConnectedAdapter = GenericConnectedAdapter<EcommerceConnectedResource>
