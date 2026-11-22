'use client'

import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useProperties } from './properties'
import { fmt, useReport } from './reports'
import { Card, Filters, NoProperty, Notice, NotConfigured, Page, RankTable } from './ui'

type Day = { dia: string; visitantes: number; sessoes: number; paginas: number }
const SERIES = '#2a78d6'
const dayLabel = (d: string) => { const [, m, day] = d.split('-'); return `${day}/${m}` }

/** Painéis: visitors over time, the totals, and the top pages, sources, devices and events. */
export function DashboardView() {
  const props = useProperties()
  const [days, setDays] = useState(30)
  const current = props.current
  const summary = useReport<Day>('resumo', current?.id, days)
  const pages = useReport<Record<string, unknown>>('paginas', current?.id, days)
  const sources = useReport<Record<string, unknown>>('origens', current?.id, days)
  const devices = useReport<{ tipo: string; nome: string; visitantes: number }>('aparelhos', current?.id, days)
  const events = useReport<Record<string, unknown>>('eventos', current?.id, days)

  if (props.error) return <Page title="Painéis"><Notice tone="error">{props.error}</Notice></Page>
  if (!props.list) return <Page title="Painéis"><Notice>Carregando…</Notice></Page>
  if (!current) return <Page title="Painéis"><NoProperty /></Page>
  const rows = summary.rows ?? []
  const total = (k: keyof Day) => rows.reduce((v, r) => v + Number(r[k] || 0), 0)
  const byType = (t: string) => (devices.rows ?? []).filter(r => r.tipo === t).map(r => ({ nome: r.nome, visitantes: r.visitantes })).slice(0, 8)

  return (
    <Page title="Painéis" subtitle="Quem visita, de onde vem e o que faz." actions={<Filters properties={props.list} current={current} onProperty={props.setSelected} days={days} onDays={setDays} />}>
      {summary.notConfigured ? <NotConfigured /> : summary.error ? <Notice tone="error">{summary.error}</Notice> : (
        <div className="grid gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[['Visitantes', 'visitantes'], ['Sessões', 'sessoes'], ['Páginas vistas', 'paginas']].map(([label, k]) => (
              <Card key={k}>
                <p className="text-[13px] text-[#6b6b6b]">{label}</p>
                <p className="mt-1 text-[30px] font-semibold tabular-nums tracking-[-0.02em] text-[#111]">{summary.rows ? fmt(total(k as keyof Day)) : '—'}</p>
                <p className="text-[12px] text-[#999]">{k === 'visitantes' ? 'soma dos visitantes de cada dia' : 'no período'}</p>
              </Card>
            ))}
          </div>
          <Card title="Visitantes por dia">
            {!summary.rows ? <p className="text-[13px] text-[#888]">Carregando…</p> : !rows.length ? <p className="text-[13px] text-[#888]">Sem visitas no período. Confira se o código está no site em Sites e apps.</p> : (
              <div className="h-64" role="img" aria-label={`Visitantes por dia, ${rows.length} dias`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="dia" tickFormatter={dayLabel} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip labelFormatter={(l) => dayLabel(String(l))} formatter={(v) => [fmt(Number(v)), 'Visitantes']} contentStyle={{ borderRadius: 10, border: '1px solid #ececec', fontSize: 13 }} />
                    <Line type="monotone" dataKey="visitantes" stroke={SERIES} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Páginas mais vistas"><RankTable rows={pages.rows} label="Página" value="visualizacoes" valueLabel="Visualizações" /></Card>
            <Card title="De onde vêm"><RankTable rows={sources.rows} label="Origem" value="visitantes" valueLabel="Visitantes" /></Card>
            <Card title="Aparelhos"><RankTable rows={devices.rows ? byType('aparelho') : null} label="Aparelho" value="visitantes" valueLabel="Visitantes" /></Card>
            <Card title="Navegadores"><RankTable rows={devices.rows ? byType('navegador') : null} label="Navegador" value="visitantes" valueLabel="Visitantes" /></Card>
            <Card title="Países"><RankTable rows={devices.rows ? byType('pais') : null} label="País" value="visitantes" valueLabel="Visitantes" /></Card>
            <Card title="Eventos"><RankTable rows={events.rows?.map(r => ({ evento: r.evento, total: r.total })) ?? null} label="Evento" value="total" valueLabel="Total" /></Card>
          </div>
        </div>
      )}
    </Page>
  )
}
