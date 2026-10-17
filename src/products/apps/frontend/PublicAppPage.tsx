'use client'
import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { AppsApi } from './client'
import RuntimeFrame, { type RuntimeBundle } from './runtime/RuntimeFrame'
import './apps.css'

// Public link of an app: no login, no Cognito chrome. Only the published version and the
// Tables operations allowed to visitors are available.
export default function PublicAppPage({ slug }: { slug: string }) {
  const [bundle, setBundle] = useState<RuntimeBundle | null>(null), [error, setError] = useState('')
  const api: AppsApi = useCallback(async <T,>(path: string, init: RequestInit = {}) => {
    const response = await fetch(`/api/public/apps/${encodeURIComponent(slug)}${path}`, { ...init, cache: 'no-store', credentials: 'omit', headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
    const data = await response.json().catch(() => null)
    if (!response.ok || !data) throw Error(data?.error?.message ?? 'Não foi possível carregar.')
    return data as T
  }, [slug])
  useEffect(() => {
    const controller = new AbortController()
    api<RuntimeBundle>('/runtime', { signal: controller.signal }).then(b => { setBundle(b); document.title = b.app.nome }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Não foi possível carregar.') })
    return () => controller.abort()
  }, [api])
  return <main className="apps-public">{error ? <div className="apps-public-notice" role="alert">{error}</div> : bundle ? <RuntimeFrame bundle={bundle} api={api} /> : <div className="apps-public-notice" role="status"><LoaderCircle size={18} className="animate-spin" />Carregando…</div>}</main>
}
