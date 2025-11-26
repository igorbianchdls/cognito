'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { BarChartHorizontalRecharts } from '@/components/charts/BarChartHorizontalRecharts'
import { BarChartMultipleRecharts } from '@/components/charts/BarChartMultipleRecharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, Users, MapPin, Globe, Tag, Building2, Briefcase, Store } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions, type FontSection } from '@/stores/modulos/financeiroDashboardStore'

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
// helpers removidos
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
  // Forçar fonte Barlow neste dashboard
  useEffect(() => {
    const sections: FontSection[] = [
      'values',
      'kpiTitle',
      'chartTitle',
      'text',
      'filters',
      'headerTitle',
      'headerSubtitle',
      'sidebarSectionTitle',
      'sidebarItemText',
    ]
    sections.forEach((s) => financeiroDashboardActions.setFont(s, { family: 'Barlow' }))
    // Definir período padrão: Novembro de 2025
    financeiroDashboardActions.setFilters({
      dateRange: { from: '2025-11-01', to: '2025-11-30' },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [rows, setRows] = useState<PedidoRow[]>([])
  const [kpis, setKpis] = useState<{ meta: number; vendas: number; percentMeta: number; ticket: number; cogs: number; margemBruta: number }>({ meta: 0, vendas: 0, percentMeta: 0, ticket: 0, cogs: 0, margemBruta: 0 })
  // Charts (reais)
  type ChartItem = { label: string; value: number }
  const [chartVendedores, setChartVendedores] = useState<ChartItem[]>([])
  // const [chartEquipes, setChartEquipes] = useState<ChartItem[]>([])
  const [chartServicos, setChartServicos] = useState<ChartItem[]>([])
  // const [chartFiliais, setChartFiliais] = useState<ChartItem[]>([])
  const [chartTerritorios, setChartTerritorios] = useState<ChartItem[]>([])
  const [chartCategorias, setChartCategorias] = useState<ChartItem[]>([])
  const [chartCanais, setChartCanais] = useState<ChartItem[]>([])
  const [chartTopClientes, setChartTopClientes] = useState<{ cliente: string; total: number; pedidos: number }[]>([])
  const [chartVendasCidade, setChartVendasCidade] = useState<{ cidade: string; total: number }[]>([])
  // Removidos: gráficos de devolução por canal e cliente
  // const [chartEstados, setChartEstados] = useState<ChartItem[]>([])
  const [chartCentroLucro, setChartCentroLucro] = useState<ChartItem[]>([])
  const [chartCampanhasVendas, setChartCampanhasVendas] = useState<ChartItem[]>([])
  const [chartCanaisDistribuicao, setChartCanaisDistribuicao] = useState<ChartItem[]>([])
  const [chartCanaisDistribuicaoTicket, setChartCanaisDistribuicaoTicket] = useState<ChartItem[]>([])
  const [chartCanaisDistribuicaoPedidos, setChartCanaisDistribuicaoPedidos] = useState<ChartItem[]>([])
  // Removido: faturamento por marca
  const [chartFiliais, setChartFiliais] = useState<ChartItem[]>([])
  const [chartUnidadesNegocio, setChartUnidadesNegocio] = useState<ChartItem[]>([])
  const [chartSalesOffices, setChartSalesOffices] = useState<ChartItem[]>([])
  const [chartServCatFat, setChartServCatFat] = useState<ChartItem[]>([])
  const [chartServCatTicket, setChartServCatTicket] = useState<ChartItem[]>([])
  const [chartServCatPedidos, setChartServCatPedidos] = useState<ChartItem[]>([])
  const [chartMetaTerritorio, setChartMetaTerritorio] = useState<Array<{ label: string; meta: number; faturamento: number }>>([])
  const [chartMetaVendedor, setChartMetaVendedor] = useState<Array<{ label: string; meta: number; faturamento: number }>>([])
  const [chartMetaVendedorVW, setChartMetaVendedorVW] = useState<Array<{ label: string; meta: number; faturamento: number }>>([])
  const [chartMetaNovosClientesVW, setChartMetaNovosClientesVW] = useState<Array<{ label: string; meta: number; realizado: number }>>([])
  const [chartMetaTicketMedioVW, setChartMetaTicketMedioVW] = useState<Array<{ label: string; meta: number; realizado: number }>>([])
  const [chartMetaTicketMedioTerritorio, setChartMetaTicketMedioTerritorio] = useState<Array<{ label: string; meta: number; realizado: number }>>([])
  const [chartMetaNovosClientesTerritorio, setChartMetaNovosClientesTerritorio] = useState<Array<{ label: string; meta: number; realizado: number }>>([])
  // Removido: vendas por cupom
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
          setChartServicos(Array.isArray(charts?.servicos) ? charts.servicos as ChartItem[] : [])
          setChartTerritorios(Array.isArray(charts?.territorios) ? charts.territorios as ChartItem[] : [])
          setChartCategorias(Array.isArray(charts?.categorias) ? charts.categorias as ChartItem[] : [])
          setChartCanais(Array.isArray(charts?.canais) ? charts.canais as ChartItem[] : [])
          setChartTopClientes(Array.isArray(charts?.clientes) ? charts.clientes as { cliente: string; total: number; pedidos: number }[] : [])
          setChartVendasCidade(Array.isArray(charts?.cidades) ? charts.cidades as { cidade: string; total: number }[] : [])
          // removidos: devolução canal/cliente
          // setChartEstados(Array.isArray(charts?.estados) ? charts.estados as ChartItem[] : [])
          setChartCentroLucro(Array.isArray(charts?.centros_lucro) ? charts.centros_lucro as ChartItem[] : [])
          setChartCampanhasVendas(Array.isArray(charts?.campanhas_vendas) ? charts.campanhas_vendas as ChartItem[] : [])
          setChartCanaisDistribuicao(Array.isArray(charts?.canais_distribuicao) ? charts.canais_distribuicao as ChartItem[] : [])
          setChartCanaisDistribuicaoTicket(Array.isArray(charts?.canais_distribuicao_ticket) ? charts.canais_distribuicao_ticket as ChartItem[] : [])
          setChartCanaisDistribuicaoPedidos(Array.isArray(charts?.canais_distribuicao_pedidos) ? charts.canais_distribuicao_pedidos as ChartItem[] : [])
          // removido: marcas
          setChartFiliais(Array.isArray(charts?.filiais) ? charts.filiais as ChartItem[] : [])
          setChartUnidadesNegocio(Array.isArray(charts?.unidades_negocio) ? charts.unidades_negocio as ChartItem[] : [])
          setChartSalesOffices(Array.isArray(charts?.sales_offices) ? charts.sales_offices as ChartItem[] : [])
          setChartMetaTerritorio(Array.isArray(charts?.meta_territorio) ? charts.meta_territorio as Array<{ label: string; meta: number; faturamento: number }> : [])
          setChartMetaVendedor(Array.isArray(charts?.meta_vendedor) ? charts.meta_vendedor as Array<{ label: string; meta: number; faturamento: number }> : [])
          setChartMetaVendedorVW(Array.isArray(charts?.meta_vendedor_vw) ? charts.meta_vendedor_vw as Array<{ label: string; meta: number; faturamento: number }> : [])
          setChartMetaTicketMedioVW(Array.isArray(charts?.meta_ticket_medio_vw) ? charts.meta_ticket_medio_vw as Array<{ label: string; meta: number; realizado: number }> : [])
          setChartMetaTicketMedioTerritorio(Array.isArray(charts?.meta_ticket_medio_territorio) ? charts.meta_ticket_medio_territorio as Array<{ label: string; meta: number; realizado: number }> : [])
          setChartMetaNovosClientesTerritorio(Array.isArray(charts?.meta_novos_clientes_territorio) ? charts.meta_novos_clientes_territorio as Array<{ label: string; meta: number; realizado: number }> : [])
          setChartMetaNovosClientesVW(Array.isArray(charts?.meta_novos_clientes_vw) ? charts.meta_novos_clientes_vw as Array<{ label: string; meta: number; realizado: number }> : [])
          // removido: cupons
          setChartServCatFat(Array.isArray(charts?.servicos_categorias_faturamento) ? charts.servicos_categorias_faturamento as ChartItem[] : [])
          setChartServCatTicket(Array.isArray(charts?.servicos_categorias_ticket) ? charts.servicos_categorias_ticket as ChartItem[] : [])
          setChartServCatPedidos(Array.isArray(charts?.servicos_categorias_pedidos) ? charts.servicos_categorias_pedidos as ChartItem[] : [])
        } else {
          setKpis({ meta: 0, vendas: 0, percentMeta: 0, ticket: 0, cogs: 0, margemBruta: 0 })
        }
      } catch {
        setKpis({ meta: 0, vendas: 0, percentMeta: 0, ticket: 0, cogs: 0, margemBruta: 0 })
      }
    }
    loadKpis()
  }, [filters.dateRange])

  // Charts (reais)
  const top5Vendedores = chartVendedores
  const vendasPorServico = chartServicos
  const vendasPorTerritorio = chartTerritorios
  const vendasPorCategoria = chartCategorias

  // Dados reais para Vendas por Canal (do endpoint agregado)
  const vendasPorCanalItems = useMemo(() => {
    return Array.isArray(chartCanais)
      ? chartCanais.map(it => ({ label: it.label || '—', value: Number(it.value || 0) }))
      : []
  }, [chartCanais])
  // vendasPorVendedor não utilizado diretamente (Top Vendedores vem do endpoint)
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

  //

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

          {/* Meta x Realizado — Vendedor (Faturamento, Ticket Médio, Novos Clientes) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartMultipleRecharts
              items={chartMetaVendedor}
              title="Meta x Faturamento por Vendedor"
              icon={<Users className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'faturamento', label: 'Faturamento', color: '#10b981' },
              ]}
              height={360}
            />
            <BarChartMultipleRecharts
              items={chartMetaTicketMedioVW as unknown as Array<{ label: string; [key: string]: string | number }>}
              title="Meta x Ticket Médio por Vendedor"
              icon={<Users className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'realizado', label: 'Realizado', color: '#10b981' },
              ]}
              height={360}
            />
            <BarChartMultipleRecharts
              items={chartMetaNovosClientesVW as unknown as Array<{ label: string; [key: string]: string | number }>}
              title="Meta x Novos Clientes por Vendedor"
              icon={<Users className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'realizado', label: 'Realizado', color: '#10b981' },
              ]}
              height={360}
            />
          </div>

          {/* Meta x Realizado — Território (Faturamento, Ticket Médio, Novos Clientes) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartMultipleRecharts
              items={chartMetaTerritorio}
              title="Meta x Faturamento por Território"
              icon={<Globe className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'faturamento', label: 'Faturamento', color: '#10b981' },
              ]}
              height={360}
            />
            <BarChartMultipleRecharts
              items={chartMetaTicketMedioTerritorio as unknown as Array<{ label: string; [key: string]: string | number }>}
              title="Meta x Ticket Médio por Território"
              icon={<Globe className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'realizado', label: 'Realizado', color: '#10b981' },
              ]}
              height={360}
            />
            <BarChartMultipleRecharts
              items={chartMetaNovosClientesTerritorio as unknown as Array<{ label: string; [key: string]: string | number }>}
              title="Meta x Novos Clientes por Território"
              icon={<Globe className="w-5 h-5" />}
              series={[
                { key: 'meta', label: 'Meta', color: '#60a5fa' },
                { key: 'realizado', label: 'Realizado', color: '#10b981' },
              ]}
              height={360}
            />
          </div>

          {/* (removido) meta x novos clientes duplicados — agora agrupados acima */}

          {/* Row 1: Faturamento por Vendedor e Vendas por Canal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={top5Vendedores}
              title="Faturamento por Vendedor"
              icon={<Users className="w-5 h-5" />}
              color="#3b82f6"
              height={360}
            />
          <BarChartHorizontalRecharts
            items={vendasPorCanalItems}
            title="Vendas por Canal"
            icon={<Tag className="w-5 h-5" />}
            color="#f59e0b"
            height={360}
          />
        </div>

          {/* Row 1.5: Vendas por Serviço */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={vendasPorServico}
              title="Vendas por Serviço"
              icon={<Briefcase className="w-5 h-5" />}
              color="#10b981"
              height={360}
            />
          </div>

          {/* Row 1.6: Categorias de Serviços (Faturamento, Ticket Médio, Pedidos) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={chartServCatFat}
              title="Faturamento por Categoria de Serviço"
              icon={<Briefcase className="w-5 h-5" />}
              color="#06b6d4"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartServCatTicket}
              title="Ticket Médio por Categoria de Serviço"
              icon={<Briefcase className="w-5 h-5" />}
              color="#f59e0b"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartServCatPedidos}
              title="Pedidos por Categoria de Serviço"
              icon={<Briefcase className="w-5 h-5" />}
              color="#8b5cf6"
              height={360}
            />
          </div>

          {/* Row 2: Vendas por Território, Vendas por Categoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={vendasPorTerritorio}
              title="Vendas por Território"
              icon={<Globe className="w-5 h-5" />}
              color="#ec4899"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={vendasPorCategoria}
              title="Faturamento por Categoria"
              icon={<Tag className="w-5 h-5" />}
              color="#6366f1"
              height={360}
            />
          </div>

          {/* (removido) row antiga de meta por vendedor — agora agrupado acima */}

          {/* Row 3: Top Clientes, Vendas por Cidade, Vendas por Centro de Lucro */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={topClientesItems}
              title="Top Clientes"
              icon={<Users className="w-5 h-5" />}
              color="#3b82f6"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={vendasPorCidadeItems}
              title="Vendas por Cidade"
              icon={<MapPin className="w-5 h-5" />}
              color="#8b5cf6"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartCentroLucro}
              title="Vendas por Centro de Lucro"
              icon={<Tag className="w-5 h-5" />}
              color="#22c55e"
              height={360}
            />
          </div>

          {/* Row 4: removido (devoluções e vendas por cupom) */}

          {/* Row 5: Vendas por Campanha de Vendas e por Canal de Distribuição */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={chartCampanhasVendas}
              title="Vendas por Campanha de Vendas"
              icon={<Globe className="w-5 h-5" />}
              color="#a855f7"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartCanaisDistribuicao}
              title="Faturamento por Canal de Distribuição"
              icon={<Tag className="w-5 h-5" />}
              color="#0ea5e9"
              height={360}
            />
          </div>

          {/* Row 5.1: Canais de Distribuição - Ticket Médio e Pedidos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={chartCanaisDistribuicaoTicket}
              title="Ticket Médio por Canal de Distribuição"
              icon={<Tag className="w-5 h-5" />}
              color="#f59e0b"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartCanaisDistribuicaoPedidos}
              title="Pedidos por Canal de Distribuição"
              icon={<Tag className="w-5 h-5" />}
              color="#8b5cf6"
              height={360}
            />
          </div>

          {/* Row 6: Faturamento por Filial, Vendas por Business Unit e Faturamento por Sales Office */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <BarChartHorizontalRecharts
              items={chartFiliais}
              title="Faturamento por Filial"
              icon={<Building2 className="w-5 h-5" />}
              color="#14b8a6"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartUnidadesNegocio}
              title="Vendas por Business Unit"
              icon={<Briefcase className="w-5 h-5" />}
              color="#8b5cf6"
              height={360}
            />
            <BarChartHorizontalRecharts
              items={chartSalesOffices}
              title="Faturamento por Sales Office"
              icon={<Store className="w-5 h-5" />}
              color="#ec4899"
              height={360}
            />
          </div>

          {/* Row 5: Pedidos Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
