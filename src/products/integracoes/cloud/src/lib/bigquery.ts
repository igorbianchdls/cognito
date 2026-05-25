export type BigQueryWriteInput = {
  dataset: string
  table: string
  rows: Record<string, unknown>[]
}

export async function writeRowsToBigQuery(_input: BigQueryWriteInput): Promise<{ ok: boolean; mode: 'stub' }> {
  return { ok: true, mode: 'stub' }
}
