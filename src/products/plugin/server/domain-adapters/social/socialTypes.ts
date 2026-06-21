import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'
import type { ConnectedProviderApiAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

export const SOCIAL_RESOURCES = [
  'perfis',
  'posts',
  'videos',
  'comentarios',
  'audiencia',
  'desempenho-diario',
  'engajamento',
] as const

export type SocialResource = (typeof SOCIAL_RESOURCES)[number]
export type SocialAdapter = GenericConnectedAdapter<SocialResource>
export type SocialApiAdapter = ConnectedProviderApiAdapter<SocialResource, never>
