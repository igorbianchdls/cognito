import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizePaidMediaRows } from '@/products/integracoes/datawarehouse/normalization/providers/paidMediaNormalizerUtils'

export const metaAdsNormalizer: Normalizer = {
  provider: 'meta_ads',
  normalize: normalizePaidMediaRows,
}
