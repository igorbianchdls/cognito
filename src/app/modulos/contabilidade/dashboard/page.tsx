'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/modulos/DashboardLayout'

type BPLinha = { conta: string; valor: number }
type BPSecao = { nome: string; linhas: BPLinha[] }
type BPResponse = { success: boolean; view: string; from: string; to: string; ativo: BPSecao[]; passivo: BPSecao[]; pl: BPSecao[] }

type DRENode = { id: string; name: string; valuesByPeriod: Record<string, number>; children?: DRENode[] }
type DREPeriod = { key: string; label: string }
type DREResponse = { success: boolean; view: string; periods: DREPeriod[]; nodes: DRENode[] }

type LancRow = { lancamento_id?: number | string; data_lancamento?: string; historico?: string; debito?: number | string; credito?: number | string; conta_codigo?: string; conta_nome?: string }

function sumSecao(list: BPSecao[], match: (s: string) => boolean) {
  let total = 0
  for (const sec of list) { if (match(sec.nome)) for (const l of sec.linhas) total += Number(l.valor || 0) }
  return total
}
function formatBRL(n?: number) { return (Number(n||0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatNum(n?: number) { return (Number(n||0)).toLocaleString('pt-BR') }

export default function ContabilidadeDashboardPage() {
  const [bp, setBp] = useState<BPResponse | null>(null)
  const [dre, setDre] = useState<DREResponse | null>(null)
  const [lanc, setLanc] = useState<LancRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const today = new Date()
        const y = today.getFullYear(); const m = String(today.getMonth()+1).padStart(2,'0')
        const firstDay = `${y}-${m}-01`
        const base = '/api/modulos/contabilidade'
        const [bpRes, dreRes, lRes] = await Promise.allSettled([
          fetch(`${base}?view=balanco-patrimonial&de=${firstDay}`, { cache: 'no-store' }),
          fetch(`${base}?view=dre&de=${firstDay}`, { cache: 'no-store' }),
          fetch(`${base}?view=lancamentos&page=1&pageSize=10&order_by=data_lancamento&order_dir=desc`, { cache: 'no-store' }),
        ])
        let bpJ: BPResponse | null = null
        let dreJ: DREResponse | null = null
        let lJ: LancRow[] = []
        if (bpRes.status === 'fulfilled' && bpRes.value.ok) { const j = await bpRes.value.json(); if (j?.success) bpJ = j as BPResponse }
        if (dreRes.status === 'fulfilled' && dreRes.value.ok) { const j = await dreRes.value.json(); if (j?.success) dreJ = j as DREResponse }
        if (lRes.status === 'fulfilled' && lRes.value.ok) { const j = await lRes.value.json(); lJ = Array.isArray(j?.rows) ? j.rows as LancRow[] : [] }

        if (!bpJ && !dreJ && lJ.length === 0) {
          // fallback mocks mínimos
          bpJ = {
            success: true, view: 'balanco-patrimonial', from: firstDay, to: new Date().toISOString().slice(0,10),
            ativo: [
              { nome: 'Ativo Circulante', linhas: [ { conta: '1.1.1 Caixa', valor: 35000 }, { conta: '1.1.2 Contas a Receber', valor: 42000 } ] },
              { nome: 'Ativo Não Circulante', linhas: [ { conta: '1.2.1 Imobilizado', valor: 90000 } ] },
            ],
            passivo: [
              { nome: 'Passivo Circulante', linhas: [ { conta: '2.1.1 Fornecedores', valor: 28000 } ] },
              { nome: 'Passivo Não Circulante', linhas: [ { conta: '2.2.1 Empréstimos', valor: 15000 } ] },
            ],
            pl: [ { nome: 'Patrimônio Líquido', linhas: [ { conta: '3.1 Capital Social', valor: 124000 } ] } ],
          }
          dreJ = {
            success: true, view: 'dre',
            periods: [ { key: `${y}-${m}`, label: 'Mês Atual' } ],
            nodes: [
              { id: 'receita', name: 'Receita', valuesByPeriod: {}, children: [
                { id:'rec-op', name:'Receitas Operacionais', valuesByPeriod: { [`${y}-${m}`]: 82000 } },
                { id:'rec-otr', name:'Outras Receitas', valuesByPeriod: { [`${y}-${m}`]: 3000 } },
              ]},
              { id: 'cogs', name: 'COGS', valuesByPeriod: {}, children: [
                { id:'cogs-cmv', name:'CMV', valuesByPeriod: { [`${y}-${m}`]: 38000 } },
              ]},
              { id: 'opex', name: 'Despesas', valuesByPeriod: {}, children: [
                { id:'adm', name:'Adm', valuesByPeriod: { [`${y}-${m}`]: 12000 } },
                { id:'com', name:'Comercial', valuesByPeriod: { [`${y}-${m}`]: 8000 } },
              ]},
            ],
          }
          lJ = [ { lancamento_id: 1, data_lancamento: `${y}-${m}-05`, historico: 'Venda', debito: 0, credito: 5000, conta_codigo: '4.1.1', conta_nome: 'Receita' } ]
        }

        if (!cancelled) { setBp(bpJ); setDre(dreJ); setLanc(lJ) }
      } catch { if (!cancelled) setError('Falha ao carregar dados') } finally { if (!cancelled) setLoading(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  const kpis = useMemo(() => {
    if (!bp) return { ativo: 0, passivo: 0, pl: 0, ac: 0, pc: 0 }
    const ativoTotal = sumSecao(bp.ativo, () => true)
    const passivoTotal = sumSecao(bp.passivo, () => true)
    const plTotal = sumSecao(bp.pl, () => true)
    const ac = sumSecao(bp.ativo, n => n.toLowerCase().includes('circulante'))
    const pc = sumSecao(bp.passivo, n => n.toLowerCase().includes('circulante'))
    return { ativo: ativoTotal, passivo: passivoTotal, pl: plTotal, ac, pc }
  }, [bp])

  // DRE agregada por período
  const dreResumo = useMemo(() => {
    if (!dre) return [] as { key: string; label: string; receita: number; cogs: number; opex: number; lucro: number; margem: number }[]
    const getSum = (nodeId: string, periodKey: string) => {
      const n = (dre.nodes || []).find(n => n.id === nodeId)
      const children = n?.children || []
      return children.reduce((acc, ch) => acc + (Number(ch.valuesByPeriod?.[periodKey] || 0)), 0)
    }
    return dre.periods.map(p => {
      const receita = getSum('receita', p.key)
      const cogs = getSum('cogs', p.key)
      const opex = getSum('opex', p.key)
      const lucro = receita - cogs - opex
      const margem = receita > 0 ? (lucro / receita) * 100 : 0
      return { key: p.key, label: p.label, receita, cogs, opex, lucro, margem }
    })
  }, [dre])

  function BarsDRE({ items }: { items: { label: string; receita: number; cogs: number; opex: number }[] }) {
    const max = Math.max(1, ...items.map(i => Math.max(i.receita, i.cogs + i.opex)))
    return (
      <div>
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-emerald-500" />Receita</div>
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-rose-500" />COGS</div>
          <div className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-indigo-500" />Opex</div>
        </div>
        <div className="grid grid-cols-6 gap-3 h-44 items-end">
          {items.map((it) => {
            const rH = Math.round((it.receita / max) * 100)
            const cH = Math.round(((it.cogs) / max) * 100)
            const oH = Math.round(((it.opex) / max) * 100)
            return (
              <div key={it.label} className="flex flex-col items-center justify-end gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="w-1/3 bg-emerald-500/80 rounded" style={{ height: `${rH}%` }} />
                  <div className="w-1/3 bg-rose-500/80 rounded" style={{ height: `${cH}%` }} />
                  <div className="w-1/3 bg-indigo-500/80 rounded" style={{ height: `${oH}%` }} />
                </div>
                <div className="text-[11px] text-gray-600">{it.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

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

  const bpComposicao = useMemo(() => {
    if (!bp) return [] as { label: string; value: number }[]
    const ac = sumSecao(bp.ativo, n => n.toLowerCase().includes('circulante'))
    const anc = sumSecao(bp.ativo, n => n.toLowerCase().includes('não') || n.toLowerCase().includes('nao'))
    const pc = sumSecao(bp.passivo, n => n.toLowerCase().includes('circulante'))
    const pnc = sumSecao(bp.passivo, n => n.toLowerCase().includes('não') || n.toLowerCase().includes('nao'))
    const pl = sumSecao(bp.pl, () => true)
    return [
      { label: 'Ativo Circulante', value: ac },
      { label: 'Ativo Não Circ.', value: anc },
      { label: 'Passivo Circ.', value: pc },
      { label: 'Passivo Não Circ.', value: pnc },
      { label: 'Patrimônio Líquido', value: pl },
    ]
  }, [bp])

  const ultimosLanc = useMemo(() => {
    return lanc.slice(0, 5)
  }, [lanc])

  const liquidezCorrente = useMemo(() => {
    const ac = kpis.ac; const pc = kpis.pc
    return pc > 0 ? ac / pc : 0
  }, [kpis])

  const lucroAtual = useMemo(() => {
    const cur = dreResumo.at(-1)
    return cur ? cur.lucro : 0
  }, [dreResumo])

  return (
    <DashboardLayout
      title="Dashboard Contábil"
      subtitle="Balanço, DRE e lançamentos"
      backgroundColor="#ffffff"
    >
      {loading ? (<div className="p-4 text-sm text-gray-500">Carregando…</div>) : error ? (<div className="p-4 text-sm text-red-600">{error}</div>) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Ativo Total</div>
          <div className="text-2xl font-bold text-blue-600">{formatBRL(kpis.ativo)}</div>
          <div className="text-xs text-gray-400 mt-1">Balanço (período)</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Passivo + PL</div>
          <div className="text-2xl font-bold text-indigo-600">{formatBRL(kpis.passivo + kpis.pl)}</div>
          <div className="text-xs text-gray-400 mt-1">Estrutura de capital</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Lucro do Mês</div>
          <div className="text-2xl font-bold text-emerald-600">{formatBRL(lucroAtual)}</div>
          <div className="text-xs text-gray-400 mt-1">Receita − COGS − Opex</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-2">Liquidez Corrente</div>
          <div className="text-2xl font-bold text-orange-600">{liquidezCorrente.toFixed(2)}x</div>
          <div className="text-xs text-gray-400 mt-1">AC / PC</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">DRE por Mês</h3>
          <BarsDRE items={dreResumo.map(d => ({ label: d.label, receita: d.receita, cogs: d.cogs, opex: d.opex }))} />
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Composição do Balanço</h3>
          <HBars items={bpComposicao} color="bg-sky-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Últimos Lançamentos</h3>
          <div className="space-y-3">
            {ultimosLanc.length === 0 ? (
              <div className="text-sm text-gray-400">Sem lançamentos</div>
            ) : ultimosLanc.map((l, idx) => (
              <div key={`${l.lancamento_id}-${idx}`} className="flex justify-between items-center pb-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{l.historico || 'Lançamento'}</div>
                  <div className="text-xs text-gray-500">{l.data_lancamento ? new Date(l.data_lancamento).toLocaleDateString('pt-BR') : '—'} • {l.conta_codigo || ''} {l.conta_nome || ''}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-rose-600">{Number(l.debito||0) > 0 ? `D ${formatBRL(Number(l.debito))}` : ''}</div>
                  <div className="text-emerald-600">{Number(l.credito||0) > 0 ? `C ${formatBRL(Number(l.credito))}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Observações</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>Considere revisar regras contábeis automáticas para CAP/AR/Payments.</li>
            <li>Valide mapeamento do plano de contas para DRE e BP.</li>
            <li>Concilie lançamentos pendentes antes do fechamento.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}

