export type ConnectorResultStatus = 'success' | 'warning' | 'error'

export type ConnectorRow = Record<string, unknown> & {
  external_id?: string | number | null
  id?: string | number | null
}

export type ConnectorRowBatch = {
  resource: string
  rows: ConnectorRow[]
  nextCursor?: Record<string, unknown>
}

export type ConnectorResult = {
  status: ConnectorResultStatus
  recordsIn: number
  recordsUpdated: number
  recordsFailed: number
  rows?: ConnectorRow[]
  batches?: ConnectorRowBatch[]
  nextCursor?: Record<string, unknown>
  errorMessage?: string
  metadata?: Record<string, unknown>
}
