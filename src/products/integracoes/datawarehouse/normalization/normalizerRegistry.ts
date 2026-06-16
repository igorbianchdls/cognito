import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { blingNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/blingNormalizer'
import { contaAzulNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/contaAzulNormalizer'
import { omieNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/omieNormalizer'

const normalizers = new Map<string, Normalizer>(
  [contaAzulNormalizer, omieNormalizer, blingNormalizer].map((normalizer) => [normalizer.provider, normalizer] as const),
)

export function getNormalizer(provider: string): Normalizer | undefined {
  return normalizers.get(provider)
}

export function listNormalizerProviders(): string[] {
  return [...normalizers.keys()]
}
