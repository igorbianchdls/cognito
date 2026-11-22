'use client'

import { useEffect, useState } from 'react'

export type Range = { days: number }
export const periods = [{ days: 1, label: 'Hoje' }, { days: 7, label: '7 dias' }, { days: 30, label: '30 dias' }, { days: 90, label: '90 dias' }]

/** [de, ate) for the last `days` days, ending at the end of today (local time). */
export function periodWindow(days: number) {
  const ate = new Date(); ate.setHours(24, 0, 0, 0)
  const de = new Date(ate); de.setDate(de.getDate() - days)
  return { de, ate }
}

type State<R> = { rows: R[] | null; error: string | null; notConfigured: boolean; loading: boolean }

/** One report from /api/analytics/relatorios; refreshes every `refreshMs` when given. */
export function useReport<R>(report: string, propertyId: string | null | undefined, days: number, extra: Record<string, string> = {}, refreshMs?: number): State<R> {
  const [state, setState] = useState<State<R>>({ rows: null, error: null, notConfigured: false, loading: true })
  const key = JSON.stringify([report, propertyId, days, extra])
  useEffect(() => {
    if (!propertyId) return
    let live = true
    const load = async () => {
      const { de, ate } = periodWindow(days)
      const q = new URLSearchParams({ propriedade: propertyId, relatorio: report, de: de.toISOString(), ate: ate.toISOString(), ...extra })
      try {
        const res = await fetch('/api/analytics/relatorios?' + q, { cache: 'no-store' })
        const body = await res.json().catch(() => ({}))
        if (!live) return
        if (res.ok) setState({ rows: body.linhas, error: null, notConfigured: false, loading: false })
        else setState({ rows: null, error: body.erro ?? 'Não foi possível carregar.', notConfigured: body.configurado === false, loading: false })
      } catch { if (live) setState(s => ({ ...s, error: 'Sem conexão.', loading: false })) }
    }
    setState(s => ({ ...s, loading: true }))
    void load()
    const timer = refreshMs ? setInterval(load, refreshMs) : undefined
    return () => { live = false; if (timer) clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshMs])
  return state
}

export const fmt = (n: number) => n.toLocaleString('pt-BR')
