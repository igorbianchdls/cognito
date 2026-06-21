import type { Normalizer } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { bitrix24Normalizer } from '@/products/integracoes/datawarehouse/normalization/providers/bitrix24Normalizer'
import { blingNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/blingNormalizer'
import { contaAzulNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/contaAzulNormalizer'
import { hubspotNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/hubspotNormalizer'
import { instagramNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/instagramNormalizer'
import { linkedinNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/linkedinNormalizer'
import { olistErpNormalizer, tinyNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/olistErpNormalizer'
import { omieNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/omieNormalizer'
import { pipedriveNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/pipedriveNormalizer'
import { rdStationCrmNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/rdStationCrmNormalizer'
import { tiktokNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/tiktokNormalizer'
import { youtubeNormalizer } from '@/products/integracoes/datawarehouse/normalization/providers/youtubeNormalizer'

const normalizers = new Map<string, Normalizer>(
  [
    contaAzulNormalizer,
    omieNormalizer,
    blingNormalizer,
    olistErpNormalizer,
    tinyNormalizer,
    hubspotNormalizer,
    rdStationCrmNormalizer,
    bitrix24Normalizer,
    pipedriveNormalizer,
    instagramNormalizer,
    youtubeNormalizer,
    linkedinNormalizer,
    tiktokNormalizer,
  ].map((normalizer) => [normalizer.provider, normalizer] as const),
)

export function getNormalizer(provider: string): Normalizer | undefined {
  return normalizers.get(provider)
}

export function listNormalizerProviders(): string[] {
  return [...normalizers.keys()]
}
