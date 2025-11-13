'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { BarChartHorizontalRecharts } from '@/components/charts/BarChartHorizontalRecharts'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, Handshake, ShoppingCart, PackagePlus, FileCheck2, Building2, DollarSign, Users, MapPin, Tag, FolderKanban } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions } from '@/stores/modulos/financeiroDashboardStore'

type PedidoRow = { numero?: string; fornecedor?: string; status?: string; data_emissao?: string; valor_total?: number | string }
type ApiComprasRow = { numero_oc?: string; fornecedor?: string; status?: string; data_emissao?: string; valor_total?: number | string }

function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

export default function ComprasDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor

  const [pedidos, setPedidos] = useState<PedidoRow[]>([])
  // KPIs (reais)
  const [gasto, setGasto] = useState<number>(0)
  const [fornecedores, setFornecedores] = useState<number>(0)
  const [transacoes, setTransacoes] = useState<number>(0)
  const [pedidosCompra, setPedidosCompra] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const base = '/api/modulos/compras'
        const [kRes, pRes] = await Promise.allSettled([
          fetch(`/api/modulos/compras/dashboard`, { cache: 'no-store' }),
          fetch(`${base}?view=compras&page=1&pageSize=1000`, { cache: 'no-store' }),
        ])
        let ps: PedidoRow[] = []
        if (kRes.status === 'fulfilled' && kRes.value.ok) {
          const j = await kRes.value.json()
          const k = j?.kpis || {}
          setGasto(Number(k.gasto || 0))
          setFornecedores(Number(k.fornecedores || 0))
          setTransacoes(Number(k.transacoes || 0))
          setPedidosCompra(Number(k.pedidos || 0))
        }
        if (pRes.status === 'fulfilled' && pRes.value.ok) {
          const j = await pRes.value.json();
          const rows = Array.isArray(j?.rows) ? (j.rows as ApiComprasRow[]) : []
          ps = rows.map((r) => ({
            numero: r.numero_oc ?? undefined,
            fornecedor: r.fornecedor,
            status: r.status,
            data_emissao: r.data_emissao,
            valor_total: r.valor_total,
          }))
        }
        if (!cancelled) { setPedidos(ps) }
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
  const styleValues = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.values.family), fontWeight: fonts.values.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.values.letterSpacing==='number'?`${fonts.values.letterSpacing}px`:undefined, color: fonts.values.color||undefined, fontSize: typeof fonts.values.size==='number'?`${fonts.values.size}px`:undefined, textTransform: fonts.values.transform==='uppercase'?'uppercase':'none' }), [fonts.values])
  const styleKpiTitle = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.kpiTitle.family), fontWeight: fonts.kpiTitle.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.kpiTitle.letterSpacing==='number'?`${fonts.kpiTitle.letterSpacing}px`:undefined, color: fonts.kpiTitle.color||undefined, fontSize: typeof fonts.kpiTitle.size==='number'?`${fonts.kpiTitle.size}px`:undefined, textTransform: fonts.kpiTitle.transform==='uppercase'?'uppercase':'none' }), [fonts.kpiTitle])
  const styleChartTitle = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.chartTitle.family), fontWeight: fonts.chartTitle.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.chartTitle.letterSpacing==='number'?`${fonts.chartTitle.letterSpacing}px`:undefined, color: fonts.chartTitle.color||undefined, fontSize: typeof fonts.chartTitle.size==='number'?`${fonts.chartTitle.size}px`:undefined, textTransform: fonts.chartTitle.transform==='uppercase'?'uppercase':'none' }), [fonts.chartTitle])
  const styleText = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.text.family), fontWeight: fonts.text.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.text.letterSpacing==='number'?`${fonts.text.letterSpacing}px`:undefined, color: fonts.text.color||undefined, fontSize: typeof fonts.text.size==='number'?`${fonts.text.size}px`:undefined, textTransform: fonts.text.transform==='uppercase'?'uppercase':'none' }), [fonts.text])
  const styleHeaderTitle = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.headerTitle.family), fontWeight: fonts.headerTitle.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.headerTitle.letterSpacing==='number'?`${fonts.headerTitle.letterSpacing}px`:undefined, color: fonts.headerTitle.color||undefined, fontSize: typeof fonts.headerTitle.size==='number'?`${fonts.headerTitle.size}px`:undefined, textTransform: fonts.headerTitle.transform==='uppercase'?'uppercase':'none' }), [fonts.headerTitle])
  const styleHeaderSubtitle = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.headerSubtitle.family), fontWeight: fonts.headerSubtitle.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.headerSubtitle.letterSpacing==='number'?`${fonts.headerSubtitle.letterSpacing}px`:undefined, color: fonts.headerSubtitle.color||undefined, fontSize: typeof fonts.headerSubtitle.size==='number'?`${fonts.headerSubtitle.size}px`:undefined, textTransform: fonts.headerSubtitle.transform==='uppercase'?'uppercase':'none' }), [fonts.headerSubtitle])

  // Header filters/actions
  const styleFilters = useMemo<React.CSSProperties>(() => ({ fontFamily: fontVar(fonts.filters.family), fontWeight: fonts.filters.weight as React.CSSProperties['fontWeight'], letterSpacing: typeof fonts.filters.letterSpacing==='number'?`${fonts.filters.letterSpacing}px`:undefined, color: fonts.filters.color||undefined, fontSize: typeof fonts.filters.size==='number'?`${fonts.filters.size}px`:undefined, textTransform: fonts.filters.transform==='uppercase'?'uppercase':'none' }), [fonts.filters])
  const dateRange: DateRange | undefined = useMemo(() => { const from = filters.dateRange?.from ? new Date(filters.dateRange.from) : undefined; const to = filters.dateRange?.to ? new Date(filters.dateRange.to) : undefined; if (!from && !to) return undefined; return { from, to } }, [filters.dateRange])
  const setDateRange = (range?: DateRange) => { const toISO = (d?: Date) => (d ? d.toISOString().slice(0,10) : undefined); financeiroDashboardActions.setFilters({ dateRange: range ? { from: toISO(range.from), to: toISO(range.to) } : undefined }) }
  const dataFilter = filters.dataFilter
  const setDataFilter = (v: string) => financeiroDashboardActions.setFilters({ dataFilter: v })
  const rangeLabel = useMemo(() => { if (dateRange?.from && dateRange?.to) { const fmt=(d:Date)=>d.toLocaleDateString('pt-BR'); return `${fmt(dateRange.from)} - ${fmt(dateRange.to)}` } if (dateRange?.from) { const fmt=(d:Date)=>d.toLocaleDateString('pt-BR'); return `${fmt(dateRange.from)}` } return 'Selecionar período' }, [dateRange])
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
          <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} captionLayout="dropdown" showOutsideDays initialFocus />
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

  // KPIs agora vêm do endpoint (mantidos em state)

  // Charts
  const gastoPorFornecedor = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of pedidos) { const k=p.fornecedor||'—'; m.set(k,(m.get(k)||0)+(Number(p.valor_total)||0)) }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value-a.value).slice(0,6)
  }, [pedidos])
  // (outros gráficos derivados podem ser adicionados futuramente)

  // Charts: sem mocks. Enquanto não houver agregações reais,
  // mantemos arrays vazios (ou derivados do que temos em memória).
  const comprasPorDepartamento: { label: string; value: number }[] = []
  const comprasPorCentroCusto: { label: string; value: number }[] = []
  // Aproveitamos o cálculo real de gasto por fornecedor a partir dos pedidos carregados
  const comprasPorFornecedores = useMemo(() => gastoPorFornecedor, [gastoPorFornecedor])
  const comprasPorFiliais: { label: string; value: number }[] = []
  const comprasPorCategorias: { label: string; value: number }[] = []
  const comprasPorProjetos: { label: string; value: number }[] = []

  

  const cardContainerClass = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Compras"
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
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><ShoppingCart className="w-4 h-4 text-blue-600" />Gasto</div>
          <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatBRL(gasto)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Total de gastos</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><Handshake className="w-4 h-4 text-emerald-600" />Fornecedores</div>
          <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{fornecedores}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Fornecedores ativos</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><FileCheck2 className="w-4 h-4 text-purple-600" />Transações</div>
          <div className="text-2xl font-bold text-purple-600" style={styleValues}>{transacoes}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Total de transações</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><PackagePlus className="w-4 h-4 text-amber-600" />Pedidos de Compra</div>
          <div className="text-2xl font-bold text-amber-600" style={styleValues}>{pedidosCompra}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Total de pedidos</div>
        </div>
      </div>

      {/* Row 1: Departamento, Centro de Custo, Fornecedores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalRecharts
          items={comprasPorDepartamento}
          title="Compras por Departamento"
          icon={<Building2 className="w-5 h-5" />}
          color="#3b82f6"
        />
        <BarChartHorizontalRecharts
          items={comprasPorCentroCusto}
          title="Compras por Centro de Custo"
          icon={<DollarSign className="w-5 h-5" />}
          color="#10b981"
        />
        <BarChartHorizontalRecharts
          items={comprasPorFornecedores}
          title="Compras por Fornecedores"
          icon={<Users className="w-5 h-5" />}
          color="#8b5cf6"
        />
      </div>

      {/* Row 2: Filiais, Categorias, Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartHorizontalRecharts
          items={comprasPorFiliais}
          title="Compras por Filiais"
          icon={<MapPin className="w-5 h-5" />}
          color="#f59e0b"
        />
        <BarChartHorizontalRecharts
          items={comprasPorCategorias}
          title="Compras por Categorias"
          icon={<Tag className="w-5 h-5" />}
          color="#ec4899"
        />
        <BarChartHorizontalRecharts
          items={comprasPorProjetos}
          title="Compras por Projetos"
          icon={<FolderKanban className="w-5 h-5" />}
          color="#6366f1"
        />
      </div>
    </DashboardLayout>
  )
}
