import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'
import type { ConnectedProviderApiAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

export const PAID_MEDIA_RESOURCES = [
  'contas',
  'campanhas',
  'grupos',
  'anuncios',
  'criativos',
  'keywords',
  'desempenho-diario',
  'conversoes',
] as const

export type PaidMediaResource = (typeof PAID_MEDIA_RESOURCES)[number]
export type PaidMediaAdapter = GenericConnectedAdapter<PaidMediaResource>
export type PaidMediaApiAdapter = ConnectedProviderApiAdapter<PaidMediaResource, never>
