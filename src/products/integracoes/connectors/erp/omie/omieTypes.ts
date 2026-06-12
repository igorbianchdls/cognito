import type { ConnectorRow } from '@/products/integracoes/connectors/base/ConnectorResult'

export type OmieCredentials = {
  app_key: string
  app_secret: string
}

export type OmieRequestPayload = {
  call: string
  app_key: string
  app_secret: string
  param: Array<Record<string, unknown>>
}

export type OmiePagePayload = Record<string, unknown> & {
  pagina?: number
  total_de_paginas?: number
  registros?: number
  total_de_registros?: number
  nPagina?: number
  nTotPaginas?: number
  nRegistros?: number
  nTotRegistros?: number
}

export type OmieResourceConfig = {
  resource: string
  endpoint: string
  call: string
  itemKeys: string[]
  defaultPageSize: number
  supportsIncremental?: boolean
  buildParams?: (input: {
    page: number
    pageSize: number
    cursor?: Record<string, unknown>
  }) => Record<string, unknown>
}

export type OmiePageResult = {
  page: number
  pageSize: number
  items: Record<string, unknown>[]
  payload: OmiePagePayload
  totalPages?: number
  totalRecords?: number
  hasMore: boolean
  truncated: boolean
}

export type OmieMappedBatch = {
  resource: string
  rows: ConnectorRow[]
  nextCursor?: Record<string, unknown>
}
