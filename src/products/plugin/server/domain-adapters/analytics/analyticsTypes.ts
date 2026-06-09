import type { GenericConnectedAdapter } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'

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
] as const

export type AnalyticsResource = (typeof ANALYTICS_RESOURCES)[number]
export type AnalyticsAdapter = GenericConnectedAdapter<AnalyticsResource>
