'use client'

import React from 'react'

import { useDashboardArtifactId } from '@/products/artifacts/dashboard/query/DashboardQueryContext'

type JsonRecord = Record<string, any>
export type DashboardQueryStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export type DashboardQueryMetadata = {
  bytesProcessed?: number
  durationMs?: number
}

export type DashboardQueryResponse = {
  ok: boolean
  status: Exclude<DashboardQueryStatus, 'idle' | 'loading'>
  code: string
  rows: JsonRecord[]
  columns: string[]
  count: number
  rowCount: number
  metadata?: DashboardQueryMetadata
  error: string | null
  details?: unknown
}

export type DashboardQueryState = Omit<DashboardQueryResponse, 'status'> & {
  status: DashboardQueryStatus
  loading: boolean
}

type CacheEntry = {
  expiresAt: number
  request: Promise<DashboardQueryResponse>
}

const CACHE_TTL_MS = 60_000
const CACHE_MAX_ENTRIES = 200
const cache = new Map<string, CacheEntry>()

function pruneCache() {
  const now = Date.now()
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key)
  }
  while (cache.size > CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (!oldest) break
    cache.delete(oldest)
  }
}

const IDLE_QUERY_STATE: DashboardQueryState = {
  ok: false,
  status: 'idle',
  code: 'dashboard_query_idle',
  rows: [],
  columns: [],
  count: 0,
  rowCount: 0,
  metadata: undefined,
  error: null,
  details: undefined,
  loading: false,
}

function normalizeSuccessPayload(payload: Partial<DashboardQueryResponse>): DashboardQueryResponse {
  const rows = Array.isArray(payload.rows) ? payload.rows : []
  const columns = Array.isArray(payload.columns) ? payload.columns.map(String) : []
  const count = Number.isFinite(Number(payload.count)) ? Number(payload.count) : rows.length
  const status = rows.length > 0 ? 'success' : 'empty'
  return {
    ok: true,
    status,
    code: status === 'empty' ? 'dashboard_query_empty' : 'dashboard_query_ok',
    rows,
    columns,
    count,
    rowCount: count,
    metadata: payload.metadata,
    error: null,
    details: undefined,
  }
}

function normalizeErrorPayload(payload: Partial<DashboardQueryResponse> & { error?: unknown }): DashboardQueryResponse {
  const message = typeof payload.error === 'string' && payload.error.trim()
    ? payload.error.trim()
    : 'Falha ao executar query do dashboard'
  return {
    ok: false,
    status: 'error',
    code: typeof payload.code === 'string' && payload.code.trim()
      ? payload.code.trim()
      : 'dashboard_query_unknown_error',
    rows: [],
    columns: [],
    count: 0,
    rowCount: 0,
    metadata: payload.metadata,
    error: message,
    details: payload.details,
  }
}

export class DashboardQueryError extends Error {
  code: string
  details?: unknown
  response: DashboardQueryResponse

  constructor(response: DashboardQueryResponse) {
    super(response.error || 'Falha ao executar query do dashboard')
    this.name = 'DashboardQueryError'
    this.code = response.code
    this.details = response.details
    this.response = response
  }
}

function fetchDashboardQuery(input: {
  artifactId: string
  query: string
  filters: JsonRecord
  limit: number
}) {
  pruneCache()
  const signature = JSON.stringify(input)
  const cached = cache.get(signature)
  if (cached && cached.expiresAt > Date.now()) {
    cache.delete(signature)
    cache.set(signature, cached)
    return { signature, request: cached.request }
  }
  const request = fetch(`/api/artifacts/dashboards/${input.artifactId}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: input.query,
      filters: input.filters,
      limit: input.limit,
    }),
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({})) as Partial<DashboardQueryResponse> & { error?: unknown }
    if (!response.ok || payload.ok === false) {
      throw new DashboardQueryError(normalizeErrorPayload(payload))
    }
    return normalizeSuccessPayload(payload)
  }).catch((error) => {
    cache.delete(signature)
    throw error
  })
  cache.set(signature, { expiresAt: Date.now() + CACHE_TTL_MS, request })
  pruneCache()
  return { signature, request }
}

export async function requestDashboardQueryRows(
  artifactId: string | null,
  dataQuery: JsonRecord,
  filters: JsonRecord = {},
): Promise<JsonRecord[]> {
  if (!artifactId) throw new Error('Artifact sem contexto para executar query.')
  const { request } = fetchDashboardQuery({
    artifactId,
    query: String(dataQuery.query || ''),
    filters,
    limit: Number(dataQuery.limit || 1000),
  })
  return (await request).rows || []
}

export function useDashboardQueryRows(
  dataQuery: JsonRecord | undefined,
  filters: JsonRecord | undefined,
) {
  const artifactId = useDashboardArtifactId()
  const query = typeof dataQuery?.query === 'string' ? dataQuery.query.trim() : ''
  const limit = Number(dataQuery?.limit || 1000)
  const signature = JSON.stringify({ artifactId, query, filters: filters || {}, limit })
  const [state, setState] = React.useState<DashboardQueryState>({
    ...IDLE_QUERY_STATE,
    status: query ? 'loading' : 'idle',
    loading: Boolean(query),
  })

  React.useEffect(() => {
    if (!query) {
      setState(IDLE_QUERY_STATE)
      return
    }
    if (!artifactId) {
      setState({
        ...IDLE_QUERY_STATE,
        ok: false,
        status: 'error',
        code: 'dashboard_query_missing_artifact_context',
        error: 'Artifact sem contexto para executar query.',
      })
      return
    }
    let cancelled = false
    const request = fetchDashboardQuery({
      artifactId,
      query,
      filters: filters || {},
      limit,
    }).request
    setState((current) => ({
      ...current,
      status: 'loading',
      loading: true,
      error: null,
    }))
    request
      .then((result) => {
        if (!cancelled) {
          setState({
            ...result,
            loading: false,
          })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const response = error instanceof DashboardQueryError
            ? error.response
            : normalizeErrorPayload({
              error: error instanceof Error ? error.message : 'Falha na query',
            })
          setState({
            ...response,
            loading: false,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [artifactId, query, signature])

  return state
}
