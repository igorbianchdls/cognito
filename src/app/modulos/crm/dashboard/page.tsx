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

type OportunidadeRow = {
  oportunidade?: string
  conta?: string
  responsavel?: string
  estagio?: string
  valor?: number | string
  probabilidade?: number | string
  data_fechamento?: string
}

type LeadRow = {
  lead?: string
  empresa?: string
  origem?: string
  status?: string
}

type AtividadeRow = {
  assunto?: string
  tipo?: string
  status?: string
  data_vencimento?: string
  conta?: string
  lead?: string
  oportunidade?: string
}

function formatBRL(v: unknown) {
  const n = Number(v ?? 0)
  if (isNaN(n)) return String(v ?? '')
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function toDateOnly(d: Date) {
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function parseDate(s?: string) { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d }
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
function monthKeyFromStr(s?: string) { const d = parseDate(s); return d ? monthKey(d) : null }
function monthLabel(key: string) { const [y, m] = key.split('-').map(Number); const d = new Date(y, (m || 1) - 1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
function lastMonths(n: number) { const arr: string[] = []; const base = new Date(); for (let i= n-1;i>=0;i--){ const d=new Date(base.getFullYear(), base.getMonth()-i, 1); arr.push(monthKey(d)) } return arr }
function isClosedWon(estagio?: string) { if (!estagio) return false; const s = estagio.toLowerCase(); return s.includes('ganh') || s.includes('won') }
function isClosedLost(estagio?: string) { if (!estagio) return false; const s = estagio.toLowerCase(); return s.includes('perd') || s.includes('lost') }
function isClosed(estagio?: string) { return isClosedWon(estagio) || isClosedLost(estagio) || (estagio?.toLowerCase().includes('fech')) }

export default function CRMDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
  const [opps, setOpps] = useState<OportunidadeRow[]>([])
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [ativs, setAtivs] = useState<AtividadeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const urls = [
          `/api/modulos/crm?view=oportunidades&page=1&pageSize=1000&de=${de}`,
          `/api/modulos/crm?view=leads&page=1&pageSize=1000`,
          `/api/modulos/crm?view=atividades&page=1&pageSize=1000&de=${de}`,
        ]
        const [oRes, lRes, aRes] = await Promise.allSettled(urls.map(u => fetch(u, { cache: 'no-store' })))
        let os: OportunidadeRow[] = []
        let ls: LeadRow[] = []
        let as: AtividadeRow[] = []
        if (oRes.status === 'fulfilled' && oRes.value.ok) {
          const j = (await oRes.value.json()) as { rows?: unknown[] }
          os = Array.isArray(j?.rows) ? (j.rows as unknown as OportunidadeRow[]) : []
        }
        if (lRes.status === 'fulfilled' && lRes.value.ok) {
          const j = (await lRes.value.json()) as { rows?: unknown[] }
          ls = Array.isArray(j?.rows) ? (j.rows as unknown as LeadRow[]) : []
        }
        if (aRes.status === 'fulfilled' && aRes.value.ok) {
          const j = (await aRes.value.json()) as { rows?: unknown[] }
          as = Array.isArray(j?.rows) ? (j.rows as unknown as AtividadeRow[]) : []
        }
        if (os.length === 0 && ls.length === 0 && as.length === 0) {
          // mocks
          const base = new Date()
          const m0 = toDateOnly(base)
          const m1 = toDateOnly(new Date(base.getFullYear(), base.getMonth(), base.getDate()-3))
          os = [
            { oportunidade: 'Tech Corp', conta: 'Tech Corp Ltda', estagio: 'Negociação', valor: 85000, probabilidade: 70, data_fechamento: m0 },
            { oportunidade: 'Comércio Global', conta: 'Comércio Global', estagio: 'Proposta', valor: 62500, probabilidade: 60, data_fechamento: m1 },
            { oportunidade: 'Indústria XYZ', conta: 'Indústria XYZ', estagio: 'Apresentação', valor: 120000, probabilidade: 50, data_fechamento: m0 },
            { oportunidade: 'Fechado ACME', conta: 'ACME', estagio: 'Fechado - Ganho', valor: 40000, probabilidade: 100, data_fechamento: m1 },
          ]
          ls = [
            { lead: 'João Silva', empresa: 'Alpha', origem: 'Website', status: 'Novo' },
            { lead: 'Maria Lima', empresa: 'Beta', origem: 'Indicação', status: 'Em contato' },
            { lead: 'Pedro Souza', empresa: 'Gama', origem: 'LinkedIn', status: 'Qualificado' },
            { lead: 'Carla Dias', empresa: 'Delta', origem: 'Email Marketing', status: 'Novo' },
          ]
          as = [
            { assunto: 'Reunião', tipo: 'Reunião', status: 'Pendente', data_vencimento: m0, conta: 'Tech Corp' },
            { assunto: 'Email de proposta', tipo: 'Email', status: 'Concluída', data_vencimento: m1, conta: 'Comércio Global' },
          ]
        }
        if (!cancelled) { setOpps(os); setLeads(ls); setAtivs(as) }
      } catch {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  // KPIs
  const openOpps = useMemo(() => opps.filter(o => !isClosed(o.estagio)), [opps])
  const kpis = useMemo(() => {
    // Faturamento: soma de valores de oportunidades ganhas
    const faturamento = opps
      .filter(o => isClosedWon(o.estagio))
      .reduce((acc, o) => acc + (Number(o.valor) || 0), 0)

    // Vendas: contagem de oportunidades ganhas
    const vendas = opps.filter(o => isClosedWon(o.estagio)).length

    // Leads: total de leads
    const totalLeads = leads.length

    // Taxa de conversão: (vendas / leads) * 100
    const taxaConversao = totalLeads > 0 ? (vendas / totalLeads) * 100 : 0

    return { faturamento, vendas, totalLeads, taxaConversao }
  }, [opps, leads])

  // Funil por estágio (soma de valor)
  const stageOrder = (s?: string) => {
    const x = (s || '').toLowerCase()
    if (x.includes('pros') || x.includes('desc')) return 1
    if (x.includes('qual')) return 2
    if (x.includes('apre') || x.includes('demo')) return 3
    if (x.includes('prop') || x.includes('proposta')) return 4
    if (x.includes('nego')) return 5
    if (isClosedWon(s)) return 6
    if (isClosedLost(s)) return 7
    if (x.includes('fech')) return 8
    return 9
  }
  const funnel = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of opps) {
      const k = o.estagio || '—'
      m.set(k, (m.get(k) || 0) + (Number(o.valor) || 0))
    }
    return Array.from(m, ([label, value]) => ({ label, value, order: stageOrder(label) }))
      .sort((a,b)=> a.order - b.order)
  }, [opps])

  // Conversões (ganhos) por mês (6m)
  const meses = useMemo(() => lastMonths(6), [])
  const winsMes = useMemo(() => {
    const m = new Map<string, number>()
    for (const k of meses) m.set(k, 0)
    for (const o of opps) {
      if (!isClosedWon(o.estagio)) continue
      const k = monthKeyFromStr(o.data_fechamento)
      if (k && m.has(k)) m.set(k, (m.get(k) || 0) + 1)
    }
    return meses.map(k => ({ key: k, label: monthLabel(k), value: m.get(k) || 0 }))
  }, [opps, meses])

  // Fontes de leads (contagem)
  const fontesLeads = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of leads) {
      const k = l.origem || '—'
      m.set(k, (m.get(k) || 0) + 1)
    }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value - a.value).slice(0, 5)
  }, [leads])

  // Oportunidades quentes (alta prob. e próximas)
  const hotOpps = useMemo(() => {
    const withScore = openOpps.map(o => {
      const p = Number(o.probabilidade) || 0
      const d = parseDate(o.data_fechamento)
      const dd = d ? d.getTime() : Infinity
      const score = p * 2 + (isFinite(dd) ? (1 / Math.max(1, (dd - Date.now()))) * 1e6 : 0)
      return { ...o, p, dd, score }
    })
    return withScore.sort((a,b)=> b.score - a.score).slice(0,5)
  }, [openOpps])

  const recentAtivs = useMemo(() => {
    return [...ativs]
      .sort((a,b)=> new Date(b.data_vencimento || 0).getTime() - new Date(a.data_vencimento || 0).getTime())
      .slice(0,3)
  }, [ativs])

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

  // Header actions
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

  // Simple bars (currency)

  function HBarsCurrency({ items, color }: { items: { label: string; value: number }[]; color: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{formatBRL(it.value)}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo CRM"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(() => { const cls = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`; return (
          <>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Faturamento</div>
              <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatBRL(kpis.faturamento)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Oportunidades fechadas/ganhas</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Vendas</div>
              <div className="text-2xl font-bold text-blue-600" style={styleValues}>{kpis.vendas}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Oportunidades ganhas</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Leads</div>
              <div className="text-2xl font-bold text-purple-600" style={styleValues}>{kpis.totalLeads}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Total de leads ativos</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Taxa de Conversão</div>
              <div className="text-2xl font-bold text-orange-600" style={styleValues}>{kpis.taxaConversao.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Leads → Vendas</div>
            </div>
          </>
        )})()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Funil de Vendas</h3>
          <HBarsCurrency items={funnel.map(f => ({ label: f.label, value: f.value }))} color="bg-cyan-500" />
        </div>
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Conversões por Mês</h3>
          <div className="grid grid-cols-6 gap-3 h-44 items-end">
            {winsMes.map(m => {
              const max = Math.max(1, ...winsMes.map(x => x.value))
              const h = Math.round((m.value / max) * 100)
              return (
                <div key={m.key} className="flex flex-col items-center justify-end gap-1">
                  <div className="w-full bg-indigo-500/80 rounded" style={{ height: `${h}%` }} />
                  <div className="text-[11px] text-gray-600" style={styleText}>{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Oportunidades Quentes</h3>
          <div className="space-y-3">
            {hotOpps.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem oportunidades</div>
            ) : hotOpps.map((o, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{o.oportunidade || o.conta || 'Oportunidade'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{o.estagio || '—'} • {o.probabilidade ?? '—'}%</div>
                </div>
                <div className="font-semibold text-green-700">{formatBRL(o.valor)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Top Fontes de Leads</h3>
          <div className="space-y-3">
            {fontesLeads.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem dados</div>
            ) : fontesLeads.map((f) => (
              <div key={f.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                  <span className="text-sm" style={styleText}>{f.label}</span>
                </div>
                <span className="font-semibold text-sm" style={styleText}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimas Atividades</h3>
          <div className="space-y-3">
            {recentAtivs.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem atividades</div>
            ) : recentAtivs.map((a, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{a.assunto || a.tipo || 'Atividade'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{a.conta || a.lead || a.oportunidade || '—'}</div>
                </div>
                <div className="text-xs text-gray-400">{a.data_vencimento ? new Date(a.data_vencimento).toLocaleDateString('pt-BR') : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
