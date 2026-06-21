import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeCrmRows } from '@/products/integracoes/datawarehouse/normalization/providers/crmNormalizerUtils'

export const hubspotNormalizer: Normalizer = {
  provider: 'hubspot',
  normalize: normalizeCrmRows,
}
