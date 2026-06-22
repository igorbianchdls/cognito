import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeEcommerceRows } from '@/products/integracoes/datawarehouse/normalization/providers/ecommerceNormalizerUtils'

export const shopifyNormalizer: Normalizer = {
  provider: 'shopify',
  normalize: normalizeEcommerceRows,
}
