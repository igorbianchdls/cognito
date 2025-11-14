'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { BarChartHorizontalRecharts } from '@/components/charts/BarChartHorizontalRecharts'
import { BarChartHorizontalPercent } from '@/components/charts/BarChartHorizontalPercent'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarIcon, TrendingUp, Users, CalendarDays, Target, UserCheck, XCircle, Clock, Filter, Activity, Star, Award, Flame, Radio } from 'lucide-react'
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
  // Removido: listas de leads/atividades para KPIs e charts (usamos endpoint agregado)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<{ faturamento: number; vendas: number; oportunidades: number; totalLeads: number; taxaConversao: number }>({ faturamento: 0, vendas: 0, oportunidades: 0, totalLeads: 0, taxaConversao: 0 })
  // Charts
  type ChartItem = { label: string; value: number }
  type ForecastItem = { key: string; value: number }
  const [chartFunilFase, setChartFunilFase] = useState<ChartItem[]>([])
  const [chartPipelineVendedor, setChartPipelineVendedor] = useState<ChartItem[]>([])
  const [chartForecastMensal, setChartForecastMensal] = useState<ForecastItem[]>([])
  const [chartConversaoCanal, setChartConversaoCanal] = useState<ChartItem[]>([])
  const [chartConversaoVendedor, setChartConversaoVendedor] = useState<ChartItem[]>([])
  const [chartConversaoEtapa, setChartConversaoEtapa] = useState<ChartItem[]>([])
  const [chartConversaoEtapaInside, setChartConversaoEtapaInside] = useState<ChartItem[]>([])
  const [chartMotivosPerda, setChartMotivosPerda] = useState<ChartItem[]>([])
  const [chartAtividadesVendedor, setChartAtividadesVendedor] = useState<ChartItem[]>([])
  const [chartFontesLeads, setChartFontesLeads] = useState<ChartItem[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const params = new URLSearchParams()
        const from = filters.dateRange?.from
        const to = filters.dateRange?.to
        if (from) params.set('de', from)
        if (to) params.set('ate', to)

        const deDefault = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const urls = [
          `/api/modulos/crm?view=oportunidades&page=1&pageSize=1000&de=${from ?? deDefault}`,
        ]
        const [kRes, oRes] = await Promise.allSettled([
          fetch(`/api/modulos/crm/dashboard?${params.toString()}`, { cache: 'no-store' }),
          fetch(urls[0], { cache: 'no-store' }),
        ])
        let os: OportunidadeRow[] = []
        if (kRes.status === 'fulfilled' && kRes.value.ok) {
          const j = await kRes.value.json()
          const kk = j?.kpis || {}
          const charts = j?.charts || {}
          setKpis({
            faturamento: Number(kk.faturamento || 0),
            vendas: Number(kk.vendas || 0),
            oportunidades: Number(kk.oportunidades || 0),
            totalLeads: Number(kk.totalLeads || 0),
            taxaConversao: Number(kk.taxaConversao || 0),
          })
          setChartFunilFase(Array.isArray(charts?.funil_fase) ? charts.funil_fase as ChartItem[] : [])
          setChartPipelineVendedor(Array.isArray(charts?.pipeline_vendedor) ? charts.pipeline_vendedor as ChartItem[] : [])
          setChartForecastMensal(Array.isArray(charts?.forecast_mensal) ? charts.forecast_mensal as ForecastItem[] : [])
          setChartConversaoCanal(Array.isArray(charts?.conversao_canal) ? charts.conversao_canal as ChartItem[] : [])
          setChartConversaoVendedor(Array.isArray(charts?.conversao_vendedor) ? charts.conversao_vendedor as ChartItem[] : [])
          setChartConversaoEtapa(Array.isArray(charts?.conversao_etapa) ? charts.conversao_etapa as ChartItem[] : [])
          setChartMotivosPerda(Array.isArray(charts?.motivos_perda) ? charts.motivos_perda as ChartItem[] : [])
          setChartAtividadesVendedor(Array.isArray(charts?.atividades_vendedor) ? charts.atividades_vendedor as ChartItem[] : [])
          setChartFontesLeads(Array.isArray(charts?.fontes_leads) ? charts.fontes_leads as ChartItem[] : [])
          setChartConversaoEtapaInside(Array.isArray(charts?.conversao_etapa_inside) ? charts.conversao_etapa_inside as ChartItem[] : [])
        }
        if (oRes.status === 'fulfilled' && oRes.value.ok) {
          const j = (await oRes.value.json()) as { rows?: unknown[] }
          os = Array.isArray(j?.rows) ? (j.rows as unknown as OportunidadeRow[]) : []
        }
        if (!cancelled) { setOpps(os) }
      } catch {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [filters.dateRange])

  // KPIs (reais)
  const openOpps = useMemo(() => opps.filter(o => !isClosed(o.estagio)), [opps])

  // Map forecast labels
  const forecastMensalItems = useMemo(() => chartForecastMensal.map(it => ({ label: monthLabel(it.key), value: it.value })), [chartForecastMensal])

  // Charts não implementados no back-end (mantidos vazios)
  const conversaoPorEtapa: ChartItem[] = chartConversaoEtapa
  const leadScoring: ChartItem[] = []
  const qualidadeCanais: ChartItem[] = []

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

  // Preparar dados de Oportunidades Quentes para chart
  const oportunidadesQuentesChart = useMemo(() => {
    return hotOpps.map(o => ({
      label: o.oportunidade || o.conta || 'Oportunidade',
      value: Number(o.valor) || 0
    }))
  }, [hotOpps])

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {(() => { const cls = `bg-white p-6 rounded-lg border border-gray-100${cardShadow ? ' shadow-sm' : ''}`; return (
          <>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Oportunidades</div>
              <div className="text-2xl font-bold text-indigo-600" style={styleValues}>{kpis.oportunidades}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Total no período</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Faturamento</div>
              <div className="text-2xl font-bold text-green-600" style={styleValues}>{formatBRL(kpis.faturamento)}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Oportunidades fechadas/ganhas</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Vendas</div>
              <div className="text-2xl font-bold text-blue-600" style={styleValues}>{kpis.vendas}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Oportunidades com fase Fechado</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Leads</div>
              <div className="text-2xl font-bold text-purple-600" style={styleValues}>{kpis.totalLeads}</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Total de leads ativos</div>
            </div>
            <div className={cls} style={{ borderColor: cardBorderColor }}>
              <div className="text-sm font-medium text-gray-500 mb-2" style={styleKpiTitle}>Taxa de Conversão</div>
              <div className="text-2xl font-bold text-orange-600" style={styleValues}>{kpis.taxaConversao.toFixed(1)}%</div>
              <div className="text-xs text-gray-400 mt-1" style={styleText}>Vendas (Fechado) / Leads</div>
            </div>
          </>
        )})()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalRecharts
          items={chartFunilFase}
          title="Pipeline de Vendas"
          icon={<TrendingUp className="w-5 h-5" />}
          color="#3b82f6"
        />
        <BarChartHorizontalRecharts
          items={chartPipelineVendedor}
          title="Pipeline por Vendedor"
          icon={<Users className="w-5 h-5" />}
          color="#10b981"
        />
        <BarChartHorizontalRecharts
          items={forecastMensalItems}
          title="Forecast Mês a Mês"
          icon={<CalendarDays className="w-5 h-5" />}
          color="#8b5cf6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalPercent
          items={chartConversaoCanal}
          title="Taxa de Conversão por Canal"
          icon={<Target className="w-5 h-5" />}
          color="#f59e0b"
          height={280}
        />
        <BarChartHorizontalPercent
          items={chartConversaoVendedor}
          title="Conversão por Vendedor"
          icon={<UserCheck className="w-5 h-5" />}
          color="#10b981"
          height={280}
        />
        <BarChartHorizontalRecharts
          items={chartMotivosPerda}
          title="Motivos de Perda"
          icon={<XCircle className="w-5 h-5" />}
          color="#ef4444"
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalPercent
          items={chartConversaoEtapaInside}
          title="Conversão por Etapa do Funil (Inside Sales)"
          icon={<Filter className="w-5 h-5" />}
          color="#3b82f6"
          height={280}
        />
        <BarChartHorizontalPercent
          items={conversaoPorEtapa}
          title="Conversão por Etapa do Funil (B2B)"
          icon={<Filter className="w-5 h-5" />}
          color="#8b5cf6"
          height={280}
        />
        <BarChartHorizontalRecharts
          items={chartAtividadesVendedor}
          title="Atividades por Vendedor"
          icon={<Activity className="w-5 h-5" />}
          color="#f59e0b"
          height={280}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalRecharts
          items={leadScoring}
          title="Distribuição de Lead Scoring"
          icon={<Star className="w-5 h-5" />}
          color="#eab308"
          height={240}
        />
        <BarChartHorizontalRecharts
          items={qualidadeCanais}
          title="Qualidade dos Canais (Score)"
          icon={<Award className="w-5 h-5" />}
          color="#6366f1"
          height={240}
        />
        <BarChartHorizontalRecharts
          items={oportunidadesQuentesChart}
          title="Oportunidades Quentes"
          icon={<Flame className="w-5 h-5" />}
          color="#10b981"
          height={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BarChartHorizontalRecharts
          items={chartFontesLeads}
          title="Top Fontes de Leads"
          icon={<Radio className="w-5 h-5" />}
          color="#3b82f6"
          height={240}
        />
      </div>
    </DashboardLayout>
  )
}
