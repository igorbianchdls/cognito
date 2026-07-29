import { erpMockData } from '@/products/erp/frontend/data/mockErpData'
import type {
  ErpClient,
  ErpEntityCreateRequest,
  ErpEntityCreateResponse,
  ErpEntityListRequest,
  ErpEntityListResponse,
} from '@/products/erp/shared/contracts'
import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'
import { ERP_STATUS_ALL_VALUE } from '@/products/erp/shared/constants'

function recordMatchesQuery(record: ErpEntityRecord, query?: string) {
  if (!query?.trim()) return true
  const normalizedQuery = query.trim().toLowerCase()
  return Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery))
}

function recordMatchesFilters(record: ErpEntityRecord, filters?: Record<string, string>) {
  if (!filters) return true
  return Object.entries(filters).every(([key, value]) => {
    if (!value || value === ERP_STATUS_ALL_VALUE) return true
    return String(record[key] ?? '') === value
  })
}

export const erpMockClient: ErpClient = {
  async listEntityRecords<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request?: ErpEntityListRequest,
  ): Promise<ErpEntityListResponse<TRecord>> {
    const records = (erpMockData[config.id] ?? []) as TRecord[]
    const filteredRecords = records.filter((record) => (
      recordMatchesQuery(record, request?.query) && recordMatchesFilters(record, request?.filters)
    ))

    return {
      records: filteredRecords,
      total: filteredRecords.length,
    }
  },

  async createEntityRecord<TRecord extends ErpEntityRecord>(
    config: ErpEntityConfig<TRecord>,
    request: ErpEntityCreateRequest,
  ): Promise<ErpEntityCreateResponse<TRecord>> {
    const record = {
      id: `mock-${Date.now()}`,
      ...(request.values as Record<string, string | number | boolean | null | undefined>),
    } as TRecord
    const records = (erpMockData[config.id] ?? []) as ErpEntityRecord[]
    records.unshift(record)
    return { record }
  },

  async runEntityAction(_config, request) {
    return { result: { ok: true, actionId: request.actionId } }
  },
}
