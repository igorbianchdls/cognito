'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'

export type TablesApi = <T>(path: string, init?: RequestInit) => Promise<T>
export class TablesClientError extends Error {
  constructor(message: string, public code: string, public status: number) { super(message) }
}

export function useTablesApi(): TablesApi {
  const { getToken, userId, orgId, sessionId } = useAuth()
  return useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    if (!userId || !sessionId) throw new TablesClientError('Entre novamente para continuar.', 'UNAUTHENTICATED', 401)
    const token = await getToken({ organizationId: orgId ?? undefined })
    if (!token) throw new TablesClientError('Entre novamente para continuar.', 'UNAUTHENTICATED', 401)
    const response = await fetch('/api/tables' + path, { ...init, cache: 'no-store', credentials: 'same-origin', headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
    const body = await response.json().catch(() => null)
    if (!response.ok || !body) throw new TablesClientError(body?.error?.message ?? 'Não foi possível carregar os dados. Tente novamente.', body?.error?.code ?? 'UNAVAILABLE', response.status)
    return body as T
  }, [getToken, userId, orgId, sessionId])
}

export function useResource<T>(api: TablesApi, path: string | null, revision = 0) {
  const key = JSON.stringify([path, revision])
  const [state, setState] = useState<{ key: string; api?: TablesApi; path?: string; data?: T; error?: string }>({ key: '' })
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    api<T>(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ key, api, path, data })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, api, path, error: error instanceof Error ? error.message : 'Não foi possível carregar os dados.' })
    })
    return () => controller.abort()
  }, [api, path, key])
  const current = state.key === key && state.api === api ? state : null
  return { data: current?.data ?? (state.api === api && state.path === path ? state.data : undefined), error: current?.error, loading: Boolean(path && !current) }
}

export const send = (method: string, body: unknown = {}) => ({ method, body: JSON.stringify(body) })
export const changedBases = () => window.dispatchEvent(new Event('tables:bases-changed'))
