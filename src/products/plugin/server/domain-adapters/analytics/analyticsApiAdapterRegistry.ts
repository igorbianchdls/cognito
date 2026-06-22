import {
  googleAnalytics4ApiAdapter,
  googleMyBusinessApiAdapter,
  googleSearchConsoleApiAdapter,
} from '@/products/plugin/server/domain-adapters/analytics/providers/analyticsApiAdapters'
import type { AnalyticsApiAdapter } from '@/products/plugin/server/domain-adapters/analytics/analyticsTypes'

const ANALYTICS_API_ADAPTERS = new Map<string, AnalyticsApiAdapter>(
  [
    googleAnalytics4ApiAdapter,
    googleMyBusinessApiAdapter,
    googleSearchConsoleApiAdapter,
  ].map((adapter) => [adapter.provider, adapter] as const),
)

export function getAnalyticsApiAdapter(provider: string) {
  return ANALYTICS_API_ADAPTERS.get(provider)
}

export function listAnalyticsApiAdapterProviders() {
  return [...ANALYTICS_API_ADAPTERS.keys()]
}
