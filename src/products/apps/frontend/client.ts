'use client'
import { useAuth } from '@clerk/nextjs'
import { useCallback, useEffect, useState } from 'react'
export type AppsApi = <T>(path: string, init?: RequestInit) => Promise<T>
export function useAppsApi(): AppsApi {
  const { getToken, userId, sessionId, orgId } = useAuth()
  return useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    if (!userId || !sessionId) throw Error('Entre novamente para continuar.')
    const token = await getToken({ organizationId: orgId ?? undefined })
    if (!token) throw Error('Entre novamente para continuar.')
    const response = await fetch('/api/apps' + path, { ...init, credentials: 'same-origin', cache: 'no-store', headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) throw Error(data?.error?.message ?? 'Não foi possível carregar os apps.')
    return data as T
  }, [getToken, userId, sessionId, orgId])
}
export function useResource<T>(api: AppsApi, path: string | null, revision = 0) {
  const [state, setState] = useState<{ api?: AppsApi; key?: string; data?: T; error?: string }>({})
  const key = `${path}:${revision}`
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    api<T>(path, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setState({ api, key, data }) }).catch(e => { if (!controller.signal.aborted) setState({ api, key, error: e instanceof Error ? e.message : 'Não foi possível carregar.' }) })
    return () => controller.abort()
  }, [api, path, key])
  return state.api === api && state.key === key ? { ...state, loading: false } : { data: undefined, error: undefined, loading: Boolean(path) }
}
export const send = (method: string, body: unknown = {}) => ({ method, body: JSON.stringify(body) })
