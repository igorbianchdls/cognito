'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/modulos/DashboardLayout'
import { ArrowDownCircle, ArrowUpCircle, AlertTriangle, BarChart3, Wallet, Clock, Star, CalendarCheck } from 'lucide-react'

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
              <div className="flex justify-between text-xs text-gray-600 mb-1">
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
          <div className="text-xs text-gray-400">Sem valores pendentes</div>
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
                <div className="text-[11px] text-gray-600">{it.label}</div>
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
      title="Dashboard Financeiro"
      subtitle="Foco diário: Contas a Receber e a Pagar"
      backgroundColor="#ffffff"
    >
      {loading ? (
        <div className="p-6 text-sm text-gray-500">Carregando dados…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><ArrowDownCircle className="w-4 h-4 text-emerald-600" />A Receber Hoje</div>
          <div className="text-2xl font-bold text-emerald-600">{formatBRL(kpis.arHoje)}</div>
          <div className="text-xs text-gray-400 mt-1">Título(s) com vencimento hoje</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4 text-rose-600" />A Pagar Hoje</div>
          <div className="text-2xl font-bold text-rose-600">{formatBRL(kpis.apHoje)}</div>
          <div className="text-xs text-gray-400 mt-1">Pagamentos previstos para hoje</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />Vencidos A Receber</div>
          <div className="text-2xl font-bold text-orange-600">{formatBRL(kpis.arVencidos)}</div>
          <div className="text-xs text-gray-400 mt-1">Valores atrasados</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <div className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Vencidos A Pagar</div>
          <div className="text-2xl font-bold text-red-600">{formatBRL(kpis.apVencidos)}</div>
          <div className="text-xs text-gray-400 mt-1">Compromissos em atraso</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" />Receitas vs Despesas</h3>
          <BarsReceitasDespesas
            items={receitasDespesas.data.map(d => ({ label: d.label, receita: d.receita, despesa: d.despesa }))}
            max={receitasDespesas.maxVal}
          />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-blue-600" />Saldo no final do mês</h3>
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
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
              <div key={d.key} className="text-[11px] text-gray-600 text-center">{d.label}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" />Aging A Receber</h3>
          <AgingBar data={arAging} />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-rose-600" />Aging A Pagar</h3>
          <AgingBar data={apAging} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" />A Receber Prioritário</h3>
          <div className="space-y-3">
            {topReceber.length === 0 ? (
              <div className="text-sm text-gray-400">Sem títulos</div>
            ) : (
              topReceber.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium text-sm">{i.nome}</div>
                    <div className="text-xs text-gray-500">{i.desc || '—'} • Venc {i.dd! < 0 ? `${Math.abs(i.dd!)}d` : `em ${i.dd}d`}</div>
                  </div>
                  <div className="font-semibold text-emerald-700">{formatBRL(i.valor)}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-rose-600" />Pagamentos do Dia</h3>
          <div className="space-y-3">
            {pagamentosHoje.length === 0 ? (
              <div className="text-sm text-gray-400">Sem pagamentos para hoje</div>
            ) : (
              pagamentosHoje.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium text-sm">{i.nome}</div>
                    <div className="text-xs text-gray-500">{i.desc || '—'}</div>
                  </div>
                  <div className="font-semibold text-rose-700">{formatBRL(i.valor)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
