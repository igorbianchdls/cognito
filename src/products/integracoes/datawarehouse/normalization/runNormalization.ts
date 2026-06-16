import type { NormalizationInput, NormalizationResult } from '@/products/integracoes/datawarehouse/normalization/contracts'
import { writeNormalizedRowsToBigQuery, type WriteNormalizedRowsOutput } from '@/products/integracoes/datawarehouse/normalization/bigquery/normalizedWriter'
import { getNormalizer } from '@/products/integracoes/datawarehouse/normalization/normalizerRegistry'

export type RunNormalizationOutput = {
  status: 'normalized' | 'skipped'
  normalization: NormalizationResult
  write: WriteNormalizedRowsOutput | null
}

export async function runNormalization(input: NormalizationInput): Promise<RunNormalizationOutput> {
  const normalizer = getNormalizer(input.provider)
  if (!normalizer) {
    return {
      status: 'skipped',
      normalization: {
        provider: input.provider,
        resource: input.resource,
        status: 'skipped',
        rows: [],
        skippedRows: input.rows.length,
        message: `Provider ${input.provider} nao possui normalizer registrado.`,
      },
      write: null,
    }
  }

  const normalization = normalizer.normalize(input)
  if (!normalization.rows.length) {
    return {
      status: 'skipped',
      normalization,
      write: null,
    }
  }

  const write = await writeNormalizedRowsToBigQuery({
    tenantId: input.tenantId,
    rows: normalization.rows,
  })

  return {
    status: 'normalized',
    normalization,
    write,
  }
}
