import type {
  ConnectedDomainAction,
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
} from '@/products/mcp-apps/server/domain-adapters/shared/adapterTypes'

export const CONNECTED_ERP_RESOURCES = [
  'clientes',
  'fornecedores',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'produtos',
  'estoque-atual',
] as const

export type ConnectedErpResource = (typeof CONNECTED_ERP_RESOURCES)[number]
export type ConnectedErpAction = ConnectedDomainAction
export type ConnectedErpProviderAction =
  | 'criar'
  | 'atualizar'
  | 'baixar'
  | 'cancelar'
  | 'estornar'
  | 'reabrir'
  | 'alterar_status'

export type ConnectedErpToolInput = {
  action?: unknown
  resource?: unknown
  provider?: unknown
  params?: unknown
  filters?: unknown
  id?: unknown
  limit?: unknown
  include_provider_fields?: unknown
}

export type ConnectedErpAdapterListInput = ConnectedDomainAdapterInput<ConnectedErpResource>
export type ConnectedErpAdapterReadInput = ConnectedDomainAdapterReadInput<ConnectedErpResource>
export type ConnectedErpAdapterResult = ConnectedDomainAdapterResult
