import type { GenericConnectedAdapter } from '@/products/mcp-apps/server/domain-adapters/shared/connectedDomainService'

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
