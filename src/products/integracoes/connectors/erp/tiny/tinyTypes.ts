import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'

export type TinyCredentials = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}

export type TinyResourceConfig = {
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

export type TinyPagePayload =
  | Record<string, unknown>
  | Record<string, unknown>[]

export type TinyPageResult = {
  page: number
  pageSize: number
  items: Record<string, unknown>[]
  payload: TinyPagePayload
  totalPages?: number
  totalRecords?: number
  hasMore: boolean
  truncated: boolean
}

export type TinyMappedBatch = {
  resource: string
  rows: ConnectorRow[]
  nextCursor?: Record<string, unknown>
}
