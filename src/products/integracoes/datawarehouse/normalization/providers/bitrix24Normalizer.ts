import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeCrmRows } from '@/products/integracoes/datawarehouse/normalization/providers/crmNormalizerUtils'

export const bitrix24Normalizer: Normalizer = {
  provider: 'bitrix24',
  normalize: normalizeCrmRows,
}
