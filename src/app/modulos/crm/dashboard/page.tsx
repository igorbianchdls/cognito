'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/modulos/DashboardLayout'

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
  const [opps, setOpps] = useState<OportunidadeRow[]>([])
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [ativs, setAtivs] = useState<AtividadeRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de = toDateOnly(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1))
        const urls = [
          `/api/modulos/crm?view=oportunidades&page=1&pageSize=1000&de=${de}`,
          `/api/modulos/crm?view=leads&page=1&pageSize=1000`,
          `/api/modulos/crm?view=atividades&page=1&pageSize=1000&de=${de}`,
        ]
        const [oRes, lRes, aRes] = await Promise.allSettled(urls.map(u => fetch(u, { cache: 'no-store' })))
        let os: OportunidadeRow[] = []
        let ls: LeadRow[] = []
        let as: AtividadeRow[] = []
        if (oRes.status === 'fulfilled' && oRes.value.ok) {
          const j = (await oRes.value.json()) as { rows?: unknown[] }
          os = Array.isArray(j?.rows) ? (j.rows as unknown as OportunidadeRow[]) : []
        }
        if (lRes.status === 'fulfilled' && lRes.value.ok) {
          const j = (await lRes.value.json()) as { rows?: unknown[] }
          ls = Array.isArray(j?.rows) ? (j.rows as unknown as LeadRow[]) : []
        }
        if (aRes.status === 'fulfilled' && aRes.value.ok) {
          const j = (await aRes.value.json()) as { rows?: unknown[] }
          as = Array.isArray(j?.rows) ? (j.rows as unknown as AtividadeRow[]) : []
        }
        if (os.length === 0 && ls.length === 0 && as.length === 0) {
          // mocks
          const base = new Date()
          const m0 = toDateOnly(base)
          const m1 = toDateOnly(new Date(base.getFullYear(), base.getMonth(), base.getDate()-3))
          os = [
            { oportunidade: 'Tech Corp', conta: 'Tech Corp Ltda', estagio: 'Negociação', valor: 85000, probabilidade: 70, data_fechamento: m0 },
            { oportunidade: 'Comércio Global', conta: 'Comércio Global', estagio: 'Proposta', valor: 62500, probabilidade: 60, data_fechamento: m1 },
            { oportunidade: 'Indústria XYZ', conta: 'Indústria XYZ', estagio: 'Apresentação', valor: 120000, probabilidade: 50, data_fechamento: m0 },
            { oportunidade: 'Fechado ACME', conta: 'ACME', estagio: 'Fechado - Ganho', valor: 40000, probabilidade: 100, data_fechamento: m1 },
          ]
          ls = [
            { lead: 'João Silva', empresa: 'Alpha', origem: 'Website', status: 'Novo' },
            { lead: 'Maria Lima', empresa: 'Beta', origem: 'Indicação', status: 'Em contato' },
            { lead: 'Pedro Souza', empresa: 'Gama', origem: 'LinkedIn', status: 'Qualificado' },
            { lead: 'Carla Dias', empresa: 'Delta', origem: 'Email Marketing', status: 'Novo' },
          ]
          as = [
            { assunto: 'Reunião', tipo: 'Reunião', status: 'Pendente', data_vencimento: m0, conta: 'Tech Corp' },
            { assunto: 'Email de proposta', tipo: 'Email', status: 'Concluída', data_vencimento: m1, conta: 'Comércio Global' },
          ]
        }
        if (!cancelled) { setOpps(os); setLeads(ls); setAtivs(as) }
      } catch (e) {
        if (!cancelled) setError('Falha ao carregar dados')
      } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  // KPIs
  const openOpps = useMemo(() => opps.filter(o => !isClosed(o.estagio)), [opps])
  const pipelineValue = useMemo(() => openOpps.reduce((acc, o) => acc + (Number(o.valor) || 0), 0), [openOpps])
  const winStats = useMemo(() => {
    const closed = opps.filter(o => isClosed(o.estagio))
    const won = closed.filter(o => isClosedWon(o.estagio)).length
    const total = closed.length || 1
    return { won, total, rate: (won / total) * 100 }
  }, [opps])
  const pendingActivitiesToday = useMemo(() => {
    const today = toDateOnly(new Date())
    return ativs.filter(a => (a.data_vencimento ? toDateOnly(new Date(a.data_vencimento)) === today : false) && !(a.status || '').toLowerCase().includes('concl')).length
  }, [ativs])

  // Funil por estágio (soma de valor)
  const stageOrder = (s?: string) => {
    const x = (s || '').toLowerCase()
    if (x.includes('pros') || x.includes('desc')) return 1
    if (x.includes('qual')) return 2
    if (x.includes('apre') || x.includes('demo')) return 3
    if (x.includes('prop') || x.includes('proposta')) return 4
    if (x.includes('nego')) return 5
    if (isClosedWon(s)) return 6
    if (isClosedLost(s)) return 7
    if (x.includes('fech')) return 8
    return 9
  }
  const funnel = useMemo(() => {
    const m = new Map<string, number>()
    for (const o of opps) {
      const k = o.estagio || '—'
      m.set(k, (m.get(k) || 0) + (Number(o.valor) || 0))
    }
    return Array.from(m, ([label, value]) => ({ label, value, order: stageOrder(label) }))
      .sort((a,b)=> a.order - b.order)
  }, [opps])

  // Conversões (ganhos) por mês (6m)
  const meses = useMemo(() => lastMonths(6), [])
  const winsMes = useMemo(() => {
    const m = new Map<string, number>()
    for (const k of meses) m.set(k, 0)
    for (const o of opps) {
      if (!isClosedWon(o.estagio)) continue
      const k = monthKeyFromStr(o.data_fechamento)
      if (k && m.has(k)) m.set(k, (m.get(k) || 0) + 1)
    }
    return meses.map(k => ({ key: k, label: monthLabel(k), value: m.get(k) || 0 }))
  }, [opps, meses])

  // Fontes de leads (contagem)
  const fontesLeads = useMemo(() => {
    const m = new Map<string, number>()
    for (const l of leads) {
      const k = l.origem || '—'
      m.set(k, (m.get(k) || 0) + 1)
    }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value - a.value).slice(0, 5)
  }, [leads])

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

  const recentAtivs = useMemo(() => {
    return [...ativs]
      .sort((a,b)=> new Date(b.data_vencimento || 0).getTime() - new Date(a.data_vencimento || 0).getTime())
      .slice(0,3)
  }, [ativs])

  // Simple bars
  function HBars({ items, color }: { items: { label: string; value: number }[]; color: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{it.value}</span></div>
              <div className="w-full h-2.5 bg-gray-100 rounded"><div className={`${color} h-2.5 rounded`} style={{ width: `${pct}%` }} /></div>
            </div>
          )
        })}
        {items.length === 0 && <div className="text-xs text-gray-400">Sem dados</div>}
      </div>
    )
  }

  function HBarsCurrency({ items, color }: { items: { label: string; value: number }[]; color: string }) {
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

  return (
    <DashboardLayout
      title="Dashboard CRM"
      subtitle="Visão geral do relacionamento com clientes"
      backgroundColor="#ffffff"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Oportunidades Abertas</div>
          <div className="text-2xl font-bold text-blue-600">{openOpps.length}</div>
          <div className="text-xs text-gray-400 mt-1">No pipeline atual</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Valor do Pipeline</div>
          <div className="text-2xl font-bold text-purple-600">{formatBRL(pipelineValue)}</div>
          <div className="text-xs text-gray-400 mt-1">Soma de oportunidades abertas</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Taxa de Ganho (6m)</div>
          <div className="text-2xl font-bold text-green-600">{winStats.rate.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 mt-1">{winStats.won}/{winStats.total} fechadas como ganho</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Atividades Hoje</div>
          <div className="text-2xl font-bold text-orange-600">{pendingActivitiesToday}</div>
          <div className="text-xs text-gray-400 mt-1">Pendentes para hoje</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Funil de Vendas</h3>
          <HBarsCurrency items={funnel.map(f => ({ label: f.label, value: f.value }))} color="bg-cyan-500" />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Conversões por Mês</h3>
          <div className="grid grid-cols-6 gap-3 h-44 items-end">
            {winsMes.map(m => {
              const max = Math.max(1, ...winsMes.map(x => x.value))
              const h = Math.round((m.value / max) * 100)
              return (
                <div key={m.key} className="flex flex-col items-center justify-end gap-1">
                  <div className="w-full bg-indigo-500/80 rounded" style={{ height: `${h}%` }} />
                  <div className="text-[11px] text-gray-600">{m.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Oportunidades Quentes</h3>
          <div className="space-y-3">
            {hotOpps.length === 0 ? (
              <div className="text-sm text-gray-400">Sem oportunidades</div>
            ) : hotOpps.map((o, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{o.oportunidade || o.conta || 'Oportunidade'}</div>
                  <div className="text-xs text-gray-500">{o.estagio || '—'} • {o.probabilidade ?? '—'}%</div>
                </div>
                <div className="font-semibold text-green-700">{formatBRL(o.valor)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top Fontes de Leads</h3>
          <div className="space-y-3">
            {fontesLeads.length === 0 ? (
              <div className="text-sm text-gray-400">Sem dados</div>
            ) : fontesLeads.map((f) => (
              <div key={f.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                  <span className="text-sm">{f.label}</span>
                </div>
                <span className="font-semibold text-sm">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Últimas Atividades</h3>
          <div className="space-y-3">
            {recentAtivs.length === 0 ? (
              <div className="text-sm text-gray-400">Sem atividades</div>
            ) : recentAtivs.map((a, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{a.assunto || a.tipo || 'Atividade'}</div>
                  <div className="text-xs text-gray-500">{a.conta || a.lead || a.oportunidade || '—'}</div>
                </div>
                <div className="text-xs text-gray-400">{a.data_vencimento ? new Date(a.data_vencimento).toLocaleDateString('pt-BR') : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
