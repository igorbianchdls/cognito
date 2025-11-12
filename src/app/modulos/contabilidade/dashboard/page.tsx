
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import DRETable from '@/components/relatorios/DRETable'
import BPTabela from '@/components/modulos/contabilidade/BPTabela'
import WaterfallDRE from '@/components/modulos/contabilidade/WaterfallDRE'
import { MultiLine } from '@/components/modulos/financeiro/NivoCharts'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions } from '@/stores/modulos/financeiroDashboardStore'

type BPLinha = { conta: string; valor: number }
type BPSecao = { nome: string; linhas: BPLinha[] }
type BPResponse = { success: boolean; view: string; from: string; to: string; ativo: BPSecao[]; passivo: BPSecao[]; pl: BPSecao[] }

type DRENode = { id: string; name: string; valuesByPeriod: Record<string, number>; children?: DRENode[] }
type DREPeriod = { key: string; label: string }
type DREResponse = { success: boolean; view: string; periods: DREPeriod[]; nodes: DRENode[] }

type LancRow = { lancamento_id?: number | string; data_lancamento?: string; historico?: string; debito?: number | string; credito?: number | string; conta_codigo?: string; conta_nome?: string }

function sumSecao(list: BPSecao[], match: (s: string) => boolean) {
  let total = 0
  for (const sec of list) { if (match(sec.nome)) for (const l of sec.linhas) total += Number(l.valor || 0) }
  return total
}
function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatNum(n?: number) { return (Number(n||0)).toLocaleString('pt-BR') }

export default function ContabilidadeDashboardPage() {
  // Global UI (reuso das props do dashboard financeiro)
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
  
  const [bp, setBp] = useState<BPResponse | null>(null)
  const [dre, setDre] = useState<DREResponse | null>(null)
  const [lanc, setLanc] = useState<LancRow[]>([])
  const [contKpis, setContKpis] = useState<{ lucro?: number; margem_liquida?: number | null; capital_de_giro?: number; liquidez_corrente?: number | null; endividamento?: number | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Font map (mesmo helper do financeiro)
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

  const styleFilters = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.filters.family),
    fontWeight: fonts.filters.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.filters.letterSpacing === 'number' ? `${fonts.filters.letterSpacing}px` : undefined,
    color: fonts.filters.color || undefined,
    fontSize: typeof fonts.filters.size === 'number' ? `${fonts.filters.size}px` : undefined,
    textTransform: fonts.filters.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.filters])

  // Date range & filtro (globais)
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
        const today = new Date()
        const y = today.getFullYear(); const m = String(today.getMonth()+1).padStart(2,'0')
        const firstDay = `${y}-${m}-01`
        const fromISO = dateRange?.from ? dateRange.from.toISOString().slice(0,10) : firstDay
        const toISO = dateRange?.to ? dateRange.to.toISOString().slice(0,10) : today.toISOString().slice(0,10)
        const base = '/api/modulos/contabilidade'
        const [bpRes, dreRes, lRes, kpisRes] = await Promise.allSettled([
          fetch(`${base}?view=balanco-patrimonial&de=${fromISO}&ate=${toISO}`, { cache: 'no-store' }),
          fetch(`${base}?view=dre&de=${fromISO}&ate=${toISO}`, { cache: 'no-store' }),
          fetch(`${base}?view=lancamentos&page=1&pageSize=10&order_by=data_lancamento&order_dir=desc`, { cache: 'no-store' }),
          fetch(`${base}?view=kpis&de=${fromISO}&ate=${toISO}`, { cache: 'no-store' }),
        ])
        let bpJ: BPResponse | null = null
        let dreJ: DREResponse | null = null
        let lJ: LancRow[] = []
        if (bpRes.status === 'fulfilled' && bpRes.value.ok) { const j = await bpRes.value.json(); if (j?.success) bpJ = j as BPResponse }
        if (dreRes.status === 'fulfilled' && dreRes.value.ok) { const j = await dreRes.value.json(); if (j?.success) dreJ = j as DREResponse }
        if (lRes.status === 'fulfilled' && lRes.value.ok) { const j = await lRes.value.json(); lJ = Array.isArray(j?.rows) ? j.rows as LancRow[] : [] }

        if (kpisRes.status === 'fulfilled' && kpisRes.value.ok) {
          const j = await kpisRes.value.json()
          if (j?.kpis) setContKpis(j.kpis as typeof contKpis)
        }

        if (!bpJ && !dreJ && lJ.length === 0) {
          // fallback mocks mínimos
          bpJ = {
            success: true, view: 'balanco-patrimonial', from: firstDay, to: new Date().toISOString().slice(0,10),
            ativo: [
              { nome: 'Ativo Circulante', linhas: [ { conta: '1.1.1 Caixa', valor: 35000 }, { conta: '1.1.2 Contas a Receber', valor: 42000 } ] },
              { nome: 'Ativo Não Circulante', linhas: [ { conta: '1.2.1 Imobilizado', valor: 90000 } ] },
            ],
            passivo: [
              { nome: 'Passivo Circulante', linhas: [ { conta: '2.1.1 Fornecedores', valor: 28000 } ] },
              { nome: 'Passivo Não Circulante', linhas: [ { conta: '2.2.1 Empréstimos', valor: 15000 } ] },
            ],
            pl: [ { nome: 'Patrimônio Líquido', linhas: [ { conta: '3.1 Capital Social', valor: 124000 } ] } ],
          }
          dreJ = {
            success: true, view: 'dre',
            periods: [ { key: `${y}-${m}`, label: 'Mês Atual' } ],
            nodes: [
              { id: 'receita', name: 'Receita', valuesByPeriod: {}, children: [
                { id:'rec-op', name:'Receitas Operacionais', valuesByPeriod: { [`${y}-${m}`]: 82000 } },
                { id:'rec-otr', name:'Outras Receitas', valuesByPeriod: { [`${y}-${m}`]: 3000 } },
              ]},
              { id: 'cogs', name: 'COGS', valuesByPeriod: {}, children: [
                { id:'cogs-cmv', name:'CMV', valuesByPeriod: { [`${y}-${m}`]: 38000 } },
              ]},
              { id: 'opex', name: 'Despesas', valuesByPeriod: {}, children: [
                { id:'adm', name:'Adm', valuesByPeriod: { [`${y}-${m}`]: 12000 } },
                { id:'com', name:'Comercial', valuesByPeriod: { [`${y}-${m}`]: 8000 } },
              ]},
            ],
          }
          lJ = [ { lancamento_id: 1, data_lancamento: `${y}-${m}-05`, historico: 'Venda', debito: 0, credito: 5000, conta_codigo: '4.1.1', conta_nome: 'Receita' } ]
        }

        if (!cancelled) { setBp(bpJ); setDre(dreJ); setLanc(lJ) }
      } catch { if (!cancelled) setError('Falha ao carregar dados') } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [dateRange])

  const kpis = useMemo(() => {
    if (!bp) return { ativo: 0, passivo: 0, pl: 0, ac: 0, pc: 0 }
    const ativoTotal = sumSecao(bp.ativo, () => true)
    const passivoTotal = sumSecao(bp.passivo, () => true)
    const plTotal = sumSecao(bp.pl, () => true)
    const ac = sumSecao(bp.ativo, n => n.toLowerCase().includes('circulante'))
    const pc = sumSecao(bp.passivo, n => n.toLowerCase().includes('circulante'))
    return { ativo: ativoTotal, passivo: passivoTotal, pl: plTotal, ac, pc }
  }, [bp])

  // DRE agregada por período
  const dreResumo = useMemo(() => {
    if (!dre) return [] as { key: string; label: string; receita: number; cogs: number; opex: number; lucro: number; margem: number }[]
    const getSum = (nodeId: string, periodKey: string) => {
      const n = (dre.nodes || []).find(n => n.id === nodeId)
      const children = n?.children || []
      return children.reduce((acc, ch) => acc + (Number(ch.valuesByPeriod?.[periodKey] || 0)), 0)
    }
    return dre.periods.map(p => {
      const receita = getSum('receita', p.key)
      const cogs = getSum('cogs', p.key)
      const opex = getSum('opex', p.key)
      const lucro = receita - cogs - opex
      const margem = receita > 0 ? (lucro / receita) * 100 : 0
      return { key: p.key, label: p.label, receita, cogs, opex, lucro, margem }
    })
  }, [dre])

  function BarsDRE({ items }: { items: { label: string; receita: number; cogs: number; opex: number }[] }) {
    const max = Math.max(1, ...items.map(i => Math.max(i.receita, i.cogs + i.opex)))
    return (
      <div>
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" />Receita</div>
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-rose-500" />COGS</div>
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-indigo-500" />Opex</div>
        </div>
        <div className="grid grid-cols-6 gap-3 h-44 items-end">
          {items.map((it) => {
            const rH = Math.round((it.receita / max) * 100)
            const cH = Math.round(((it.cogs) / max) * 100)
            const oH = Math.round(((it.opex) / max) * 100)
            return (
              <div key={it.label} className="flex flex-col items-center justify-end gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="w-1/3 bg-emerald-500/80 rounded" style={{ height: `${rH}%` }} />
                  <div className="w-1/3 bg-rose-500/80 rounded" style={{ height: `${cH}%` }} />
                  <div className="w-1/3 bg-indigo-500/80 rounded" style={{ height: `${oH}%` }} />
                </div>
                <div className="text-[11px] text-gray-600">{it.label}</div>
              </div>
            )
          })}
        </div>
      </div>
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
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{formatBRL(it.value)}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
      </div>
    )
  }

  const bpComposicao = useMemo(() => {
    if (!bp) return [] as { label: string; value: number }[]
    const ac = sumSecao(bp.ativo, n => n.toLowerCase().includes('circulante'))
    const anc = sumSecao(bp.ativo, n => n.toLowerCase().includes('não') || n.toLowerCase().includes('nao'))
    const pc = sumSecao(bp.passivo, n => n.toLowerCase().includes('circulante'))
    const pnc = sumSecao(bp.passivo, n => n.toLowerCase().includes('não') || n.toLowerCase().includes('nao'))
    const pl = sumSecao(bp.pl, () => true)
    return [
      { label: 'Ativo Circulante', value: ac },
      { label: 'Ativo Não Circ.', value: anc },
      { label: 'Passivo Circ.', value: pc },
      { label: 'Passivo Não Circ.', value: pnc },
      { label: 'Patrimônio Líquido', value: pl },
    ]
  }, [bp])

  const ultimosLanc = useMemo(() => {
    return lanc.slice(0, 5)
  }, [lanc])

  const liquidezCorrente = useMemo(() => {
    const ac = kpis.ac; const pc = kpis.pc
    return pc > 0 ? ac / pc : 0
  }, [kpis])

  const lucroAtual = useMemo(() => {
    const cur = dreResumo.at(-1)
    return cur ? cur.lucro : 0
  }, [dreResumo])

  const cardContainerClass = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Contabilidade"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      {contKpis && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Lucro do Período</div>
            <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatBRL(contKpis.lucro)}</div>
            <div className="text-xs text-gray-400 mt-1" style={styleText}>Receitas − Custos − Despesas</div>
          </div>
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Margem Líquida</div>
            <div className="text-2xl font-bold text-blue-600" style={styleValues}>{
              contKpis.margem_liquida != null ? `${(contKpis.margem_liquida * 100).toFixed(1)}%` : '—'
            }</div>
            <div className="text-xs text-gray-400 mt-1" style={styleText}>Lucro / Receita</div>
          </div>
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Capital de Giro</div>
            <div className="text-2xl font-bold text-indigo-600" style={styleValues}>{formatBRL(contKpis.capital_de_giro)}</div>
            <div className="text-xs text-gray-400 mt-1" style={styleText}>Ativo Circulante − Passivo Circulante</div>
          </div>
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Liquidez Corrente</div>
            <div className="text-2xl font-bold text-orange-600" style={styleValues}>{
              contKpis.liquidez_corrente != null ? `${contKpis.liquidez_corrente.toFixed(2)}x` : '—'
            }</div>
            <div className="text-xs text-gray-400 mt-1" style={styleText}>AC / PC</div>
          </div>
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Endividamento</div>
            <div className="text-2xl font-bold text-rose-600" style={styleValues}>{
              contKpis.endividamento != null ? `${(contKpis.endividamento * 100).toFixed(1)}%` : '—'
            }</div>
            <div className="text-xs text-gray-400 mt-1" style={styleText}>Passivo / Ativo</div>
          </div>
        </div>
      )}

      {/* Tabelas do Balanço Patrimonial (Ativo | Passivo | PL) */}
      {bp && (
        <div className="grid grid-cols-3 gap-6 items-start content-start mb-6">
          <div className="min-w-0">
            <BPTabela title="Ativo" secoes={bp.ativo} />
          </div>
          <div className="min-w-0">
            <BPTabela title="Passivo" secoes={bp.passivo} />
          </div>
          <div className="min-w-0">
            <BPTabela title="Patrimônio Líquido" secoes={bp.pl} />
          </div>
        </div>
      )}

      {/* DRE em largura total (igual à aba DRE) */}
      {dre && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>DRE</h3>
          <DRETable data={dre.nodes} periods={dre.periods} />
        </div>
      )}

      {/* Evolução Mensal + Waterfall (DRE) */}
      {dre && dreResumo.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Evolução Mensal (Receita, COGS, Opex, Lucro)</h3>
            <MultiLine
              series={[
                { id: 'Receita', color: '#10b981', points: dreResumo.map(d => ({ x: d.label, y: d.receita })) },
                { id: 'COGS', color: '#ef4444', points: dreResumo.map(d => ({ x: d.label, y: d.cogs })) },
                { id: 'Opex', color: '#6366f1', points: dreResumo.map(d => ({ x: d.label, y: d.opex })) },
                { id: 'Lucro', color: '#2563eb', points: dreResumo.map(d => ({ x: d.label, y: d.lucro })) },
              ]}
            />
          </div>
          <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
            <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Waterfall (Período Atual)</h3>
            {(() => {
              const last = dreResumo.at(-1)!;
              return (
                <WaterfallDRE
                  receita={last.receita}
                  cogs={-Math.abs(last.cogs)}
                  opex={-Math.abs(last.opex)}
                  lucro={last.lucro}
                />
              );
            })()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Últimos Lançamentos</h3>
          <div className="space-y-3">
            {ultimosLanc.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem lançamentos</div>
            ) : ultimosLanc.map((l, idx) => (
              <div key={`${l.lancamento_id}-${idx}`} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{l.historico || 'Lançamento'}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{l.data_lancamento ? new Date(l.data_lancamento).toLocaleDateString('pt-BR') : '—'} • {l.conta_codigo || ''} {l.conta_nome || ''}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-rose-600">{Number(l.debito||0) > 0 ? `D ${formatBRL(Number(l.debito))}` : ''}</div>
                  <div className="text-emerald-600">{Number(l.credito||0) > 0 ? `C ${formatBRL(Number(l.credito))}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Observações</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5" style={styleText}>
            <li>Considere revisar regras contábeis automáticas para CAP/AR/Payments.</li>
            <li>Valide mapeamento do plano de contas para DRE e BP.</li>
            <li>Concilie lançamentos pendentes antes do fechamento.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
