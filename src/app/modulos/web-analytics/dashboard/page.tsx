'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions } from '@/stores/modulos/financeiroDashboardStore'

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
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
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

  // Fonts mapping (shared)
  function fontVar(name?: string) {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    if (name === 'Roboto Mono') return 'var(--font-roboto-mono)'
    if (name === 'Geist Mono') return 'var(--font-geist-mono)'
    if (name === 'IBM Plex Mono') return 'var(--font-ibm-plex-mono), "IBM Plex Mono", monospace'
    if (name === 'Avenir') return 'var(--font-avenir), Avenir, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
    if (name === 'Space Mono') return 'var(--font-space-mono), "Space Mono", monospace'
    return name
  }
  const styleValues = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.values.family),
    fontWeight: fonts.values.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.values.letterSpacing === 'number' ? `${fonts.values.letterSpacing}px` : undefined,
    color: fonts.values.color || undefined,
    fontSize: typeof fonts.values.size === 'number' ? `${fonts.values.size}px` : undefined,
    textTransform: fonts.values.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.values])
  const styleKpiTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.kpiTitle.family),
    fontWeight: fonts.kpiTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.kpiTitle.letterSpacing === 'number' ? `${fonts.kpiTitle.letterSpacing}px` : undefined,
    color: fonts.kpiTitle.color || undefined,
    fontSize: typeof fonts.kpiTitle.size === 'number' ? `${fonts.kpiTitle.size}px` : undefined,
    textTransform: fonts.kpiTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.kpiTitle])
  const styleChartTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.chartTitle.family),
    fontWeight: fonts.chartTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.chartTitle.letterSpacing === 'number' ? `${fonts.chartTitle.letterSpacing}px` : undefined,
    color: fonts.chartTitle.color || undefined,
    fontSize: typeof fonts.chartTitle.size === 'number' ? `${fonts.chartTitle.size}px` : undefined,
    textTransform: fonts.chartTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.chartTitle])
  const styleText = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.text.family),
    fontWeight: fonts.text.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.text.letterSpacing === 'number' ? `${fonts.text.letterSpacing}px` : undefined,
    color: fonts.text.color || undefined,
    fontSize: typeof fonts.text.size === 'number' ? `${fonts.text.size}px` : undefined,
    textTransform: fonts.text.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.text])
  const styleHeaderTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.headerTitle.family),
    fontWeight: fonts.headerTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.headerTitle.letterSpacing === 'number' ? `${fonts.headerTitle.letterSpacing}px` : undefined,
    color: fonts.headerTitle.color || undefined,
    fontSize: typeof fonts.headerTitle.size === 'number' ? `${fonts.headerTitle.size}px` : undefined,
    textTransform: fonts.headerTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.headerTitle])
  const styleHeaderSubtitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.headerSubtitle.family),
    fontWeight: fonts.headerSubtitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.headerSubtitle.letterSpacing === 'number' ? `${fonts.headerSubtitle.letterSpacing}px` : undefined,
    color: fonts.headerSubtitle.color || undefined,
    fontSize: typeof fonts.headerSubtitle.size === 'number' ? `${fonts.headerSubtitle.size}px` : undefined,
    textTransform: fonts.headerSubtitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.headerSubtitle])

  // Header actions (date range + filter)
  const styleFilters = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.filters.family),
    fontWeight: fonts.filters.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.filters.letterSpacing === 'number' ? `${fonts.filters.letterSpacing}px` : undefined,
    color: fonts.filters.color || undefined,
    fontSize: typeof fonts.filters.size === 'number' ? `${fonts.filters.size}px` : undefined,
    textTransform: fonts.filters.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.filters])
  const dateRange: DateRange | undefined = useMemo(() => {
    const from = filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined
    const to = filters.dateRange?.to ? new Date(filters.dateRange.to) : undefined
    if (!from && !to) return undefined
    return { from, to }
  }, [filters.dateRange])
  const setDateRange = (range?: DateRange) => {
    const toISO = (d?: Date) => (d ? d.toISOString().slice(0, 10) : undefined)
    financeiroDashboardActions.setFilters({
      dateRange: range ? { from: toISO(range.from), to: toISO(range.to) } : undefined,
    })
  }
  const dataFilter = filters.dataFilter
  const setDataFilter = (v: string) => financeiroDashboardActions.setFilters({ dataFilter: v })
  const rangeLabel = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      const fmt = (d: Date) => d.toLocaleDateString('pt-BR')
      return `${fmt(dateRange.from)} - ${fmt(dateRange.to)}`
    }
    if (dateRange?.from) {
      const fmt = (d: Date) => d.toLocaleDateString('pt-BR')
      return `${fmt(dateRange.from)}`
    }
    return 'Selecionar período'
  }, [dateRange])
  const headerActions = (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 px-3">
            <CalendarIcon className="mr-2 h-4 w-4" style={{ color: filtersIconColor }} />
            <span className="whitespace-nowrap" style={styleFilters}>{rangeLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="p-2 w-auto">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
            captionLayout="dropdown"
            showOutsideDays
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Select value={dataFilter} onValueChange={setDataFilter}>
        <SelectTrigger className="h-9 w-[160px]" style={styleFilters}>
          <SelectValue placeholder="Filtro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="pendentes">Pendentes</SelectItem>
          <SelectItem value="vencidos">Vencidos</SelectItem>
          <SelectItem value="pagos">Pagos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const cardContainerClass = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`

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
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Web Analytics"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(() => { const cls = cardContainerClass; return (
          <>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Usuários Únicos (30d)</div>
              <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatNum(kpis.users)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Total no período</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Sessões (30d)</div>
              <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatNum(kpis.sessions)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Somatório no período</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Taxa de Conversão</div>
              <div className="text-2xl font-bold text-purple-600" style={styleValues}>{formatPct(kpis.convRate)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Conversões / Sessões</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Tempo Médio</div>
              <div className="text-2xl font-bold text-orange-600" style={styleValues}>{formatDuration(kpis.avgDur)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>min:seg por sessão</div>
            </div>
          </>
        )})()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Tráfego ao Longo do Tempo</h3>
          <LineSimple items={trafficSeries} color="#2563eb" />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {trafficSeries.slice(-6).map(x => (<div key={x.label} className="text-[11px] text-gray-600 text-center" style={styleText}>{x.label.slice(5)}</div>))}
          </div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Taxa de Conversão (diária)</h3>
          <LineSimple items={convSeries} color="#16a34a" />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {convSeries.slice(-6).map(x => (<div key={x.label} className="text-[11px] text-gray-600 text-center" style={styleText}>{x.label.slice(5)}</div>))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Páginas Mais Visitadas</h3>
          <div className="space-y-3">
            {pages.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem dados</div>
            ) : pages.slice(0,6).map((p) => (
              <div key={p.url} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{p.url}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{formatNum(p.pageviews)} visualizações</div>
                </div>
                <div className="text-xs font-semibold text-blue-600">{formatPct(p.share)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Fontes de Tráfego</h3>
          <HBars items={sources.map(s => ({ label: s.source, value: s.sessions, hint: `${formatNum(s.sessions)} • ${formatPct(s.sessions_share)} • ${s.pages_per_session.toFixed(2)} p/s • ${formatPct(s.conversion_rate)}` }))} color="bg-sky-500" />
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimas Conversões</h3>
          <div className="space-y-3">
            {convs.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem conversões</div>
            ) : convs.map((c) => (
              <div key={c.id} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>Sessão {c.session || '—'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{new Date(c.timestamp).toLocaleString('pt-BR')}</div>
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
