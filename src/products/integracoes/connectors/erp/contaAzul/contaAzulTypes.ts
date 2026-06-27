import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'

export type ContaAzulCredentials = {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
  tokenType?: string
  scope?: string
}

export type ContaAzulResourceConfig = {
  resource: string
  path: string
  method?: 'GET' | 'POST'
  responseMode?: 'paginated' | 'single'
  paginationMode?: 'paged' | 'none'
  itemKeys: string[]
  defaultPageSize: number
  minPageSize?: number
  supportsIncremental?: boolean
  transformItems?: (items: Record<string, unknown>[]) => Record<string, unknown>[]
  derivedFrom?: {
    resource: string
    path: string
    idKeys: string[]
    responseMode?: 'paginated' | 'single'
    itemKeys?: string[]
  }
  buildQuery?: (input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, string | number | boolean>
  buildBody?: (input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, unknown>
}

export type ContaAzulPagePayload =
  | Record<string, unknown>
  | Record<string, unknown>[]

export type ContaAzulPageResult = {
  page: number
  pageSize: number
  items: Record<string, unknown>[]
  payload: ContaAzulPagePayload
  totalPages?: number
  totalRecords?: number
  hasMore: boolean
  truncated: boolean
}

export type ContaAzulMappedBatch = {
  resource: string
  rows: ConnectorRow[]
  nextCursor?: Record<string, unknown>
}
