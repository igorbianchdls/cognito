import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeAnalyticsRows } from '@/products/integracoes/datawarehouse/normalization/providers/analyticsNormalizerUtils'

export const googleSearchConsoleNormalizer: Normalizer = {
  provider: 'google_search_console',
  normalize: normalizeAnalyticsRows,
}
