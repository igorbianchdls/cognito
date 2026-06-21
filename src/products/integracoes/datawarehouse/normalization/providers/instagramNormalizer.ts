import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeSocialRows } from '@/products/integracoes/datawarehouse/normalization/providers/socialNormalizerUtils'

export const instagramNormalizer: Normalizer = {
  provider: 'instagram',
  normalize: normalizeSocialRows,
}
