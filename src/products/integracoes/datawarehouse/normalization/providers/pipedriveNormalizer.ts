import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeCrmRows } from '@/products/integracoes/datawarehouse/normalization/providers/crmNormalizerUtils'

export const pipedriveNormalizer: Normalizer = {
  provider: 'pipedrive',
  normalize: normalizeCrmRows,
}
