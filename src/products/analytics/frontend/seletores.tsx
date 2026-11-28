'use client'

// Os seletores de quem monta consultas: evento (com os que o site já mandou), campo (os fixos, as propriedades dos
// eventos e as coortes), filtros com sugestão de valores e a quebra.
import { useEffect, useId, useState } from 'react'
import { CAMPOS, OPERADORES, TODOS, rotuloCampo, type Filtro } from '../shared/consulta'
import { api, useLista } from './api'
import { campoCls } from './ui'

type Catalogo = { eventos: { evento: string; total: number }[]; propriedades: { chave: string }[] }
const cache = new Map<string, Promise<Catalogo>>()
/** Eventos e propriedades conhecidos do site (uma leitura por site e por visita à tela). */
export function useCatalogo(site: string) {
  const [c, setC] = useState<Catalogo | null>(null)
  useEffect(() => {
    let vivo = true
    if (!cache.has(site)) cache.set(site, Promise.all([
      api<{ eventos: Catalogo['eventos'] }>(`catalogo?propriedade=${site}&tipo=eventos`),
      api<{ propriedades: Catalogo['propriedades'] }>(`catalogo?propriedade=${site}&tipo=propriedades`),
    ]).then(([a, b]) => ({ eventos: a.eventos, propriedades: b.propriedades })).catch(e => { cache.delete(site); throw e }))
    cache.get(site)!.then(v => { if (vivo) setC(v) }).catch(() => { if (vivo) setC({ eventos: [], propriedades: [] }) })
    return () => { vivo = false }
  }, [site])
  return c
}

export const nomeEvento = (e: string) => e === TODOS ? 'Qualquer evento' : e === '$pageview' ? 'Página vista' : e === '$pageleave' ? 'Saiu da página'
  : e === '$autocapture' ? 'Clique' : e === '$rageclick' ? 'Clique de raiva' : e === '$identify' ? 'Identificou' : e === '$flag' ? 'Viu uma flag' : e

const FIXOS = ['$pageview', '$autocapture', '$identify', '$pageleave', '$rageclick']

export function EventoSelect({ site, value, onChange, todos = true, label = 'Evento' }: { site: string; value: string; onChange: (v: string) => void; todos?: boolean; label?: string }) {
  const c = useCatalogo(site)
  const lista = [...new Set([...(todos ? [TODOS] : []), ...FIXOS, ...(c?.eventos.map(e => e.evento) ?? []), value])]
  return <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className={`${campoCls} min-w-0 max-w-full`}>
    {lista.map(e => <option key={e} value={e}>{nomeEvento(e)}{c?.eventos.find(x => x.evento === e) ? ` · ${c.eventos.find(x => x.evento === e)!.total.toLocaleString('pt-BR')}` : ''}</option>)}
  </select>
}

export function CampoSelect({ site, value, onChange, vazio, coortes = false, label = 'Campo' }: { site: string; value: string; onChange: (v: string) => void; vazio?: string; coortes?: boolean; label?: string }) {
  const c = useCatalogo(site)
  const props = c?.propriedades.map(p => `prop:${p.chave}`) ?? []
  return <select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className={`${campoCls} min-w-0`}>
    {vazio !== undefined ? <option value="">{vazio}</option> : null}
    <optgroup label="Visita">{Object.entries(CAMPOS).filter(([k]) => k !== 'evento').map(([k, v]) => <option key={k} value={k}>{v}</option>)}</optgroup>
    {props.length ? <optgroup label="Propriedades do evento">{props.map(p => <option key={p} value={p}>{rotuloCampo(p)}</option>)}</optgroup> : null}
    {value.startsWith('prop:') && !props.includes(value) ? <option value={value}>{rotuloCampo(value)}</option> : null}
    {coortes ? <optgroup label="Pessoas"><option value="coorte">Está na coorte</option></optgroup> : null}
  </select>
}

function Valor({ site, campo, value, onChange }: { site: string; campo: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  const [valores, setValores] = useState<string[]>([])
  useEffect(() => {
    let vivo = true
    const t = setTimeout(() => api<{ valores: { valor: string }[] }>(`catalogo?propriedade=${site}&tipo=valores&campo=${encodeURIComponent(campo)}&busca=${encodeURIComponent(value)}`)
      .then(r => { if (vivo) setValores(r.valores.map(v => v.valor)) }).catch(() => undefined), 250)
    return () => { vivo = false; clearTimeout(t) }
  }, [site, campo, value])
  return <><input aria-label="Valor" list={id} value={value} onChange={e => onChange(e.target.value)} placeholder="valor" className={`${campoCls} w-36 min-w-0`} />
    <datalist id={id}>{valores.map(v => <option key={v} value={v} />)}</datalist></>
}

/** Os filtros (todos precisam valer). */
export function FiltrosEditor({ site, filtros, onChange, coortes = true }: { site: string; filtros: Filtro[]; onChange: (f: Filtro[]) => void; coortes?: boolean }) {
  const lista = useLista<{ id: string; name: string }>('coortes', coortes ? site : null)
  const mudar = (i: number, f: Partial<Filtro>) => onChange(filtros.map((x, k) => k === i ? { ...x, ...f } as Filtro : x))
  return <div className="grid gap-1.5">
    {filtros.map((f, i) => <div key={i} className="flex flex-wrap items-center gap-1.5" data-filtro>
      <span className="w-6 text-right text-[11.5px] text-[#999]">{i ? 'e' : 'onde'}</span>
      <CampoSelect site={site} value={f.campo} coortes={coortes} onChange={campo => mudar(i, campo === 'coorte' ? { campo: 'coorte', op: 'igual', valor: lista.itens?.[0]?.id ?? '' } as Filtro : { campo, op: f.campo === 'coorte' ? 'igual' : f.op, valor: f.campo === 'coorte' ? '' : f.valor } as Filtro)} />
      {f.campo === 'coorte' ? <>
        <select aria-label="Condição" value={f.op} onChange={e => mudar(i, { op: e.target.value as 'igual' })} className={campoCls}><option value="igual">é da</option><option value="diferente">não é da</option></select>
        <select aria-label="Coorte" value={f.valor} onChange={e => mudar(i, { valor: e.target.value })} className={campoCls}>
          {!lista.itens?.length ? <option value="">Nenhuma coorte</option> : lista.itens.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </> : <>
        <select aria-label="Condição" value={f.op} onChange={e => mudar(i, { op: e.target.value as Filtro['op'] })} className={campoCls}>
          {Object.entries(OPERADORES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        {f.op !== 'existe' && f.op !== 'nao_existe' ? <Valor site={site} campo={f.campo} value={f.valor ?? ''} onChange={valor => mudar(i, { valor })} /> : null}
      </>}
      <button type="button" aria-label="Tirar filtro" onClick={() => onChange(filtros.filter((_, k) => k !== i))} className="grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3] hover:text-[#333]">×</button>
    </div>)}
    <button type="button" onClick={() => onChange([...filtros, { campo: 'pagina', op: 'igual', valor: '' }])} className="w-fit rounded-md px-1.5 py-1 text-[12.5px] font-medium text-[#2a78d6] hover:bg-[#f0f6fd]">+ Filtro</button>
  </div>
}
