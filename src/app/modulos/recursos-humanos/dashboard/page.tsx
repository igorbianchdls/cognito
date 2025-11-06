'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/modulos/DashboardLayout'

type ContratoRow = {
  id?: number | string
  funcionario_id?: number | string
  funcionario?: string
  funcionario_imagem_url?: string
  tipo_de_contrato?: string
  admissao?: string
  demissao?: string | null
  status?: string
}

type HistoricoRow = {
  id?: number | string
  funcionario_id?: number | string
  funcionario?: string
  funcionario_imagem_url?: string
  salario_base?: number | string
  tipo_de_pagamento?: string
  inicio_vigencia?: string
  fim_vigencia?: string | null
}

type DepartamentoRow = { departamento?: string; qtd_funcionarios?: number | string }

function toMonthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function toDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatNum(n?: number) { return (Number(n||0)).toLocaleString('pt-BR') }

export default function RHDashboardPage() {
  const [contratos, setContratos] = useState<ContratoRow[]>([])
  const [historico, setHistorico] = useState<HistoricoRow[]>([])
  const [departamentos, setDepartamentos] = useState<DepartamentoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const de = toDateStr(toMonthStart())
        const base = '/api/modulos/rh'
        const [cRes, hRes, dRes] = await Promise.allSettled([
          fetch(`${base}?view=contratos&de=${de}&page=1&pageSize=1000`, { cache: 'no-store' }),
          fetch(`${base}?view=historico-salarial&de=${de}&page=1&pageSize=1000`, { cache: 'no-store' }),
          fetch(`${base}?view=departamentos`, { cache: 'no-store' }),
        ])
        let cs: ContratoRow[] = []
        let hs: HistoricoRow[] = []
        let ds: DepartamentoRow[] = []
        if (cRes.status === 'fulfilled' && cRes.value.ok) { const j = await cRes.value.json(); cs = Array.isArray(j?.rows) ? j.rows as ContratoRow[] : [] }
        if (hRes.status === 'fulfilled' && hRes.value.ok) { const j = await hRes.value.json(); hs = Array.isArray(j?.rows) ? j.rows as HistoricoRow[] : [] }
        if (dRes.status === 'fulfilled' && dRes.value.ok) { const j = await dRes.value.json(); ds = Array.isArray(j?.rows) ? j.rows as DepartamentoRow[] : [] }

        if (cs.length === 0 && hs.length === 0 && ds.length === 0) {
          // mocks coerentes
          const mStart = toMonthStart(); const mKey = toDateStr(mStart).slice(0,7)
          cs = [
            { funcionario: 'Ana', admissao: `${mKey}-01`, demissao: null, status: 'ativo' },
            { funcionario: 'Bruno', admissao: `${mKey}-02", demissao: null, status: 'ativo' },
            { funcionario: 'Caio', admissao: `${mKey}-03`, demissao: `${mKey}-10`, status: 'inativo' },
          ]
          hs = [
            { funcionario: 'Ana', salario_base: 6000, tipo_de_pagamento: 'CLT', inicio_vigencia: `${mKey}-01` },
            { funcionario: 'Bruno', salario_base: 4500, tipo_de_pagamento: 'CLT', inicio_vigencia: `${mKey}-02` },
            { funcionario: 'Caio', salario_base: 3000, tipo_de_pagamento: 'PJ', inicio_vigencia: `${mKey}-03`, fim_vigencia: `${mKey}-10` },
          ]
          ds = [ { departamento: 'Comercial', qtd_funcionarios: 8 }, { departamento: 'Engenharia', qtd_funcionarios: 12 }, { departamento: 'Financeiro', qtd_funcionarios: 5 } ]
        }

        if (!cancelled) { setContratos(cs); setHistorico(hs); setDepartamentos(ds) }
      } catch { if (!cancelled) setError('Falha ao carregar dados') } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  // KPIs
  const headcount = useMemo(() => {
    const nowKey = toDateStr(new Date())
    return contratos.filter(c => {
      const dem = c.demissao || ''
      return !dem || dem > nowKey
    }).length
  }, [contratos])

  const admissoesMes = useMemo(() => {
    const start = toDateStr(toMonthStart())
    const end = toDateStr(new Date())
    return contratos.filter(c => (c.admissao||'') >= start && (c.admissao||'') <= end).length
  }, [contratos])

  const demissoesMes = useMemo(() => {
    const start = toDateStr(toMonthStart())
    const end = toDateStr(new Date())
    return contratos.filter(c => (c.demissao||'') >= start && (c.demissao||'') <= end).length
  }, [contratos])

  const folhaEstim = useMemo(() => {
    // Estimativa: soma de salário base de históricos ativos no mês
    const start = toMonthStart(); const end = new Date()
    const isActiveOnMonth = (h: HistoricoRow) => {
      const ini = h.inicio_vigencia ? new Date(h.inicio_vigencia) : null
      const fim = h.fim_vigencia ? new Date(h.fim_vigencia) : null
      return (!!ini && ini <= end) && (!fim || fim >= start)
    }
    return historico.filter(isActiveOnMonth).reduce((acc, h) => acc + (Number(h.salario_base)||0), 0)
  }, [historico])

  // Charts
  const folhaPorTipo = useMemo(() => {
    const m = new Map<string, number>()
    const start = toMonthStart(); const end = new Date()
    for (const h of historico) {
      const ini = h.inicio_vigencia ? new Date(h.inicio_vigencia) : null
      const fim = h.fim_vigencia ? new Date(h.fim_vigencia) : null
      if (!(ini && ini <= end && (!fim || fim >= start))) continue
      const k = h.tipo_de_pagamento || '—'
      m.set(k, (m.get(k)||0) + (Number(h.salario_base)||0))
    }
    return Array.from(m, ([label, value]) => ({ label, value })).sort((a,b)=> b.value-a.value)
  }, [historico])

  const headcountPorDepto = useMemo(() => {
    return departamentos.map(d => ({ label: d.departamento || '—', value: Number(d.qtd_funcionarios||0) }))
      .sort((a,b)=> b.value-a.value)
  }, [departamentos])

  const ultimasMov = useMemo(() => {
    const recentAdms = [...contratos].sort((a,b)=> new Date(b.admissao||0).getTime() - new Date(a.admissao||0).getTime()).slice(0,3).map(c => ({ tipo:'Admissão', nome:c.funcionario||'—', data:c.admissao||'' }))
    const recentDems = [...contratos].filter(c=>!!c.demissao).sort((a,b)=> new Date(b.demissao||0).getTime() - new Date(a.demissao||0).getTime()).slice(0,3).map(c => ({ tipo:'Demissão', nome:c.funcionario||'—', data:c.demissao||'' }))
    return [...recentAdms, ...recentDems].sort((a,b)=> new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0,5)
  }, [contratos])

  function HBars({ items, color = 'bg-indigo-500' }: { items: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(1, ...items.map(i => i.value))
    return (
      <div className="space-y-3">
        {items.map((it) => {
          const pct = Math.round((it.value / max) * 100)
          return (
            <div key={it.label}>
              <div className="flex justify-between text-xs text-gray-600 mb-1"><span>{it.label}</span><span>{it.value >= 1 ? formatBRL(it.value) : formatNum(it.value)}</span></div>
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
      title="Dashboard de RH"
      subtitle="Folha, headcount e movimentações"
      backgroundColor="#ffffff"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Folha Estimada (mês)</div>
          <div className="text-2xl font-bold text-blue-600">{formatBRL(folhaEstim)}</div>
          <div className="text-xs text-gray-400 mt-1">Soma dos salários vigentes</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Headcount Atual</div>
          <div className="text-2xl font-bold text-green-600">{formatNum(headcount)}</div>
          <div className="text-xs text-gray-400 mt-1">Contratos ativos</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Admissões (mês)</div>
          <div className="text-2xl font-bold text-emerald-600">{formatNum(admissoesMes)}</div>
          <div className="text-xs text-gray-400 mt-1">Entrada de colaboradores</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Demissões (mês)</div>
          <div className="text-2xl font-bold text-rose-600">{formatNum(demissoesMes)}</div>
          <div className="text-xs text-gray-400 mt-1">Saídas registradas</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Folha por Tipo de Pagamento</h3>
          <HBars items={folhaPorTipo} color="bg-sky-500" />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Headcount por Departamento</h3>
          <HBars items={headcountPorDepto} color="bg-indigo-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Últimas Movimentações</h3>
          <div className="space-y-3">
            {ultimasMov.length === 0 ? (
              <div className="text-sm text-gray-400">Sem movimentações</div>
            ) : ultimasMov.map((m, idx) => (
              <div key={`${m.tipo}-${m.nome}-${idx}`} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{m.tipo} • {m.nome}</div>
                  <div className="text-xs text-gray-500">{new Date(m.data).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className={`text-xs ${m.tipo === 'Admissão' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.tipo}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>Use contratos e histórico salarial para validar a folha.</li>
            <li>Parametrize benefícios e encargos para custo total por colaborador.</li>
            <li>Acompanhe admissões/demissões para prever impacto de headcount.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

