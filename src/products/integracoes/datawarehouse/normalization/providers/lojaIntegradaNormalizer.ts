import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeEcommerceRows } from '@/products/integracoes/datawarehouse/normalization/providers/ecommerceNormalizerUtils'

export const lojaIntegradaNormalizer: Normalizer = {
  provider: 'loja_integrada',
  normalize: normalizeEcommerceRows,
}
