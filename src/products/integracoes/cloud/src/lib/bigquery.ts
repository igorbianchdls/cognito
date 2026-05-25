import { getIntegrationsCloudConfig } from '@/products/integracoes/cloud/src/config/gcpConfig'

export type BigQueryWriteInput = {
  dataset?: string
  table: string
  rows: Record<string, unknown>[]
}

export async function writeRowsToBigQuery(_input: BigQueryWriteInput): Promise<{ ok: boolean; mode: 'stub' }> {
  const config = getIntegrationsCloudConfig()
  const dataset = _input.dataset || config.bigQuery.customRawDataset
  void dataset

  return { ok: true, mode: 'stub' }
}
