'use client'
import { DASHBOARD_QUERY_RETIRED_CODE, DASHBOARD_QUERY_RETIRED_MESSAGE } from '@/products/artifacts/dashboard/query/dashboardQueryPolicy'
type JsonRecord = Record<string, any>
export type DashboardQueryStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'
export type DashboardQueryMetadata = { durationMs?: number }
export type DashboardQueryResponse = {
  ok: boolean; status: Exclude<DashboardQueryStatus, 'idle' | 'loading'>; code: string
  rows: JsonRecord[]; columns: string[]; count: number; rowCount: number
  metadata?: DashboardQueryMetadata; error: string | null; details?: unknown
}
export type DashboardQueryState = Omit<DashboardQueryResponse, 'status'> & { status: DashboardQueryStatus; loading: boolean }
const RETIRED_RESPONSE: DashboardQueryResponse = {
  ok: false, status: 'error', code: DASHBOARD_QUERY_RETIRED_CODE,
  rows: [], columns: [], count: 0, rowCount: 0, error: DASHBOARD_QUERY_RETIRED_MESSAGE,
}
const IDLE_STATE: DashboardQueryState = { ...RETIRED_RESPONSE, status: 'idle', code: 'dashboard_query_idle', error: null, loading: false }
const RETIRED_STATE: DashboardQueryState = { ...RETIRED_RESPONSE, loading: false }
export class DashboardQueryError extends Error {
  readonly code = DASHBOARD_QUERY_RETIRED_CODE
  readonly details = undefined
  readonly response = RETIRED_RESPONSE
  constructor() { super(DASHBOARD_QUERY_RETIRED_MESSAGE); this.name = 'DashboardQueryError' }
}
export async function requestDashboardQueryRows(_artifactId: string | null, _dataQuery: JsonRecord, _filters: JsonRecord = {}): Promise<JsonRecord[]> {
  throw new DashboardQueryError()
}
// Stable terminal state for older renderers: no fetch, cache or retries.
export function useDashboardQueryRows(dataQuery: JsonRecord | undefined, _filters: JsonRecord | undefined): DashboardQueryState {
  return dataQuery && (dataQuery.query != null || dataQuery.model != null) ? RETIRED_STATE : IDLE_STATE
}
