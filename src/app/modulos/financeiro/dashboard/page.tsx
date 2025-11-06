'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, BarChart3, Wallet, Clock, Star, CalendarCheck, Calendar as CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DateRange } from 'react-day-picker'

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
  const d = new Date(value)
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

export default function FinanceiroDashboardPage() {
  const [arRows, setArRows] = useState<ARRow[]>([])
  const [apRows, setApRows] = useState<APRow[]>([])
  const [prRows, setPrRows] = useState<RecebidoRow[]>([])
  const [peRows, setPeRows] = useState<EfetuadoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Header filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [dataFilter, setDataFilter] = useState<string>('todos')

  // Typography controls
  const [fonts, setFonts] = useState({
    values: { family: 'Space Mono', weight: 700 as number | undefined, letterSpacing: 0 as number | undefined, color: '#111827' as string | undefined, size: 24 as number | undefined, transform: 'none' as 'none' | 'uppercase' },
    // Separação de títulos: KPI vs Charts
    kpiTitle: { family: 'Space Mono', weight: 500 as number | undefined, letterSpacing: 0 as number | undefined, color: '#adadad' as string | undefined, size: 13 as number | undefined, transform: 'uppercase' as 'none' | 'uppercase' },
    chartTitle: { family: 'Space Mono', weight: 500 as number | undefined, letterSpacing: 0 as number | undefined, color: '#adadad' as string | undefined, size: 13 as number | undefined, transform: 'uppercase' as 'none' | 'uppercase' },
    text: { family: 'Inter', weight: 400 as number | undefined, letterSpacing: 0 as number | undefined, color: '#6b7280' as string | undefined, size: 12 as number | undefined, transform: 'none' as 'none' | 'uppercase' },
    filters: { family: 'Inter', weight: 400 as number | undefined, letterSpacing: 0 as number | undefined, color: 'rgb(122, 122, 122)' as string | undefined, size: 13 as number | undefined, transform: 'none' as 'none' | 'uppercase' },
    sidebarSectionTitle: { family: 'Space Mono', weight: 500 as number | undefined, letterSpacing: 0 as number | undefined, color: '#808080' as string | undefined, size: 12 as number | undefined, transform: 'uppercase' as 'none' | 'uppercase' },
    headerTitle: { family: 'Space Mono', weight: 700 as number | undefined, letterSpacing: 0 as number | undefined, color: '#111827' as string | undefined, size: 20 as number | undefined, transform: 'uppercase' as 'none' | 'uppercase' },
    headerSubtitle: { family: 'Inter', weight: 400 as number | undefined, letterSpacing: 0 as number | undefined, color: '#6b7280' as string | undefined, size: 12 as number | undefined, transform: 'none' as 'none' | 'uppercase' },
  })
  const [cardBorderColor, setCardBorderColor] = useState<string>('#f0f0f0')
  const [pageBgColor, setPageBgColor] = useState<string>('#ffffff')
  const [filtersIconColor, setFiltersIconColor] = useState<string>('#6b7280')
  const [sidebarBgColor, setSidebarBgColor] = useState<string>('#fdfdfd')
  const [sidebarTextColor, setSidebarTextColor] = useState<string>('#717171')
  const [sidebarItemTextColor, setSidebarItemTextColor] = useState<string>('#0f172a')
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

  const styleSidebarSectionTitle = useMemo<React.CSSProperties>(() => ({
    fontFamily: fontVar(fonts.sidebarSectionTitle.family),
    fontWeight: fonts.sidebarSectionTitle.weight as React.CSSProperties['fontWeight'],
    letterSpacing: typeof fonts.sidebarSectionTitle.letterSpacing === 'number' ? `${fonts.sidebarSectionTitle.letterSpacing}px` : undefined,
    color: fonts.sidebarSectionTitle.color || undefined,
    fontSize: typeof fonts.sidebarSectionTitle.size === 'number' ? `${fonts.sidebarSectionTitle.size}px` : undefined,
    textTransform: fonts.sidebarSectionTitle.transform === 'uppercase' ? 'uppercase' : 'none',
  }), [fonts.sidebarSectionTitle])

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
      setLoading(true)
      setError(null)
      try {
        const qs = (view: string) => `/api/modulos/financeiro?view=${view}&page=1&pageSize=1000`
        const [arRes, apRes, prRes, peRes] = await Promise.allSettled([
          fetch(qs('contas-a-receber'), { cache: 'no-store' }),
          fetch(qs('contas-a-pagar'), { cache: 'no-store' }),
          fetch(qs('pagamentos-recebidos'), { cache: 'no-store' }),
          fetch(qs('pagamentos-efetuados'), { cache: 'no-store' }),
        ])

        let ar: ARRow[] = []
        let ap: APRow[] = []
        let pr: RecebidoRow[] = []
        let pe: EfetuadoRow[] = []

        if (arRes.status === 'fulfilled' && arRes.value.ok) {
          const j = (await arRes.value.json()) as { rows?: unknown[] }
          ar = Array.isArray(j?.rows) ? (j.rows as unknown as ARRow[]) : []
        }
        if (apRes.status === 'fulfilled' && apRes.value.ok) {
          const j = (await apRes.value.json()) as { rows?: unknown[] }
          ap = Array.isArray(j?.rows) ? (j.rows as unknown as APRow[]) : []
        }
        if (prRes.status === 'fulfilled' && prRes.value.ok) {
          const j = (await prRes.value.json()) as { rows?: unknown[] }
          pr = Array.isArray(j?.rows) ? (j.rows as unknown as RecebidoRow[]) : []
        }
        if (peRes.status === 'fulfilled' && peRes.value.ok) {
          const j = (await peRes.value.json()) as { rows?: unknown[] }
          pe = Array.isArray(j?.rows) ? (j.rows as unknown as EfetuadoRow[]) : []
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

        if (!cancelled) {
          setArRows(ar)
          setApRows(ap)
          setPrRows(pr)
          setPeRows(pe)
        }
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Helpers to compute KPIs
  const todayStr = toDateOnly(new Date())
  const isToday = (d?: string) => d ? toDateOnly(new Date(d)) === todayStr : false
  const isOverdue = <T extends BaseRow>(r: T) => !isPaid(r.status) && (daysDiffFromToday(String(r.data_vencimento)) ?? 1) < 0
  const isOpenOrOverdue = <T extends BaseRow>(r: T) => !isPaid(r.status)

  const kpis = useMemo(() => {
    const sum = <T extends BaseRow>(arr: T[], pred: (r: T) => boolean) => arr.filter(pred).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0)
    return {
      arHoje: sum(arRows, r => isOpenOrOverdue(r) && isToday(String(r.data_vencimento))),
      apHoje: sum(apRows, r => isOpenOrOverdue(r) && isToday(String(r.data_vencimento))),
      arVencidos: sum(arRows, r => isOverdue(r)),
      apVencidos: sum(apRows, r => isOverdue(r)),
    }
  }, [arRows, apRows])

  // Aging buckets (valor em BRL por faixa)
  type Bucket = { label: string; value: number }
  function buildAging<T extends BaseRow>(rows: T[]): Bucket[] {
    const buckets: Record<string, number> = {
      'Vencido >30': 0,
      'Vencido 1–30': 0,
      'Vence 1–7': 0,
      'Vence 8–15': 0,
      'Vence 16–30': 0,
    }
    for (const r of rows) {
      if (isPaid(r.status)) continue
      const v = Number(r.valor_total) || 0
      const dd = daysDiffFromToday(String(r.data_vencimento))
      if (dd == null) continue
      if (dd < -30) buckets['Vencido >30'] += v
      else if (dd < 0) buckets['Vencido 1–30'] += v
      else if (dd <= 7) buckets['Vence 1–7'] += v
      else if (dd <= 15) buckets['Vence 8–15'] += v
      else if (dd <= 30) buckets['Vence 16–30'] += v
    }
    return Object.entries(buckets).map(([label, value]) => ({ label, value }))
  }

  const arAging = useMemo(() => buildAging(arRows), [arRows])
  const apAging = useMemo(() => buildAging(apRows), [apRows])

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

  function AgingBar({ data }: { data: Bucket[] }) {
    const total = data.reduce((acc, b) => acc + b.value, 0)
    return (
      <div className="space-y-3">
        {data.map((b) => {
          const pct = total > 0 ? Math.max(2, Math.round((b.value / total) * 100)) : 0
          const color = b.label.includes('Vencido') ? 'bg-red-500' : 'bg-amber-500'
          return (
            <div key={b.label} className="">
              <div className="flex justify-between text-xs text-gray-600 mb-1" style={styleText}>
                <span>{b.label}</span>
                <span>{formatBRL(b.value)}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded">
                <div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
        {total === 0 && (
          <div className="text-xs text-gray-400" style={styleText}>Sem valores pendentes</div>
        )}
      </div>
    )
  }

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

  const receitasDespesas = useMemo(() => {
    const rec: Record<string, number> = {}
    const des: Record<string, number> = {}
    for (const k of meses) { rec[k] = 0; des[k] = 0 }

    // Receitas realizadas
    for (const r of prRows) {
      const k = monthKeyFromStr(r.data_recebimento)
      if (k && k in rec) rec[k] += Number(r.valor_total) || 0
    }
    // Despesas realizadas
    for (const r of peRows) {
      const k = monthKeyFromStr(r.data_pagamento)
      if (k && k in des) des[k] += Number(r.valor_pago) || 0
    }

    // Fallback: se tudo zero, usar AR/AP por vencimento como proxy
    const allZero = meses.every(k => (rec[k] || 0) === 0 && (des[k] || 0) === 0)
    if (allZero) {
      for (const r of arRows) {
        const k = monthKeyFromStr(r.data_vencimento)
        if (k && k in rec && !isPaid(r.status)) rec[k] += Number(r.valor_total) || 0
      }
      for (const r of apRows) {
        const k = monthKeyFromStr(r.data_vencimento)
        if (k && k in des && !isPaid(r.status)) des[k] += Number(r.valor_total) || 0
      }
    }

    const data = meses.map(k => ({ key: k, label: monthLabel(k), receita: rec[k] || 0, despesa: des[k] || 0 }))
    const maxVal = Math.max(1, ...data.map(d => Math.max(d.receita, d.despesa)))
    const saldoMensal = data.map(d => d.receita - d.despesa)
    const saldoAcumulado: number[] = []
    saldoMensal.reduce((acc, v, idx) => {
      const s = acc + v
      saldoAcumulado[idx] = s
      return s
    }, 0)
    const minSaldo = Math.min(0, ...saldoAcumulado)
    const maxSaldo = Math.max(1, ...saldoAcumulado)
    return { data, maxVal, saldoAcumulado, minSaldo, maxSaldo }
  }, [meses, prRows, peRows, arRows, apRows])

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
      sidebarSectionTitleStyle={styleSidebarSectionTitle}
      userAvatarUrl="https://i.pravatar.cc/80?img=12"
    >
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Carregando dados…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><ArrowDownCircle className="w-4 h-4 text-emerald-600" />A Receber Hoje</div>
          <div className="text-2xl font-bold text-emerald-600" style={styleValues}>{formatBRL(kpis.arHoje)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Título(s) com vencimento hoje</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><ArrowUpCircle className="w-4 h-4 text-rose-600" />A Pagar Hoje</div>
          <div className="text-2xl font-bold text-rose-600" style={styleValues}>{formatBRL(kpis.apHoje)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Pagamentos previstos para hoje</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><AlertTriangle className="w-4 h-4 text-orange-500" />Vencidos A Receber</div>
          <div className="text-2xl font-bold text-orange-600" style={styleValues}>{formatBRL(kpis.arVencidos)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Valores atrasados</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2" style={styleKpiTitle}><AlertTriangle className="w-4 h-4 text-red-500" />Vencidos A Pagar</div>
          <div className="text-2xl font-bold text-red-600" style={styleValues}>{formatBRL(kpis.apVencidos)}</div>
          <div className="text-xs text-gray-400 mt-1" style={styleText}>Compromissos em atraso</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={styleChartTitle}><BarChart3 className="w-5 h-5 text-indigo-600" />Receitas vs Despesas</h3>
          <BarsReceitasDespesas
            items={receitasDespesas.data.map(d => ({ label: d.label, receita: d.receita, despesa: d.despesa }))}
            max={receitasDespesas.maxVal}
          />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={styleChartTitle}><Wallet className="w-5 h-5 text-blue-600" />Saldo no final do mês</h3>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1" style={styleText}>
            <span>Acumulado</span>
            <span>
              Último: {formatBRL(receitasDespesas.saldoAcumulado.at(-1) ?? 0)}
            </span>
          </div>
          <LineSaldoMensal
            values={receitasDespesas.saldoAcumulado}
            min={receitasDespesas.minSaldo}
            max={receitasDespesas.maxSaldo}
          />
          <div className="grid grid-cols-6 gap-3 mt-1">
            {receitasDespesas.data.map(d => (
              <div key={d.key} className="text-[11px] text-gray-600 text-center" style={styleText}>{d.label}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={styleChartTitle}><Clock className="w-5 h-5 text-emerald-600" />Aging A Receber</h3>
          <AgingBar data={arAging} />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={styleChartTitle}><Clock className="w-5 h-5 text-rose-600" />Aging A Pagar</h3>
          <AgingBar data={apAging} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={styleChartTitle}><Star className="w-5 h-5 text-amber-500" />A Receber Prioritário</h3>
          <div className="space-y-3">
            {topReceber.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem títulos</div>
            ) : (
              topReceber.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                  <div>
                    <div className="font-medium text-sm">{i.nome}</div>
                    <div className="text-xs text-gray-500" style={styleText}>{i.desc || '—'} • Venc {i.dd! < 0 ? `${Math.abs(i.dd!)}d` : `em ${i.dd}d`}</div>
                  </div>
                  <div className="font-semibold text-emerald-700">{formatBRL(i.valor)}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100" style={{ borderColor: cardBorderColor }}>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={styleChartTitle}><CalendarCheck className="w-5 h-5 text-rose-600" />Pagamentos do Dia</h3>
          <div className="space-y-3">
            {pagamentosHoje.length === 0 ? (
              <div className="text-sm text-gray-400" style={styleText}>Sem pagamentos para hoje</div>
            ) : (
              pagamentosHoje.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0" style={{ borderColor: cardBorderColor }}>
                  <div>
                    <div className="font-medium text-sm">{i.nome}</div>
                    <div className="text-xs text-gray-500" style={styleText}>{i.desc || '—'}</div>
                  </div>
                  <div className="font-semibold text-rose-700">{formatBRL(i.valor)}</div>
                </div>
              ))
            )}
          </div>
        </div>
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
                  <option>Roboto Mono</option>
                  <option>Geist Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
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
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerTitle.letterSpacing ?? 0} step={0.5} onChange={(e) => setFonts((f) => ({ ...f, headerTitle: { ...f.headerTitle, letterSpacing: Number(e.target.value) } }))} />
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
                  <option>Roboto Mono</option>
                  <option>Geist Mono</option>
                  <option>IBM Plex Mono</option>
                  <option>Avenir</option>
                  <option>Space Mono</option>
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
                <input type="number" className="border rounded px-2 py-1 text-xs w-24" value={fonts.headerSubtitle.letterSpacing ?? 0} step={0.5} onChange={(e) => setFonts((f) => ({ ...f, headerSubtitle: { ...f.headerSubtitle, letterSpacing: Number(e.target.value) } }))} />
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
