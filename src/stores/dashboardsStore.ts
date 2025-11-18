import { createClient } from '@/lib/supabase/client'

export interface Dashboard {
  id: string
  title: string
  description: string | null
  sourcecode: string
  visibility: 'private' | 'org' | 'public'
  version: number
  created_at?: string
  updated_at?: string
}

export const dashboardsApi = {
  async list(params?: { q?: string; visibility?: string; limit?: number; offset?: number }) {
    const sp = new URLSearchParams()
    if (params?.q) sp.set('q', params.q)
    if (params?.visibility) sp.set('visibility', params.visibility)
    if (params?.limit) sp.set('limit', String(params.limit))
    if (params?.offset) sp.set('offset', String(params.offset))
    const res = await fetch(`/api/dashboards${sp.toString() ? `?${sp.toString()}` : ''}`)
    const json = await res.json()
    if (!json?.success) throw new Error(json?.error || 'Falha ao listar dashboards')
    return json as { success: true; items: Dashboard[]; count: number }
  },
  async get(id: string) {
    const res = await fetch(`/api/dashboards/${id}`)
    const json = await res.json()
    if (!json?.success) throw new Error(json?.error || 'Falha ao obter dashboard')
    return json as { success: true; item: Dashboard }
  },
  async create(payload: Omit<Dashboard, 'id' | 'created_at' | 'updated_at'>) {
    const res = await fetch('/api/dashboards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (!json?.success) throw new Error(json?.error || 'Falha ao criar dashboard')
    return json as { success: true; item: Dashboard }
  },
  async update(id: string, payload: Partial<Omit<Dashboard, 'id'>>) {
    const res = await fetch(`/api/dashboards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    if (!json?.success) throw new Error(json?.error || 'Falha ao atualizar dashboard')
    return json as { success: true; item: Dashboard }
  },
  async remove(id: string) {
    const res = await fetch(`/api/dashboards/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json?.success) throw new Error(json?.error || 'Falha ao remover dashboard')
    return json as { success: true }
  }
}

