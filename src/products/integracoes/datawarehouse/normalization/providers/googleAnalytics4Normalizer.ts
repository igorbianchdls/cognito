import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeAnalyticsRows } from '@/products/integracoes/datawarehouse/normalization/providers/analyticsNormalizerUtils'

export const googleAnalytics4Normalizer: Normalizer = {
  provider: 'google_analytics_4',
  normalize: normalizeAnalyticsRows,
}
