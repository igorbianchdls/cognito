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

type ContaRow = {
  id?: number | string
  conta?: string
  plataforma?: string
  seguidores?: number | string
  seguindo?: number | string
  total_publicacoes?: number | string
  taxa_engajamento?: number | string
  registrado_em?: string
}

type PublicacaoRow = {
  id?: number | string
  conta?: string
  titulo?: string
  tipo?: string
  status?: string
  criado_em?: string
  atualizado_em?: string
}

type MetricasRow = {
  id_publicacao?: number | string
  conta?: string
  titulo?: string
  tipo?: string
  curtidas?: number | string
  comentarios?: number | string
  compartilhamentos?: number | string
  visualizacoes?: number | string
  impressoes?: number | string
  taxa_engajamento?: number | string
  ultimo_registro?: string
}

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function parseDate(s?: string) { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d }
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
function monthLabel(key: string) { const [y, m] = key.split('-').map(Number); const d = new Date(y, (m || 1) - 1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
function lastMonths(n: number) { const arr: string[] = []; const base = new Date(); for (let i= n-1;i>=0;i--){ const d=new Date(base.getFullYear(), base.getMonth()-i, 1); arr.push(monthKey(d)) } return arr }
function formatNum(n?: number) { return (n ?? 0).toLocaleString('pt-BR') }
// formatBR removido por não uso

export default function MarketingDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
  const [contas, setContas] = useState<ContaRow[]>([])
  const [pubs, setPubs] = useState<PublicacaoRow[]>([])
  const [mets, setMets] = useState<MetricasRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de6m = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const de30 = toDateOnly(new Date(Date.now() - 29 * 86400000))
        const urls = [
          `/api/modulos/marketing?view=contas&page=1&pageSize=1000&de=${de6m}`,
          `/api/modulos/marketing?view=publicacoes&page=1&pageSize=1000&de=${de30}`,
          `/api/modulos/marketing?view=metricas&page=1&pageSize=1000&de=${de30}`,
        ]
        const [cRes, pRes, mRes] = await Promise.allSettled(urls.map(u => fetch(u, { cache: 'no-store' })))
        let cs: ContaRow[] = []
        let ps: PublicacaoRow[] = []
        let ms: MetricasRow[] = []
        if (cRes.status === 'fulfilled' && cRes.value.ok) {
          const j = (await cRes.value.json()) as { rows?: unknown[] }
          cs = Array.isArray(j?.rows) ? (j.rows as unknown as ContaRow[]) : []
        }
        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const j = (await pRes.value.json()) as { rows?: unknown[] }
          ps = Array.isArray(j?.rows) ? (j.rows as unknown as PublicacaoRow[]) : []
        }
        if (mRes.status === 'fulfilled' && mRes.value.ok) {
          const j = (await mRes.value.json()) as { rows?: unknown[] }
          ms = Array.isArray(j?.rows) ? (j.rows as unknown as MetricasRow[]) : []
        }
        if (cs.length === 0 && ps.length === 0 && ms.length === 0) {
          // Mocks coerentes
          const base = new Date()
          const d0 = toDateOnly(base)
          const d1 = toDateOnly(new Date(base.getFullYear(), base.getMonth(), base.getDate()-7))
          cs = [
            { conta: '@brand_ig', plataforma: 'Instagram', seguidores: 12500, total_publicacoes: 320, taxa_engajamento: 4.2, registrado_em: d0 },
            { conta: '@brand_tt', plataforma: 'TikTok', seguidores: 8300, total_publicacoes: 210, taxa_engajamento: 6.1, registrado_em: d0 },
            { conta: '@brand_fb', plataforma: 'Facebook', seguidores: 5600, total_publicacoes: 540, taxa_engajamento: 2.8, registrado_em: d0 },
            { conta: '@brand_li', plataforma: 'LinkedIn', seguidores: 2147, total_publicacoes: 120, taxa_engajamento: 3.5, registrado_em: d0 },
            { conta: '@brand_ig', plataforma: 'Instagram', seguidores: 12100, total_publicacoes: 315, taxa_engajamento: 4.0, registrado_em: d1 },
            { conta: '@brand_tt', plataforma: 'TikTok', seguidores: 7900, total_publicacoes: 205, taxa_engajamento: 5.9, registrado_em: d1 },
          ]
          ps = [
            { id: 1, conta: '@brand_ig', titulo: 'Lançamento X', tipo: 'Reel', status: 'publicado', criado_em: d0 },
            { id: 2, conta: '@brand_tt', titulo: 'Trend Y', tipo: 'Vídeo', status: 'publicado', criado_em: d0 },
            { id: 3, conta: '@brand_fb', titulo: 'Bastidores', tipo: 'Post', status: 'publicado', criado_em: d1 },
          ]
          ms = [
            { id_publicacao: 1, conta: '@brand_ig', titulo: 'Lançamento X', tipo: 'Reel', curtidas: 820, comentarios: 95, compartilhamentos: 40, visualizacoes: 24000, impressoes: 30000, taxa_engajamento: 3.18, ultimo_registro: d0 },
            { id_publicacao: 2, conta: '@brand_tt', titulo: 'Trend Y', tipo: 'Vídeo', curtidas: 1500, comentarios: 210, compartilhamentos: 180, visualizacoes: 68000, impressoes: 72000, taxa_engajamento: 2.56, ultimo_registro: d0 },
            { id_publicacao: 3, conta: '@brand_fb', titulo: 'Bastidores', tipo: 'Post', curtidas: 260, comentarios: 40, compartilhamentos: 22, visualizacoes: 9000, impressoes: 11000, taxa_engajamento: 2.91, ultimo_registro: d1 },
          ]
        }
        if (!cancelled) { setContas(cs); setPubs(ps); setMets(ms) }
      } catch {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  // Font mapping (shared)
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

  // Header filters/actions (global)
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

  // Deduplicar contas pela leitura mais recente (por conta)
  const latestConta = useMemo(() => {
    const map = new Map<string, ContaRow>()
    for (const r of contas) {
      const key = String(r.conta || '')
      if (!key) continue
      const current = map.get(key)
      const rd = parseDate(r.registrado_em)?.getTime() || 0
      const cd = current ? (parseDate(current.registrado_em)?.getTime() || 0) : -1
      if (!current || rd > cd) map.set(key, r)
    }
    return Array.from(map.values())
  }, [contas])

  // KPIs
  const seguidoresTotais = useMemo(() => latestConta.reduce((acc, r) => acc + (Number(r.seguidores) || 0), 0), [latestConta])
  const publicacoes30d = useMemo(() => pubs.length, [pubs])
  const engajamentoGeral = useMemo(() => {
    const inter = mets.reduce((acc, m) => acc + (Number(m.curtidas) || 0) + (Number(m.comentarios) || 0) + (Number(m.compartilhamentos) || 0), 0)
    const imps = mets.reduce((acc, m) => acc + (Number(m.impressoes) || 0), 0)
    if (imps <= 0) return 0
    return (inter / imps) * 100
  }, [mets])
  const crescimento30d = useMemo(() => {
    // delta seguidores entre primeiro e último snapshot do período
    type ContaAgg = { first?: number; last?: number; tFirst?: number; tLast?: number }
    const byConta = new Map<string, ContaAgg>()
    for (const r of contas) {
      const k = String(r.conta || '')
      if (!k) continue
      const val = Number(r.seguidores) || 0
      const t = parseDate(r.registrado_em)?.getTime() || 0
      const cur: ContaAgg = byConta.get(k) ?? {}
      if (cur.first == null || t < (cur.tFirst ?? Number.POSITIVE_INFINITY)) { cur.tFirst = t; cur.first = val }
      if (cur.last == null || t > (cur.tLast ?? Number.NEGATIVE_INFINITY)) { cur.tLast = t; cur.last = val }
      byConta.set(k, cur)
    }
    let firstSum = 0; let lastSum = 0
    for (const v of byConta.values()) { firstSum += v.first || 0; lastSum += v.last || 0 }
    if (firstSum <= 0) return 0
    return ((lastSum - firstSum) / firstSum) * 100
  }, [contas])

  // Engajamento por plataforma (média ponderada por seguidores)
  const engajPorPlataforma = useMemo(() => {
    const agg = new Map<string, { seg: number; weighted: number }>()
    for (const r of latestConta) {
      const plat = r.plataforma || '—'
      const seg = Number(r.seguidores) || 0
      const er = Number(r.taxa_engajamento) || 0
      const cur = agg.get(plat) || { seg: 0, weighted: 0 }
      cur.seg += seg
      cur.weighted += er * seg
      agg.set(plat, cur)
    }
    return Array.from(agg, ([label, v]) => ({ label, value: v.seg > 0 ? v.weighted / v.seg : 0 }))
      .sort((a,b)=> b.value - a.value)
  }, [latestConta])

  // Crescimento de seguidores por mês (soma do último snapshot do mês)
  const meses = useMemo(() => lastMonths(6), [])
  const seguidoresMes = useMemo(() => {
    const byMes = new Map<string, Map<string, { t: number; seg: number }>>() // mes -> conta -> latest
    for (const r of contas) {
      const d = parseDate(r.registrado_em); if (!d) continue
      const k = monthKey(d)
      const conta = String(r.conta || '')
      const seg = Number(r.seguidores) || 0
      const t = d.getTime()
      const map = byMes.get(k) || new Map<string, { t: number; seg: number }>()
      const cur = map.get(conta)
      if (!cur || t > cur.t) map.set(conta, { t, seg })
      byMes.set(k, map)
    }
    return meses.map(k => {
      const m = byMes.get(k)
      const total = m ? Array.from(m.values()).reduce((acc, v) => acc + v.seg, 0) : 0
      return { key: k, label: monthLabel(k), value: total }
    })
  }, [contas, meses])

  // Top posts por engajamento
  const topPosts = useMemo(() => {
    const withER = mets.map(m => ({
      titulo: m.titulo || 'Post',
      conta: m.conta || '—',
      er: Number(m.taxa_engajamento) || 0,
      views: Number(m.visualizacoes) || 0,
      curtidas: Number(m.curtidas) || 0,
    }))
    return withER.sort((a,b)=> b.er - a.er).slice(0, 5)
  }, [mets])

  // Desempenho por plataforma (seguidores totais)
  const desempenhoPlataforma = useMemo(() => {
    const agg = new Map<string, { seguidores: number; contas: number }>()
    for (const r of latestConta) {
      const plat = r.plataforma || '—'
      const seg = Number(r.seguidores) || 0
      const cur = agg.get(plat) || { seguidores: 0, contas: 0 }
      cur.seguidores += seg; cur.contas += 1
      agg.set(plat, cur)
    }
    return Array.from(agg, ([plataforma, v]) => ({ plataforma, seguidores: v.seguidores, contas: v.contas }))
      .sort((a,b)=> b.seguidores - a.seguidores)
  }, [latestConta])

  const recentes = useMemo(() => {
    return [...pubs].sort((a,b)=> new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime()).slice(0,3)
  }, [pubs])

  // Simple chart components
  function HBars({ items, suffix = '', color = 'bg-indigo-500' }: { items: { label: string; value: number }[]; suffix?: string; color?: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{suffix ? `${it.value.toFixed(2)}${suffix}` : it.value.toFixed(2)}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
      </div>
    )
  }

  function LineSimple({ items, color = '#2563eb' }: { items: { label: string; value: number }[]; color?: string }) {
    const W = 520, H = 180, padX = 16, padY = 12
    const max = Math.max(1, ...items.map(i => i.value)); const min = Math.min(0, ...items.map(i => i.value))
    const n = Math.max(1, items.length); const xStep = (W - padX * 2) / Math.max(1, n - 1)
    const scaleY = (v: number) => { const rng = max - min || 1; const t = (v - min) / rng; return H - padY - t * (H - padY * 2) }
    const pts = items.map((p, i) => `${padX + i * xStep},${scaleY(p.value)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
        <defs>
          <linearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />
        {items.length > 1 && (
          <polygon points={`${padX},${scaleY(items[0].value)} ${pts} ${padX + (n - 1) * xStep},${H - padY} ${padX},${H - padY}`} fill="url(#gradLine)" />
        )}
      </svg>
    )
  }

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Marketing"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Seguidores Totais</div>
          <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatNum(seguidoresTotais)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Somatório (último snapshot)</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Taxa de Engajamento</div>
          <div className="text-2xl font-bold text-green-600" style={styleValues}>{engajamentoGeral.toFixed(2)}%</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Interações / impressões (30d)</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Publicações (30d)</div>
          <div className="text-2xl font-bold text-purple-600" style={styleValues}>{formatNum(publicacoes30d)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Total de posts</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Crescimento de Seguidores</div>
          <div className="text-2xl font-bold text-orange-600" style={styleValues}>{crescimento30d.toFixed(2)}%</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Variação no período</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Engajamento por Plataforma</h3>
          <HBars items={engajPorPlataforma} suffix="%" color="bg-emerald-500" />
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Crescimento de Seguidores</h3>
          <LineSimple items={seguidoresMes.map(m => ({ label: m.label, value: m.value }))} />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {seguidoresMes.map(m => (<div key={m.key} className="text-[11px] text-gray-600 text-center" style={styleText}>{m.label}</div>))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Top Posts (ER%)</h3>
          <div className="space-y-3">
            {topPosts.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem dados</div>
            ) : topPosts.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{p.titulo}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{p.conta} • {formatNum(p.views)} views</div>
                </div>
                <div className="text-emerald-700 font-semibold text-sm">{p.er.toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Desempenho por Plataforma</h3>
          <div className="space-y-3">
            {desempenhoPlataforma.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem dados</div>
            ) : desempenhoPlataforma.map((x) => (
              <div key={x.plataforma} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-sm" style={styleText}>{x.plataforma}</span>
                </div>
                <span className="font-semibold text-sm" style={styleText}>{formatNum(x.seguidores)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimas Publicações</h3>
          <div className="space-y-3">
            {recentes.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem publicações</div>
            ) : recentes.map((p) => (
              <div key={String(p.id ?? p.titulo)} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{p.titulo || 'Post'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{p.conta || '—'} • {p.criado_em ? new Date(p.criado_em).toLocaleDateString('pt-BR') : '—'}</div>
                </div>
                <div className="font-semibold text-blue-600 text-sm">{p.tipo || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
