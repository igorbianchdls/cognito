import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'
import type { ConnectedProviderApiAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

export const ECOMMERCE_CONNECTED_RESOURCES = [
  'lojas',
  'pedidos',
  'itens-pedido',
  'produtos',
  'variantes',
  'clientes',
  'pagamentos',
  'reembolsos',
  'frete',
  'estoque',
  'categorias',
  'cupons',
  'carrinhos-abandonados',
] as const

export type EcommerceConnectedResource = (typeof ECOMMERCE_CONNECTED_RESOURCES)[number]
export type EcommerceConnectedAdapter = GenericConnectedAdapter<EcommerceConnectedResource>
export type EcommerceConnectedAction = 'listar' | 'ler' | 'listar_live' | 'ler_live'
export type EcommerceConnectedProviderAction = 'criar' | 'atualizar' | 'cancelar' | 'deletar' | 'alterar_status'
export type EcommerceConnectedApiAdapter = ConnectedProviderApiAdapter<EcommerceConnectedResource, EcommerceConnectedProviderAction>
