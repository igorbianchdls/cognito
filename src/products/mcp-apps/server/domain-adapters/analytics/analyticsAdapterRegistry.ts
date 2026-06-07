import type { AnalyticsAdapter } from '@/products/mcp-apps/server/domain-adapters/analytics/analyticsTypes'
import { googleAnalytics4Adapter } from '@/products/mcp-apps/server/domain-adapters/analytics/providers/googleAnalytics4Adapter'
import { googleMyBusinessAdapter } from '@/products/mcp-apps/server/domain-adapters/analytics/providers/googleMyBusinessAdapter'
import { googleSearchConsoleAdapter } from '@/products/mcp-apps/server/domain-adapters/analytics/providers/googleSearchConsoleAdapter'

const ANALYTICS_ADAPTERS = new Map<string, AnalyticsAdapter>(
  [googleAnalytics4Adapter, googleMyBusinessAdapter, googleSearchConsoleAdapter]
    .map((adapter) => [adapter.provider, adapter] as const),
)

export function getAnalyticsAdapter(provider: string) {
  return ANALYTICS_ADAPTERS.get(provider)
}

export function listAnalyticsAdapterProviders() {
  return [...ANALYTICS_ADAPTERS.keys()]
}
