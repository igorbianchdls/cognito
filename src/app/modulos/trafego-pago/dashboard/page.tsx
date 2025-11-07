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

type ResumoRow = {
  plataforma?: string
  data_ref?: string
  gasto?: number | string
  impressoes?: number | string
  cliques?: number | string
  conversoes?: number | string
  receita?: number | string
}

type CampanhaRow = {
  campanha?: string
  plataforma?: string
  gasto?: number | string
  cliques?: number | string
  conversoes?: number | string
  receita?: number | string
}

type AnuncioRow = {
  id?: number | string
  plataforma?: string
  status?: string
  criado_em?: string
  nome?: string
}

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
function monthLabel(key: string) { const [y, m] = key.split('-').map(Number); const d = new Date(y, (m || 1) - 1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
function lastMonths(n: number) { const arr: string[] = []; const base = new Date(); for (let i= n-1;i>=0;i--){ const d=new Date(base.getFullYear(), base.getMonth()-i, 1); arr.push(monthKey(d)) } return arr }
function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatNum(n?: number) { return (Number(n||0)).toLocaleString('pt-BR') }

export default function TrafegoPagoDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  
  const filtersIconColor = ui.filtersIconColor
  const [resumos, setResumos] = useState<ResumoRow[]>([])
  const [campanhas, setCampanhas] = useState<CampanhaRow[]>([])
  const [anuncios, setAnuncios] = useState<AnuncioRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        // Tentativa de API (se existir). Caso contrário, mocks abaixo
        const de30 = toDateOnly(new Date(Date.now() - 29 * 86400000))
        const de6m = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const urls = [
          `/api/modulos/trafego-pago?view=resumos&de=${de6m}`,
          `/api/modulos/trafego-pago?view=campanhas&de=${de30}`,
          `/api/modulos/trafego-pago?view=anuncios&de=${de30}`,
        ]
        const [r1, r2, r3] = await Promise.allSettled(urls.map(u => fetch(u, { cache: 'no-store' })))
        let rs: ResumoRow[] = []
        let cs: CampanhaRow[] = []
        let as: AnuncioRow[] = []
        if (r1.status === 'fulfilled' && r1.value.ok) { const j = await r1.value.json(); rs = Array.isArray(j?.rows) ? j.rows as ResumoRow[] : [] }
        if (r2.status === 'fulfilled' && r2.value.ok) { const j = await r2.value.json(); cs = Array.isArray(j?.rows) ? j.rows as CampanhaRow[] : [] }
        if (r3.status === 'fulfilled' && r3.value.ok) { const j = await r3.value.json(); as = Array.isArray(j?.rows) ? j.rows as AnuncioRow[] : [] }

        if (rs.length === 0 && cs.length === 0 && as.length === 0) {
          // Mocks coerentes
          const base = new Date()
          const m0 = monthKey(base)
          const m1 = monthKey(new Date(base.getFullYear(), base.getMonth()-1, 1))
          const m2 = monthKey(new Date(base.getFullYear(), base.getMonth()-2, 1))
          rs = [
            { plataforma: 'Google Ads', data_ref: m2, gasto: 12000, impressoes: 520000, cliques: 26000, conversoes: 350, receita: 52000 },
            { plataforma: 'Meta Ads',   data_ref: m2, gasto: 8000,  impressoes: 410000, cliques: 22000, conversoes: 240, receita: 35000 },
            { plataforma: 'TikTok Ads', data_ref: m2, gasto: 3000,  impressoes: 150000, cliques: 9000,  conversoes: 60,  receita: 9000  },
            { plataforma: 'Google Ads', data_ref: m1, gasto: 15000, impressoes: 600000, cliques: 30000, conversoes: 420, receita: 64000 },
            { plataforma: 'Meta Ads',   data_ref: m1, gasto: 9000,  impressoes: 430000, cliques: 23000, conversoes: 280, receita: 39000 },
            { plataforma: 'TikTok Ads', data_ref: m1, gasto: 3500,  impressoes: 170000, cliques: 10000, conversoes: 70,  receita: 11000 },
            { plataforma: 'Google Ads', data_ref: m0, gasto: 16800, impressoes: 620000, cliques: 31200, conversoes: 450, receita: 70000 },
            { plataforma: 'Meta Ads',   data_ref: m0, gasto: 10200, impressoes: 450000, cliques: 24000, conversoes: 300, receita: 42000 },
            { plataforma: 'TikTok Ads', data_ref: m0, gasto: 3800,  impressoes: 180000, cliques: 10600, conversoes: 78,  receita: 12000 },
          ]
          cs = [
            { campanha: 'Black Friday 2025', plataforma: 'Google Ads', gasto: 8500, cliques: 14000, conversoes: 180, receita: 58000 },
            { campanha: 'Remarketing Geral', plataforma: 'Meta Ads', gasto: 5200, cliques: 11000, conversoes: 120, receita: 27000 },
            { campanha: 'Produto Novo',      plataforma: 'TikTok Ads', gasto: 2300, cliques: 5600,  conversoes: 38,  receita: 10400 },
          ]
          const today = toDateOnly(new Date())
          const yest = toDateOnly(new Date(Date.now() - 86400000))
          as = [
            { id: 1, nome: 'Anúncio Produto X', plataforma: 'Google Ads', status: 'ativo', criado_em: today },
            { id: 2, nome: 'Carousel Serviços', plataforma: 'Meta Ads', status: 'ativo', criado_em: yest },
            { id: 3, nome: 'Vídeo Promocional', plataforma: 'TikTok Ads', status: 'aprovação', criado_em: yest },
          ]
        }
        if (!cancelled) { setResumos(rs); setCampanhas(cs); setAnuncios(as) }
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  // Fonts mapping
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

  const meses = useMemo(() => lastMonths(6), [])

  // KPIs 30d a partir de resumos do mês corrente (aproximação) ou agregando rs do último mês
  const kpis = useMemo(() => {
    const curKey = monthKey(new Date())
    const rs = resumos.filter(r => r.data_ref === curKey)
    const gasto = rs.reduce((acc, r) => acc + (Number(r.gasto) || 0), 0)
    const imp = rs.reduce((acc, r) => acc + (Number(r.impressoes) || 0), 0)
    const clk = rs.reduce((acc, r) => acc + (Number(r.cliques) || 0), 0)
    const conv = rs.reduce((acc, r) => acc + (Number(r.conversoes) || 0), 0)
    const rev = rs.reduce((acc, r) => acc + (Number(r.receita) || 0), 0)
    const ctr = imp > 0 ? (clk / imp) * 100 : 0
    const cpc = clk > 0 ? gasto / clk : 0
    const cpa = conv > 0 ? gasto / conv : 0
    const roas = gasto > 0 ? rev / gasto : 0
    return { gasto, conv, cpc, roas }
  }, [resumos])

  // Investimento x Receita por mês
  const investRet = useMemo(() => {
    const agg = new Map<string, { gasto: number; receita: number }>()
    for (const k of meses) agg.set(k, { gasto: 0, receita: 0 })
    for (const r of resumos) {
      const k = String(r.data_ref || '')
      if (!agg.has(k)) continue
      const cur = agg.get(k)!
      cur.gasto += Number(r.gasto) || 0
      cur.receita += Number(r.receita) || 0
    }
    return meses.map(k => ({ key: k, label: monthLabel(k), gasto: agg.get(k)?.gasto || 0, receita: agg.get(k)?.receita || 0 }))
  }, [resumos, meses])

  // CPA por mês
  const cpaMes = useMemo(() => {
    const agg = new Map<string, { gasto: number; conv: number }>()
    for (const k of meses) agg.set(k, { gasto: 0, conv: 0 })
    for (const r of resumos) {
      const k = String(r.data_ref || '')
      if (!agg.has(k)) continue
      const cur = agg.get(k)!
      cur.gasto += Number(r.gasto) || 0
      cur.conv += Number(r.conversoes) || 0
    }
    return meses.map(k => ({ key: k, label: monthLabel(k), cpa: (agg.get(k)!.conv > 0 ? agg.get(k)!.gasto / agg.get(k)!.conv : 0) }))
  }, [resumos, meses])

  // Conversões por plataforma
  const convPorPlataforma = useMemo(() => {
    const curKey = monthKey(new Date())
    const rs = resumos.filter(r => r.data_ref === curKey)
    const m = new Map<string, number>()
    for (const r of rs) { const p = r.plataforma || '—'; m.set(p, (m.get(p) || 0) + (Number(r.conversoes) || 0)) }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value - a.value)
  }, [resumos])

  // Top campanhas por ROAS
  const topCampanhas = useMemo(() => {
    const withRoas = campanhas.map(c => ({ ...c, roas: (Number(c.gasto) || 0) > 0 ? (Number(c.receita) || 0) / (Number(c.gasto) || 1) : 0 }))
    return withRoas.sort((a,b)=> (b.roas || 0) - (a.roas || 0)).slice(0,5)
  }, [campanhas])

  const anunciosRecentes = useMemo(() => {
    return [...anuncios].sort((a,b)=> new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime()).slice(0,3)
  }, [anuncios])

  // Simple chart components
  function BarsInvestRet({ items, max }: { items: { label: string; gasto: number; receita: number }[]; max: number }) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-rose-500" />Investimento</div>
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" />Receita</div>
        </div>
        <div className="grid grid-cols-6 gap-3 h-44 items-end">
          {items.map((it) => {
            const gH = Math.round((it.gasto / max) * 100)
            const rH = Math.round((it.receita / max) * 100)
            return (
              <div key={it.label} className="flex flex-col items-center justify-end gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="w-2/5 bg-rose-500/80 rounded" style={{ height: `${gH}%` }} />
                  <div className="w-2/5 bg-emerald-500/80 rounded" style={{ height: `${rH}%` }} />
                </div>
                <div className="text-[11px] text-gray-600">{it.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function LineCPA({ items }: { items: { label: string; cpa: number }[] }) {
    const W = 520, H = 180, padX = 16, padY = 12
    const max = Math.max(1, ...items.map(i => i.cpa)); const min = Math.min(0, ...items.map(i => i.cpa))
    const n = Math.max(1, items.length); const xStep = (W - padX * 2) / Math.max(1, n - 1)
    const scaleY = (v: number) => { const rng = max - min || 1; const t = (v - min) / rng; return H - padY - t * (H - padY * 2) }
    const pts = items.map((p, i) => `${padX + i * xStep},${scaleY(p.cpa)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
        <defs>
          <linearGradient id="cpaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke="#6366f1" strokeWidth="2" />
        {items.length > 1 && (
          <polygon points={`${padX},${scaleY(items[0].cpa)} ${pts} ${padX + (n - 1) * xStep},${H - padY} ${padX},${H - padY}`} fill="url(#cpaGrad)" />
        )}
      </svg>
    )
  }

  function HBars({ items, color }: { items: { label: string; value: number }[]; color: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{formatNum(it.value)}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
      </div>
    )
  }

  const maxInvRet = Math.max(1, ...investRet.map(i => Math.max(i.gasto, i.receita)))

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Tráfego Pago"
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
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Investimento (mês)</div>
              <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatBRL(kpis.gasto)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Soma gasto do mês corrente</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Conversões (mês)</div>
              <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatNum(kpis.conv)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Total do mês corrente</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>CPC Médio</div>
              <div className="text-2xl font-bold text-purple-600" style={styleValues}>{formatBRL(kpis.cpc)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Gasto/Clques (mês)</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>ROAS</div>
              <div className="text-2xl font-bold text-orange-600" style={styleValues}>{kpis.roas.toFixed(2)}x</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Receita/Investimento (mês)</div>
            </div>
          </>
        )})()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Investimento vs Receita</h3>
          <BarsInvestRet items={investRet} max={maxInvRet} />
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>CPA por mês</h3>
          <LineCPA items={cpaMes} />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {cpaMes.map(m => (<div key={m.key} className="text-[11px] text-gray-600 text-center" style={styleText}>{m.label}</div>))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Campanhas com Melhor ROAS</h3>
          <div className="space-y-3">
            {topCampanhas.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem dados</div>
            ) : topCampanhas.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{c.campanha || 'Campanha'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{c.plataforma || '—'}</div>
                </div>
                <div className="text-emerald-700 font-semibold text-sm">{(((Number(c.receita)||0)/(Number(c.gasto)||1))).toFixed(2)}x</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Conversões por Plataforma</h3>
          <HBars items={convPorPlataforma} color="bg-sky-500" />
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimos Anúncios Criados</h3>
          <div className="space-y-3">
            {anunciosRecentes.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem anúncios</div>
            ) : anunciosRecentes.map((a) => (
              <div key={String(a.id ?? a.nome)} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{a.nome || 'Anúncio'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{a.plataforma || '—'} • {a.criado_em ? new Date(a.criado_em).toLocaleDateString('pt-BR') : '—'}</div>
                </div>
                <div className={`text-xs ${String(a.status||'').toLowerCase().includes('ativo') ? 'text-green-600' : 'text-yellow-600'}`}>{a.status || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
