import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { normalizeCrmRows } from '@/products/integracoes/datawarehouse/normalization/providers/crmNormalizerUtils'

export const rdStationCrmNormalizer: Normalizer = {
  provider: 'rd_station_crm',
  normalize: normalizeCrmRows,
}
