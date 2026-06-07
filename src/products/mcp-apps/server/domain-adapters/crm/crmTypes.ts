import type {
  ConnectedDomainAction,
  ConnectedDomainAdapterInput,
  ConnectedDomainAdapterReadInput,
  ConnectedDomainAdapterResult,
} from '@/products/mcp-apps/server/domain-adapters/shared/adapterTypes'

export const CONNECTED_CRM_RESOURCES = [
  'contas',
  'contatos',
  'leads',
  'oportunidades',
  'atividades',
] as const

export type ConnectedCrmResource = (typeof CONNECTED_CRM_RESOURCES)[number]
export type ConnectedCrmAction = ConnectedDomainAction

export type ConnectedCrmToolInput = {
  action?: unknown
  resource?: unknown
  provider?: unknown
  params?: unknown
  filters?: unknown
  id?: unknown
  limit?: unknown
  include_provider_fields?: unknown
}

export type ConnectedCrmAdapterListInput = ConnectedDomainAdapterInput<ConnectedCrmResource>
export type ConnectedCrmAdapterReadInput = ConnectedDomainAdapterReadInput<ConnectedCrmResource>
export type ConnectedCrmAdapterResult = ConnectedDomainAdapterResult
