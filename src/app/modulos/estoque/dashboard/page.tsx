'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, Boxes, PackageSearch, TriangleAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions } from '@/stores/modulos/financeiroDashboardStore'

type ProdutoRow = {
  codigo?: string
  nome?: string
  categoria?: string
  estoque_atual?: number | string
  estoque_minimo?: number | string
  valor_unitario?: number | string
  updated_at?: string
}

type MovRow = {
  data?: string
  tipo?: 'entrada' | 'saida'
  produto?: string
  quantidade?: number | string
  valor_total?: number | string
}

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}` }
function monthLabel(key: string) { const [y, m] = key.split('-').map(Number); const d = new Date(y, (m||1)-1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
function lastMonths(n: number) { const arr: string[] = []; const base = new Date(); for (let i=n-1;i>=0;i--){ const d=new Date(base.getFullYear(), base.getMonth()-i, 1); arr.push(monthKey(d)) } return arr }
function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function parseDate(s?: string) { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d }

export default function EstoqueDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor

  const [produtos, setProdutos] = useState<ProdutoRow[]>([])
  const [movs, setMovs] = useState<MovRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const base = '/api/modulos/estoque'
        const [pRes, mRes] = await Promise.allSettled([
          fetch(`${base}?view=produtos&page=1&pageSize=1000`, { cache: 'no-store' }),
          fetch(`${base}?view=movimentacoes&page=1&pageSize=1000`, { cache: 'no-store' }),
        ])
        let ps: ProdutoRow[] = []
        let ms: MovRow[] = []
        if (pRes.status === 'fulfilled' && pRes.value.ok) { const j = await pRes.value.json(); ps = Array.isArray(j?.rows) ? j.rows as ProdutoRow[] : [] }
        if (mRes.status === 'fulfilled' && mRes.value.ok) { const j = await mRes.value.json(); ms = Array.isArray(j?.rows) ? j.rows as MovRow[] : [] }

        if (ps.length === 0 && ms.length === 0) {
          // Mocks coerentes
          ps = [
            { codigo: 'SKU-1001', nome: 'Produto A', categoria: 'Eletrônicos', estoque_atual: 120, estoque_minimo: 40, valor_unitario: 120.5 },
            { codigo: 'SKU-1002', nome: 'Produto B', categoria: 'Acessórios', estoque_atual: 18, estoque_minimo: 25, valor_unitario: 35.9 },
            { codigo: 'SKU-1003', nome: 'Produto C', categoria: 'Eletrônicos', estoque_atual: 0, estoque_minimo: 10, valor_unitario: 980.0 },
            { codigo: 'SKU-1004', nome: 'Produto D', categoria: 'Casa', estoque_atual: 65, estoque_minimo: 20, valor_unitario: 49.0 },
            { codigo: 'SKU-1005', nome: 'Produto E', categoria: 'Casa', estoque_atual: 8, estoque_minimo: 12, valor_unitario: 25.0 },
          ]
          const d0 = toDateOnly(new Date())
          const d1 = toDateOnly(new Date(Date.now() - 86400000))
          const d2 = toDateOnly(new Date(Date.now() - 2*86400000))
          ms = [
            { data: d0, tipo: 'entrada', produto: 'Produto A', quantidade: 50, valor_total: 6025 },
            { data: d1, tipo: 'saida', produto: 'Produto C', quantidade: 4, valor_total: 3920 },
            { data: d2, tipo: 'saida', produto: 'Produto B', quantidade: 10, valor_total: 359 },
          ]
        }
        if (!cancelled) { setProdutos(ps); setMovs(ms) }
      } catch { if (!cancelled) setError('Falha ao carregar dados') } finally { if (!cancelled) setLoading(false) }
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

  // KPIs
  const valorEstoque = useMemo(() => produtos.reduce((acc, p) => acc + (Number(p.estoque_atual)||0) * (Number(p.valor_unitario)||0), 0), [produtos])
  const abaixoMinimo = useMemo(() => produtos.filter(p => (Number(p.estoque_atual)||0) < (Number(p.estoque_minimo)||0)).length, [produtos])
  const rupturas = useMemo(() => produtos.filter(p => (Number(p.estoque_atual)||0) <= 0).length, [produtos])
  const entradasMes = useMemo(() => {
    const key = monthKey(new Date())
    return movs.filter(m => m.tipo === 'entrada' && (m.data||'').startsWith(key)).reduce((acc,m)=> acc + (Number(m.valor_total)||0), 0)
  }, [movs])

  // Charts
  const estoquePorCategoria = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of produtos) { const k = p.categoria || '—'; m.set(k, (m.get(k)||0) + (Number(p.estoque_atual)||0)) }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value-a.value).slice(0,6)
  }, [produtos])
  const topValorEstoque = useMemo(() => {
    return produtos.map(p => ({ label: p.nome || p.codigo || 'Produto', value: (Number(p.estoque_atual)||0) * (Number(p.valor_unitario)||0) }))
      .sort((a,b)=> b.value-a.value).slice(0,6)
  }, [produtos])
  const meses = useMemo(() => lastMonths(6), [])
  const saidasMes = useMemo(() => {
    const m = new Map<string, number>(); for (const k of meses) m.set(k, 0)
    for (const mv of movs) { if (mv.tipo !== 'saida') continue; const d = parseDate(mv.data); if (!d) continue; const k = monthKey(d); if (m.has(k)) m.set(k, (m.get(k)||0)+(Number(mv.quantidade)||0)) }
    return meses.map(k => ({ key: k, label: monthLabel(k), value: m.get(k)||0 }))
  }, [movs, meses])

  function HBars({ items, color = 'bg-indigo-500' }: { items: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1" style={styleText}><span>{it.label}</span><span>{formatBRL(it.value)}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400" style={styleText}>Sem dados</div>}
      </div>
    )
  }

  const cardContainerClass = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Estoque"
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
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><Boxes className="w-4 h-4 text-blue-600" />Valor do Estoque</div>
          <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatBRL(valorEstoque)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Soma (qtd × valor unit.)</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><PackageSearch className="w-4 h-4 text-amber-600" />Abaixo do Mínimo</div>
          <div className="text-2xl font-bold text-amber-600" style={styleValues}>{abaixoMinimo}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Itens com alerta</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><TriangleAlert className="w-4 h-4 text-red-600" />Rupturas</div>
          <div className="text-2xl font-bold text-red-600" style={styleValues}>{rupturas}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Itens zerados</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><ArrowDownRight className="w-4 h-4 text-emerald-600" />Entradas (mês)</div>
          <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatBRL(entradasMes)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Movimentações de entrada</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Estoque por Categoria</h3>
          <HBars items={estoquePorCategoria} color="bg-indigo-500" />
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Top Itens por Valor</h3>
          <HBars items={topValorEstoque} color="bg-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Saídas por Mês</h3>
          <div className="grid grid-cols-6 gap-3 h-44 items-end">
            {saidasMes.map(m => {
              const max = Math.max(1, ...saidasMes.map(x => x.value))
              const h = Math.round((m.value / max) * 100)
              return (
                <div key={m.key} className="flex flex-col items-center justify-end gap-1">
                  <div className="w-full bg-rose-500/80 rounded" style={{ height: `${h}%` }} />
                  <div className="text-[11px] text-gray-600" style={styleText}>{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Movimentações Recentes</h3>
          <div className="space-y-3">
            {movs.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem movimentações</div>
            ) : movs.slice(0,5).map((mv, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                <div>
                  <div className="font-medium text-sm" style={styleText}>{mv.tipo === 'entrada' ? 'Entrada' : 'Saída'} • {mv.produto}</div>
                  <div className="text-xs text-gray-500" style={styleText}>{mv.data || '—'} • {Number(mv.quantidade)||0} un</div>
                </div>
                <div className={`text-xs ${mv.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatBRL(Number(mv.valor_total)||0)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Notas</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5" style={styleText}>
            <li>Revise itens abaixo do mínimo e rupturas.</li>
            <li>Valide custos de reposição e prazos.</li>
            <li>Monitore saídas para identificar sazonalidade.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

