'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, BarChart3, Wallet, Star, CalendarCheck, Calendar as CalendarIcon } from 'lucide-react'
import { BarChartHorizontalRecharts } from '@/components/charts/BarChartHorizontalRecharts'
import { BarChartMultipleRecharts } from '@/components/charts/BarChartMultipleRecharts'
import { KPITrendBadge } from '@/components/widgets/KPITrendBadge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { DateRange } from 'react-day-picker'
import { $financeiroDashboardUI, $financeiroDashboardFilters, financeiroDashboardActions, type FontSection } from '@/stores/modulos/financeiroDashboardStore'
// (sem store global para sparkline)
import type { FinanceiroDashboardUIState } from '@/stores/modulos/financeiroDashboardStore'

type BaseRow = {
  valor_total?: number | string
  data_vencimento?: string
  status?: string
}

type ARRow = BaseRow & {
  cliente?: string
  descricao?: string
}

type APRow = BaseRow & {
  fornecedor?: string
  descricao?: string
  descricao_lancamento?: string
}

type RecebidoRow = {
  valor_total?: number | string
  data_recebimento?: string
}

type EfetuadoRow = {
  valor_pago?: number | string
  data_pagamento?: string
}

function formatBRL(v: unknown) {
  const n = Number(v ?? 0)
  if (isNaN(n)) return String(v ?? '')
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Font controls
function fontVar(name?: string) {
  if (!name) return undefined
  if (name === 'Inter') return 'var(--font-inter)'
  if (name === 'Geist') return 'var(--font-geist-sans)'
  if (name === 'Roboto Mono') return 'var(--font-roboto-mono)'
  if (name === 'Geist Mono') return 'var(--font-geist-mono)'
  if (name === 'IBM Plex Mono') return 'var(--font-ibm-plex-mono), "IBM Plex Mono", monospace'
  if (name === 'Avenir') return 'var(--font-avenir), Avenir, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  if (name === 'Space Mono') return 'var(--font-space-mono), "Space Mono", monospace'
  if (name === 'EB Garamond') return 'var(--font-eb-garamond), "EB Garamond", serif'
  if (name === 'Libre Baskerville') return 'var(--font-libre-baskerville), "Libre Baskerville", serif'
  if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
  return name
}

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function parseDate(value?: string) {
  if (!value) return null
  if (typeof value === 'string') {
    // Padrão ISO date-only ou com tempo: pega apenas a parte de data
    const mIso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (mIso) {
      const yyyy = parseInt(mIso[1], 10)
      const mm = parseInt(mIso[2], 10)
      const dd = parseInt(mIso[3], 10)
      const d = new Date(yyyy, mm - 1, dd) // local date, sem fuso
      if (!isNaN(d.getTime())) return d
    }
    // dd/mm/yyyy
    const mBr = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (mBr) {
      const dd = parseInt(mBr[1], 10)
      const mm = parseInt(mBr[2], 10)
      const yyyy = parseInt(mBr[3], 10)
      const d = new Date(yyyy, mm - 1, dd)
      if (!isNaN(d.getTime())) return d
    }
  }
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? null : d
}

function daysDiffFromToday(dateStr?: string) {
  const d = parseDate(dateStr)
  if (!d) return null
  const today = new Date()
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const ms = b.getTime() - a.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

function isPaid(status?: string) {
  if (!status) return false
  const s = status.toLowerCase()
  return s.includes('pago') || s.includes('liquidado') || s.includes('baixado')
}

function toNum(v: unknown) {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const s = v.trim().replace(/\./g, '').replace(/,/g, '.')
    const n = parseFloat(s)
    return isNaN(n) ? 0 : n
  }
  const n = Number(v || 0)
  return isNaN(n) ? 0 : n
}

export default function FinanceiroDashboardPage() {
  const [arRows, setArRows] = useState<ARRow[]>([])
  const [apRows, setApRows] = useState<APRow[]>([])
  const [prRows, setPrRows] = useState<RecebidoRow[]>([])
  const [peRows, setPeRows] = useState<EfetuadoRow[]>([])
  const [topCC, setTopCC] = useState<{ label: string; value: number }[]>([])
  const [topCategorias, setTopCategorias] = useState<{ label: string; value: number }[]>([])
  const [topDepartamentos, setTopDepartamentos] = useState<{ label: string; value: number }[]>([])
  const [topLucros, setTopLucros] = useState<{ label: string; value: number }[]>([])
  const [topProjetos, setTopProjetos] = useState<{ label: string; value: number }[]>([])
  const [topFiliais, setTopFiliais] = useState<{ label: string; value: number }[]>([])
  const [topFornecedores, setTopFornecedores] = useState<{ label: string; value: number }[]>([])
  const [topClientes, setTopClientes] = useState<{ label: string; value: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Global (Nanostores): UI + Filters
  const ui = useStore($financeiroDashboardUI)
  const filters = useStore($financeiroDashboardFilters)
  const fonts = ui.fonts
  const cardBorderColor = ui.cardBorderColor
  const cardShadow = ui.cardShadow // legacy flag (kept for compatibility)
  const pageBgColor = ui.pageBgColor
  const filtersIconColor = ui.filtersIconColor
  const kpiIconColor = ui.kpiIconColor
  const chartIconColor = ui.chartIconColor
  const cardShadowPreset = ui.cardShadowPreset
  // Forçar fonte Barlow em todas as seções de tipografia deste dashboard
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
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // Patch-like setters to keep UI code similar
  const setFonts = (
    updater: (
      prev: FinanceiroDashboardUIState['fonts']
    ) => FinanceiroDashboardUIState['fonts']
  ) => {
    const next = updater(fonts)
    financeiroDashboardActions.setUI({ fonts: next })
  }
  const setCardBorderColor = (v: string) => financeiroDashboardActions.setUI({ cardBorderColor: v })
  const setPageBgColor = (v: string) => financeiroDashboardActions.setUI({ pageBgColor: v })
  const setFiltersIconColor = (v: string) => financeiroDashboardActions.setUI({ filtersIconColor: v })
  const setKpiIconColor = (v: string) => financeiroDashboardActions.setUI({ kpiIconColor: v })
  const setChartIconColor = (v: string) => financeiroDashboardActions.setUI({ chartIconColor: v })
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
  const [sidebarBgColor, setSidebarBgColor] = useState<string>('#fdfdfd')
  const [sidebarTextColor, setSidebarTextColor] = useState<string>('#717171')
  const [sidebarItemTextColor, setSidebarItemTextColor] = useState<string>('#0f172a')
  const styleValues = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.values.family),
    fontWeight: fonts.values.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.values.letterSpacing === 'number' ? `${fonts.values.letterSpacing}em` : undefined,
    color: fonts.values.color || undefined,
    fontSize: typeof fonts.values.size === 'number' ? `${fonts.values.size}px` : undefined,
    textTransform: fonts.values.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.values])
  const styleKpiTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.kpiTitle.family),
    fontWeight: fonts.kpiTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.kpiTitle.letterSpacing === 'number' ? `${fonts.kpiTitle.letterSpacing}em` : undefined,
    color: fonts.kpiTitle.color || undefined,
    fontSize: typeof fonts.kpiTitle.size === 'number' ? `${fonts.kpiTitle.size}px` : undefined,
    textTransform: fonts.kpiTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.kpiTitle])
  const styleChartTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.chartTitle.family),
    fontWeight: fonts.chartTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.chartTitle.letterSpacing === 'number' ? `${fonts.chartTitle.letterSpacing}em` : undefined,
    color: fonts.chartTitle.color || undefined,
    fontSize: typeof fonts.chartTitle.size === 'number' ? `${fonts.chartTitle.size}px` : undefined,
    textTransform: fonts.chartTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.chartTitle])
  const styleText = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.text.family),
    fontWeight: fonts.text.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.text.letterSpacing === 'number' ? `${fonts.text.letterSpacing}em` : undefined,
    color: fonts.text.color || undefined,
    fontSize: typeof fonts.text.size === 'number' ? `${fonts.text.size}px` : undefined,
    textTransform: fonts.text.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.text])

  const styleHeaderTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.headerTitle.family),
    fontWeight: fonts.headerTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.headerTitle.letterSpacing === 'number' ? `${fonts.headerTitle.letterSpacing}em` : undefined,
    color: fonts.headerTitle.color || undefined,
    fontSize: typeof fonts.headerTitle.size === 'number' ? `${fonts.headerTitle.size}px` : undefined,
    textTransform: fonts.headerTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.headerTitle])
  const styleHeaderSubtitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.headerSubtitle.family),
    fontWeight: fonts.headerSubtitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.headerSubtitle.letterSpacing === 'number' ? `${fonts.headerSubtitle.letterSpacing}em` : undefined,
    color: fonts.headerSubtitle.color || undefined,
    fontSize: typeof fonts.headerSubtitle.size === 'number' ? `${fonts.headerSubtitle.size}px` : undefined,
    textTransform: fonts.headerSubtitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.headerSubtitle])

  const styleFilters = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.filters.family),
    fontWeight: fonts.filters.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.filters.letterSpacing === 'number' ? `${fonts.filters.letterSpacing}em` : undefined,
    color: fonts.filters.color || undefined,
    fontSize: typeof fonts.filters.size === 'number' ? `${fonts.filters.size}px` : undefined,
    textTransform: fonts.filters.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.filters])

  const styleSidebarSectionTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.sidebarSectionTitle.family),
    fontWeight: fonts.sidebarSectionTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.sidebarSectionTitle.letterSpacing === 'number' ? `${fonts.sidebarSectionTitle.letterSpacing}em` : undefined,
    color: fonts.sidebarSectionTitle.color || undefined,
    fontSize: typeof fonts.sidebarSectionTitle.size === 'number' ? `${fonts.sidebarSectionTitle.size}px` : undefined,
    textTransform: fonts.sidebarSectionTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.sidebarSectionTitle])

  const styleSidebarItemText = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.sidebarItemText.family),
    fontWeight: fonts.sidebarItemText.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.sidebarItemText.letterSpacing === 'number' ? `${fonts.sidebarItemText.letterSpacing}em` : undefined,
    color: fonts.sidebarItemText.color || undefined,
    fontSize: typeof fonts.sidebarItemText.size === 'number' ? `${fonts.sidebarItemText.size}px` : undefined,
    textTransform: fonts.sidebarItemText.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.sidebarItemText])

  // Header right actions (date range + generic data filter)
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

  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month')

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

      {/* Agrupar por */}
      <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'day' | 'week' | 'month')}>
        <SelectTrigger className="h-9 w-[140px]" style={styleFilters}>
          <SelectValue placeholder="Agrupar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Dia</SelectItem>
          <SelectItem value="week">Semana</SelectItem>
          <SelectItem value="month">Mês</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const cardContainerClass = `bg-white p-6 rounded-lg border border-gray-100`
  const cardBoxShadow = useMemo(() => (cardShadowPreset === 'none' ? 'none' : `var(--shadow-${cardShadowPreset})`), [cardShadowPreset])

  // KPIs do mês — dinâmico via date picker (header)
  const [kpisMonth, setKpisMonth] = useState<{ arMes: number; apMes: number; recebidosMes: number; pagosMes: number; geracaoCaixa: number; receitaMes: number; despesasMes: number; lucroMes: number } | null>(null)
  const { kpiDe, kpiAte, kpiLabel } = useMemo(() => {
    const now = new Date()
    const firstDayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
    const lastDayOf = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
    let start: Date
    let end: Date
    if (dateRange?.from && dateRange?.to) {
      start = new Date(dateRange.from)
      end = new Date(dateRange.to)
    } else if (dateRange?.from) {
      start = firstDayOf(dateRange.from)
      end = lastDayOf(dateRange.from)
    } else {
      start = firstDayOf(now)
      end = lastDayOf(now)
    }
    const deIso = toDateOnly(start)
    const ateIso = toDateOnly(end)
    const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
    const label = sameMonth
      ? start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      : `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`
    return { kpiDe: deIso, kpiAte: ateIso, kpiLabel: label }
  }, [dateRange])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const qs = (view: string) => `/api/modulos/financeiro?view=${view}&page=1&pageSize=1000`
        const [arRes, apRes, prRes, peRes, kpisRes, topCcRes, topCatRes, topDepRes, topLucroRes, topProjRes, topFilialRes, cfRealRes, topFornRes, topCliRes] = await Promise.allSettled([
          fetch(qs('contas-a-receber'), { cache: 'no-store' }),
          fetch(qs('contas-a-pagar'), { cache: 'no-store' }),
          fetch(qs('pagamentos-recebidos'), { cache: 'no-store' }),
          fetch(qs('pagamentos-efetuados'), { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=kpis&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-despesas&dim=centro_custo&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-despesas&dim=categoria&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-despesas&dim=departamento&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-receitas-centro-lucro&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-despesas&dim=projeto&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-despesas&dim=filial&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=cashflow-realized&de=${kpiDe}&ate=${kpiAte}&group_by=${groupBy}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-despesas&dim=fornecedor&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
          fetch(`/api/modulos/financeiro?view=top-receitas&dim=cliente&de=${kpiDe}&ate=${kpiAte}`, { cache: 'no-store' }),
        ])

        let ar: ARRow[] = []
        let ap: APRow[] = []
        let pr: RecebidoRow[] = []
        let pe: EfetuadoRow[] = []

        if (arRes.status === 'fulfilled' && arRes.value.ok) {
          const j = (await arRes.value.json()) as { rows?: any[] }
          ar = Array.isArray(j?.rows)
            ? j.rows.map((r: any) => ({
                valor_total: r.valor_a_receber ?? r.valor ?? r.valor_total,
                data_vencimento: r.data_vencimento ?? r.vencimento ?? r.dv,
                status: r.status_conta ?? r.status,
                cliente: r.cliente_nome ?? r.cliente,
                descricao: r.descricao_conta ?? r.descricao,
              }))
            : []
        }
        if (apRes.status === 'fulfilled' && apRes.value.ok) {
          const j = (await apRes.value.json()) as { rows?: any[] }
          ap = Array.isArray(j?.rows)
            ? j.rows.map((r: any) => ({
                valor_total: r.valor_a_pagar ?? r.valor ?? r.valor_total,
                data_vencimento: r.data_vencimento ?? r.vencimento ?? r.dv,
                status: r.status_conta ?? r.status,
                fornecedor: r.fornecedor_nome ?? r.fornecedor,
                descricao: r.descricao_conta ?? r.descricao,
                descricao_lancamento: r.descricao_conta ?? r.descricao_lancamento ?? r.descricao,
              }))
            : []
        }
        if (prRes.status === 'fulfilled' && prRes.value.ok) {
          const j = (await prRes.value.json()) as { rows?: any[] }
          pr = Array.isArray(j?.rows)
            ? j.rows.map((r: any) => ({
                valor_total: r.valor_recebido ?? r.valor ?? r.valor_total,
                data_recebimento: r.data_pagamento ?? r.data_recebimento ?? r.data_lancamento,
              }))
            : []
        }
        if (peRes.status === 'fulfilled' && peRes.value.ok) {
          const j = (await peRes.value.json()) as { rows?: any[] }
          pe = Array.isArray(j?.rows)
            ? j.rows.map((r: any) => ({
                valor_pago: r.valor_pago ?? r.valor ?? r.valor_total,
                data_pagamento: r.data_pagamento ?? r.data_lancamento ?? r.data,
              }))
            : []
        }

        // Fallback mock if nothing returned (ex: sem DB)
        if (ar.length === 0 && ap.length === 0) {
          const today = toDateOnly(new Date())
          const in3 = toDateOnly(new Date(Date.now() + 3 * 86400000))
          const in6 = toDateOnly(new Date(Date.now() + 6 * 86400000))
          const y2 = toDateOnly(new Date(Date.now() - 2 * 86400000))
          ar = [
            { cliente: 'Cliente A', descricao: 'NF 1001', valor_total: 2500, data_vencimento: y2, status: 'vencido' },
            { cliente: 'Cliente B', descricao: 'Fatura 2002', valor_total: 5200, data_vencimento: today, status: 'pendente' },
            { cliente: 'Cliente C', descricao: 'Mensalidade', valor_total: 1800, data_vencimento: in3, status: 'pendente' },
            { cliente: 'Cliente D', descricao: 'Serviço', valor_total: 3400, data_vencimento: in6, status: 'pendente' },
          ]
          ap = [
            { fornecedor: 'Fornecedor X', descricao_lancamento: 'NF 889', descricao: 'NF 889', valor_total: 3100, data_vencimento: today, status: 'pendente' },
            { fornecedor: 'Fornecedor Y', descricao_lancamento: 'Contrato', descricao: 'Contrato', valor_total: 780, data_vencimento: in3, status: 'pendente' },
            { fornecedor: 'Fornecedor Z', descricao_lancamento: 'Impostos', descricao: 'Impostos', valor_total: 5600, data_vencimento: y2, status: 'vencido' },
          ]
          // mocks de recebidos/efetuados para gráficos
          const m0 = toDateOnly(new Date())
          const m1 = toDateOnly(new Date(new Date().setMonth(new Date().getMonth() - 1)))
          const m2 = toDateOnly(new Date(new Date().setMonth(new Date().getMonth() - 2)))
          pr = [
            { valor_total: 18000, data_recebimento: m2 },
            { valor_total: 22000, data_recebimento: m1 },
            { valor_total: 19500, data_recebimento: m0 },
          ]
          pe = [
            { valor_pago: 12500, data_pagamento: m2 },
            { valor_pago: 16750, data_pagamento: m1 },
            { valor_pago: 14200, data_pagamento: m0 },
          ]
        }

        // KPIs mês (API)
        if (kpisRes.status === 'fulfilled' && kpisRes.value.ok) {
          const j = await kpisRes.value.json() as { kpis?: { ar_mes?: number; ap_mes?: number; recebidos_mes?: number; pagos_mes?: number; geracao_caixa?: number; receita_mes?: number; despesas_mes?: number; lucro_mes?: number } }
          if (j?.kpis) {
            setKpisMonth({
              arMes: Number(j.kpis.ar_mes || 0),
              apMes: Number(j.kpis.ap_mes || 0),
              recebidosMes: Number(j.kpis.recebidos_mes || 0),
              pagosMes: Number(j.kpis.pagos_mes || 0),
              geracaoCaixa: Number(j.kpis.geracao_caixa || 0),
              receitaMes: Number(j.kpis.receita_mes || 0),
              despesasMes: Number(j.kpis.despesas_mes || 0),
              lucroMes: Number(j.kpis.lucro_mes || 0),
            })
          }
        }

        if (!cancelled) {
          setArRows(ar)
          setApRows(ap)
          setPrRows(pr)
          setPeRows(pe)
          // Top 5 (CC, Categoria, Departamento)
          if (topCcRes.status === 'fulfilled' && topCcRes.value.ok) {
            const j = await topCcRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopCC(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopCC([])
          if (topCatRes.status === 'fulfilled' && topCatRes.value.ok) {
            const j = await topCatRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopCategorias(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopCategorias([])
          if (topDepRes.status === 'fulfilled' && topDepRes.value.ok) {
            const j = await topDepRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopDepartamentos(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopDepartamentos([])
          if (topLucroRes.status === 'fulfilled' && topLucroRes.value.ok) {
            const j = await topLucroRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopLucros(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopLucros([])
          if (topProjRes.status === 'fulfilled' && topProjRes.value.ok) {
            const j = await topProjRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopProjetos(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopProjetos([])
          if (topFilialRes.status === 'fulfilled' && topFilialRes.value.ok) {
            const j = await topFilialRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopFiliais(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopFiliais([])

          if (cfRealRes.status === 'fulfilled' && cfRealRes.value.ok) {
            const j = await cfRealRes.value.json() as { rows?: Array<{ period: string; entradas: number; saidas: number; net: number }> }
            setCashRealized(Array.isArray(j?.rows) ? j.rows : [])
          } else setCashRealized([])

          // Top fornecedores e clientes
          if (topFornRes.status === 'fulfilled' && topFornRes.value.ok) {
            const j = await topFornRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopFornecedores(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopFornecedores([])
          if (topCliRes.status === 'fulfilled' && topCliRes.value.ok) {
            const j = await topCliRes.value.json() as { rows?: Array<{ label?: string; total?: number }> }
            setTopClientes(Array.isArray(j?.rows) ? j.rows.map(r => ({ label: String(r.label || ''), value: Number(r.total || 0) })) : [])
          } else setTopClientes([])
        }
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [kpiDe, kpiAte])

  // Helpers to compute KPIs
  const todayStr = toDateOnly(new Date())
  const isToday = (d?: string) => d ? toDateOnly(new Date(d)) === todayStr : false
  const isOverdue = <T extends BaseRow>(r: T) => !isPaid(r.status) && (daysDiffFromToday(String(r.data_vencimento)) ?? 1) < 0
  const isOpenOrOverdue = <T extends BaseRow>(r: T) => !isPaid(r.status)

  // Fallback simples caso a API de KPIs não responda: usa somas do mês corrente (client-side)
  const kpis = useMemo(() => {
    if (kpisMonth) return kpisMonth
    const inMonth = (ds?: string) => {
      const d = parseDate(ds)
      if (!d) return false
      const s = toDateOnly(d)
      return s >= kpiDe && s <= kpiAte
    }
    const sum = <T extends BaseRow>(arr: T[], pred: (r: T) => boolean) => arr.filter(pred).reduce((acc, r) => acc + toNum(r.valor_total), 0)
    const arMes = sum(arRows, r => !isPaid(r.status) && inMonth(String(r.data_vencimento)))
    const apMes = sum(apRows, r => !isPaid(r.status) && inMonth(String(r.data_vencimento)))
    // recebidos/pagos: aproximar por data de pagamento/recebimento nos arrays de séries
    const recebidosMes = prRows.filter(r => inMonth(String(r.data_recebimento))).reduce((a, r) => a + toNum(r.valor_total), 0)
    const pagosMes = peRows.filter(r => inMonth(String(r.data_pagamento))).reduce((a, r) => a + toNum(r.valor_pago), 0)
    const geracaoCaixa = recebidosMes - pagosMes
    // receita/despesas: ignorar status, por vencimento no período
    const receitaMes = arRows.filter(r => inMonth(String(r.data_vencimento))).reduce((a, r) => a + toNum(r.valor_total), 0)
    const despesasMes = apRows.filter(r => inMonth(String(r.data_vencimento))).reduce((a, r) => a + toNum(r.valor_total), 0)
    const lucroMes = receitaMes - despesasMes
    return { arMes, apMes, recebidosMes, pagosMes, geracaoCaixa, receitaMes, despesasMes, lucroMes }
  }, [kpisMonth, arRows, apRows, prRows, peRows])

  const topReceber = useMemo(() => {
    const rows = arRows.filter(r => !isPaid(r.status))
    return rows
      .map(r => ({
        nome: r.cliente || 'Cliente',
        desc: r.descricao,
        valor: Number(r.valor_total) || 0,
        dv: String(r.data_vencimento),
        dd: daysDiffFromToday(String(r.data_vencimento)) ?? 9999,
      }))
      .sort((a, b) => (a.dd ?? 9999) - (b.dd ?? 9999) || b.valor - a.valor)
      .slice(0, 5)
  }, [arRows])

  const pagamentosHoje = useMemo(() => {
    const rows = apRows.filter(r => !isPaid(r.status) && isToday(String(r.data_vencimento)))
    return rows
      .map(r => ({
        nome: r.fornecedor || 'Fornecedor',
        desc: r.descricao || r.descricao_lancamento,
        valor: Number(r.valor_total) || 0,
        dv: String(r.data_vencimento),
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
  }, [apRows])

  // ---- Charts: Receitas vs Despesas & Saldo no final do mês ----
  function monthKey(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }
  function monthKeyFromStr(s?: string) {
    if (!s) return null
    const d = parseDate(s)
    if (!d) return null
    return monthKey(d)
  }
  function monthLabel(key: string) {
    const [y, m] = key.split('-').map(Number)
    const d = new Date(y, (m || 1) - 1, 1)
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }
  function lastMonths(n: number) {
    const arr: string[] = []
    const base = new Date()
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
      arr.push(monthKey(d))
    }
    return arr
  }
  const meses = useMemo(() => lastMonths(6), [])

  // Cashflow (realizado) - estados
  type CashRow = { period: string; entradas: number; saidas: number; net: number }
  const [cashRealized, setCashRealized] = useState<CashRow[]>([])

  // Helpers to display cashflow labels
  function periodToLabel(s: string) {
    const d = parseDate(s)
    if (!d) return s
    if (groupBy === 'day') return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    if (groupBy === 'week') return `sem ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }

  // Cálculo do período anterior (mesmo tamanho) e label
  const prevPeriod = useMemo(() => {
    const start = parseDate(kpiDe) || new Date(kpiDe)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(start)
    // exatamente 7 dias anteriores ao início
    prevStart.setDate(prevStart.getDate() - 7)
    return { prevStart, prevEnd, prevLabel: `7 dias anteriores` }
  }, [kpiDe])

  const prevTotals = useMemo(() => {
    const inPrevRange = (ds?: string) => {
      const d = parseDate(String(ds))
      if (!d) return false
      const s = toDateOnly(d)
      return s >= toDateOnly(prevPeriod.prevStart) && s <= toDateOnly(prevPeriod.prevEnd)
    }
    const sum = <T extends BaseRow>(arr: T[], pred: (r: T) => boolean) => arr.filter(pred).reduce((acc, r) => acc + toNum(r.valor_total), 0)
    const arMes = sum(arRows, r => !isPaid(r.status) && inPrevRange(String(r.data_vencimento)))
    const apMes = sum(apRows, r => !isPaid(r.status) && inPrevRange(String(r.data_vencimento)))
    const recebidosMes = prRows.filter(r => inPrevRange(String(r.data_recebimento))).reduce((a, r) => a + toNum(r.valor_total), 0)
    const pagosMes = peRows.filter(r => inPrevRange(String(r.data_pagamento))).reduce((a, r) => a + toNum(r.valor_pago), 0)
    const receitaMes = arRows.filter(r => inPrevRange(String(r.data_vencimento))).reduce((a, r) => a + toNum(r.valor_total), 0)
    const despesasMes = apRows.filter(r => inPrevRange(String(r.data_vencimento))).reduce((a, r) => a + toNum(r.valor_total), 0)
    const lucroMes = receitaMes - despesasMes
    const geracaoCaixa = recebidosMes - pagosMes
    return { arMes, apMes, recebidosMes, pagosMes, receitaMes, despesasMes, lucroMes, geracaoCaixa }
  }, [arRows, apRows, prRows, peRows, prevPeriod])

  function BarsReceitasDespesas({ items, max }: { items: { label: string; receita: number; despesa: number }[]; max: number }) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" />Receitas</div>
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-rose-500" />Despesas</div>
        </div>
        <div className="grid grid-cols-6 gap-3 h-44 items-end">
          {items.map((it) => {
            const rH = Math.round((it.receita / max) * 100)
            const dH = Math.round((it.despesa / max) * 100)
            return (
              <div key={it.label} className="flex flex-col items-center justify-end gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="w-2/5 bg-emerald-500/80 rounded" style={{ height: `${rH}%` }} />
                  <div className="w-2/5 bg-rose-500/80 rounded" style={{ height: `${dH}%` }} />
                </div>
                <div className="text-[11px] text-gray-600" style={styleText}>{it.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  function BarList({ items, color = 'bg-sky-500' }: { items: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-xs text-gray-400" style={styleText}>Sem dados</div>
        ) : items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1" style={styleText}>
                <span className="truncate pr-2">{it.label}</span>
                <span>{formatBRL(it.value)}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded">
                <div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function LineSaldoMensal({ values, min, max }: { values: number[]; min: number; max: number }) {
    const W = 520
    const H = 180
    const padX = 16
    const padY = 12
    const n = Math.max(1, values.length)
    const xStep = (W - padX * 2) / Math.max(1, n - 1)
    const scaleY = (v: number) => {
      const rng = max - min || 1
      const t = (v - min) / rng
      return H - padY - t * (H - padY * 2)
    }
    const pts = values.map((v, i) => `${padX + i * xStep},${scaleY(v)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
        <defs>
          <linearGradient id="saldoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2" />
        {values.length > 1 && (
          <polygon
            points={`${padX},${scaleY(values[0])} ${pts} ${padX + (n - 1) * xStep},${H - padY} ${padX},${H - padY}`}
            fill="url(#saldoGrad)"
          />
        )}
      </svg>
    )
  }

  return (
    <DashboardLayout
      title="Olá, Igor Bianch"
      subtitle="Você está na aba Dashboard do módulo Financeiro"
      backgroundColor={pageBgColor}
      headerBackground="transparent"
      headerTitleStyle={styleHeaderTitle}
      headerSubtitleStyle={styleHeaderSubtitle}
      headerActions={headerActions}
      sidebarBgColor={sidebarBgColor}
      sidebarTextColor={sidebarTextColor}
      sidebarItemTextColor={sidebarItemTextColor}
      sidebarItemTextStyle={styleSidebarItemText}
      sidebarSectionTitleStyle={styleSidebarSectionTitle}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Carregando dados…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <ArrowDownCircle className="w-4 h-4" style={{ color: kpiIconColor }} />A Receber no mês ({kpiLabel})
          </div>
          <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatBRL(kpis.arMes)}</div>
          <KPITrendBadge current={kpis.arMes} previous={prevTotals.arMes} invert label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Vencimento dentro do período</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <ArrowUpCircle className="w-4 h-4" style={{ color: kpiIconColor }} />A Pagar no mês ({kpiLabel})
          </div>
          <div className="text-2xl font-bold text-rose-600" style={styleValues}>{formatBRL(kpis.apMes)}</div>
          <KPITrendBadge current={kpis.apMes} previous={prevTotals.apMes} invert label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Vencimento dentro do período</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <Wallet className="w-4 h-4" style={{ color: kpiIconColor }} />Recebido no mês ({kpiLabel})
          </div>
          <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatBRL(kpis.recebidosMes)}</div>
          <KPITrendBadge current={kpis.recebidosMes} previous={prevTotals.recebidosMes} label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Recebimentos realizados no período</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <CalendarCheck className="w-4 h-4" style={{ color: kpiIconColor }} />Pago no mês ({kpiLabel})
          </div>
          <div className="text-2xl font-bold text-rose-600" style={styleValues}>{formatBRL(kpis.pagosMes)}</div>
          <KPITrendBadge current={kpis.pagosMes} previous={prevTotals.pagosMes} invert label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Pagamentos realizados no período</div>
        </div>
      </div>

      {/* KPI: Receita, Despesas, Lucro e Geração de Caixa do mês */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <Wallet className="w-4 h-4" style={{ color: kpiIconColor }} />Receita ({kpiLabel})
          </div>
          <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatBRL(kpis.receitaMes)}</div>
          <KPITrendBadge current={kpis.receitaMes} previous={prevTotals.receitaMes} label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Contas a receber no período (sem status)</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <ArrowUpCircle className="w-4 h-4" style={{ color: kpiIconColor }} />Despesas ({kpiLabel})
          </div>
          <div className="text-2xl font-bold text-rose-600" style={styleValues}>{formatBRL(kpis.despesasMes)}</div>
          <KPITrendBadge current={kpis.despesasMes} previous={prevTotals.despesasMes} invert label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Contas a pagar no período (sem status)</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <BarChart3 className="w-4 h-4" style={{ color: kpiIconColor }} />Lucro ({kpiLabel})
          </div>
          {(() => {
            const net = (kpis.lucroMes ?? (kpis.receitaMes - kpis.despesasMes))
            const cls = net >= 0 ? 'text-emerald-600' : 'text-rose-600'
            return (
              <div className={`text-2xl font-bold ${cls}`} style={styleValues}>{formatBRL(net)}</div>
            )
          })()}
          <KPITrendBadge current={kpis.lucroMes} previous={prevTotals.lucroMes} label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Receita − Despesas</div>
        </div>
        <div className={cardContainerClass} style={{ borderColor: cardBorderColor, boxShadow: cardBoxShadow }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}>
            <BarChart3 className="w-4 h-4" style={{ color: kpiIconColor }} />Geração de Caixa ({kpiLabel})
          </div>
          {(() => {
            const net = (kpis.geracaoCaixa ?? (kpis.recebidosMes - kpis.pagosMes))
            const cls = net >= 0 ? 'text-emerald-600' : 'text-rose-600'
            return (
              <div className={`text-2xl font-bold ${cls}`} style={styleValues}>{formatBRL(net)}</div>
            )
          })()}
          <KPITrendBadge current={kpis.geracaoCaixa} previous={prevTotals.geracaoCaixa} label={`vs ${prevPeriod.prevLabel}`} />
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Recebido − Pago no período</div>
        </div>
      </div>

      {/* Charts — Row 1 (Fluxo de Caixa + Fornecedores + Clientes) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartMultipleRecharts
          items={cashRealized.map(d => ({
            label: periodToLabel(d.period),
            entradas: d.entradas,
            saidas: d.saidas
          }))}
          title="Fluxo de Caixa — Realizado"
          icon={<BarChart3 className="w-5 h-5" />}
          series={[
            { key: "entradas", label: "Entradas", color: "#10b981" },
            { key: "saidas", label: "Saídas", color: "#ef4444" }
          ]}
        />
        <BarChartHorizontalRecharts
          items={topFornecedores}
          title="Top 5 Fornecedores"
          icon={<Star className="w-5 h-5" />}
          color="#10b981"
        />
        <BarChartHorizontalRecharts
          items={topClientes}
          title="Top 5 Clientes"
          icon={<CalendarCheck className="w-5 h-5" />}
          color="#8b5cf6"
        />
      </div>

      {/* Charts — Row 2 (Top 5 por dimensão) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalRecharts
          items={topCC}
          title="Top 5 Centros de Custo"
          icon={<BarChart3 className="w-5 h-5" />}
          color="#6366f1"
        />
        <BarChartHorizontalRecharts
          items={topCategorias}
          title="Top 5 Categorias"
          icon={<BarChart3 className="w-5 h-5" />}
          color="#f43f5e"
        />
        <BarChartHorizontalRecharts
          items={topDepartamentos}
          title="Top 5 Departamentos"
          icon={<BarChart3 className="w-5 h-5" />}
          color="#f59e0b"
        />
      </div>

      {/* Charts — Row 3 (Top 5 por dimensão) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BarChartHorizontalRecharts
          items={topLucros}
          title="Top 5 Centros de Lucro"
          icon={<BarChart3 className="w-5 h-5" />}
          color="#10b981"
        />
        <BarChartHorizontalRecharts
          items={topProjetos}
          title="Top 5 Projetos"
          icon={<BarChart3 className="w-5 h-5" />}
          color="#8b5cf6"
        />
        <BarChartHorizontalRecharts
          items={topFiliais}
          title="Top 5 Filiais"
          icon={<BarChart3 className="w-5 h-5" />}
          color="#14b8a6"
        />
      </div>

      {/* Tipografia - Controles */}
      <div className="mt-6 bg-white p-4 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tipografia</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Valores */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Valores (ex.: números de KPIs)</div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Fonte</label>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={fonts.values.family}
                onChange={(e) => setFonts((f) => ({ ...f, values: { ...f.values, family: e.target.value } }))}
              >
                <option>Inter</option>
                <option>Geist</option>
                <option>Roboto Mono</option>
                <option>Geist Mono</option>
                <option>IBM Plex Mono</option>
                <option>Avenir</option>
                <option>Space Mono</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Caixa</label>
              <select
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.values.transform}
                onChange={(e) => setFonts((f) => ({ ...f, values: { ...f.values, transform: e.target.value as 'none' | 'uppercase' } }))}
              >
                <option value="none">Normal</option>
                <option value="uppercase">UPPERCASE</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Peso</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.values.weight ?? 700}
                min={100}
                max={900}
                step={100}
                onChange={(e) => setFonts((f) => ({ ...f, values: { ...f.values, weight: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Tamanho</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.values.size ?? 24}
                min={8}
                max={64}
                step={1}
                onChange={(e) => setFonts((f) => ({ ...f, values: { ...f.values, size: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16">Espaço</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.values.letterSpacing ?? 0}
                step={0.5}
                onChange={(e) => setFonts((f) => ({ ...f, values: { ...f.values, letterSpacing: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-600 w-16">Cor</label>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={fonts.values.color || '#111827'}
                onChange={(e) => setFonts((f) => ({ ...f, values: { ...f.values, color: e.target.value } }))}
              />
            </div>
          </div>

          {/* Título (KPI) */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Título (KPI)</div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Fonte</label>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={fonts.kpiTitle.family}
                onChange={(e) => setFonts((f) => ({ ...f, kpiTitle: { ...f.kpiTitle, family: e.target.value } }))}
              >
                <option>Inter</option>
                <option>Geist</option>
                <option>Roboto Mono</option>
                <option>Geist Mono</option>
                <option>IBM Plex Mono</option>
                <option>Avenir</option>
                <option>Space Mono</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Caixa</label>
              <select
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.kpiTitle.transform}
                onChange={(e) => setFonts((f) => ({ ...f, kpiTitle: { ...f.kpiTitle, transform: e.target.value as 'none' | 'uppercase' } }))}
              >
                <option value="none">Normal</option>
                <option value="uppercase">UPPERCASE</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Peso</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.kpiTitle.weight ?? 600}
                min={100}
                max={900}
                step={100}
                onChange={(e) => setFonts((f) => ({ ...f, kpiTitle: { ...f.kpiTitle, weight: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Tamanho</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.kpiTitle.size ?? 14}
                min={8}
                max={48}
                step={1}
                onChange={(e) => setFonts((f) => ({ ...f, kpiTitle: { ...f.kpiTitle, size: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16">Espaço</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.kpiTitle.letterSpacing ?? 0}
                step={0.5}
                onChange={(e) => setFonts((f) => ({ ...f, kpiTitle: { ...f.kpiTitle, letterSpacing: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-600 w-16">Cor</label>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={fonts.kpiTitle.color || '#1f2937'}
                onChange={(e) => setFonts((f) => ({ ...f, kpiTitle: { ...f.kpiTitle, color: e.target.value } }))}
              />
            </div>
          </div>

          {/* Título (Charts) */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Título (Charts)</div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Fonte</label>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={fonts.chartTitle.family}
                onChange={(e) => setFonts((f) => ({ ...f, chartTitle: { ...f.chartTitle, family: e.target.value } }))}
              >
                <option>Inter</option>
                <option>Geist</option>
                <option>Roboto Mono</option>
                <option>Geist Mono</option>
                <option>IBM Plex Mono</option>
                <option>Avenir</option>
                <option>Space Mono</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Caixa</label>
              <select
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.chartTitle.transform}
                onChange={(e) => setFonts((f) => ({ ...f, chartTitle: { ...f.chartTitle, transform: e.target.value as 'none' | 'uppercase' } }))}
              >
                <option value="none">Normal</option>
                <option value="uppercase">UPPERCASE</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Peso</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.chartTitle.weight ?? 600}
                min={100}
                max={900}
                step={100}
                onChange={(e) => setFonts((f) => ({ ...f, chartTitle: { ...f.chartTitle, weight: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Tamanho</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.chartTitle.size ?? 14}
                min={8}
                max={48}
                step={1}
                onChange={(e) => setFonts((f) => ({ ...f, chartTitle: { ...f.chartTitle, size: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16">Espaço</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.chartTitle.letterSpacing ?? 0}
                step={0.5}
                onChange={(e) => setFonts((f) => ({ ...f, chartTitle: { ...f.chartTitle, letterSpacing: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-600 w-16">Cor</label>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={fonts.chartTitle.color || '#1f2937'}
                onChange={(e) => setFonts((f) => ({ ...f, chartTitle: { ...f.chartTitle, color: e.target.value } }))}
              />
            </div>
          </div>

          {/* Texto */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Texto (ex.: subtítulos e descrições)</div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Fonte</label>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={fonts.text.family}
                onChange={(e) => setFonts((f) => ({ ...f, text: { ...f.text, family: e.target.value } }))}
              >
                <option>Inter</option>
                <option>Geist</option>
                <option>Roboto Mono</option>
                <option>Geist Mono</option>
                <option>IBM Plex Mono</option>
                <option>Avenir</option>
                <option>Space Mono</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Caixa</label>
              <select
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.text.transform}
                onChange={(e) => setFonts((f) => ({ ...f, text: { ...f.text, transform: e.target.value as 'none' | 'uppercase' } }))}
              >
                <option value="none">Normal</option>
                <option value="uppercase">UPPERCASE</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Peso</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.text.weight ?? 400}
                min={100}
                max={900}
                step={100}
                onChange={(e) => setFonts((f) => ({ ...f, text: { ...f.text, weight: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs text-gray-600 w-16">Tamanho</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.text.size ?? 12}
                min={8}
                max={32}
                step={1}
                onChange={(e) => setFonts((f) => ({ ...f, text: { ...f.text, size: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-16">Espaço</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-xs w-24"
                value={fonts.text.letterSpacing ?? 0}
                step={0.5}
                onChange={(e) => setFonts((f) => ({ ...f, text: { ...f.text, letterSpacing: Number(e.target.value) } }))}
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-600 w-16">Cor</label>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={fonts.text.color || '#6b7280'}
                onChange={(e) => setFonts((f) => ({ ...f, text: { ...f.text, color: e.target.value } }))}
              />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Header</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header Title */}
            <div>
              <div className="text-xs text-gray-500 mb-2">Título do Header</div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Fonte</label>
                <select className="border rounded px-2 py-1 text-xs" value={fonts.headerTitle.family} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, family: e.target.value } }))}>
                  <option>Inter</option>
                  <option>Geist</option>
                  <option>Geist Mono</option>
                  <option>Roboto Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
                  <option>EB Garamond</option>
                  <option>Libre Baskerville</option>
                  <option>Barlow</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Peso</label>
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerTitle.weight ?? 700} min={100} max={900} step={100} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, weight: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Tamanho</label>
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerTitle.size ?? 18} min={8} max={48} step={1} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, size: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Espaço</label>
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerTitle.letterSpacing ?? 0} min={-0.1} max={0.1} step={0.01} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, letterSpacing: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Caixa</label>
                <select className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerTitle.transform} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, transform: e.target.value as 'none' | 'uppercase' } }))}>
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-16">Cor</label>
                <input type="color" className="border rounded w-8 h-6" value={fonts.headerTitle.color || '#111827'} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, color: e.target.value } }))} />
              </div>
            </div>
            {/* Header Subtitle */}
            <div>
              <div className="text-xs text-gray-500 mb-2">Subtítulo do Header</div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Fonte</label>
                <select className="border rounded px-2 py-1 text-xs" value={fonts.headerSubtitle.family} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, family: e.target.value } }))}>
                  <option>Inter</option>
                  <option>Geist</option>
                  <option>Geist Mono</option>
                  <option>Roboto Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
                  <option>EB Garamond</option>
                  <option>Libre Baskerville</option>
                  <option>Barlow</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Peso</label>
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerSubtitle.weight ?? 400} min={100} max={900} step={100} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, weight: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Tamanho</label>
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerSubtitle.size ?? 12} min={8} max={48} step={1} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, size: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Espaço</label>
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerSubtitle.letterSpacing ?? 0} min={-0.1} max={0.1} step={0.01} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, letterSpacing: Number(e.target.value) } }))} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Caixa</label>
                <select className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerSubtitle.transform} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, transform: e.target.value as 'none' | 'uppercase' } }))}>
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-16">Cor</label>
                <input type="color" className="border rounded w-8 h-6" value={fonts.headerSubtitle.color || '#6b7280'} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, color: e.target.value } }))} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Sidebar — Título das Seções</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-2">Tipografia do título (ex.: Gestão, Vendas, Integrações)</div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Fonte</label>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={fonts.sidebarSectionTitle.family}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarSectionTitle: { ...f.sidebarSectionTitle, family: e.target.value } }))}
                >
                  <option>Inter</option>
                  <option>Geist</option>
                  <option>Roboto Mono</option>
                  <option>Geist Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Caixa</label>
                <select
                  className="border rounded px-2 py-1 text-xs w-28"
                  value={fonts.sidebarSectionTitle.transform}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarSectionTitle: { ...f.sidebarSectionTitle, transform: e.target.value as 'none' | 'uppercase' } }))}
                >
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Peso</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.sidebarSectionTitle.weight ?? 600}
                  min={100}
                  max={900}
                  step={100}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarSectionTitle: { ...f.sidebarSectionTitle, weight: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Tamanho</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.sidebarSectionTitle.size ?? 12}
                  min={8}
                  max={32}
                  step={1}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarSectionTitle: { ...f.sidebarSectionTitle, size: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Espaço</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.sidebarSectionTitle.letterSpacing ?? 0}
                  step={0.5}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarSectionTitle: { ...f.sidebarSectionTitle, letterSpacing: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Cor</label>
                <input
                  type="color"
                  className="border rounded w-8 h-6"
                  value={fonts.sidebarSectionTitle.color || '#6b7280'}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarSectionTitle: { ...f.sidebarSectionTitle, color: e.target.value } }))}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Sidebar — Itens (Financeiro, Dashboard, etc.)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-2">Tipografia dos itens do menu</div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Fonte</label>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={fonts.sidebarItemText.family}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarItemText: { ...f.sidebarItemText, family: e.target.value } }))}
                >
                  <option>Inter</option>
                  <option>Geist</option>
                  <option>Geist Mono</option>
                  <option>Roboto Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
                  <option>EB Garamond</option>
                  <option>Libre Baskerville</option>
                  <option>Barlow</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Caixa</label>
                <select
                  className="border rounded px-2 py-1 text-xs w-28"
                  value={fonts.sidebarItemText.transform}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarItemText: { ...f.sidebarItemText, transform: e.target.value as 'none' | 'uppercase' } }))}
                >
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Peso</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.sidebarItemText.weight ?? 400}
                  min={100}
                  max={900}
                  step={100}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarItemText: { ...f.sidebarItemText, weight: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Tamanho</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.sidebarItemText.size ?? 14}
                  min={8}
                  max={32}
                  step={1}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarItemText: { ...f.sidebarItemText, size: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-20">Espaço</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.sidebarItemText.letterSpacing ?? 0}
                  step={0.5}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarItemText: { ...f.sidebarItemText, letterSpacing: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-20">Cor</label>
                <input
                  type="color"
                  className="border rounded w-8 h-6"
                  value={fonts.sidebarItemText.color || '#0f172a'}
                  onChange={(e) => setFonts((f) => ({ ...f, sidebarItemText: { ...f.sidebarItemText, color: e.target.value } }))}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h5 className="text-xs font-semibold text-gray-700 mb-2">Filtros (Date Range e Select)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipografia dos filtros */}
            <div>
              <div className="text-xs text-gray-500 mb-2">Fonte dos filtros</div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Fonte</label>
                <select
                  className="border rounded px-2 py-1 text-xs"
                  value={fonts.filters.family}
                  onChange={(e) => setFonts((f) => ({ ...f, filters: { ...f.filters, family: e.target.value } }))}
                >
                  <option>Inter</option>
                  <option>Geist</option>
                  <option>Roboto Mono</option>
                  <option>Geist Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Caixa</label>
                <select
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.filters.transform}
                  onChange={(e) => setFonts((f) => ({ ...f, filters: { ...f.filters, transform: e.target.value as 'none' | 'uppercase' } }))}
                >
                  <option value="none">Normal</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Peso</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.filters.weight ?? 400}
                  min={100}
                  max={900}
                  step={100}
                  onChange={(e) => setFonts((f) => ({ ...f, filters: { ...f.filters, weight: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Tamanho</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.filters.size ?? 12}
                  min={8}
                  max={32}
                  step={1}
                  onChange={(e) => setFonts((f) => ({ ...f, filters: { ...f.filters, size: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs text-gray-600 w-16">Espaço</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-xs w-24"
                  value={fonts.filters.letterSpacing ?? 0}
                  step={0.5}
                  onChange={(e) => setFonts((f) => ({ ...f, filters: { ...f.filters, letterSpacing: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-16">Cor</label>
                <input
                  type="color"
                  className="border rounded w-8 h-6"
                  value={fonts.filters.color || '#374151'}
                  onChange={(e) => setFonts((f) => ({ ...f, filters: { ...f.filters, color: e.target.value } }))}
                />
              </div>
            </div>
            {/* Cor do ícone dos filtros */}
            <div>
              <div className="text-xs text-gray-500 mb-2">Cor do ícone dos filtros</div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-24">Ícone</label>
                <input
                  type="color"
                  className="border rounded w-8 h-6"
                  value={filtersIconColor}
                  onChange={(e) => setFiltersIconColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100" style={{ borderColor: cardBorderColor }}>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Fundo da página</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={pageBgColor}
                onChange={(e) => setPageBgColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Borda dos cards</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={cardBorderColor}
                onChange={(e) => setCardBorderColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Sombra dos cards</div>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={cardShadowPreset}
                onChange={(e) => financeiroDashboardActions.setCardShadowPreset(e.target.value as typeof cardShadowPreset)}
              >
                <option value="none">Nenhuma</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Sidebar - Fundo</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={sidebarBgColor}
                onChange={(e) => setSidebarBgColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Sidebar - Ícone/Texto</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={sidebarTextColor}
                onChange={(e) => setSidebarTextColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Sidebar - Itens (Ativo/Hover)</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={sidebarItemTextColor}
                onChange={(e) => setSidebarItemTextColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Ícones dos Cards KPI</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={kpiIconColor}
                onChange={(e) => setKpiIconColor(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Ícones dos Charts</div>
              <input
                type="color"
                className="border rounded w-8 h-6"
                value={chartIconColor}
                onChange={(e) => setChartIconColor(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
