import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'
import type { ConnectedProviderApiAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedProviderApiAdapter'

export const ANALYTICS_RESOURCES = [
  'propriedades',
  'paginas',
  'landing-pages',
  'eventos',
  'conversoes',
  'canais',
  'consultas',
  'perfil-negocio',
  'reviews',
  'posts-locais',
] as const

export type AnalyticsResource = (typeof ANALYTICS_RESOURCES)[number]
export type AnalyticsAdapter = GenericConnectedAdapter<AnalyticsResource>
export type AnalyticsApiAdapter = ConnectedProviderApiAdapter<AnalyticsResource, never>
