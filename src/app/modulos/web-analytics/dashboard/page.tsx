'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/modulos/DashboardLayout'

type OverviewPoint = { date: string; sessions: number; users: number; pageviews: number; avg_duration_seconds: number; conversions: number }
type SourcesRow = { source: string; sessions: number; sessions_share: number; pages_per_session: number; conversion_rate: number; conversions: number }
type TopPage = { url: string; pageviews: number; share: number }
type Conversion = { id: string; visitor: string | null; session: string | null; value: number; timestamp: string }

function formatNum(n?: number) { return (n ?? 0).toLocaleString('pt-BR') }
function formatPct(n?: number) { return `${(n ?? 0).toFixed(2)}%` }
function formatDuration(sec?: number) { const s = Math.round(sec ?? 0); const m = Math.floor(s/60); const r = s%60; return `${m}:${String(r).padStart(2,'0')}` }

function LineSimple({ items, color = '#2563eb' }: { items: { label: string; value: number }[]; color?: string }) {
  const W = 520, H = 180, padX = 16, padY = 12
  const max = Math.max(1, ...items.map(i => i.value)); const min = Math.min(0, ...items.map(i => i.value))
  const n = Math.max(1, items.length); const xStep = (W - padX * 2) / Math.max(1, n - 1)
  const scaleY = (v: number) => { const rng = max - min || 1; const t = (v - min) / rng; return H - padY - t * (H - padY * 2) }
  const pts = items.map((p, i) => `${padX + i * xStep},${scaleY(p.value)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
      <defs>
        <linearGradient id="gradLineWA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
      {items.length > 1 && (
        <polygon points={`${padX},${scaleY(items[0].value)} ${pts} ${padX + (n - 1) * xStep},${H - padY} ${padX},${H - padY}`} fill="url(#gradLineWA)" />
      )}
    </svg>
  )
}

function HBars({ items, color = 'bg-indigo-500' }: { items: { label: string; value: number; hint?: string }[]; color?: string }) {
  const max = Math.max(1, ...items.map(i => i.value))
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const pct = Math.round((it.value / max) * 100)
        return (
          <div key={it.label}>
            <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{it.hint || formatNum(it.value)}</span></div>
            <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
          </div>
        )
      })}
      {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
    </div>
  )
}

export default function WebAnalyticsDashboardPage() {
  const [overview, setOverview] = useState<OverviewPoint[]>([])
  const [sources, setSources] = useState<SourcesRow[]>([])
  const [pages, setPages] = useState<TopPage[]>([])
  const [convs, setConvs] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const base = '/api/modulos/web-analytics'
        const [o, s, p, c] = await Promise.allSettled([
          fetch(`${base}?view=overview&days=30`, { cache: 'no-store' }),
          fetch(`${base}?view=sources&days=30`, { cache: 'no-store' }),
          fetch(`${base}?view=top-pages&days=30`, { cache: 'no-store' }),
          fetch(`${base}?view=recent-conversions&days=30`, { cache: 'no-store' }),
        ])
        let ov: OverviewPoint[] = []
        let so: SourcesRow[] = []
        let pa: TopPage[] = []
        let co: Conversion[] = []
        if (o.status === 'fulfilled' && o.value.ok) { const j = await o.value.json(); ov = Array.isArray(j?.series) ? j.series as OverviewPoint[] : [] }
        if (s.status === 'fulfilled' && s.value.ok) { const j = await s.value.json(); so = Array.isArray(j?.sources) ? j.sources as SourcesRow[] : [] }
        if (p.status === 'fulfilled' && p.value.ok) { const j = await p.value.json(); pa = Array.isArray(j?.pages) ? j.pages as TopPage[] : [] }
        if (c.status === 'fulfilled' && c.value.ok) { const j = await c.value.json(); co = Array.isArray(j?.conversions) ? j.conversions as Conversion[] : [] }

        if (ov.length === 0 && so.length === 0 && pa.length === 0) {
          // Mocks coerentes
          const today = new Date(); const series: OverviewPoint[] = []
          for (let i=29;i>=0;i--) { const d = new Date(today.getFullYear(), today.getMonth(), today.getDate()-i); const label = d.toISOString().slice(0,10); const s = 600 + Math.round(Math.random()*200); const u = 400 + Math.round(Math.random()*150); const pv = s * (1.5 + Math.random()); const conv = Math.round(s * 0.03); series.push({ date: label, sessions: s, users: u, pageviews: Math.round(pv), avg_duration_seconds: 180+Math.round(Math.random()*120), conversions: conv }) }
          ov = series
          so = [
            { source: 'Orgânico', sessions: 9200, sessions_share: 38.7, pages_per_session: 1.8, conversion_rate: 3.1, conversions: 285 },
            { source: 'Direto', sessions: 6500, sessions_share: 27.3, pages_per_session: 1.6, conversion_rate: 2.8, conversions: 182 },
            { source: 'Social', sessions: 4800, sessions_share: 20.2, pages_per_session: 1.7, conversion_rate: 2.5, conversions: 120 },
            { source: 'Referência', sessions: 3300, sessions_share: 13.9, pages_per_session: 1.6, conversion_rate: 2.1, conversions: 69 },
          ]
          pa = [
            { url: '/produtos', pageviews: 4200, share: 18.5 },
            { url: '/home', pageviews: 3800, share: 16.2 },
            { url: '/sobre', pageviews: 2100, share: 8.9 },
          ]
          co = [
            { id: '1', visitor: 'v-123', session: 's-1', value: 0, timestamp: new Date().toISOString() },
            { id: '2', visitor: 'v-124', session: 's-2', value: 0, timestamp: new Date(Date.now()-15*60000).toISOString() },
            { id: '3', visitor: 'v-125', session: 's-3', value: 1200, timestamp: new Date(Date.now()-60*60000).toISOString() },
          ]
        }

        if (!cancelled) { setOverview(ov); setSources(so); setPages(pa); setConvs(co) }
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  const kpis = useMemo(() => {
    const sessions = overview.reduce((a, r) => a + r.sessions, 0)
    const users = overview.reduce((a, r) => a + r.users, 0)
    const conversions = overview.reduce((a, r) => a + r.conversions, 0)
    const avgDur = (() => { const vals = overview.map(r => r.avg_duration_seconds).filter(v => v>0); return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0 })()
    const convRate = sessions > 0 ? (conversions / sessions) * 100 : 0
    return { sessions, users, convRate, avgDur }
  }, [overview])

  const trafficSeries = useMemo(() => overview.map(d => ({ label: d.date, value: d.sessions })), [overview])
  const convSeries = useMemo(() => overview.map(d => ({ label: d.date, value: (d.sessions>0 ? (d.conversions/d.sessions)*100 : 0) })), [overview])

  return (
    <DashboardLayout
      title="Dashboard Web Analytics"
      subtitle="Visão geral do comportamento dos visitantes"
      backgroundColor="#ffffff"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Usuários Únicos (30d)</div>
          <div className="text-2xl font-bold text-blue-600">{formatNum(kpis.users)}</div>
          <div className="text-xs text-gray-400 mt-1">Total no período</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Sessões (30d)</div>
          <div className="text-2xl font-bold text-green-600">{formatNum(kpis.sessions)}</div>
          <div className="text-xs text-gray-400 mt-1">Somatório no período</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Conversão</div>
          <div className="text-2xl font-bold text-purple-600">{formatPct(kpis.convRate)}</div>
          <div className="text-xs text-gray-400 mt-1">Conversões / Sessões</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Tempo Médio</div>
          <div className="text-2xl font-bold text-orange-600">{formatDuration(kpis.avgDur)}</div>
          <div className="text-xs text-gray-400 mt-1">min:seg por sessão</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Tráfego ao Longo do Tempo</h3>
          <LineSimple items={trafficSeries} color="#2563eb" />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {trafficSeries.slice(-6).map(x => (
              <div key={x.label} className="text-[11px] text-gray-600 text-center">{x.label.slice(5)}</div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Taxa de Conversão (diária)</h3>
          <LineSimple items={convSeries} color="#16a34a" />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {convSeries.slice(-6).map(x => (
              <div key={x.label} className="text-[11px] text-gray-600 text-center">{x.label.slice(5)}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Páginas Mais Visitadas</h3>
          <div className="space-y-3">
            {pages.length === 0 ? (
              <div className="text-sm text-gray-400">Sem dados</div>
            ) : pages.slice(0,6).map((p) => (
              <div key={p.url} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{p.url}</div>
                  <div className="text-xs text-gray-500">{formatNum(p.pageviews)} visualizações</div>
                </div>
                <div className="text-xs font-semibold text-blue-600">{formatPct(p.share)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Fontes de Tráfego</h3>
          <HBars items={sources.map(s => ({ label: s.source, value: s.sessions, hint: `${formatNum(s.sessions)} • ${formatPct(s.sessions_share)} • ${s.pages_per_session.toFixed(2)} p/s • ${formatPct(s.conversion_rate)}` }))} color="bg-sky-500" />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Últimas Conversões</h3>
          <div className="space-y-3">
            {convs.length === 0 ? (
              <div className="text-sm text-gray-400">Sem conversões</div>
            ) : convs.map((c) => (
              <div key={c.id} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">Sessão {c.session || '—'}</div>
                  <div className="text-xs text-gray-500">{new Date(c.timestamp).toLocaleString('pt-BR')}</div>
                </div>
                <div className="text-xs text-green-600">{c.value > 0 ? `Valor ${formatNum(c.value)}` : 'Evento'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
