import type { ConnectorRow } from '@/products/integracoes/cloud/src/connectors/base/ConnectorResult'

export type LinxCredentials = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}

export type LinxResourceConfig = {
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

export type LinxPagePayload =
  | Record<string, unknown>
  | Record<string, unknown>[]

export type LinxPageResult = {
  page: number
  pageSize: number
  items: Record<string, unknown>[]
  payload: LinxPagePayload
  totalPages?: number
  totalRecords?: number
  hasMore: boolean
  truncated: boolean
}

export type LinxMappedBatch = {
  resource: string
  rows: ConnectorRow[]
  nextCursor?: Record<string, unknown>
}
