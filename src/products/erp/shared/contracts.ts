import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export type ErpEntityListRequest = {
  entityId: string
  query?: string
  filters?: Record<string, string>
  page?: number
  pageSize?: number
}

export type ErpEntityListResponse<TRecord extends ErpEntityRecord = ErpEntityRecord> = {
  records: TRecord[]
  total: number
  page: number
  pageSize: number
}

export type ErpEntityCreateRequest = {
  entityId: string
  values: Record<string, unknown>
}

export type ErpEntityCreateResponse<TRecord extends ErpEntityRecord = ErpEntityRecord> = {
  record: TRecord
}

export type ErpEntityUpdateRequest = {
  values: Record<string, unknown>
  expectedVersion: number
}

export type ErpEntityActionRequest = {
  actionId: string
  recordId: string
  values?: Record<string, unknown>
}

export type ErpEntityActionResponse = {
  result: unknown
}

export type ErpClient = {
  listEntityRecords: <TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request?: ErpEntityListRequest,
  ) => Promise<ErpEntityListResponse<TRecord>>
  createEntityRecord: <TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request: ErpEntityCreateRequest,
  ) => Promise<ErpEntityCreateResponse<TRecord>>
  getEntityRecord: <TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string) => Promise<ErpEntityCreateResponse<TRecord>>
  updateEntityRecord: <TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string, request: ErpEntityUpdateRequest) => Promise<ErpEntityCreateResponse<TRecord>>
  deactivateEntityRecord: <TRecord extends ErpEntityRecord>(config: ErpEntityConfig<TRecord>, id: string, expectedVersion: number) => Promise<ErpEntityCreateResponse<TRecord>>
  runEntityAction: (
    config: ErpEntityConfig,
    request: ErpEntityActionRequest,
  ) => Promise<ErpEntityActionResponse>
}
