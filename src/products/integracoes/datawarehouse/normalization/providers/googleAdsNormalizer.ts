import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizePaidMediaRows } from '@/products/integracoes/datawarehouse/normalization/providers/paidMediaNormalizerUtils'

export const googleAdsNormalizer: Normalizer = {
  provider: 'google_ads',
  normalize: normalizePaidMediaRows,
}
