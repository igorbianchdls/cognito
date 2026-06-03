import type { ConnectorRow } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'

export type BlingCredentials = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}

export type BlingResourceConfig = {
  resource: string
  path: string
  itemKeys: string[]
  defaultPageSize: number
  supportsIncremental?: boolean
  buildQuery?: (input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, string | number | boolean>
}

export type BlingPagePayload =
  | Record<string, unknown>
  | Record<string, unknown>[]

export type BlingPageResult = {
  page: number
  pageSize: number
  items: Record<string, unknown>[]
  payload: BlingPagePayload
  totalPages?: number
  totalRecords?: number
  hasMore: boolean
  truncated: boolean
}

export type BlingMappedBatch = {
  resource: string
  rows: ConnectorRow[]
  nextCursor?: Record<string, unknown>
}
