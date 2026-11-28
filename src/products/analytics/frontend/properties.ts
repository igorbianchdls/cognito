'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

export type Property = { id: string; name: string; kind: 'site' | 'app'; domains: string[]; public_key: string; require_consent: boolean; autocapture: boolean; replay_sample: number; replay_mask_text: boolean; created_at: string }
const SELECTED = 'otto-analytics-property'
type Patch = Partial<Pick<Property, 'name' | 'kind' | 'domains' | 'require_consent' | 'autocapture' | 'replay_sample' | 'replay_mask_text'>>

/** Os sites e apps da empresa e o escolhido nas telas (lembrado neste navegador). */
export function useProperties() {
  const [list, setList] = useState<Property[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelectedState] = useState<string | null>(() => { try { return typeof window === 'undefined' ? null : localStorage.getItem(SELECTED) } catch { return null } })

  const reload = useCallback(async () => {
    try { setList((await api<{ itens: Property[] }>('dados/sites')).itens); setError(null) } catch (e) { setError((e as Error).message || 'Não foi possível carregar os sites e apps.') }
  }, [])
  useEffect(() => { const t = setTimeout(() => void reload(), 0); return () => clearTimeout(t) }, [reload])
  const setSelected = (id: string) => { setSelectedState(id); try { localStorage.setItem(SELECTED, id) } catch { /* bloqueado */ } }
  const current = list?.find(p => p.id === selected) ?? list?.[0] ?? null

  const run = async (fn: () => Promise<unknown>) => { try { const r = await fn(); await reload(); return { r, erro: null as string | null } } catch (e) { return { r: null, erro: (e as Error).message } } }
  async function create(input: Patch & { name: string }) {
    const { r, erro } = await run(() => api<Property>('dados/sites', { json: input }))
    if (r) setSelected((r as Property).id)
    return erro
  }
  const update = async (id: string, patch: Patch) => (await run(() => api(`dados/sites/${id}`, { method: 'PATCH', json: patch }))).erro
  const remove = async (id: string) => (await run(() => api(`dados/sites/${id}`, { method: 'DELETE' }))).erro
  return { list, error, current, setSelected, create, update, remove, reload }
}

/** Domínios digitados: "https://www.site.com/", "site.com" → "www.site.com", "site.com". */
export const cleanDomains = (text: string) => [...new Set(text.split(/[\s,;]+/).map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(d => /^[a-z0-9.-]+\.[a-z]{2,}$|^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(d)))]
