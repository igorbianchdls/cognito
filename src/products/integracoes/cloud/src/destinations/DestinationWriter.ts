import type { CloudIntegrationDestination } from '@/products/integracoes/cloud/src/lib/postgresStatus'

export type DestinationWriteInput = {
  tenantId: number
  connectionId: string
  pipelineId?: string | null
  destination: CloudIntegrationDestination
  provider: string
  resource: string
  runId?: string | null
  table: string
  rows: Record<string, unknown>[]
}

export type DestinationWriteOutput = {
  ok: boolean
  mode: string
  destinationType: string
  insertedRows: number
  metadata?: Record<string, unknown>
}

export type DestinationWriter = {
  type: string
  writeRows: (input: DestinationWriteInput) => Promise<DestinationWriteOutput>
}
