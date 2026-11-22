'use client'

import { Fragment, useState } from 'react'
import { useProperties } from './properties'
import { useReport } from './reports'
import { Card, Filters, NoProperty, Notice, NotConfigured, Page } from './ui'

type Row = { quando: string; evento: string; pagina: string | null; visitante: string; usuario: string | null; pais: string | null; aparelho: string | null; navegador: string | null; origem: string | null; propriedades: string | null }
const time = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** The latest events of the last day, refreshed every 10 seconds: to check that tracking works. */
export function EventsView() {
  const props = useProperties()
  const [event, setEvent] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const live = useReport<Row>('ao-vivo', props.current?.id, 1, { evento: event }, 10000)

  if (props.error) return <Page title="Eventos"><Notice tone="error">{props.error}</Notice></Page>
  if (!props.list) return <Page title="Eventos"><Notice>Carregando…</Notice></Page>
  if (!props.current) return <Page title="Eventos"><NoProperty /></Page>
  return (
    <Page title="Eventos" subtitle="Os últimos 100 eventos das últimas 24 horas. Atualiza sozinho." actions={
      <div className="flex flex-wrap items-center gap-2">
        <Filters properties={props.list} current={props.current} onProperty={props.setSelected} />
        <input value={event} onChange={e => setEvent(e.target.value.trim())} placeholder="Filtrar evento (ex.: $pageview)" aria-label="Filtrar por evento"
          className="h-9 w-56 rounded-lg border border-[#e2e2e2] bg-white px-3 text-[14px]" />
      </div>}>
      {live.notConfigured ? <NotConfigured /> : live.error ? <Notice tone="error">{live.error}</Notice> : (
        <Card>
          {!live.rows ? <p className="text-[13px] text-[#888]">Carregando…</p> : !live.rows.length ? <p className="text-[13px] text-[#888]">Nenhum evento nas últimas 24 horas.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead><tr className="text-left text-[12px] text-[#888]">{['Quando', 'Evento', 'Página', 'Visitante', 'País', 'Aparelho', 'Origem'].map(h => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {live.rows.map((r, i) => (
                    <Fragment key={i}>
                      <tr onClick={() => setOpen(open === i ? null : i)} className="cursor-pointer border-t border-[#f3f3f3] hover:bg-[#fafafa]">
                        <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-[#555]">{time(r.quando)}</td>
                        <td className="py-2 pr-3 font-medium text-[#111]">{r.evento}</td>
                        <td className="max-w-[220px] truncate py-2 pr-3 text-[#333]" title={r.pagina ?? ''}>{r.pagina ?? '—'}</td>
                        <td className="py-2 pr-3 font-mono text-[12px] text-[#555]">{r.usuario ?? r.visitante.slice(0, 8)}</td>
                        <td className="py-2 pr-3 text-[#555]">{r.pais ?? '—'}</td>
                        <td className="py-2 pr-3 text-[#555]">{[r.aparelho, r.navegador].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="py-2 pr-3 text-[#555]">{r.origem ?? '—'}</td>
                      </tr>
                      {open === i ? <tr><td colSpan={7} className="bg-[#fafafa] px-3 py-2 font-mono text-[12px] text-[#444]">{r.propriedades && r.propriedades !== 'null' ? r.propriedades : 'Sem propriedades.'}</td></tr> : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </Page>
  )
}
