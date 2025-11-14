'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { BarChartHorizontalRecharts } from '@/components/charts/BarChartHorizontalRecharts'
import { BarChartMultipleRecharts } from '@/components/charts/BarChartMultipleRecharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChartHorizontalPercent } from '@/components/charts/BarChartHorizontalPercent'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, Users, UsersRound, Package, MapPin, Globe, Tag } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions } from '@/stores/modulos/financeiroDashboardStore'

type PedidoRow = {
  valor_total_pedido?: number | string
  valor_total?: number | string
  data_pedido?: string
  canal_venda?: string
  vendedor?: string
  cliente?: string
  numero_pedido?: string
  status?: string
  cidade_uf?: string
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
function monthKey(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
function monthKeyFromStr(s?: string) { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : monthKey(d) }
function monthLabel(key: string) { const [y, m] = key.split('-').map(Number); const d = new Date(y, (m || 1) - 1, 1); return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) }
function lastMonths(n: number) { const arr: string[] = []; const base = new Date(); for (let i= n-1;i>=0;i--){ const d=new Date(base.getFullYear(), base.getMonth()-i, 1); arr.push(monthKey(d)) } return arr }
function isCompleted(status?: string) { if (!status) return false; const s = status.toLowerCase(); return s.includes('conclu') || s.includes('fatur') || s.includes('pago') || s.includes('final') }

export default function VendasDashboardPage() {
  // Global UI & Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const pageBgColor = ui.pageBgColor
  const cardShadow = ui.cardShadow
  const filtersIconColor = ui.filtersIconColor
  const [rows, setRows] = useState<PedidoRow[]>([])
  const [kpis, setKpis] = useState<{ meta: number; vendas: number; percentMeta: number; ticket: number; cogs: number; margemBruta: number }>({ meta: 0, vendas: 0, percentMeta: 0, ticket: 0, cogs: 0, margemBruta: 0 })
  // Charts (reais)
  type ChartItem = { label: string; value: number }
  const [chartVendedores, setChartVendedores] = useState<ChartItem[]>([])
  const [chartEquipes, setChartEquipes] = useState<ChartItem[]>([])
  const [chartProdutos, setChartProdutos] = useState<ChartItem[]>([])
  const [chartFiliais, setChartFiliais] = useState<ChartItem[]>([])
  const [chartTerritorios, setChartTerritorios] = useState<ChartItem[]>([])
  const [chartCategorias, setChartCategorias] = useState<ChartItem[]>([])
  const [chartCanais, setChartCanais] = useState<ChartItem[]>([])
  const [chartTopClientes, setChartTopClientes] = useState<{ cliente: string; total: number; pedidos: number }[]>([])
  const [chartVendasCidade, setChartVendasCidade] = useState<{ cidade: string; total: number }[]>([])
  const [chartDevolucaoCanal, setChartDevolucaoCanal] = useState<{ label: string; value: number }[]>([])
  const [chartDevolucaoCliente, setChartDevolucaoCliente] = useState<{ label: string; value: number }[]>([])
  const [chartEstados, setChartEstados] = useState<ChartItem[]>([])
  const [chartMetaTerritorio, setChartMetaTerritorio] = useState<Array<{ label: string; meta: number; faturamento: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const url = `/api/modulos/vendas?view=pedidos&page=1&pageSize=1000&de=${de}`
        const res = await fetch(url, { cache: 'no-store' })
        let data: PedidoRow[] = []
        if (res.ok) {
          const j = (await res.json()) as { rows?: unknown[] }
          data = Array.isArray(j?.rows) ? (j.rows as unknown as PedidoRow[]) : []
        }
        // Sem mocks: se não houver dados, manter lista vazia
        if (!cancelled) setRows(data)
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load(); return () => { cancelled = true }
  }, [])

  // KPIs (reais)
  useEffect(() => {
    let cancelled = false
    async function loadKpis() {
      try {
        const params = new URLSearchParams()
        const from = filters.dateRange?.from
        const to = filters.dateRange?.to
        if (from) params.set('de', from)
        if (to) params.set('ate', to)
        const res = await fetch(`/api/modulos/vendas/dashboard?${params.toString()}`, { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          const kk = j?.kpis || {}
          const charts = j?.charts || {}
          const vendas = Number(kk.vendas || 0)
          const meta = Number(kk.meta || 0)
          setKpis({
            meta,
            vendas,
            percentMeta: Number(kk.percentMeta || (meta > 0 ? (vendas / meta) * 100 : 0)),
            ticket: Number(kk.ticketMedio || 0),
            cogs: Number(kk.cogs || 0),
            margemBruta: Number(kk.margemBruta || 0),
          })
          setChartVendedores(Array.isArray(charts?.vendedores) ? charts.vendedores as ChartItem[] : [])
          setChartProdutos(Array.isArray(charts?.produtos) ? charts.produtos as ChartItem[] : [])
          setChartTerritorios(Array.isArray(charts?.territorios) ? charts.territorios as ChartItem[] : [])
          setChartCategorias(Array.isArray(charts?.categorias) ? charts.categorias as ChartItem[] : [])
          setChartCanais(Array.isArray(charts?.canais) ? charts.canais as ChartItem[] : [])
          setChartTopClientes(Array.isArray(charts?.clientes) ? charts.clientes as { cliente: string; total: number; pedidos: number }[] : [])
          setChartVendasCidade(Array.isArray(charts?.cidades) ? charts.cidades as { cidade: string; total: number }[] : [])
          setChartDevolucaoCanal(Array.isArray(charts?.devolucao_canal) ? charts.devolucao_canal as { label: string; value: number }[] : [])
          setChartDevolucaoCliente(Array.isArray(charts?.devolucao_cliente) ? charts.devolucao_cliente as { label: string; value: number }[] : [])
          setChartEstados(Array.isArray(charts?.estados) ? charts.estados as ChartItem[] : [])
          setChartMetaTerritorio(Array.isArray(charts?.meta_territorio) ? charts.meta_territorio as Array<{ label: string; meta: number; faturamento: number }> : [])
        } else {
          setKpis({ meta: 0, vendas: 0, percentMeta: 0, ticket: 0, cogs: 0, margemBruta: 0 })
        }
      } catch {
        setKpis({ meta: 0, vendas: 0, percentMeta: 0, ticket: 0, cogs: 0, margemBruta: 0 })
      }
    }
    loadKpis()
    return () => { cancelled = true }
  }, [filters.dateRange])

  // Charts (reais)
  const top5Vendedores = chartVendedores
  const top5Equipes = chartEquipes
  const top5Produtos = chartProdutos
  const rankingFiliais = chartFiliais
  const vendasPorTerritorio = chartTerritorios
  const vendasPorCategoria = chartCategorias

  // Dados reais para Vendas por Canal (do endpoint agregado)
  const vendasPorCanalItems = useMemo(() => {
    return Array.isArray(chartCanais)
      ? chartCanais.map(it => ({ label: it.label || '—', value: Number(it.value || 0) }))
      : []
  }, [chartCanais])
  // vendasPorVendedor não utilizado diretamente (Top Vendedores vem do endpoint)
  const topClientes = chartTopClientes
  const vendasPorCidade = chartVendasCidade
  const pedidosRecentes = useMemo(() => {
    return [...rows]
      .sort((a,b)=> new Date(b.data_pedido || 0).getTime() - new Date(a.data_pedido || 0).getTime())
      .slice(0,3)
  }, [rows])

  // Map real data for horizontal bar charts
  const topClientesItems = useMemo(() => {
    // chartTopClientes comes from the dashboard endpoint
    // Fallback to derived list if not loaded yet
    const arr = chartTopClientes?.length
      ? chartTopClientes.map(c => ({ label: c.cliente || '—', value: Number(c.total || 0) }))
      : []
    return arr
  }, [chartTopClientes])
  const vendasPorCidadeItems = useMemo(() => {
    const arr = chartVendasCidade?.length
      ? chartVendasCidade.map(x => ({ label: x.cidade || '—', value: Number(x.total || 0) }))
      : []
    return arr
  }, [chartVendasCidade])

  // Simple horizontal bars
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

  // Fonts and header styles
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

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Vendas"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      <div className="flex-1">
          {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Meta de Vendas</div>
              <div className="text-2xl font-bold text-blue-600" style={styleValues}>{formatBRL(kpis.meta)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Meta estabelecida</div>
            </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Vendas</div>
              <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatBRL(kpis.vendas)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Total realizado</div>
            </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>% da Meta</div>
              <div className="text-2xl font-bold text-purple-600" style={styleValues}>{kpis.percentMeta.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Alcançado da meta</div>
            </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Ticket Médio</div>
              <div className="text-2xl font-bold text-orange-600" style={styleValues}>{formatBRL(kpis.ticket)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Valor médio por pedido</div>
            </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>COGS</div>
              <div className="text-2xl font-bold text-rose-600" style={styleValues}>{formatBRL(kpis.cogs)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Custo dos produtos</div>
            </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Margem Bruta</div>
              <div className="text-2xl font-bold text-indigo-600" style={styleValues}>{kpis.margemBruta.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>(Vendas - COGS) / Vendas</div>
            </div>
          </div>

          {/* Row 1: Top 5 Vendedores, Top 5 Equipes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={top5Vendedores}
              title="Top 5 Vendedores"
              icon={<Users className="w-5 h-5" />}
              color="#3b82f6"
            />
            <BarChartHorizontalRecharts
              items={top5Equipes}
              title="Top 5 Equipes de Venda"
              icon={<UsersRound className="w-5 h-5" />}
              color="#10b981"
            />
          </div>

          {/* Row 2: Top 5 Produtos, Vendas por Canal, Meta x Faturamento por Território */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={top5Produtos}
              title="Top 5 Produtos"
              icon={<Package className="w-5 h-5" />}
              color="#8b5cf6"
            />
            <BarChartHorizontalRecharts
              items={vendasPorCanalItems}
              title="Vendas por Canal"
              icon={<Tag className="w-5 h-5" />}
              color="#f59e0b"
            />
            <BarChartMultipleRecharts
              items={chartMetaTerritorio as any}
              title="Meta x Faturamento por Território"
              icon={<Globe className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'faturamento', label: 'Faturamento', color: '#10b981' },
              ]}
              height={240}
            />
          </div>

          {/* Row 3: Vendas por Território, Vendas por Categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={vendasPorTerritorio}
              title="Vendas por Território"
              icon={<Globe className="w-5 h-5" />}
              color="#ec4899"
            />
            <BarChartHorizontalRecharts
              items={vendasPorCategoria}
              title="Vendas por Categoria"
              icon={<Tag className="w-5 h-5" />}
              color="#6366f1"
            />
          </div>

          {/* Row 4: Taxas de Devolução e Vendas por Estado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalPercent
              items={chartDevolucaoCanal}
              title="Taxa de Devolução por Canal"
              icon={<Tag className="w-5 h-5" />}
              color="#ef4444"
              height={240}
            />
            <BarChartHorizontalPercent
              items={chartDevolucaoCliente}
              title="Taxa de Devolução por Cliente"
              icon={<Users className="w-5 h-5" />}
              color="#f97316"
              height={240}
            />
            <BarChartHorizontalRecharts
              items={chartEstados}
              title="Vendas por Estado"
              icon={<MapPin className="w-5 h-5" />}
              color="#22c55e"
              height={240}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <BarChartHorizontalRecharts
              items={topClientesItems}
              title="Top Clientes"
              icon={<Users className="w-5 h-5" />}
              color="#3b82f6"
              height={240}
            />
            <BarChartHorizontalRecharts
              items={vendasPorCidadeItems}
              title="Vendas por Cidade/UF"
              icon={<MapPin className="w-5 h-5" />}
              color="#8b5cf6"
              height={240}
            />
            <div className={cardContainerClass} style={{ borderColor: cardBorderColor }}>
              <h3 className="text-lg font-semibold mb-4" style={styleChartTitle}>Pedidos Recentes</h3>
              {pedidosRecentes.length === 0 ? (
                <div className="text-sm text-gray-400" style={styleText}>Sem pedidos recentes</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-[110px]">Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosRecentes.slice(0, 6).map((p) => (
                        <TableRow key={p.numero_pedido ?? `${p.cliente}-${p.data_pedido}`}>
                          <TableCell className="font-medium">{p.numero_pedido || '—'}</TableCell>
                          <TableCell>{p.cliente || '—'}</TableCell>
                          <TableCell>{p.canal_venda || '—'}</TableCell>
                          <TableCell>{p.vendedor || '—'}</TableCell>
                          <TableCell className="text-right">{formatBRL(p.valor_total_pedido ?? p.valor_total)}</TableCell>
                          <TableCell>{p.data_pedido ? new Date(p.data_pedido).toLocaleDateString('pt-BR') : '—'}</TableCell>
                          <TableCell>
                            <span className={`${isCompleted(p.status) ? 'text-green-600' : 'text-orange-600'}`}>{p.status || '—'}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
      </div>
    </DashboardLayout>
  )
}
