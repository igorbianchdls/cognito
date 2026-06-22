import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeEcommerceRows } from '@/products/integracoes/datawarehouse/normalization/providers/ecommerceNormalizerUtils'

export const nuvemshopNormalizer: Normalizer = {
  provider: 'nuvemshop',
  normalize: normalizeEcommerceRows,
}
