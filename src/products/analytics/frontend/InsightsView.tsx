'use client'

// A lista de insights salvos e os painéis: cada painel é uma grade de insights que rodam no período escolhido.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api, apagar, salvar, useConsulta, useLista } from './api'
import { Resultado } from './Construtor'
import { limpar, noPeriodo, resumo, TIPOS, type Insight, type Painel } from './insights'
import { Card, campoCls, haQuanto, Notice, Periodo, perigo, primario, secundario, Tela, Vazio } from './ui'

export function InsightsView() {
  const [busca, setBusca] = useState('')
  return <Tela title="Insights" subtitle="Gráficos, funis, retenção e caminhos salvos." actions={() => <Link href="/analytics/insights/novo" className={primario}>Novo insight</Link>}>
    {site => <Lista site={site.id} busca={busca} setBusca={setBusca} />}
  </Tela>
}

function Lista({ site, busca, setBusca }: { site: string; busca: string; setBusca: (b: string) => void }) {
  const l = useLista<Insight>('insights', site)
  if (l.erro) return <Notice tone="error">{l.erro}</Notice>
  if (!l.itens) return <div className="h-40 animate-pulse rounded-2xl bg-[#f0f0f0]" />
  if (!l.itens.length) return <Vazio titulo="Nenhum insight ainda" acao={<Link href="/analytics/insights/novo" className={primario}>Criar o primeiro</Link>}>
    Um insight responde uma pergunta: quantas pessoas viram a página de preços por dia, quanto do cadastro chega ao fim, quem volta na semana seguinte.</Vazio>
  const lista = l.itens.filter(i => !busca || i.name.toLowerCase().includes(busca.toLowerCase()))
  return <div className="grid gap-3">
    <input aria-label="Buscar insights" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar…" className={`${campoCls} w-full max-w-xs`} />
    <Card className="p-0">
      <ul className="divide-y divide-[#f2f2f2]">
        {lista.map(i => <li key={i.id}><Link href={`/analytics/insights/${i.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-[#fafafa]" data-insight>
          <span className="rounded-md bg-[#f3f5f8] px-2 py-0.5 text-[11.5px] font-medium text-[#555]">{TIPOS[i.query.tipo]}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-medium text-[#111]">{i.name}</span><span className="block truncate text-[12px] text-[#888]">{resumo(i.query)}</span></span>
          <span className="shrink-0 text-[12px] text-[#999]">{haQuanto(i.updated_at)}</span>
        </Link></li>)}
        {!lista.length ? <li className="px-5 py-6 text-[13px] text-[#888]">Nada com “{busca}”.</li> : null}
      </ul>
    </Card>
  </div>
}

export function PaineisView() {
  const router = useRouter()
  return <Tela title="Painéis" subtitle="Junte insights numa tela para acompanhar.">{site => <ListaPaineis site={site.id} abrir={id => router.push(`/analytics/paineis/${id}`)} />}</Tela>
}

function ListaPaineis({ site, abrir }: { site: string; abrir: (id: string) => void }) {
  const l = useLista<Painel>('paineis', site)
  const [nome, setNome] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const criar = async () => { if (!nome.trim()) return; try { const p = await salvar<Painel>('paineis', { property_id: site, name: nome.trim() }); abrir(p.id) } catch (e) { setErro((e as Error).message) } }
  return <div className="grid gap-4">
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); void criar() }}>
      <input aria-label="Nome do novo painel" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do novo painel (ex.: Marketing)" className={`${campoCls} w-72`} />
      <button type="submit" className={primario} disabled={!nome.trim()}>Criar painel</button>
    </form>
    {erro || l.erro ? <Notice tone="error">{erro ?? l.erro}</Notice> : null}
    {!l.itens ? <div className="h-32 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : !l.itens.length ? <Vazio titulo="Nenhum painel ainda">Crie um painel e adicione insights a ele, aqui ou na tela do insight.</Vazio>
      : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{l.itens.map(p => <Link key={p.id} href={`/analytics/paineis/${p.id}`} className="rounded-2xl border border-[#ececec] bg-white p-5 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]" data-painel>
        <p className="text-[15px] font-semibold text-[#111]">{p.name}</p><p className="mt-1 text-[12.5px] text-[#888]">{p.items.length} insight{p.items.length === 1 ? '' : 's'}</p></Link>)}</div>}
  </div>
}

function Cartao({ insight, dias, site, largura, editar, onLargura, onTirar }: { insight: Insight; dias: number; site: string; largura: 1 | 2; editar: boolean; onLargura: () => void; onTirar: () => void }) {
  const c = noPeriodo(limpar(insight.query), dias)
  const { resultado, erro, carregando } = useConsulta(site, c, 0)
  return <section className={`min-w-0 rounded-2xl border border-[#ececec] bg-white p-4 ${largura === 2 ? 'md:col-span-2' : ''}`} data-cartao>
    <header className="mb-2 flex items-start justify-between gap-2">
      <Link href={`/analytics/insights/${insight.id}`} className="min-w-0"><h3 className="truncate text-[14px] font-semibold text-[#111] hover:underline">{insight.name}</h3><p className="truncate text-[12px] text-[#888]">{resumo(insight.query)}</p></Link>
      {editar ? <span className="flex shrink-0 gap-1"><button type="button" onClick={onLargura} className={secundario}>{largura === 2 ? 'Estreitar' : 'Alargar'}</button><button type="button" onClick={onTirar} className={perigo}>Tirar</button></span> : null}
    </header>
    <div className={carregando ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
      {erro ? <p className="text-[13px] text-[#a33]">{erro}</p> : !resultado ? <div className="h-52 animate-pulse rounded-xl bg-[#f5f5f5]" /> : <Resultado r={resultado} c={c} visual={insight.view} altura={220} compacto />}
    </div>
  </section>
}

export function PainelView({ id }: { id: string }) {
  const router = useRouter()
  const [p, setP] = useState<Painel | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [dias, setDias] = useState(30)
  const [editar, setEditar] = useState(false)
  const [add, setAdd] = useState('')
  useEffect(() => { api<Painel>(`dados/paineis/${id}`).then(setP).catch(e => setErro((e as Error).message)) }, [id])
  const insights = useLista<Insight>('insights', p?.property_id)
  const guardar = async (items: Painel['items']) => { if (!p) return; const antes = p; setP({ ...p, items }); try { await salvar('paineis', { items }, p.id) } catch (e) { setP(antes); setErro((e as Error).message) } }
  return <Tela title={p?.name ?? 'Painel'} semSeletor actions={() => p ? <>
    <Periodo dias={dias} onDias={setDias} />
    <button type="button" onClick={() => setEditar(!editar)} className={editar ? primario : secundario} aria-pressed={editar}>{editar ? 'Pronto' : 'Editar'}</button>
  </> : null}>{() => erro ? <Notice tone="error">{erro}</Notice> : !p ? <div className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : <div className="grid gap-4">
    {editar ? <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#ececec] bg-white p-3">
      <select aria-label="Insight para adicionar" value={add} onChange={e => setAdd(e.target.value)} className={campoCls}><option value="">Adicionar insight…</option>
        {insights.itens?.filter(i => !p.items.some(x => x.insight_id === i.id)).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
      <button type="button" disabled={!add} onClick={() => { void guardar([...p.items, { insight_id: add, largura: 1 }]); setAdd('') }} className={secundario}>Adicionar</button>
      <Link href="/analytics/insights/novo" className={secundario}>Novo insight</Link>
      <button type="button" className={`${perigo} ml-auto`} onClick={async () => { if (!confirm(`Apagar o painel "${p.name}"? Os insights continuam salvos.`)) return; try { await apagar('paineis', p.id); router.push('/analytics/paineis') } catch (e) { setErro((e as Error).message) } }}>Apagar painel</button>
    </div> : null}
    {!p.items.length ? <Vazio titulo="Painel vazio" acao={<button type="button" className={primario} onClick={() => setEditar(true)}>Adicionar insights</button>}>Adicione os insights que quer acompanhar juntos.</Vazio> : null}
    <div className="grid gap-4 md:grid-cols-2">
      {p.items.map((item, k) => { const i = insights.itens?.find(x => x.id === item.insight_id); return i
        ? <Cartao key={item.insight_id} insight={i} site={p.property_id} dias={dias} largura={item.largura} editar={editar}
          onLargura={() => void guardar(p.items.map((x, j) => j === k ? { ...x, largura: x.largura === 2 ? 1 : 2 } : x))} onTirar={() => void guardar(p.items.filter((_, j) => j !== k))} />
        : insights.itens ? null : <div key={item.insight_id} className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" /> })}
    </div>
  </div>}</Tela>
}
