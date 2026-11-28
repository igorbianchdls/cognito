'use client'

// Gravações de sessão: a lista (quem, quanto tempo, páginas, cliques e cliques de raiva) e o reprodutor (rrweb),
// com a linha do tempo dos eventos da sessão para pular direto para um clique ou página.
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { api, useLeitura } from './api'
import { duracao } from './graficos'
import type { Property } from './properties'
import { nomeEvento } from './seletores'
import { Card, campoCls, haQuanto, Notice, perigo, secundario, Tela, Vazio } from './ui'

type Gravacao = { sessao: string; pessoa: string; inicio: string; fim: string; duracao_s: number; url: string | null; paginas: number; cliques: number; raiva: number; aparelho: string | null; pais: string | null }
type Completa = { gravacao: { session_id: string; started_at: string }; eventos: { timestamp: number; type: number }[]; marcos: { quando: string; evento: string; pagina: string | null; texto: string | null }[] }
type Replayer = { play(t?: number): void; pause(t?: number): void; setConfig(c: Record<string, unknown>): void; getCurrentTime(): number; getMetaData(): { totalTime: number }; destroy?: () => void; on(e: string, cb: () => void): void }
declare global { interface Window { rrweb?: { Replayer: new (eventos: unknown[], o: Record<string, unknown>) => Replayer } } }

let carregando: Promise<void> | null = null
/** O reprodutor vem como arquivo próprio (só quem abre uma gravação baixa). */
function carregarRrweb() {
  if (window.rrweb) return Promise.resolve()
  carregando ??= new Promise<void>((ok, falha) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/analytics/rrweb.css'; document.head.appendChild(css)
    const s = document.createElement('script'); s.src = '/analytics/rrweb.js'; s.onload = () => ok(); s.onerror = () => { carregando = null; falha(new Error('Não foi possível carregar o reprodutor.')) }
    document.head.appendChild(s)
  })
  return carregando
}

export function GravacoesView() {
  return <Tela title="Gravações" subtitle="Veja a sessão como a pessoa viu: cliques, rolagem e onde travou.">{site => <Gravacoes key={site.id} site={site} />}</Tela>
}

function Gravacoes({ site }: { site: Property }) {
  const [sessao, setSessao] = useState<string | null>(() => typeof window === 'undefined' ? null : new URLSearchParams(location.search).get('sessao'))
  const [pagina, setPagina] = useState(0)
  const [so, setSo] = useState<'todas' | 'raiva'>('todas')
  const l = useLeitura<{ gravacoes: Gravacao[]; mais: boolean }>(`gravacoes?propriedade=${site.id}&pagina=${pagina}`)
  const abrir = (s: string | null) => { setSessao(s); try { history.replaceState(null, '', s ? `?sessao=${encodeURIComponent(s)}` : location.pathname) } catch { /* ok */ } }
  if (!site.replay_sample && l.dados && !l.dados.gravacoes.length) return <Vazio titulo="A gravação está desligada" acao={<Link href="/analytics/sites" className={secundario}>Ligar em Sites e apps</Link>}>
    Escolha a porcentagem de sessões a gravar. Senhas e campos de formulário nunca são gravados; o texto da página pode ser escondido também.</Vazio>
  if (sessao) return <Reprodutor site={site.id} sessao={sessao} voltar={() => { abrir(null); l.recarregar() }} />
  if (l.erro) return <Notice tone="error">{l.erro}</Notice>
  if (!l.dados) return <div className="h-64 animate-pulse rounded-2xl bg-[#f0f0f0]" />
  const lista = l.dados.gravacoes.filter(g => so === 'todas' || g.raiva > 0)
  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label="Mostrar" value={so} onChange={e => setSo(e.target.value as 'todas')} className={campoCls}><option value="todas">Todas</option><option value="raiva">Com cliques de raiva</option></select>
      <span className="text-[12.5px] text-[#888]">Gravando {site.replay_sample}% das sessões · guardadas por 30 dias</span>
    </div>
    {!lista.length ? <Vazio titulo="Nenhuma gravação ainda">As sessões gravadas aparecem aqui alguns segundos depois de começar.</Vazio> : <Card className="p-0"><ul className="divide-y divide-[#f2f2f2]">
      {lista.map(g => <li key={g.sessao}><button type="button" onClick={() => abrir(g.sessao)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#fafafa]" data-gravacao>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fdf0f0] text-[#c92a2a]" aria-hidden>▶</span>
        <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium text-[#111]">{g.url ? (() => { try { return new URL(g.url).pathname } catch { return g.url } })() : 'Sessão'}</span>
          <span className="block truncate text-[12px] text-[#888]">{g.pessoa.slice(0, 18)} · {[g.aparelho, g.pais].filter(Boolean).join(' · ')} · {g.paginas} pág. · {g.cliques} cliques</span></span>
        {g.raiva ? <span className="shrink-0 rounded bg-[#fdf0f0] px-1.5 py-0.5 text-[11px] font-medium text-[#c92a2a]">{g.raiva} raiva</span> : null}
        <span className="w-16 shrink-0 text-right text-[12.5px] tabular-nums text-[#444]">{duracao(g.duracao_s)}</span>
        <span className="w-20 shrink-0 text-right text-[12px] text-[#999]">{haQuanto(g.inicio)}</span>
      </button></li>)}
    </ul>
      <div className="flex justify-between border-t border-[#f3f3f3] px-4 py-2.5"><button type="button" disabled={!pagina} onClick={() => setPagina(pagina - 1)} className={secundario}>Anteriores</button><button type="button" disabled={!l.dados.mais} onClick={() => setPagina(pagina + 1)} className={secundario}>Próximas</button></div>
    </Card>}
  </div>
}

function Reprodutor({ site, sessao, voltar }: { site: string; sessao: string; voltar: () => void }) {
  const palco = useRef<HTMLDivElement>(null)
  const rep = useRef<Replayer | null>(null)
  const [dados, setDados] = useState<Completa | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tocando, setTocando] = useState(false)
  const [t, setT] = useState(0)
  const [vel, setVel] = useState(1)
  const [pular, setPular] = useState(true)
  useEffect(() => {
    let vivo = true
    Promise.all([api<Completa>(`gravacoes?propriedade=${site}&sessao=${encodeURIComponent(sessao)}`), carregarRrweb()]).then(([d]) => { if (vivo) setDados(d) }).catch(e => { if (vivo) setErro((e as Error).message) })
    return () => { vivo = false }
  }, [site, sessao])
  useEffect(() => {
    if (!dados || !palco.current || !window.rrweb || dados.eventos.length < 2) return
    palco.current.innerHTML = ''
    const r = new window.rrweb.Replayer(dados.eventos, { root: palco.current, skipInactive: true, showWarning: false, mouseTail: { strokeStyle: '#e8590c' }, UNSAFE_replayCanvas: false })
    rep.current = r
    r.on('finish', () => setTocando(false))
    const ajustar = () => { const el = palco.current; const w = el?.querySelector('.replayer-wrapper') as HTMLElement | null; const f = el?.querySelector('iframe'); if (!el || !w || !f) return
      // Cabe na largura e em até 70% da altura da tela, centralizado.
      const s = Math.min(1, el.clientWidth / (f.offsetWidth || 1), window.innerHeight * 0.7 / (f.offsetHeight || 1))
      w.style.transform = `scale(${s})`; w.style.transformOrigin = 'top left'; w.style.marginLeft = `${Math.max(0, (el.clientWidth - f.offsetWidth * s) / 2)}px`
      el.style.height = `${(f.offsetHeight || 600) * s}px` }
    const timer = setInterval(() => { setT(r.getCurrentTime()); ajustar() }, 250)
    r.play(); queueMicrotask(() => setTocando(true))
    return () => { clearInterval(timer); r.pause(); rep.current = null }
  }, [dados])
  useEffect(() => { rep.current?.setConfig({ speed: vel, skipInactive: pular }) }, [vel, pular])
  const total = dados && dados.eventos.length > 1 ? dados.eventos[dados.eventos.length - 1].timestamp - dados.eventos[0].timestamp : 0
  const ir = (ms: number) => { const r = rep.current; if (!r) return; const alvo = Math.max(0, Math.min(total, ms)); if (tocando) r.play(alvo); else r.pause(alvo); setT(alvo) }
  const inicio = dados?.eventos[0]?.timestamp ?? 0
  const mmss = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
  return <div className="grid gap-3">
    <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={voltar} className={secundario}>← Gravações</button>
      {dados ? <span className="text-[12.5px] text-[#888]">Sessão de {new Date(dados.gravacao.started_at).toLocaleString('pt-BR')}</span> : null}
      <button type="button" className={`${perigo} ml-auto`} onClick={async () => { if (!confirm('Apagar esta gravação?')) return; try { await api(`gravacoes?propriedade=${site}&sessao=${encodeURIComponent(sessao)}`, { method: 'DELETE' }); voltar() } catch (e) { setErro((e as Error).message) } }}>Apagar</button></div>
    {erro ? <Notice tone="error">{erro}</Notice> : dados && dados.eventos.length < 2 ? <Notice>A gravação ainda não tem o suficiente para reproduzir. Tente de novo em alguns segundos.</Notice> : null}
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="min-w-0 p-3">
        <div ref={palco} className="relative min-h-[320px] overflow-hidden rounded-lg bg-[#f6f7f9]" data-palco>{!dados && !erro ? <div className="h-[420px] animate-pulse" /> : null}</div>
        <div className="mt-3 grid gap-2">
          <div className="relative h-2 cursor-pointer rounded-full bg-[#eceef1]" role="slider" aria-label="Posição" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.round(t)} tabIndex={0}
            onKeyDown={e => { if (e.key === 'ArrowRight') ir(t + 5000); if (e.key === 'ArrowLeft') ir(t - 5000) }}
            onClick={e => { const b = e.currentTarget.getBoundingClientRect(); ir((e.clientX - b.left) / b.width * total) }}>
            <span className="absolute inset-y-0 left-0 rounded-full bg-[#2a78d6]" style={{ width: `${total ? t / total * 100 : 0}%` }} />
            {dados?.marcos.filter(m => m.evento === '$rageclick' || m.evento === '$pageview').map((m, i) => { const x = (new Date(m.quando).getTime() - inicio) / (total || 1) * 100; return x >= 0 && x <= 100
              ? <span key={i} className={`absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${m.evento === '$rageclick' ? 'bg-[#c92a2a]' : 'bg-white ring-2 ring-[#2a78d6]'}`} style={{ left: `${x}%` }} title={`${nomeEvento(m.evento)} ${m.pagina ?? ''}`} /> : null })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => { const r = rep.current; if (!r) return; if (tocando) { r.pause(); setTocando(false) } else { r.play(t >= total ? 0 : t); setTocando(true) } }} className={secundario} aria-label={tocando ? 'Pausar' : 'Tocar'}>{tocando ? '❚❚ Pausar' : '▶ Tocar'}</button>
            <span className="text-[12.5px] tabular-nums text-[#555]">{mmss(t)} / {mmss(total)}</span>
            <select aria-label="Velocidade" value={vel} onChange={e => setVel(Number(e.target.value))} className={campoCls}>{[0.5, 1, 2, 4, 8].map(v => <option key={v} value={v}>{v}×</option>)}</select>
            <label className="flex items-center gap-1.5 text-[12.5px] text-[#333]"><input type="checkbox" checked={pular} onChange={e => setPular(e.target.checked)} />Pular inatividade</label>
          </div>
        </div>
      </Card>
      <Card title="Na sessão" className="max-h-[70vh] overflow-auto">
        {!dados ? <p className="text-[13px] text-[#888]">Carregando…</p> : !dados.marcos.length ? <p className="text-[13px] text-[#888]">Sem eventos.</p> : <ol className="grid gap-0.5">{dados.marcos.map((m, i) => {
          const ms = new Date(m.quando).getTime() - inicio
          return <li key={i}><button type="button" onClick={() => ir(ms)} className="flex w-full items-baseline gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-[#f5f7fa]">
            <span className="w-10 shrink-0 tabular-nums text-[11.5px] text-[#999]">{mmss(Math.max(0, ms))}</span>
            <span className={`font-medium ${m.evento === '$rageclick' ? 'text-[#c92a2a]' : 'text-[#111]'}`}>{nomeEvento(m.evento)}</span>
            <span className="min-w-0 truncate text-[#777]">{m.texto || m.pagina}</span></button></li> })}</ol>}
      </Card>
    </div>
  </div>
}
