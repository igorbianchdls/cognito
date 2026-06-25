'use client'

import React from 'react'

import { useDashboardArtifactId } from '@/products/artifacts/dashboard/query/DashboardQueryContext'

type JsonRecord = Record<string, any>
type QueryResponse = {
  rows: JsonRecord[]
  columns: string[]
  count: number
  metadata?: { bytesProcessed?: number; durationMs?: number }
}

const cache = new Map<string, Promise<QueryResponse>>()

export async function requestDashboardQueryRows(
  dataQuery: JsonRecord,
  filters: JsonRecord = {},
): Promise<JsonRecord[]> {
  const match = typeof window !== 'undefined'
    ? window.location.pathname.match(/\/artifacts\/dashboards\/([^/]+)/)
    : null
  const artifactId = match?.[1]
  if (!artifactId) throw new Error('Artifact sem contexto para executar query.')
  const response = await fetch(`/api/artifacts/dashboards/${artifactId}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: String(dataQuery.query || ''),
      filters,
      limit: Number(dataQuery.limit || 1000),
    }),
  })
  const payload = await response.json().catch(() => ({})) as QueryResponse & { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Falha ao executar query do dashboard')
  return payload.rows || []
}

export function useDashboardQueryRows(
  dataQuery: JsonRecord | undefined,
  filters: JsonRecord | undefined,
) {
  const artifactId = useDashboardArtifactId()
  const query = typeof dataQuery?.query === 'string' ? dataQuery.query.trim() : ''
  const limit = Number(dataQuery?.limit || 1000)
  const signature = JSON.stringify({ artifactId, query, filters: filters || {}, limit })
  const [state, setState] = React.useState<{
    rows: JsonRecord[]
    loading: boolean
    error: string | null
  }>({ rows: [], loading: Boolean(query), error: null })

  React.useEffect(() => {
    if (!query) {
      setState({ rows: [], loading: false, error: null })
      return
    }
    if (!artifactId) {
      setState({ rows: [], loading: false, error: 'Artifact sem contexto para executar query.' })
      return
    }
    let cancelled = false
    const request = cache.get(signature) || fetch(`/api/artifacts/dashboards/${artifactId}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, filters: filters || {}, limit }),
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({})) as QueryResponse & { error?: string }
      if (!response.ok) throw new Error(payload.error || 'Falha ao executar query do dashboard')
      return payload
    })
    cache.set(signature, request)
    setState((current) => ({ ...current, loading: true, error: null }))
    request
      .then((result) => {
        if (!cancelled) setState({ rows: result.rows || [], loading: false, error: null })
      })
      .catch((error) => {
        cache.delete(signature)
        if (!cancelled) setState({ rows: [], loading: false, error: error instanceof Error ? error.message : 'Falha na query' })
      })
    return () => {
      cancelled = true
    }
  }, [artifactId, query, signature])

  return state
}
