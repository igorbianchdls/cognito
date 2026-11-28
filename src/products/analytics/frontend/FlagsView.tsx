'use client'

// Feature flags e experimentos: liga e desliga partes do site sem publicar de novo, para uma porcentagem e para quem
// atende as regras; um experimento compara as variantes de uma flag num evento objetivo e diz se a diferença é real.
import { useEffect, useState } from 'react'
import { api, apagar, salvar, useLista } from './api'
import { EventoSelect } from './seletores'
import { Card, campoCls, Notice, perigo, primario, secundario, Tela, Vazio } from './ui'

type Regra = { tipo: 'campo'; campo: 'pais' | 'aparelho' | 'navegador' | 'sistema' | 'idioma' | 'pagina'; op: 'igual' | 'diferente' | 'contem'; valor: string } | { tipo: 'coorte'; coorte_id: string } | { tipo: 'identificado'; valor: boolean }
type Flag = { id: string; key: string; name: string; description: string; enabled: boolean; rollout: number; rules: Regra[]; variants: { key: string; peso: number }[] | null }
type Experimento = { id: string; flag_id: string; name: string; hypothesis: string; goal_event: string; status: 'rascunho' | 'rodando' | 'encerrado'; started_at: string | null; ended_at: string | null; winner: string | null }
type Resultado = { variantes: { variante: string; expostos: number; convertidos: number; conversao: number; p_valor: number | null; chance_melhor: number | null }[]; significativo: boolean; iniciado: boolean }
const CAMPOS_FLAG = { pais: 'País (BR, US…)', aparelho: 'Aparelho (desktop, mobile, tablet)', navegador: 'Navegador', sistema: 'Sistema', idioma: 'Idioma (pt, en…)', pagina: 'Página' }

export function FlagsView() {
  const [aba, setAba] = useState<'flags' | 'experimentos'>(() => typeof window !== 'undefined' && location.hash === '#experimentos' ? 'experimentos' : 'flags')
  return <Tela title="Flags e experimentos" subtitle="Ligue partes do site para quem quiser e teste versões com números.">{site => <div className="grid gap-4">
    <div role="tablist" className="flex w-fit rounded-xl border border-[#e2e2e2] bg-white p-1">{(['flags', 'experimentos'] as const).map(a => <button key={a} type="button" role="tab" aria-selected={aba === a} onClick={() => setAba(a)}
      className={`h-8 rounded-lg px-3.5 text-[13px] font-medium ${aba === a ? 'bg-[#111] text-white' : 'text-[#555] hover:bg-[#f3f3f3]'}`}>{a === 'flags' ? 'Feature flags' : 'Experimentos'}</button>)}</div>
    {aba === 'flags' ? <Flags key={site.id} site={site.id} /> : <Experimentos key={site.id} site={site.id} />}
  </div>}</Tela>
}

function Flags({ site }: { site: string }) {
  const l = useLista<Flag>('flags', site)
  const [editando, setEditando] = useState<Flag | 'nova' | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const alternar = async (f: Flag) => { l.setItens(l.itens!.map(x => x.id === f.id ? { ...x, enabled: !f.enabled } : x)); try { await salvar('flags', { enabled: !f.enabled }, f.id) } catch (e) { setErro((e as Error).message); await l.recarregar() } }
  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-2"><button type="button" className={primario} onClick={() => setEditando('nova')}>Nova flag</button>
      <span className="text-[12.5px] text-[#888]">No site: <code>if (otto.flag(&apos;nova-home&apos;)) {'{ … }'}</code> ou <code>otto.onFlags(f =&gt; …)</code></span></div>
    {erro || l.erro ? <Notice tone="error">{erro ?? l.erro}</Notice> : null}
    {editando ? <EditorFlag site={site} inicial={editando === 'nova' ? undefined : editando} fechar={async () => { setEditando(null); await l.recarregar() }} /> : null}
    {!l.itens ? <div className="h-32 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : !l.itens.length && !editando ? <Vazio titulo="Nenhuma flag ainda">Uma flag liga uma parte do site (uma home nova, um botão) para 10% das pessoas, só no celular, só para quem se identificou…</Vazio>
      : <Card className="p-0"><ul className="divide-y divide-[#f2f2f2]">{l.itens.map(f => <li key={f.id} className="flex flex-wrap items-center gap-3 px-5 py-3" data-flag>
        <button type="button" role="switch" aria-checked={f.enabled} aria-label={`Ligar ${f.key}`} onClick={() => void alternar(f)} className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${f.enabled ? 'bg-[#2f9e44]' : 'bg-[#d5d8dc]'}`}>
          <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${f.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></button>
        <span className="min-w-0 flex-1"><span className="block font-mono text-[13px] font-medium text-[#111]">{f.key}</span><span className="block truncate text-[12px] text-[#888]">{f.name || 'Sem descrição'} · {f.rollout}% {f.rules.length ? `· ${f.rules.length} regra${f.rules.length > 1 ? 's' : ''}` : ''}{f.variants ? ` · variantes ${f.variants.map(v => `${v.key} ${v.peso}%`).join(', ')}` : ''}</span></span>
        <button type="button" className={secundario} onClick={() => setEditando(f)}>Editar</button>
      </li>)}</ul></Card>}
  </div>
}

function EditorFlag({ site, inicial, fechar }: { site: string; inicial?: Flag; fechar: () => void }) {
  const [f, setF] = useState<Omit<Flag, 'id'>>(inicial ?? { key: '', name: '', description: '', enabled: false, rollout: 100, rules: [], variants: null })
  const [erro, setErro] = useState<string | null>(null)
  const coortes = useLista<{ id: string; name: string }>('coortes', site)
  const soma = f.variants?.reduce((a, b) => a + b.peso, 0) ?? 100
  async function gravar() {
    try { const { key, ...resto } = f; await salvar('flags', inicial ? resto : { property_id: site, key, ...resto }, inicial?.id); fechar() } catch (e) { setErro((e as Error).message) }
  }
  const regra = (i: number, r: Partial<Regra>) => setF({ ...f, rules: f.rules.map((x, k) => k === i ? { ...x, ...r } as Regra : x) })
  return <Card className="grid gap-3">
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-[12.5px] text-[#555]">Chave (usada no código)<input aria-label="Chave" value={f.key} disabled={Boolean(inicial)} onChange={e => setF({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') })} placeholder="nova-home" className={`${campoCls} font-mono`} /></label>
      <label className="grid gap-1 text-[12.5px] text-[#555]">Nome<input aria-label="Nome da flag" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Home nova" className={campoCls} /></label>
    </div>
    <label className="grid gap-1 text-[12.5px] text-[#555]">Para quantas pessoas: <b className="text-[#111]">{f.rollout}%</b>
      <input type="range" min={0} max={100} step={5} value={f.rollout} onChange={e => setF({ ...f, rollout: Number(e.target.value) })} aria-label="Porcentagem" /></label>
    <div className="grid gap-1.5"><p className="text-[12.5px] text-[#555]">Só para quem (todas valem):</p>
      {f.rules.map((r, i) => <div key={i} className="flex flex-wrap items-center gap-1.5" data-regra-flag>
        <select aria-label="Tipo de regra" value={r.tipo === 'campo' ? r.campo : r.tipo} onChange={e => { const v = e.target.value; regra(i, v === 'coorte' ? { tipo: 'coorte', coorte_id: coortes.itens?.[0]?.id ?? '' } : v === 'identificado' ? { tipo: 'identificado', valor: true } : { tipo: 'campo', campo: v as 'pais', op: 'igual', valor: '' }) }} className={campoCls}>
          {Object.entries(CAMPOS_FLAG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}<option value="coorte">Está na coorte</option><option value="identificado">Se identificou</option></select>
        {r.tipo === 'campo' ? <><select aria-label="Condição" value={r.op} onChange={e => regra(i, { op: e.target.value as 'igual' })} className={campoCls}><option value="igual">é</option><option value="diferente">não é</option><option value="contem">contém</option></select>
          <input aria-label="Valor" value={r.valor} onChange={e => regra(i, { valor: e.target.value })} className={`${campoCls} w-36`} /></>
          : r.tipo === 'coorte' ? <select aria-label="Coorte" value={r.coorte_id} onChange={e => regra(i, { coorte_id: e.target.value })} className={campoCls}>{coortes.itens?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          : <select aria-label="Identificado" value={String(r.valor)} onChange={e => regra(i, { valor: e.target.value === 'true' })} className={campoCls}><option value="true">sim</option><option value="false">não</option></select>}
        <button type="button" aria-label="Tirar regra" onClick={() => setF({ ...f, rules: f.rules.filter((_, k) => k !== i) })} className="grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3]">×</button>
      </div>)}
      <button type="button" onClick={() => setF({ ...f, rules: [...f.rules, { tipo: 'campo', campo: 'aparelho', op: 'igual', valor: 'mobile' }] })} className="w-fit rounded-md px-1.5 py-1 text-[12.5px] font-medium text-[#2a78d6] hover:bg-[#f0f6fd]">+ Regra</button>
    </div>
    <div className="grid gap-1.5">
      <label className="flex items-center gap-2 text-[13px] text-[#333]"><input type="checkbox" checked={Boolean(f.variants)} onChange={e => setF({ ...f, variants: e.target.checked ? [{ key: 'controle', peso: 50 }, { key: 'teste', peso: 50 }] : null })} />Variantes (teste A/B)</label>
      {f.variants?.map((v, i) => <div key={i} className="flex items-center gap-1.5">
        <input aria-label="Chave da variante" value={v.key} onChange={e => setF({ ...f, variants: f.variants!.map((x, k) => k === i ? { ...x, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') } : x) })} className={`${campoCls} w-32 font-mono`} />
        <input aria-label="Peso" type="number" min={0} max={100} value={v.peso} onChange={e => setF({ ...f, variants: f.variants!.map((x, k) => k === i ? { ...x, peso: Math.max(0, Math.min(100, Number(e.target.value) || 0)) } : x) })} className={`${campoCls} w-20`} />%
        {i === 0 ? <span className="text-[11.5px] text-[#999]">controle</span> : f.variants!.length > 2 ? <button type="button" aria-label="Tirar variante" onClick={() => setF({ ...f, variants: f.variants!.filter((_, k) => k !== i) })} className="grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3]">×</button> : null}
      </div>)}
      {f.variants ? <div className="flex items-center gap-2">{f.variants.length < 6 ? <button type="button" className="w-fit rounded-md px-1.5 py-1 text-[12.5px] font-medium text-[#2a78d6] hover:bg-[#f0f6fd]" onClick={() => setF({ ...f, variants: [...f.variants!, { key: `v${f.variants!.length + 1}`, peso: 0 }] })}>+ Variante</button> : null}
        {soma !== 100 ? <span className="text-[12px] text-[#a33]">Os pesos somam {soma}%; precisam somar 100.</span> : null}</div> : null}
    </div>
    {erro ? <p role="alert" className="text-[13px] text-[#a33]">{erro}</p> : null}
    <div className="flex flex-wrap gap-2"><button type="button" disabled={!f.key || soma !== 100} onClick={() => void gravar()} className={primario}>Salvar flag</button><button type="button" onClick={fechar} className={secundario}>Cancelar</button>
      {inicial ? <button type="button" className={`${perigo} ml-auto`} onClick={async () => { if (!confirm(`Apagar a flag ${inicial.key}? O site passa a receber false.`)) return; try { await apagar('flags', inicial.id); fechar() } catch (e) { setErro((e as Error).message) } }}>Apagar</button> : null}</div>
  </Card>
}

function Experimentos({ site }: { site: string }) {
  const l = useLista<Experimento>('experimentos', site)
  const flags = useLista<Flag>('flags', site)
  const [novo, setNovo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const livres = flags.itens?.filter(f => f.variants && !l.itens?.some(x => x.flag_id === f.id)) ?? []
  const mudar = async (x: Experimento, dados: Partial<Experimento>) => { try { await salvar('experimentos', dados, x.id); await l.recarregar() } catch (e) { setErro((e as Error).message) } }
  return <div className="grid gap-3">
    <div><button type="button" className={primario} onClick={() => setNovo(true)} disabled={!livres.length}>Novo experimento</button>
      {flags.itens && !livres.length ? <span className="ml-2 text-[12.5px] text-[#888]">Crie uma flag com variantes para testar.</span> : null}</div>
    {erro || l.erro ? <Notice tone="error">{erro ?? l.erro}</Notice> : null}
    {novo ? <NovoExperimento site={site} flags={livres} fechar={async () => { setNovo(false); await l.recarregar() }} /> : null}
    {!l.itens ? <div className="h-32 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : !l.itens.length && !novo ? <Vazio titulo="Nenhum experimento ainda">Compare a home atual com uma nova: quem viu cada uma e quantos se cadastraram, com a chance de a diferença ser real.</Vazio>
      : l.itens.map(x => <Card key={x.id} className="grid gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><p className="text-[15px] font-semibold text-[#111]">{x.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ${x.status === 'rodando' ? 'bg-[#e9f7ec] text-[#2f7a3a]' : x.status === 'encerrado' ? 'bg-[#f1f1f1] text-[#555]' : 'bg-[#fff6e5] text-[#9a6200]'}`}>{x.status}</span></p>
            <p className="text-[12.5px] text-[#888]">Flag {flags.itens?.find(f => f.id === x.flag_id)?.key ?? '…'} · objetivo: {x.goal_event}{x.hypothesis ? ` · ${x.hypothesis}` : ''}</p></div>
          <span className="flex gap-1">
            {x.status === 'rascunho' ? <button type="button" className={primario} onClick={async () => { const f = flags.itens?.find(y => y.id === x.flag_id); if (f && !f.enabled) await salvar('flags', { enabled: true }, f.id); await mudar(x, { status: 'rodando', started_at: new Date().toISOString() }) }}>Começar</button> : null}
            {x.status === 'rodando' ? <button type="button" className={secundario} onClick={() => void mudar(x, { status: 'encerrado', ended_at: new Date().toISOString() })}>Encerrar</button> : null}
            <button type="button" className={perigo} onClick={async () => { if (!confirm(`Apagar "${x.name}"?`)) return; try { await apagar('experimentos', x.id); await l.recarregar() } catch (e) { setErro((e as Error).message) } }}>Apagar</button>
          </span>
        </div>
        {x.status !== 'rascunho' ? <ResultadoExp id={x.id} /> : <p className="text-[13px] text-[#888]">Ao começar, a flag é ligada e quem a vê (otto.flag) entra no experimento.</p>}
      </Card>)}
  </div>
}

function NovoExperimento({ site, flags, fechar }: { site: string; flags: Flag[]; fechar: () => void }) {
  const [x, setX] = useState({ name: '', hypothesis: '', goal_event: '$pageview', flag_id: flags[0]?.id ?? '' })
  const [erro, setErro] = useState<string | null>(null)
  return <Card className="grid gap-2">
    <input aria-label="Nome do experimento" value={x.name} onChange={e => setX({ ...x, name: e.target.value })} placeholder="Nome (ex.: Home nova)" className={campoCls} />
    <input aria-label="Hipótese" value={x.hypothesis} onChange={e => setX({ ...x, hypothesis: e.target.value })} placeholder="Hipótese (ex.: a home nova aumenta cadastros)" className={campoCls} />
    <div className="flex flex-wrap items-center gap-2 text-[13px]">Flag<select aria-label="Flag" value={x.flag_id} onChange={e => setX({ ...x, flag_id: e.target.value })} className={campoCls}>{flags.map(f => <option key={f.id} value={f.id}>{f.key}</option>)}</select>
      Objetivo<EventoSelect site={site} todos={false} value={x.goal_event} onChange={goal_event => setX({ ...x, goal_event })} label="Evento objetivo" /></div>
    {erro ? <p role="alert" className="text-[13px] text-[#a33]">{erro}</p> : null}
    <div className="flex gap-2"><button type="button" className={primario} disabled={!x.name.trim() || !x.flag_id} onClick={async () => { try { await salvar('experimentos', { property_id: site, ...x, name: x.name.trim() }); fechar() } catch (e) { setErro((e as Error).message) } }}>Criar</button><button type="button" className={secundario} onClick={fechar}>Cancelar</button></div>
  </Card>
}

function ResultadoExp({ id }: { id: string }) {
  const [r, setR] = useState<Resultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => { api<Resultado>(`experimentos/${id}`).then(setR).catch(e => setErro((e as Error).message)) }, [id])
  if (erro) return <p className="text-[13px] text-[#a33]">{erro}</p>
  if (!r) return <div className="h-24 animate-pulse rounded-xl bg-[#f5f5f5]" />
  const melhor = r.variantes.reduce((a, b) => b.conversao > a.conversao ? b : a, r.variantes[0])
  return <div className="grid gap-2" data-resultado-exp>
    <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-[13px]"><thead><tr className="text-left text-[12px] text-[#888]">{['Variante', 'Viram', 'Converteram', 'Conversão', 'Chance de ser melhor', 'Valor-p'].map(h => <th key={h} className="pb-2 pr-3 font-medium">{h}</th>)}</tr></thead>
      <tbody>{r.variantes.map((v, i) => <tr key={v.variante} className="border-t border-[#f3f3f3]"><td className="py-2 pr-3 font-mono font-medium">{v.variante}{i === 0 ? <span className="ml-1 font-sans text-[11px] text-[#999]">controle</span> : null}</td>
        <td className="py-2 pr-3 tabular-nums">{v.expostos}</td><td className="py-2 pr-3 tabular-nums">{v.convertidos}</td>
        <td className="py-2 pr-3"><span className="inline-flex items-center gap-2"><span className="h-2 w-20 overflow-hidden rounded-full bg-[#f1f3f5]"><span className="block h-full bg-[#2a78d6]" style={{ width: `${Math.min(100, v.conversao)}%` }} /></span><b className="tabular-nums">{v.conversao}%</b></span></td>
        <td className="py-2 pr-3 tabular-nums">{v.chance_melhor == null ? '—' : `${v.chance_melhor}%`}</td><td className="py-2 pr-3 tabular-nums text-[#666]">{v.p_valor == null ? '—' : v.p_valor}</td></tr>)}</tbody></table></div>
    <p className={`text-[13px] ${r.significativo ? 'font-medium text-[#2f7a3a]' : 'text-[#666]'}`}>{r.significativo ? `Diferença significativa (95%): ${melhor.variante} está à frente.` : r.variantes.some(v => v.expostos < 30) ? 'Ainda poucas pessoas para concluir (mínimo de 30 por variante).' : 'Por enquanto, sem diferença significativa.'}</p>
  </div>
}
