'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { supabase } from './supabase'

export type Property = { id: string; name: string; kind: 'site' | 'app'; domains: string[]; public_key: string; require_consent: boolean; created_at: string }
const SELECTED = 'otto-analytics-property'

/** The company's sites and apps, and the one picked on the screens (remembered in this browser). */
export function useProperties() {
  const { orgId, isLoaded } = useAuth()
  const [list, setList] = useState<Property[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelectedState] = useState<string | null>(() => { try { return typeof window === 'undefined' ? null : localStorage.getItem(SELECTED) } catch { return null } })

  const fetchList = useCallback(async () => {
    if (!orgId) return null
    const { data, error } = await supabase().from('properties').select('id, name, kind, domains, public_key, require_consent, created_at').eq('workspace_id', orgId).order('created_at')
    return error ? { error: 'Não foi possível carregar os sites e apps.' } : { list: data as Property[] }
  }, [orgId])
  const apply = (r: { error?: string; list?: Property[] } | null) => { if (!r) return; setError(r.error ?? null); if (r.list) setList(r.list) }
  const reload = async () => apply(await fetchList())

  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchList().then(r => { if (live) apply(r) })
    return () => { live = false }
  }, [isLoaded, fetchList])
  const setSelected = (id: string) => { setSelectedState(id); try { localStorage.setItem(SELECTED, id) } catch { /* blocked */ } }
  const current = list?.find(p => p.id === selected) ?? list?.[0] ?? null

  async function create(input: { name: string; kind: 'site' | 'app'; domains: string[]; require_consent: boolean }) {
    if (!orgId) return 'Escolha uma empresa.'
    const { data, error } = await supabase().from('properties').insert({ ...input, workspace_id: orgId }).select('id').single()
    if (error) return error.code === '42501' ? 'Seu perfil só pode visualizar.' : 'Não foi possível criar.'
    await reload(); setSelected(data.id as string); return null
  }
  async function update(id: string, patch: Partial<Pick<Property, 'name' | 'kind' | 'domains' | 'require_consent'>>) {
    const { error } = await supabase().from('properties').update(patch).eq('id', id)
    if (error) return error.code === '42501' ? 'Seu perfil só pode visualizar.' : 'Não foi possível salvar.'
    await reload(); return null
  }
  async function remove(id: string) {
    const { error } = await supabase().from('properties').delete().eq('id', id)
    if (error) return 'Não foi possível excluir.'
    await reload(); return null
  }
  return { list, error, current, setSelected, create, update, remove, reload }
}

/** Domains typed by the person: "https://www.site.com/", "site.com" → "www.site.com", "site.com". */
export const cleanDomains = (text: string) => [...new Set(text.split(/[\s,;]+/).map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(d => /^[a-z0-9.-]+\.[a-z]{2,}$|^localhost(:\d+)?$/.test(d)))]
