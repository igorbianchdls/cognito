'use client'

// O construtor de insights: escolhe o tipo, monta séries/passos/filtros/quebra e vê o resultado na hora; salva com
// nome e põe num painel. Também serve para abrir e alterar um insight salvo.
import { useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import type { Consulta, ConsultaCaminhos, ConsultaFunil, ConsultaRetencao, ConsultaTendencia, Resultado } from '../shared/consulta'
import { api, apagar, salvar, useConsulta, useLista } from './api'
import { Caminhos, GraficoFunil, GraficoTendencia, TabelaRetencao, type Visual } from './graficos'
import { diasDe, limpar, noPeriodo, nova, TIPOS, type Insight, type Painel } from './insights'
import { CampoSelect, EventoSelect, FiltrosEditor } from './seletores'
import { Card, campoCls, Notice, Periodo, perigo, primario, secundario, Tela } from './ui'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <div className="grid gap-2 border-t border-[#f2f2f2] pt-3 first:border-0 first:pt-0"><p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#888]">{titulo}</p>{children}</div>
}

function Tendencia({ site, c, set }: { site: string; c: ConsultaTendencia; set: (c: ConsultaTendencia) => void }) {
  return <>
    <Secao titulo="Séries">
      {c.series.map((s, i) => <div key={i} className="grid gap-1.5 rounded-xl border border-[#eee] p-2.5" data-serie>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="grid size-5 place-items-center rounded bg-[#eef4fc] text-[11px] font-semibold text-[#2a78d6]">{String.fromCharCode(65 + i)}</span>
          <EventoSelect site={site} value={s.evento} onChange={evento => set({ ...c, series: c.series.map((x, k) => k === i ? { ...x, evento } : x) })} />
          <select aria-label="Métrica" value={s.metrica} onChange={e => set({ ...c, series: c.series.map((x, k) => k === i ? { ...x, metrica: e.target.value as 'total' } : x) })} className={campoCls}>
            <option value="total">Total</option><option value="pessoas">Pessoas</option><option value="sessoes">Sessões</option></select>
          {c.series.length > 1 ? <button type="button" aria-label="Tirar série" onClick={() => set({ ...c, series: c.series.filter((_, k) => k !== i) })} className="ml-auto grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3]">×</button> : null}
        </div>
        <FiltrosEditor site={site} filtros={s.filtros} onChange={filtros => set({ ...c, series: c.series.map((x, k) => k === i ? { ...x, filtros } : x) })} />
      </div>)}
      {c.series.length < 5 ? <button type="button" onClick={() => set({ ...c, series: [...c.series, { evento: '$pageview', metrica: 'total', filtros: [] }] })} className={`${secundario} w-fit`}>+ Série</button> : null}
    </Secao>
    <Secao titulo="Agrupar">
      <div className="flex flex-wrap gap-1.5">
        <select aria-label="Intervalo" value={c.intervalo} onChange={e => set({ ...c, intervalo: e.target.value as 'dia' })} className={campoCls}>
          <option value="hora">Por hora</option><option value="dia">Por dia</option><option value="semana">Por semana</option><option value="mes">Por mês</option></select>
        <CampoSelect site={site} label="Quebra" value={c.quebra ?? ''} vazio="Sem quebra" onChange={q => set({ ...c, quebra: q || undefined })} />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[#333]"><input type="checkbox" checked={c.comparar} onChange={e => set({ ...c, comparar: e.target.checked })} />Comparar com o período anterior</label>
    </Secao>
  </>
}

function Funil({ site, c, set }: { site: string; c: ConsultaFunil; set: (c: ConsultaFunil) => void }) {
  const mover = (i: number, d: number) => { const p = [...c.passos]; [p[i], p[i + d]] = [p[i + d], p[i]]; set({ ...c, passos: p }) }
  return <>
    <Secao titulo="Passos">
      {c.passos.map((s, i) => <div key={i} className="grid gap-1.5 rounded-xl border border-[#eee] p-2.5" data-passo-editor>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="grid size-5 place-items-center rounded bg-[#eef4fc] text-[11px] font-semibold text-[#2a78d6]">{i + 1}</span>
          <EventoSelect site={site} todos={false} value={s.evento} onChange={evento => set({ ...c, passos: c.passos.map((x, k) => k === i ? { ...x, evento } : x) })} />
          <span className="ml-auto flex">
            <button type="button" aria-label="Subir passo" disabled={!i} onClick={() => mover(i, -1)} className="grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3] disabled:opacity-30">↑</button>
            <button type="button" aria-label="Descer passo" disabled={i === c.passos.length - 1} onClick={() => mover(i, 1)} className="grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3] disabled:opacity-30">↓</button>
            {c.passos.length > 2 ? <button type="button" aria-label="Tirar passo" onClick={() => set({ ...c, passos: c.passos.filter((_, k) => k !== i) })} className="grid size-7 place-items-center rounded-md text-[#999] hover:bg-[#f3f3f3]">×</button> : null}
          </span>
        </div>
        <FiltrosEditor site={site} filtros={s.filtros} onChange={filtros => set({ ...c, passos: c.passos.map((x, k) => k === i ? { ...x, filtros } : x) })} />
      </div>)}
      {c.passos.length < 10 ? <button type="button" onClick={() => set({ ...c, passos: [...c.passos, { evento: '$pageview', filtros: [] }] })} className={`${secundario} w-fit`}>+ Passo</button> : null}
    </Secao>
    <Secao titulo="Regras">
      <label className="flex flex-wrap items-center gap-2 text-[13px] text-[#333]">Completar em até
        <input type="number" min={1} max={90} value={c.janela_dias} onChange={e => set({ ...c, janela_dias: Math.min(90, Math.max(1, Number(e.target.value) || 1)) })} className={`${campoCls} w-16`} aria-label="Janela em dias" /> dias</label>
      <CampoSelect site={site} label="Quebra" value={c.quebra ?? ''} vazio="Sem quebra" onChange={q => set({ ...c, quebra: q || undefined })} />
    </Secao>
  </>
}

function Retencao({ site, c, set }: { site: string; c: ConsultaRetencao; set: (c: ConsultaRetencao) => void }) {
  return <>
    <Secao titulo="Quem começou com">
      <EventoSelect site={site} value={c.inicial.evento} onChange={evento => set({ ...c, inicial: { ...c.inicial, evento } })} label="Evento inicial" />
      <FiltrosEditor site={site} filtros={c.inicial.filtros} onChange={filtros => set({ ...c, inicial: { ...c.inicial, filtros } })} />
    </Secao>
    <Secao titulo="E voltou para">
      <EventoSelect site={site} value={c.retorno.evento} onChange={evento => set({ ...c, retorno: { ...c.retorno, evento } })} label="Evento de retorno" />
      <FiltrosEditor site={site} filtros={c.retorno.filtros} onChange={filtros => set({ ...c, retorno: { ...c.retorno, filtros } })} />
    </Secao>
    <Secao titulo="Períodos">
      <div className="flex flex-wrap gap-1.5">
        <select aria-label="Intervalo" value={c.intervalo} onChange={e => set({ ...c, intervalo: e.target.value as 'semana' })} className={campoCls}>
          <option value="dia">Dias</option><option value="semana">Semanas</option><option value="mes">Meses</option></select>
        <input type="number" min={2} max={12} value={c.periodos} onChange={e => set({ ...c, periodos: Math.min(12, Math.max(2, Number(e.target.value) || 2)) })} className={`${campoCls} w-16`} aria-label="Quantidade de períodos" />
      </div>
    </Secao>
  </>
}

function CaminhosEd({ c, set }: { c: ConsultaCaminhos; set: (c: ConsultaCaminhos) => void }) {
  return <Secao titulo="Caminhos">
    <div className="flex flex-wrap gap-1.5">
      <select aria-label="Direção" value={c.direcao} onChange={e => set({ ...c, direcao: e.target.value as 'depois' })} className={campoCls}><option value="depois">Para onde vão depois de</option><option value="antes">De onde vêm antes de</option></select>
      <input aria-label="Página" value={c.pagina ?? ''} onChange={e => set({ ...c, pagina: e.target.value })} placeholder="/precos (vazio = início da sessão)" className={`${campoCls} w-56`} />
    </div>
    <label className="flex items-center gap-2 text-[13px] text-[#333]">Passos
      <input type="number" min={2} max={6} value={c.passos} onChange={e => set({ ...c, passos: Math.min(6, Math.max(2, Number(e.target.value) || 2)) })} className={`${campoCls} w-16`} /></label>
  </Secao>
}

/** O resultado de qualquer consulta, no visual escolhido. */
export function Resultado({ r, c, visual, altura, compacto }: { r: Resultado; c: Consulta; visual: Visual; altura?: number; compacto?: boolean }) {
  if (r.tipo === 'tendencia') return <GraficoTendencia r={r} intervalo={(c as ConsultaTendencia).intervalo ?? 'dia'} visual={visual} altura={altura} />
  if (r.tipo === 'funil') return <GraficoFunil r={r} compacto={compacto} />
  if (r.tipo === 'retencao') return <TabelaRetencao r={r} intervalo={(c as ConsultaRetencao).intervalo} />
  return <Caminhos r={r} />
}

function Construtor({ site, inicial }: { site: string; inicial?: Insight }) {
  const router = useRouter()
  const [c, setC] = useState<Consulta>(() => inicial ? noPeriodo(inicial.query, diasDe(inicial.query)) : nova('tendencia'))
  const [dias, setDias] = useState(() => inicial ? diasDe(inicial.query) : 30)
  const [visual, setVisual] = useState<Visual>(inicial?.view ?? 'linha')
  const [nome, setNome] = useState(inicial?.name ?? '')
  const [msg, setMsg] = useState<{ t: string; erro?: boolean } | null>(null)
  const [painel, setPainel] = useState('')
  const paineis = useLista<Painel>('paineis', site)
  const { resultado, erro, carregando } = useConsulta(site, limpar(c))
  const mudarDias = (d: number) => { setDias(d); setC(x => noPeriodo(x, d)) }
  const trocarTipo = (tipo: Consulta['tipo']) => { if (tipo !== c.tipo) setC({ ...nova(tipo, dias), filtros: c.filtros }) }

  async function gravar() {
    if (!nome.trim()) { setMsg({ t: 'Dê um nome ao insight.', erro: true }); return null }
    try {
      const r = await salvar<Insight>('insights', { ...(inicial ? {} : { property_id: site }), name: nome.trim(), query: limpar(c), view: visual }, inicial?.id)
      setMsg({ t: 'Insight salvo.' })
      if (!inicial) router.replace(`/analytics/insights/${r.id}`)
      return r
    } catch (e) { setMsg({ t: (e as Error).message, erro: true }); return null }
  }
  async function porNoPainel() {
    const p = paineis.itens?.find(x => x.id === painel)
    if (!p) return
    const i = inicial ?? await gravar()
    if (!i) return
    if (p.items.some(x => x.insight_id === i.id)) { setMsg({ t: `Já está em "${p.name}".` }); return }
    try { await salvar('paineis', { items: [...p.items, { insight_id: i.id, largura: 1 }] }, p.id); await paineis.recarregar(); setMsg({ t: `Adicionado ao painel "${p.name}".` }) } catch (e) { setMsg({ t: (e as Error).message, erro: true }) }
  }

  return <div className="grid gap-4">
    <div className="flex flex-wrap items-center gap-2">
      <input aria-label="Nome do insight" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do insight" className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[18px] font-semibold text-[#111] hover:border-[#e2e2e2] focus:border-[#2a78d6] focus:bg-white focus:outline-none" />
      <button type="button" onClick={() => void gravar()} className={primario}>Salvar</button>
      {paineis.itens?.length ? <span className="flex gap-1">
        <select aria-label="Painel" value={painel} onChange={e => setPainel(e.target.value)} className={campoCls}><option value="">Pôr num painel…</option>{paineis.itens.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button type="button" disabled={!painel} onClick={() => void porNoPainel()} className={secundario}>Adicionar</button></span> : null}
      {inicial ? <button type="button" onClick={async () => { if (!confirm(`Apagar "${inicial.name}"?`)) return; try { await apagar('insights', inicial.id); router.push('/analytics/insights') } catch (e) { setMsg({ t: (e as Error).message, erro: true }) } }} className={perigo}>Apagar</button> : null}
    </div>
    {msg ? <p role={msg.erro ? 'alert' : 'status'} className={`text-[13px] ${msg.erro ? 'text-[#a33]' : 'text-[#2f7a3a]'}`}>{msg.t}</p> : null}
    <div role="tablist" aria-label="Tipo de insight" className="flex w-fit flex-wrap rounded-xl border border-[#e2e2e2] bg-white p-1">
      {Object.entries(TIPOS).map(([k, v]) => <button key={k} role="tab" aria-selected={c.tipo === k} type="button" onClick={() => trocarTipo(k as Consulta['tipo'])}
        className={`h-8 rounded-lg px-3.5 text-[13px] font-medium ${c.tipo === k ? 'bg-[#111] text-white' : 'text-[#555] hover:bg-[#f3f3f3]'}`}>{v}</button>)}
    </div>
    <div className="grid items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="grid gap-3">
        {c.tipo === 'tendencia' ? <Tendencia site={site} c={c} set={setC} /> : c.tipo === 'funil' ? <Funil site={site} c={c} set={setC} />
          : c.tipo === 'retencao' ? <Retencao site={site} c={c} set={setC} /> : <CaminhosEd c={c} set={setC} />}
        <Secao titulo="Filtros de tudo"><FiltrosEditor site={site} filtros={c.filtros} onChange={filtros => setC({ ...c, filtros } as Consulta)} /></Secao>
      </Card>
      <Card className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <Periodo dias={dias} onDias={mudarDias} />
          {c.tipo === 'tendencia' ? <select aria-label="Visual" value={visual} onChange={e => setVisual(e.target.value as Visual)} className={campoCls}>
            <option value="linha">Linha</option><option value="area">Área</option><option value="barras">Barras</option><option value="numero">Número</option><option value="tabela">Tabela</option></select> : null}
        </div>
        <div className={`transition-opacity ${carregando ? 'opacity-50' : ''}`} aria-busy={carregando} data-resultado>
          {erro ? <Notice tone="error">{erro}</Notice> : !resultado || resultado.tipo !== c.tipo ? <div className="h-64 animate-pulse rounded-xl bg-[#f5f5f5]" /> : <Resultado r={resultado} c={c} visual={visual} />}
        </div>
      </Card>
    </div>
  </div>
}

export function NovoInsightView() {
  return <Tela title="Novo insight" subtitle="Monte, veja o resultado na hora e salve.">{site => <Construtor key={site.id} site={site.id} />}</Tela>
}

export function InsightView({ id }: { id: string }) {
  const [i, setI] = useState<Insight | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => { api<Insight>(`dados/insights/${id}`).then(setI).catch(e => setErro((e as Error).message)) }, [id])
  return <Tela title="Insight" semSeletor>{() => erro ? <Notice tone="error">{erro}</Notice> : !i ? <div className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" /> : <Construtor site={i.property_id} inicial={i} />}</Tela>
}
