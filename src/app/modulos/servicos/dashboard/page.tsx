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

type OSRow = {
  id?: number | string
  numero_os?: string
  cliente?: string
  tecnico_responsavel?: string
  status?: string
  prioridade?: string
  data_abertura?: string
  data_prevista?: string
  data_conclusao?: string
  valor_estimado?: number | string
  valor_final?: number | string
}

type TecnicoRow = { tecnico?: string; status?: string }

function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatNum(n?: number) { return (Number(n||0)).toLocaleString('pt-BR') }
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` }
function monthLabel(key: string) { const [y,m] = key.split('-').map(Number); const d=new Date(y,(m||1)-1,1); return d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}) }

export default function ServicosDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
  const [oss, setOss] = useState<OSRow[]>([])
  const [tecs, setTecs] = useState<TecnicoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de6m = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`
        const [oRes, tRes] = await Promise.allSettled([
          fetch(`/api/modulos/servicos?view=ordens-servico&page=1&pageSize=1000&de=${de6m}`, { cache: 'no-store' }),
          fetch(`/api/modulos/servicos?view=tecnicos&page=1&pageSize=1000`, { cache: 'no-store' }),
        ])
        let os: OSRow[] = []
        let ts: TecnicoRow[] = []
        if (oRes.status === 'fulfilled' && oRes.value.ok) { const j = await oRes.value.json(); os = Array.isArray(j?.rows) ? j.rows as OSRow[] : [] }
        if (tRes.status === 'fulfilled' && tRes.value.ok) { const j = await tRes.value.json(); ts = Array.isArray(j?.rows) ? j.rows as TecnicoRow[] : [] }

        if (os.length === 0 && ts.length === 0) {
          // mocks
          const today = new Date(); const m0 = monthKey(today)
          const m1 = monthKey(new Date(today.getFullYear(), today.getMonth()-1, 1))
          os = [
            { numero_os: 'OS-1245', cliente: 'Cliente Premium Ltda', status: 'aberta', prioridade: 'crítico', data_abertura: `${m0}-05`, data_prevista: `${m0}-08`, valor_estimado: 3500 },
            { numero_os: 'OS-1238', cliente: 'Indústria ABC', status: 'em andamento', prioridade: 'alto', data_abertura: `${m0}-03`, data_prevista: `${m0}-10`, valor_estimado: 1200 },
            { numero_os: 'OS-1240', cliente: 'Tech Solutions', status: 'concluída', prioridade: 'médio', data_abertura: `${m0}-01`, data_conclusao: `${m0}-02`, valor_final: 3500 },
            { numero_os: 'OS-1235', cliente: 'Comércio DEF', status: 'concluída', prioridade: 'baixo', data_abertura: `${m1}-28`, data_conclusao: `${m0}-01`, valor_final: 1200 },
            { numero_os: 'OS-1229', cliente: 'Indústria GHI', status: 'concluída', prioridade: 'alto', data_abertura: `${m1}-20`, data_conclusao: `${m1}-25`, valor_final: 2800 },
          ]
          ts = [ { tecnico: 'João Silva', status: 'ativo' }, { tecnico: 'Maria Santos', status: 'ativo' }, { tecnico: 'Pedro Costa', status: 'ativo' } ]
        }
        if (!cancelled) { setOss(os); setTecs(ts) }
      } catch { if (!cancelled) setError('Falha ao carregar dados') }
      finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  const isClosed = (s?: string) => (s||'').toLowerCase().includes('concl') || (s||'').toLowerCase().includes('fech')
  const isOpen = (s?: string) => !isClosed(s)

  // KPIs
  const ordensAbertas = useMemo(() => oss.filter(o => isOpen(o.status)).length, [oss])
  const tecnicosAtivos = useMemo(() => tecs.filter(t => (t.status||'').toLowerCase().includes('ativo')).length || tecs.length, [tecs])
  const receitaMes = useMemo(() => {
    const key = monthKey(new Date())
    return oss
      .filter(o => isClosed(o.status) && (o.data_conclusao||'').startsWith(key))
      .reduce((acc, o) => acc + (Number(o.valor_final)||0), 0)
  }, [oss])
  const tmaDias = useMemo(() => {
    const diffs = oss.filter(o => isClosed(o.status) && o.data_abertura && o.data_conclusao)
      .map(o => {
        const a = new Date(o.data_abertura as string).getTime(); const c = new Date(o.data_conclusao as string).getTime();
        return Math.max(0, (c-a)/(1000*60*60*24))
      })
    if (diffs.length === 0) return 0
    return diffs.reduce((a,b)=>a+b,0)/diffs.length
  }, [oss])

  // Font map (shared)
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

  // Header filters/actions
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

  // Charts: Status e Receita mensal 6m
  const statusDist = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of oss) { const k = (o.status||'—'); m.set(k, (m.get(k)||0)+1) }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value-a.value)
  }, [oss])

  const meses = useMemo(() => { const arr: string[] = []; const base=new Date(); for (let i=5;i>=0;i--){ arr.push(monthKey(new Date(base.getFullYear(), base.getMonth()-i, 1))) } return arr }, [])
  const receitaMensal = useMemo(() => {
    const agg = new Map<string, number>(); for (const k of meses) agg.set(k, 0)
    for (const o of oss) { if (isClosed(o.status) && o.data_conclusao) { const k = (o.data_conclusao as string).slice(0,7); if (agg.has(k)) agg.set(k, (agg.get(k)||0) + (Number(o.valor_final)||0)) } }
    return meses.map(k => ({ key: k, label: monthLabel(k), value: agg.get(k)||0 }))
  }, [oss, meses])

  // Lists
  const ordensUrgentes = useMemo(() => {
    const orderPrio = (p?: string) => { const s=(p||'').toLowerCase(); if (s.includes('crít')||s.includes('crit')) return 3; if (s.includes('alto')) return 2; if (s.includes('méd')||s.includes('med')) return 1; return 0 }
    return oss.filter(o => isOpen(o.status)).map(o => ({...o, pr: orderPrio(o.prioridade)})).sort((a,b)=> b.pr - a.pr).slice(0,5)
  }, [oss])

  const topTecnicosMes = useMemo(() => {
    const key = monthKey(new Date()); const m = new Map<string, number>()
    for (const o of oss) { if (isClosed(o.status) && (o.data_conclusao||'').startsWith(key)) { const t=o.tecnico_responsavel||'—'; m.set(t, (m.get(t)||0)+1) } }
    return Array.from(m, ([tecnico, total]) => ({ tecnico, total })).sort((a,b)=> b.total-a.total).slice(0,6)
  }, [oss])

  const ultimasConcluidas = useMemo(() => {
    return oss.filter(o => isClosed(o.status) && o.data_conclusao).sort((a,b)=> new Date(b.data_conclusao as string).getTime() - new Date(a.data_conclusao as string).getTime()).slice(0,3)
  }, [oss])

  // Simple chart components
  function HBars({ items, color = 'bg-indigo-500' }: { items: { label: string; value: number }[]; color?: string }) {
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

  function BarsReceita({ items }: { items: { label: string; value: number }[] }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div>
        <div className="grid grid-cols-6 gap-3 h-44 items-end">
          {items.map(it => {
            const h = Math.round((it.value / max) * 100)
            return (
              <div key={it.label} className="flex flex-col items-center justify-end gap-1">
                <div className="w-full bg-emerald-500/80 rounded" style={{ height: `${h}%` }} />
                <div className="text-[11px] text-gray-600">{it.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Serviços"
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
            <div className={cls} style={{ borderColor: cardBorderColor}}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Ordens Abertas</div>
              <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatNum(ordensAbertas)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Em progresso e pendentes</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor}}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Técnicos Ativos</div>
              <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatNum(tecnicosAtivos)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Disponíveis no período</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor}}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Receita do Mês</div>
              <div className="text-2xl font-bold text-purple-600" style={styleValues}>{formatBRL(receitaMes)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Somatório de OS concluídas</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor}}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Tempo Médio</div>
              <div className="text-2xl font-bold text-orange-600" style={styleValues}>{tmaDias.toFixed(1)} dias</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Conclusão de ordens</div>
            </div>
          </>
        )})()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Ordens por Status</h3>
          <HBars items={statusDist} color="bg-cyan-500" />
        </div>
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Receita de Serviços (Mensal)</h3>
          <BarsReceita items={receitaMensal.map(m => ({ label: m.label, value: m.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Ordens Urgentes</h3>
          <div className="space-y-3">
            {ordensUrgentes.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem ordens</div>
            ) : ordensUrgentes.map((o, idx) => (
              <div key={`${o.numero_os}-${idx}`} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{o.numero_os} - {o.prioridade || '—'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{o.cliente || '—'}</div>
                </div>
                <div className={`text-xs ${String(o.prioridade||'').toLowerCase().includes('crít')||String(o.prioridade||'').toLowerCase().includes('crit') ? 'text-red-600' : 'text-orange-600'}`}>{o.prioridade || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Top Técnicos (Mês)</h3>
          <div className="space-y-3">
            {topTecnicosMes.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem dados</div>
            ) : topTecnicosMes.map((t) => (
              <div key={t.tecnico} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-sm" style={styleText}>{t.tecnico}</span>
                </div>
                <span className="font-semibold text-sm" style={styleText}>{formatNum(t.total)} OS</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimas Ordens Concluídas</h3>
          <div className="space-y-3">
            {ultimasConcluidas.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem ordens concluídas</div>
            ) : ultimasConcluidas.map((o, idx) => (
              <div key={`${o.numero_os}-done-${idx}`} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{o.numero_os || 'OS'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{o.cliente || '—'}</div>
                </div>
                <div className="font-semibold text-green-600 text-sm">{formatBRL(Number(o.valor_final)||0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
