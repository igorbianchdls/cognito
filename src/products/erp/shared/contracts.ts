import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export type ErpEntityListRequest = {
  entityId: string
  query?: string
  filters?: Record<string, string>
}

export type ErpEntityListResponse<TRecord extends ErpEntityRecord = ErpEntityRecord> = {
  records: TRecord[]
  total: number
}

export type ErpClient = {
  listEntityRecords: <TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request?: ErpEntityListRequest,
  ) => Promise<ErpEntityListResponse<TRecord>>
}

