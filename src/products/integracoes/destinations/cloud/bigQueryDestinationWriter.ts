import { writeRowsToBigQuery } from '@/products/integracoes/datawarehouse/bigquery/bigquery'
import type {
  DestinationWriteInput,
  DestinationWriteOutput,
  DestinationWriter,
} from '@/products/integracoes/destinations/cloud/DestinationWriter'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export const bigQueryDestinationWriter: DestinationWriter = {
  type: 'bigquery',
  async writeRows(input: DestinationWriteInput): Promise<DestinationWriteOutput> {
    const write = await writeRowsToBigQuery({
      dataset: asString(input.destination.config.rawDataset),
      tenantId: input.tenantId,
      connectionId: input.connectionId,
      provider: input.provider,
      resource: input.resource,
      runId: input.runId,
      table: input.table,
      rows: input.rows,
    })

    return {
      ok: write.ok,
      mode: write.mode,
      destinationType: input.destination.type,
      insertedRows: write.insertedRows,
      metadata: {
        dataset: write.dataset,
        table: write.table,
        pipelineId: input.pipelineId || null,
        destinationId: input.destination.id,
      },
    }
  },
}
