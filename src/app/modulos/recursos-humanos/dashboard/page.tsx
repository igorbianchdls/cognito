
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

type ContratoRow = {
  id?: number | string
  funcionario_id?: number | string
  funcionario?: string
  funcionario_imagem_url?: string
  tipo_de_contrato?: string
  admissao?: string
  demissao?: string | null
  status?: string
}

type HistoricoRow = {
  id?: number | string
  funcionario_id?: number | string
  funcionario?: string
  funcionario_imagem_url?: string
  salario_base?: number | string
  tipo_de_pagamento?: string
  inicio_vigencia?: string
  fim_vigencia?: string | null
}

type DepartamentoRow = { departamento?: string; qtd_funcionarios?: number | string }

function toMonthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatNum(n?: number) { return (Number(n||0)).toLocaleString('pt-BR') }

export default function RHDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
  const [contratos, setContratos] = useState<ContratoRow[]>([])
  const [historico, setHistorico] = useState<HistoricoRow[]>([])
  const [departamentos, setDepartamentos] = useState<DepartamentoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Font map (compartilhado)
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

  // Header filters/actions (globais)
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

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de = toDateStr(toMonthStart())
        const base = '/api/modulos/rh'
        const [cRes, hRes, dRes] = await Promise.allSettled([
          fetch(`${base}?view=contratos&de=${de}&page=1&pageSize=1000`, { cache: 'no-store' }),
          fetch(`${base}?view=historico-salarial&de=${de}&page=1&pageSize=1000`, { cache: 'no-store' }),
          fetch(`${base}?view=departamentos`, { cache: 'no-store' }),
        ])
        let cs: ContratoRow[] = []
        let hs: HistoricoRow[] = []
        let ds: DepartamentoRow[] = []
        if (cRes.status === 'fulfilled' && cRes.value.ok) { const j = await cRes.value.json(); cs = Array.isArray(j?.rows) ? j.rows as ContratoRow[] : [] }
        if (hRes.status === 'fulfilled' && hRes.value.ok) { const j = await hRes.value.json(); hs = Array.isArray(j?.rows) ? j.rows as HistoricoRow[] : [] }
        if (dRes.status === 'fulfilled' && dRes.value.ok) { const j = await dRes.value.json(); ds = Array.isArray(j?.rows) ? j.rows as DepartamentoRow[] : [] }

        if (cs.length === 0 && hs.length === 0 && ds.length === 0) {
          // mocks coerentes
          const mStart = toMonthStart(); const mKey = toDateStr(mStart).slice(0,7)
          cs = [
            { funcionario: 'Ana', admissao: `${mKey}-01`, demissao: null, status: 'ativo' },
            { funcionario: 'Bruno', admissao: `${mKey}-02`, demissao: null, status: 'ativo' },
            { funcionario: 'Caio', admissao: `${mKey}-03`, demissao: `${mKey}-10`, status: 'inativo' },
          ]
          hs = [
            { funcionario: 'Ana', salario_base: 6000, tipo_de_pagamento: 'CLT', inicio_vigencia: `${mKey}-01` },
            { funcionario: 'Bruno', salario_base: 4500, tipo_de_pagamento: 'CLT', inicio_vigencia: `${mKey}-02` },
            { funcionario: 'Caio', salario_base: 3000, tipo_de_pagamento: 'PJ', inicio_vigencia: `${mKey}-03`, fim_vigencia: `${mKey}-10` },
          ]
          ds = [ { departamento: 'Comercial', qtd_funcionarios: 8 }, { departamento: 'Engenharia', qtd_funcionarios: 12 }, { departamento: 'Financeiro', qtd_funcionarios: 5 } ]
        }

        if (!cancelled) { setContratos(cs); setHistorico(hs); setDepartamentos(ds) }
      } catch { if (!cancelled) setError('Falha ao carregar dados') } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  // KPIs
  const headcount = useMemo(() => {
    const nowKey = toDateStr(new Date())
    return contratos.filter(c => {
      const dem = c.demissao || ''
      return !dem || dem > nowKey
    }).length
  }, [contratos])

  const admissoesMes = useMemo(() => {
    const start = toDateStr(toMonthStart())
    const end = toDateStr(new Date())
    return contratos.filter(c => (c.admissao||'') >= start && (c.admissao||'') <= end).length
  }, [contratos])

  const demissoesMes = useMemo(() => {
    const start = toDateStr(toMonthStart())
    const end = toDateStr(new Date())
    return contratos.filter(c => (c.demissao||'') >= start && (c.demissao||'') <= end).length
  }, [contratos])

  const folhaEstim = useMemo(() => {
    // Estimativa: soma de salário base de históricos ativos no mês
    const start = toMonthStart(); const end = new Date()
    const isActiveOnMonth = (h: HistoricoRow) => {
      const ini = h.inicio_vigencia ? new Date(h.inicio_vigencia) : null
      const fim = h.fim_vigencia ? new Date(h.fim_vigencia) : null
      return (!!ini && ini <= end) && (!fim || fim >= start)
    }
    return historico.filter(isActiveOnMonth).reduce((acc, h) => acc + (Number(h.salario_base)||0), 0)
  }, [historico])

  // Charts
  const folhaPorTipo = useMemo(() => {
    const m = new Map<string, number>()
    const start = toMonthStart(); const end = new Date()
    for (const h of historico) {
      const ini = h.inicio_vigencia ? new Date(h.inicio_vigencia) : null
      const fim = h.fim_vigencia ? new Date(h.fim_vigencia) : null
      if (!(ini && ini <= end && (!fim || fim >= start))) continue
      const k = h.tipo_de_pagamento || '—'
      m.set(k, (m.get(k)||0) + (Number(h.salario_base)||0))
    }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value-a.value)
  }, [historico])

  const headcountPorDepto = useMemo(() => {
    return departamentos.map(d => ({ label: d.departamento || '—', value: Number(d.qtd_funcionarios||0) }))
      .sort((a,b)=> b.value-a.value)
  }, [departamentos])

  const ultimasMov = useMemo(() => {
    const recentAdms = [...contratos].sort((a,b)=> new Date(b.admissao||0).getTime() - new Date(a.admissao||0).getTime()).slice(0,3).map(c => ({ tipo:'Admissão', nome:c.funcionario||'—', data:c.admissao||'' }))
    const recentDems = [...contratos].filter(c=>!!c.demissao).sort((a,b)=> new Date(b.demissao||0).getTime() - new Date(a.demissao||0).getTime()).slice(0,3).map(c => ({ tipo:'Demissão', nome:c.funcionario||'—', data:c.demissao||'' }))
    return [...recentAdms, ...recentDems].sort((a,b)=> new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0,5)
  }, [contratos])

  function HBars({ items, color = 'bg-indigo-500' }: { items: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{it.value >= 1 ? formatBRL(it.value) : formatNum(it.value)}</span></div>
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
      subtitle="Você está na aba Dashboard do módulo Recursos Humanos"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(() => {
          const cardCls = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`
          return (
            <>
              <div className={cardCls} style={{ borderColor: cardBorderColor }}>
                <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Folha Estimada (mês)</div>
                <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatBRL(folhaEstim)}</div>
                <div className="text-xs text-gray-400 mt-1" style={styleText}>Soma dos salários vigentes</div>
              </div>
              <div className={cardCls} style={{ borderColor: cardBorderColor }}>
                <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Headcount Atual</div>
                <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatNum(headcount)}</div>
                <div className="text-xs text-gray-400 mt-1" style={styleText}>Contratos ativos</div>
              </div>
              <div className={cardCls} style={{ borderColor: cardBorderColor }}>
                <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Admissões (mês)</div>
                <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatNum(admissoesMes)}</div>
                <div className="text-xs text-gray-400 mt-1" style={styleText}>Entrada de colaboradores</div>
              </div>
              <div className={cardCls} style={{ borderColor: cardBorderColor }}>
                <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Demissões (mês)</div>
                <div className="text-2xl font-bold text-rose-600" style={styleValues}>{formatNum(demissoesMes)}</div>
                <div className="text-xs text-gray-400 mt-1" style={styleText}>Saídas registradas</div>
              </div>
            </>
          )
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Folha por Tipo de Pagamento</h3>
          <HBars items={folhaPorTipo} color="bg-sky-500" />
        </div>
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Headcount por Departamento</h3>
          <HBars items={headcountPorDepto} color="bg-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimas Movimentações</h3>
          <div className="space-y-3">
            {ultimasMov.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem movimentações</div>
            ) : ultimasMov.map((m, idx) => (
              <div key={`${m.tipo}-${m.nome}-${idx}`} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{m.tipo} • {m.nome}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{new Date(m.data).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className={`text-xs ${m.tipo === 'Admissão' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.tipo}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Observações</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5" style={styleText}>
            <li>Use contratos e histórico salarial para validar a folha.</li>
            <li>Parametrize benefícios e encargos para custo total por colaborador.</li>
            <li>Acompanhe admissões/demissões para prever impacto de headcount.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
