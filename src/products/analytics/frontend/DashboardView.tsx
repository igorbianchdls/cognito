'use client'

// Visão geral (o "web analytics"): quem está no site agora, os totais do período, visitantes por dia e as listas de
// páginas, entradas, origens, campanhas, aparelhos e eventos. Sem nenhum evento ainda, mostra como instalar.
import Link from 'next/link'
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLeitura } from './api'
import { duracao } from './graficos'
import type { Property } from './properties'
import { fmt, useReport } from './reports'
import { Card, haQuanto, Notice, Periodo, primario, RankTable, Tela } from './ui'

type Day = { dia: string; visitantes: number; sessoes: number; paginas: number }
type Totais = { visitantes: number; sessoes: number; paginas: number; paginas_por_sessao: number | null; rejeicao: number | null; duracao_media_s: number | null }
type Instalacao = { ultimo_evento: string | null; eventos_ultima_hora: number; eventos_ultimo_dia: number }
const dayLabel = (d: string) => { const [, m, day] = d.split('-'); return `${day}/${m}` }

export function DashboardView() {
  const [days, setDays] = useState(30)
  return <Tela title="Visão geral" subtitle="Quem visita, de onde vem e o que faz." actions={() => <Periodo dias={days} onDias={setDays} />}>
    {site => <Geral key={site.id} site={site} days={days} />}
  </Tela>
}

function Agora({ site }: { site: string }) {
  const agora = useReport<{ pessoas: number }>('agora', site, 1, {}, 30000)
  const n = agora.rows?.[0]?.pessoas
  return <span className="inline-flex items-center gap-2 rounded-full border border-[#e6efe6] bg-[#f4faf4] px-3 py-1 text-[12.5px] font-medium text-[#2f7a3a]" data-agora>
    <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2f9e44] opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-[#2f9e44]" /></span>
    {n == null ? '…' : `${fmt(n)} ${n === 1 ? 'pessoa' : 'pessoas'} agora`}
  </span>
}

function Geral({ site, days }: { site: Property; days: number }) {
  const inst = useLeitura<Instalacao>(`catalogo?propriedade=${site.id}&tipo=instalacao`)
  const totais = useReport<Totais>('totais', site.id, days)
  const summary = useReport<Day>('resumo', site.id, days)
  const pages = useReport<Record<string, unknown>>('paginas', site.id, days)
  const entradas = useReport<Record<string, unknown>>('entradas', site.id, days)
  const sources = useReport<Record<string, unknown>>('origens', site.id, days)
  const campanhas = useReport<{ campanha: string; origem: string; visitantes: number }>('campanhas', site.id, days)
  const devices = useReport<{ tipo: string; nome: string; visitantes: number }>('aparelhos', site.id, days)
  const events = useReport<Record<string, unknown>>('eventos', site.id, days)
  if (summary.error) return <Notice tone="error">{summary.error}</Notice>
  if (inst.dados && !inst.dados.ultimo_evento) return <Card>
    <p className="text-[16px] font-semibold text-[#111]">Esperando o primeiro evento de {site.name}</p>
    <p className="mt-1 text-[13.5px] text-[#555]">Cole o código do site antes de <code>&lt;/head&gt;</code> e abra uma página: em segundos a visita aparece aqui.</p>
    <div className="mt-4 flex gap-2"><Link href="/analytics/sites" className={primario}>Ver o código</Link></div>
  </Card>
  const t = totais.rows?.[0]
  const rows = summary.rows ?? []
  const byType = (k: string) => (devices.rows ?? []).filter(r => r.tipo === k).map(r => ({ nome: r.nome, visitantes: r.visitantes })).slice(0, 8)
  const numeros: [string, string, string?][] = [
    ['Visitantes', t ? fmt(t.visitantes) : '—'], ['Sessões', t ? fmt(t.sessoes) : '—'], ['Páginas vistas', t ? fmt(t.paginas) : '—'],
    ['Páginas por sessão', t?.paginas_por_sessao != null ? String(t.paginas_por_sessao).replace('.', ',') : '—'],
    ['Rejeição', t?.rejeicao != null ? `${String(t.rejeicao).replace('.', ',')}%` : '—', 'sessões com uma página só'],
    ['Duração média', t ? duracao(t.duracao_media_s) : '—', 'por sessão'],
  ]
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center gap-3"><Agora site={site.id} />{inst.dados?.ultimo_evento ? <span className="text-[12.5px] text-[#888]">Último evento {haQuanto(inst.dados.ultimo_evento)}</span> : null}</div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {numeros.map(([label, valor, dica]) => <Card key={label} className="p-4"><p className="text-[12.5px] text-[#6b6b6b]">{label}</p>
        <p className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em] text-[#111]" data-total>{valor}</p>{dica ? <p className="text-[11.5px] text-[#999]">{dica}</p> : null}</Card>)}
    </div>
    <Card title="Visitantes por dia">
      {!summary.rows ? <div className="h-64 animate-pulse rounded-xl bg-[#f5f5f5]" /> : !rows.length ? <p className="text-[13px] text-[#888]">Sem visitas no período.</p> : (
        <div className="h-64" role="img" aria-label={`Visitantes por dia, ${rows.length} dias`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="dia" tickFormatter={dayLabel} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip labelFormatter={(l) => dayLabel(String(l))} formatter={(v, n) => [fmt(Number(v)), n === 'visitantes' ? 'Visitantes' : 'Páginas vistas']} contentStyle={{ borderRadius: 10, border: '1px solid #ececec', fontSize: 13 }} />
              <Line type="monotone" dataKey="visitantes" stroke="#2a78d6" strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
              <Line type="monotone" dataKey="paginas" stroke="#2a78d6" strokeOpacity={0.35} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>)}
    </Card>
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Páginas mais vistas"><RankTable rows={pages.rows} label="Página" value="visualizacoes" valueLabel="Visualizações" /></Card>
      <Card title="Páginas de entrada"><RankTable rows={entradas.rows} label="Página" value="sessoes" valueLabel="Sessões" /></Card>
      <Card title="De onde vêm"><RankTable rows={sources.rows} label="Origem" value="visitantes" valueLabel="Visitantes" /></Card>
      <Card title="Campanhas"><RankTable rows={campanhas.rows?.map(r => ({ campanha: `${r.campanha} · ${r.origem}`, visitantes: r.visitantes })) ?? null} label="Campanha" value="visitantes" valueLabel="Visitantes" empty="Nenhuma visita com utm_campaign no período." /></Card>
      <Card title="Aparelhos"><RankTable rows={devices.rows ? byType('aparelho') : null} label="Aparelho" value="visitantes" valueLabel="Visitantes" /></Card>
      <Card title="Navegadores"><RankTable rows={devices.rows ? byType('navegador') : null} label="Navegador" value="visitantes" valueLabel="Visitantes" /></Card>
      <Card title="Países"><RankTable rows={devices.rows ? byType('pais') : null} label="País" value="visitantes" valueLabel="Visitantes" /></Card>
      <Card title="Eventos"><RankTable rows={events.rows?.map(r => ({ evento: r.evento, total: r.total })) ?? null} label="Evento" value="total" valueLabel="Total" /></Card>
    </div>
  </div>
}
