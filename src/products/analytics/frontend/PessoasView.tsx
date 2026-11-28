'use client'

// Pessoas (visitantes e usuários identificados, juntos depois do identify), o perfil com a linha do tempo e as
// gravações, e as coortes: regras de quem fez ou não fez algo, com a contagem ao vivo enquanto monta.
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { TODOS, type DefinicaoCoorte } from '../shared/consulta'
import { api, apagar, salvar, useLeitura, useLista } from './api'
import { CampoSelect, EventoSelect, FiltrosEditor, nomeEvento } from './seletores'
import { Card, campoCls, haQuanto, Notice, perigo, primario, quando, secundario, Tela, Vazio } from './ui'

type Pessoa = { pessoa: string; usuario: string | null; primeira_vez: string; ultima_vez: string; eventos: number; sessoes: number; pais: string | null; aparelho: string | null; navegador: string | null; origem: string | null }
type Coorte = { id: string; name: string; description: string; rules: DefinicaoCoorte }
const curto = (p: string) => p.length > 18 ? `${p.slice(0, 8)}…${p.slice(-4)}` : p

export function PessoasView() {
  return <Tela title="Pessoas" subtitle="Cada visitante, e quem se identificou, com tudo o que fez.">{site => <Pessoas key={site.id} site={site.id} />}</Tela>
}

function Pessoas({ site }: { site: string }) {
  const [busca, setBusca] = useState('')
  const [coorte, setCoorte] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(location.search).get('coorte') ?? '')
  const [pagina, setPagina] = useState(0)
  const [b, setB] = useState('')
  useEffect(() => { const t = setTimeout(() => { setB(busca); setPagina(0) }, 300); return () => clearTimeout(t) }, [busca])
  const coortes = useLista<Coorte>('coortes', site)
  const l = useLeitura<{ pessoas: Pessoa[]; mais: boolean }>(`pessoas?propriedade=${site}&busca=${encodeURIComponent(b)}&coorte=${coorte}&pagina=${pagina}`)
  return <div className="grid gap-3">
    <div className="flex flex-wrap gap-2">
      <input aria-label="Buscar pessoa" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por id ou usuário…" className={`${campoCls} w-64`} />
      <select aria-label="Coorte" value={coorte} onChange={e => { setCoorte(e.target.value); setPagina(0) }} className={campoCls}><option value="">Todas as pessoas</option>{coortes.itens?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
    </div>
    {l.erro ? <Notice tone="error">{l.erro}</Notice> : !l.dados ? <div className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : !l.dados.pessoas.length ? <Vazio titulo="Ninguém por aqui">{b || coorte ? 'Nenhuma pessoa com esse filtro.' : 'As pessoas aparecem quando o site manda os primeiros eventos.'}</Vazio> : <Card className="p-0">
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-[13px]">
        <thead><tr className="text-left text-[12px] text-[#888]">{['Pessoa', 'Última vez', 'Primeira vez', 'Sessões', 'Eventos', 'Onde', 'Origem'].map(h => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
        <tbody>{l.dados.pessoas.map(p => <tr key={p.pessoa} className="border-t border-[#f3f3f3] hover:bg-[#fafafa]" data-pessoa>
          <td className="px-4 py-2.5"><Link href={`/analytics/pessoas/${encodeURIComponent(p.pessoa)}`} className="font-medium text-[#111] hover:underline">{p.usuario ? p.usuario : <span className="font-mono text-[12px]">{curto(p.pessoa)}</span>}</Link>
            {p.usuario ? <span className="ml-2 rounded bg-[#eef4fc] px-1.5 py-0.5 text-[11px] text-[#2a78d6]">identificado</span> : null}</td>
          <td className="px-4 py-2.5 text-[#555]">{haQuanto(p.ultima_vez)}</td><td className="px-4 py-2.5 text-[#555]">{quando(p.primeira_vez)}</td>
          <td className="px-4 py-2.5 tabular-nums">{p.sessoes}</td><td className="px-4 py-2.5 tabular-nums">{p.eventos}</td>
          <td className="px-4 py-2.5 text-[#555]">{[p.pais, p.aparelho, p.navegador].filter(Boolean).join(' · ') || '—'}</td><td className="px-4 py-2.5 text-[#555]">{p.origem ?? '(direto)'}</td>
        </tr>)}</tbody>
      </table></div>
      <div className="flex justify-between border-t border-[#f3f3f3] px-4 py-2.5">
        <button type="button" disabled={!pagina} onClick={() => setPagina(pagina - 1)} className={secundario}>Anteriores</button>
        <button type="button" disabled={!l.dados.mais} onClick={() => setPagina(pagina + 1)} className={secundario}>Próximas</button>
      </div>
    </Card>}
  </div>
}

type Perfil = Omit<Pessoa, 'eventos'> & { visitantes: string[]; regiao: string | null; sistema: string | null; origem_inicial: string; primeira_pagina: string | null; dados: Record<string, unknown> | null
  eventos: { quando: string; evento: string; pagina: string | null; titulo: string | null; sessao: string | null; propriedades: Record<string, unknown> | null; origem: string | null }[]
  gravacoes: { sessao: string; inicio: string; fim: string; url: string | null }[] }

export function PessoaView({ id }: { id: string }) {
  return <Tela title="Pessoa">{site => <PerfilPessoa key={site.id} site={site.id} id={id} />}</Tela>
}

function PerfilPessoa({ site, id }: { site: string; id: string }) {
  const l = useLeitura<Perfil>(`pessoas?propriedade=${site}&id=${encodeURIComponent(id)}`)
  const [aberto, setAberto] = useState<number | null>(null)
  if (l.erro) return <Notice tone="error">{l.erro}</Notice>
  if (!l.dados) return <div className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" />
  const p = l.dados
  const sessoes = new Map<string, Perfil['eventos']>()
  p.eventos.forEach(e => { const k = e.sessao ?? '—'; sessoes.set(k, [...(sessoes.get(k) ?? []), e]) })
  const grav = new Set(p.gravacoes.map(g => g.sessao))
  let n = 0
  return <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
    <Card className="grid gap-3">
      <div><p className="break-all text-[16px] font-semibold text-[#111]">{p.usuario ?? curto(p.pessoa)}</p><p className="text-[12px] text-[#888]">{p.usuario ? 'usuário identificado' : 'visitante anônimo'}</p></div>
      <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1.5 text-[12.5px]">
        {([['Primeira vez', quando(p.primeira_vez)], ['Última vez', quando(p.ultima_vez)], ['Sessões', p.sessoes], ['Eventos', p.eventos.length >= 300 ? '300+' : p.eventos.length], ['Chegou por', p.origem_inicial], ['Primeira página', p.primeira_pagina ?? '—'],
          ['Lugar', [p.regiao, p.pais].filter(Boolean).join(', ') || '—'], ['Aparelho', [p.aparelho, p.sistema, p.navegador].filter(Boolean).join(' · ') || '—'], ['Aparelhos', p.visitantes.length]] as [string, string | number][])
          .map(([k, v]) => <div key={k} className="contents"><dt className="text-[#888]">{k}</dt><dd className="min-w-0 break-words text-[#222]">{v}</dd></div>)}
      </dl>
      {p.dados && Object.keys(p.dados).length ? <div><p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-[#888]">Dados do identify</p>
        <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-[12.5px]">{Object.entries(p.dados).slice(0, 20).map(([k, v]) => <div key={k} className="contents"><dt className="truncate text-[#888]">{k}</dt><dd className="break-words">{String(v)}</dd></div>)}</dl></div> : null}
    </Card>
    <Card title="Linha do tempo" className="min-w-0">
      <div className="grid gap-4">{[...sessoes.entries()].map(([s, evs]) => <div key={s} data-sessao>
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[12px] text-[#888]"><span className="font-medium text-[#444]">Sessão de {quando(evs[evs.length - 1].quando)}</span>{evs[evs.length - 1].origem ? <span>· via {evs[evs.length - 1].origem}</span> : null}
          {grav.has(s) ? <Link href={`/analytics/gravacoes?sessao=${encodeURIComponent(s)}`} className="rounded bg-[#fdf0f0] px-1.5 py-0.5 font-medium text-[#c92a2a] hover:underline">▶ Ver gravação</Link> : null}</div>
        <ol className="grid border-l border-[#eee] pl-3">{evs.map(e => { const i = n++; return <li key={i} className="relative py-1">
          <span aria-hidden className="absolute -left-[16px] top-[11px] size-[7px] rounded-full bg-[#cfd8e3]" />
          <button type="button" onClick={() => setAberto(aberto === i ? null : i)} className="flex w-full items-baseline gap-2 text-left text-[13px]">
            <span className="w-12 shrink-0 tabular-nums text-[11.5px] text-[#999]">{new Date(e.quando).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="font-medium text-[#111]">{nomeEvento(e.evento)}</span><span className="min-w-0 truncate text-[#777]">{e.evento === '$autocapture' ? String(e.propriedades?.texto || e.propriedades?.seletor || '') : e.pagina}</span></button>
          {aberto === i && e.propriedades ? <pre className="mt-1 overflow-x-auto rounded-lg bg-[#fafafa] p-2 text-[11.5px] text-[#444]">{JSON.stringify(e.propriedades, null, 2)}</pre> : null}
        </li> })}</ol>
      </div>)}</div>
    </Card>
  </div>
}

// ---------------------------------------------------------------- coortes

export function CoortesView() {
  const [editando, setEditando] = useState<Coorte | 'nova' | null>(null)
  return <Tela title="Coortes" subtitle="Grupos de pessoas por comportamento, para filtrar insights, flags e a lista de pessoas."
    actions={() => <button type="button" className={primario} onClick={() => setEditando('nova')}>Nova coorte</button>}>
    {site => <Coortes key={site.id} site={site.id} editando={editando} setEditando={setEditando} />}
  </Tela>
}

function Coortes({ site, editando, setEditando }: { site: string; editando: Coorte | 'nova' | null; setEditando: (c: Coorte | 'nova' | null) => void }) {
  const l = useLista<Coorte>('coortes', site)
  return <div className="grid gap-4">
    {editando ? <EditorCoorte site={site} inicial={editando === 'nova' ? undefined : editando} fechar={async () => { setEditando(null); await l.recarregar() }} /> : null}
    {l.erro ? <Notice tone="error">{l.erro}</Notice> : !l.itens ? <div className="h-32 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : !l.itens.length && !editando
      ? <Vazio titulo="Nenhuma coorte ainda" acao={<button type="button" className={primario} onClick={() => setEditando('nova')}>Criar coorte</button>}>Ex.: “viu preços nos últimos 30 dias e não se cadastrou”.</Vazio>
      : <div className="grid gap-3 sm:grid-cols-2">{l.itens.map(c => <Card key={c.id} className="grid gap-2" >
        <div className="flex items-start justify-between gap-2"><div><p className="text-[14.5px] font-semibold text-[#111]">{c.name}</p><p className="text-[12px] text-[#888]">{c.rules.regras.length} regra{c.rules.regras.length > 1 ? 's' : ''} · {c.rules.combinar === 'todas' ? 'todas valem' : 'qualquer uma'}</p></div>
          <span className="flex gap-1"><Link href={`/analytics/pessoas?coorte=${c.id}`} className={secundario}>Pessoas</Link><button type="button" className={secundario} onClick={() => setEditando(c)}>Editar</button></span></div>
        <Contagem site={site} def={c.rules} />
      </Card>)}</div>}
  </div>
}

function Contagem({ site, def }: { site: string; def: DefinicaoCoorte }) {
  const [r, setR] = useState<{ total: number } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const chave = JSON.stringify(def)
  useEffect(() => {
    const t = setTimeout(() => api<{ total: number }>('coortes', { json: { propriedade: site, definicao: JSON.parse(chave) } }).then(x => { setR(x); setErro(null) }).catch(e => setErro((e as Error).message)), 350)
    return () => clearTimeout(t)
  }, [site, chave])
  return <p className="text-[13px] text-[#555]" data-contagem>{erro ? <span className="text-[#a33]">{erro}</span> : r ? <><b className="text-[18px] tabular-nums text-[#111]">{r.total.toLocaleString('pt-BR')}</b> {r.total === 1 ? 'pessoa' : 'pessoas'} agora</> : 'Contando…'}</p>
}

type Regra = DefinicaoCoorte['regras'][number]
function EditorCoorte({ site, inicial, fechar }: { site: string; inicial?: Coorte; fechar: () => void }) {
  const [nome, setNome] = useState(inicial?.name ?? '')
  const [def, setDef] = useState<DefinicaoCoorte>(inicial?.rules ?? { combinar: 'todas', regras: [{ tipo: 'fez', evento: '$pageview', vezes: 1, dias: 30, filtros: [] }] })
  const [erro, setErro] = useState<string | null>(null)
  const mudar = (i: number, r: Partial<Regra>) => setDef({ ...def, regras: def.regras.map((x, k) => k === i ? { ...x, ...r } as Regra : x) })
  const valida: DefinicaoCoorte = { ...def, regras: def.regras.map(r => r.tipo === 'fez' ? { ...r, filtros: r.filtros.filter(f => f.campo === 'coorte' || f.op === 'existe' || f.op === 'nao_existe' || f.valor) } : r) }
  async function gravar() {
    if (!nome.trim()) { setErro('Dê um nome à coorte.'); return }
    try { await salvar('coortes', { ...(inicial ? {} : { property_id: site }), name: nome.trim(), rules: valida }, inicial?.id); fechar() } catch (e) { setErro((e as Error).message) }
  }
  return <Card className="grid gap-3" >
    <input aria-label="Nome da coorte" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da coorte" className="h-10 rounded-lg border border-[#e2e2e2] px-3 text-[15px] font-semibold" />
    <label className="flex items-center gap-2 text-[13px] text-[#333]">Pessoas que atendem
      <select aria-label="Combinar" value={def.combinar} onChange={e => setDef({ ...def, combinar: e.target.value as 'todas' })} className={campoCls}><option value="todas">todas</option><option value="qualquer">qualquer uma</option></select> das regras:</label>
    {def.regras.map((r, i) => <div key={i} className="grid gap-1.5 rounded-xl border border-[#eee] p-2.5" data-regra>
      <div className="flex flex-wrap items-center gap-1.5">
        <select aria-label="Tipo de regra" value={r.tipo} onChange={e => mudar(i, e.target.value === 'fez' ? { tipo: 'fez', evento: '$pageview', vezes: 1, dias: 30, filtros: [] } : e.target.value === 'nao_fez' ? { tipo: 'nao_fez', evento: '$pageview', dias: 30 } : { tipo: 'propriedade', campo: 'pais', op: 'igual', valor: '' })} className={campoCls}>
          <option value="fez">Fez</option><option value="nao_fez">Não fez</option><option value="propriedade">Tem</option></select>
        {r.tipo === 'propriedade' ? <>
          <CampoSelect site={site} value={r.campo} onChange={campo => mudar(i, { campo })} />
          <select aria-label="Condição" value={r.op} onChange={e => mudar(i, { op: e.target.value as 'igual' })} className={campoCls}><option value="igual">igual a</option><option value="diferente">diferente de</option><option value="contem">contendo</option><option value="existe">preenchido</option></select>
          {r.op !== 'existe' ? <input aria-label="Valor" value={r.valor ?? ''} onChange={e => mudar(i, { valor: e.target.value })} className={`${campoCls} w-36`} /> : null}
        </> : <>
          <EventoSelect site={site} value={r.evento} onChange={evento => mudar(i, { evento })} />
          {r.tipo === 'fez' ? <label className="flex items-center gap-1 text-[13px]"><input type="number" min={1} value={r.vezes} onChange={e => mudar(i, { vezes: Math.max(1, Number(e.target.value) || 1) })} className={`${campoCls} w-16`} aria-label="Vezes" />vez(es)</label> : null}
          <label className="flex items-center gap-1 text-[13px]">nos últimos<input type="number" min={1} max={400} value={r.dias} onChange={e => mudar(i, { dias: Math.min(400, Math.max(1, Number(e.target.value) || 1)) })} className={`${campoCls} w-16`} aria-label="Dias" />dias</label>
        </>}
        {def.regras.length > 1 ? <button type="button" aria-label="Tirar regra" onClick={() => setDef({ ...def, regras: def.regras.filter((_, k) => k !== i) })} className="ml-auto grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3]">×</button> : null}
      </div>
      {r.tipo === 'fez' && r.evento !== TODOS ? <FiltrosEditor site={site} filtros={r.filtros} coortes={false} onChange={filtros => mudar(i, { filtros })} /> : null}
    </div>)}
    <button type="button" onClick={() => setDef({ ...def, regras: [...def.regras, { tipo: 'nao_fez', evento: '$pageview', dias: 30 }] })} className={`${secundario} w-fit`}>+ Regra</button>
    <Contagem site={site} def={valida} />
    {erro ? <p role="alert" className="text-[13px] text-[#a33]">{erro}</p> : null}
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void gravar()} className={primario}>Salvar coorte</button><button type="button" onClick={fechar} className={secundario}>Cancelar</button>
      {inicial ? <button type="button" className={`${perigo} ml-auto`} onClick={async () => { if (!confirm(`Apagar "${inicial.name}"?`)) return; try { await apagar('coortes', inicial.id); fechar() } catch (e) { setErro((e as Error).message) } }}>Apagar</button> : null}</div>
  </Card>
}
