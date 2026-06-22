import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeAnalyticsRows } from '@/products/integracoes/datawarehouse/normalization/providers/analyticsNormalizerUtils'

export const googleMyBusinessNormalizer: Normalizer = {
  provider: 'google_my_business',
  normalize: normalizeAnalyticsRows,
}
