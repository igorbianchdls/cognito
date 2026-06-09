import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'

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
