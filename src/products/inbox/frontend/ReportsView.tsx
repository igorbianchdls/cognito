'use client'

import { useEffect, useMemo, useState } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import type { InboxReport } from '../server/reports'

const brl = (v: number | null | undefined) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const num = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('pt-BR'))
const minutes = (v: number | null | undefined) => (v == null ? '—' : v < 60 ? `${num(v)} min` : `${num(Math.round(v / 6) / 10)} h`)
const day = (offset: number) => new Date(Date.now() - 3 * 3600_000 - offset * 86400_000).toISOString().slice(0, 10)
const RANGES = [['7 dias', 6], ['30 dias', 29], ['90 dias', 89]] as const

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <div className="rounded-xl border border-[#ececec] bg-white p-4"><p className="text-[12px] text-[#777]">{label}</p><p className="mt-1 text-[22px] font-semibold tabular-nums text-[#111]">{value}</p>{hint ? <p className="mt-0.5 text-[12px] text-[#888]">{hint}</p> : null}</div>
}
function Table({ head, rows, empty }: { head: string[]; rows: (string | number)[][]; empty: string }) {
  if (!rows.length) return <p className="text-[13px] text-[#777]">{empty}</p>
  return (
    <div className="overflow-x-auto"><table className="w-full text-left text-[13px]">
      <thead className="border-b border-[#ececec] text-[11.5px] uppercase tracking-wide text-[#888]"><tr>{head.map((h, i) => <th key={h} className={`py-2 pr-3 font-medium ${i ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-[#f3f3f3] last:border-0">{r.map((c, j) => <td key={j} className={`py-2 pr-3 ${j ? 'text-right tabular-nums' : 'font-medium'}`}>{c}</td>)}</tr>)}</tbody>
    </table></div>
  )
}

/** The Inbox in numbers for a period: service, sales by lead source, pipeline, automations and broadcasts. */
export function ReportsView() {
  const { memberships } = useOrganization({ memberships: { pageSize: 100 } })
  const names = useMemo(() => new Map((memberships?.data ?? []).map(m => [m.publicUserData?.userId ?? '', [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Pessoa'])), [memberships?.data])
  const [range, setRange] = useState({ de: day(29), ate: day(0) })
  const [data, setData] = useState<InboxReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void fetch(`/api/inbox/relatorios?de=${range.de}&ate=${range.ate}`).then(async r => {
      const body = await r.json().catch(() => ({}))
      if (!live) return
      if (r.ok) { setData(body as InboxReport); setError(null) } else setError((body as { erro?: string }).erro ?? 'Não foi possível carregar.')
    })
    return () => { live = false }
  }, [range])

  const a = data?.atendimento, v = data?.vendas, d = data?.negocios
  return (
    <Page title="Relatórios" subtitle="Atendimento, vendas por origem, funil, automações e disparos no período."
      actions={<div className="flex flex-wrap items-center gap-2 text-[13px]">
        <div className="flex rounded-lg bg-[#f2f2f4] p-0.5">{RANGES.map(([label, back]) => (
          <button key={label} type="button" onClick={() => setRange({ de: day(back), ate: day(0) })} className={`rounded-md px-2.5 py-1 ${range.de === day(back) && range.ate === day(0) ? 'bg-white font-medium shadow-sm' : 'text-[#636366]'}`}>{label}</button>))}</div>
        <input type="date" aria-label="De" value={range.de} max={range.ate} onChange={e => e.target.value && setRange({ ...range, de: e.target.value })} className="h-8 rounded-lg border border-[#e2e2e2] bg-white px-2" />
        <input type="date" aria-label="Até" value={range.ate} min={range.de} onChange={e => e.target.value && setRange({ ...range, ate: e.target.value })} className="h-8 rounded-lg border border-[#e2e2e2] bg-white px-2" />
      </div>}>
      {error ? <Notice tone="error">{error}</Notice> : !data ? <Notice>Carregando…</Notice> : (
        <div className="grid gap-4">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile label="Conversas novas" value={num(a?.conversas_novas)} hint={`${num(a?.encerradas)} encerradas`} />
            <Tile label="1ª resposta (mediana)" value={minutes(a?.primeira_resposta_mediana_min)} hint={`média ${minutes(a?.primeira_resposta_media_min)}`} />
            <Tile label="Avaliação média" value={data.avaliacoes.media == null ? '—' : `${data.avaliacoes.media.toLocaleString('pt-BR')} ★`} hint={`${num(data.avaliacoes.total)} avaliações`} />
            <Tile label="Em andamento" value={num(a?.em_andamento)} hint={`${num(a?.sem_responsavel)} sem responsável · ${num(a?.atrasadas)} atrasadas`} />
            <Tile label="Receita" value={brl(v?.receita)} hint={`${num(v?.vendas)} vendas · ${num(v?.compradores)} compradores`} />
            <Tile label="Reembolsos" value={brl(v?.valor_reembolsado)} hint={`${num(v?.reembolsos)} pedidos`} />
            <Tile label="Negócios ganhos" value={brl(d?.valor_ganho)} hint={`${num(d?.ganhos)} ganhos · ${num(d?.perdidos)} perdidos${d?.taxa_de_ganho != null ? ` · ${d.taxa_de_ganho.toLocaleString('pt-BR')}%` : ''}`} />
            <Tile label="Funil em aberto" value={brl(d?.valor_em_aberto)} hint={`${num(d?.abertos)} negócios`} />
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Por responsável">
              <Table head={['Pessoa', 'Encerradas', 'Em andamento', '1ª resposta', 'Avaliação']} empty="Nenhuma conversa com responsável no período."
                rows={data.por_responsavel.map(p => [names.get(p.responsavel_id) ?? 'Pessoa', num(p.encerradas), num(p.em_andamento), minutes(p.primeira_resposta_media_min), p.avaliacao_media == null ? '—' : `${p.avaliacao_media.toLocaleString('pt-BR')} (${p.avaliacoes})`])} />
            </Card>
            <Card title="Vendas por origem do lead">
              <Table head={['Origem', 'Leads novos', 'Vendas', 'Receita']} empty="Sem leads nem vendas no período."
                rows={data.por_origem.map(o => [o.origem, num(o.leads_novos), num(o.vendas), brl(o.receita)])} />
            </Card>
            <Card title="Automações e IA">
              <Table head={['', 'No período']} empty="" rows={[['Automações iniciadas', num(data.automacoes.iniciadas)], ['Automações concluídas', num(data.automacoes.concluidas)],
                ['Respostas da IA', num(data.automacoes.ia_respostas)], ['IA passou para a equipe', num(data.automacoes.ia_passou_para_equipe)]]} />
            </Card>
            <Card title="Disparos">
              <Table head={['', 'No período']} empty="" rows={[['Disparos iniciados', num(data.disparos.disparos)], ['Mensagens enviadas', num(data.disparos.enviados)], ['Falhas', num(data.disparos.falhas)], ['Ignorados (sem contato ou saíram)', num(data.disparos.ignorados)]]} />
            </Card>
          </div>
        </div>
      )}
    </Page>
  )
}
