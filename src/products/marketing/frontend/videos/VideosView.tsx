'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Ban, Check, Download, FolderInput, Heart, LayoutGrid, Loader2, RotateCcw, Sparkles, Trash2, User, Video as VideoIcon, Wand2, X, ZoomIn, ZoomOut, Filter } from 'lucide-react'
import {
  emAndamento, ESTILOS_VIDEO, formatarMinutos, MODELOS_VIDEO, modeloVideo, FORMATOS_VIDEO,
  type FormatoVideo, type SituacaoVideo,
} from '@/products/marketing/shared/videoModels'
import { PromptBar, RASCUNHO_INICIAL, type Rascunho } from './PromptBar'
import { copyVideoToDrive, VIDEOS_FOLDER } from './toDrive'
import s from '@/products/editor/frontend/shell/ui.module.css'
import x from './videos.module.css'

type Video = {
  id: string; prompt: string; modelo: string; formato: FormatoVideo; duracao_s: number; estilo: string
  status: SituacaoVideo; erro: string | null; criado_em: string; concluido_em: string | null
  criado_por_mim: boolean; salvo: boolean; url: string | null; referencia_url: string | null
}
type Cota = { usado_segundos: number; limite_minutos: number }
type Aba = 'todos' | 'salvos' | 'meus'
type Filtros = { modelo?: string; formato?: string; situacao?: SituacaoVideo }

const ABAS: { id: Aba; nome: string; Icone: typeof Heart }[] = [
  { id: 'todos', nome: 'Todos', Icone: LayoutGrid }, { id: 'salvos', nome: 'Salvos', Icone: Heart }, { id: 'meus', nome: 'Meus', Icone: User },
]
const SITUACOES: { id: SituacaoVideo; nome: string }[] = [
  { id: 'pronto', nome: 'Prontos' }, { id: 'gerando', nome: 'Gerando' }, { id: 'erro', nome: 'Com erro' }, { id: 'cancelado', nome: 'Cancelados' },
]
/** Largura mínima das colunas da galeria em cada nível de zoom. */
const ZOOM = [150, 200, 260, 340]
const PROPORCAO: Record<FormatoVideo, string> = { '9:16': '9 / 16', '16:9': '16 / 9', '1:1': '1 / 1' }
const CONSULTA_MS = 3000

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init })
  const body = await response.json().catch(() => ({})) as T & { erro?: string }
  if (!response.ok) throw new Error(body.erro ?? `HTTP ${response.status}`)
  return body
}
const nomeArquivo = (v: Video) => `${v.prompt.slice(0, 40).replace(/[^\p{L}\p{N} ]/gu, '').trim() || 'video'} ${v.id.slice(0, 6)}.mp4`
const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Um menu simples que abre abaixo de um botão (filtro da galeria). */
function MenuFiltro({ filtros, setFiltros }: { filtros: Filtros; setFiltros: (f: Filtros) => void }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberto) return
    const fechar = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(false) }
    window.addEventListener('mousedown', fechar)
    return () => window.removeEventListener('mousedown', fechar)
  }, [aberto])
  const ativos = Object.values(filtros).filter(Boolean).length
  const item = (ativo: boolean, nome: string, onClick: () => void) =>
    <button key={nome} type="button" role="menuitemcheckbox" aria-checked={ativo} className={`${x.option} ${ativo ? x.optionOn : ''}`} onClick={onClick}>
      <span>{nome}</span>{ativo && <Check size={15} className={x.check} />}
    </button>
  const alternar = (campo: keyof Filtros, valor: string) => setFiltros({ ...filtros, [campo]: filtros[campo] === valor ? undefined : valor })
  return <div ref={ref} className={x.menuWrap}>
    <button type="button" className={`${x.chip} ${ativos ? x.chipOn : ''}`} aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
      <Filter size={15} />Filtro{ativos ? ` (${ativos})` : ''}
    </button>
    {aberto && <div className={`${x.menu} ${x.menuDown}`} role="menu">
      <div className={x.menuTitle}>Modelo</div>
      {MODELOS_VIDEO.map(m => item(filtros.modelo === m.id, m.nome, () => alternar('modelo', m.id)))}
      <div className={x.menuTitle}>Formato</div>
      {FORMATOS_VIDEO.map(f => item(filtros.formato === f.id, f.nome, () => alternar('formato', f.id)))}
      <div className={x.menuTitle}>Situação</div>
      {SITUACOES.map(st => item(filtros.situacao === st.id, st.nome, () => alternar('situacao', st.id)))}
      {ativos > 0 && <button type="button" className={x.option} onClick={() => setFiltros({})}><span>Limpar filtros</span></button>}
    </div>}
  </div>
}

function Cartao({ video, onAbrir, onSalvar, onRefazer }: { video: Video; onAbrir: () => void; onSalvar: () => void; onRefazer: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const modelo = modeloVideo(video.modelo)?.nome ?? video.modelo
  return <div className={x.card} style={{ aspectRatio: PROPORCAO[video.formato] }} role="button" tabIndex={0} aria-label={`Abrir vídeo: ${video.prompt}`}
    onClick={onAbrir} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir() } }}
    onMouseEnter={() => { void ref.current?.play().catch(() => undefined) }} onMouseLeave={() => { if (ref.current) { ref.current.pause(); ref.current.currentTime = 0 } }}>
    {video.status === 'pronto' && video.url && <video ref={ref} src={video.url} muted loop playsInline preload="metadata" />}
    {emAndamento(video.status) && <div className={x.pending}>
      <Loader2 size={22} className="animate-spin" /><b>Gerando…</b><small>{modelo} · {video.formato} · {video.duracao_s}s</small>
    </div>}
    {(video.status === 'erro' || video.status === 'cancelado') && <div className={x.failed}>
      {video.status === 'erro' ? <Ban size={22} /> : <X size={22} />}
      <b>{video.status === 'erro' ? 'Não foi possível gerar' : 'Cancelado'}</b>
      {video.erro && <p>{video.erro}</p>}
      <button type="button" className={x.chip} onClick={e => { e.stopPropagation(); onRefazer() }}><RotateCcw size={14} />Tentar de novo</button>
    </div>}
    {video.salvo && <Heart size={18} className={x.saved} fill="currentColor" aria-label="Salvo" />}
    {video.status === 'pronto' && <div className={x.cardOverlay}>
      <span className={x.cardPrompt}>{video.prompt}</span>
      <button type="button" className={x.cardIcon} aria-label={video.salvo ? 'Tirar dos salvos' : 'Salvar'} onClick={e => { e.stopPropagation(); onSalvar() }}>
        <Heart size={15} fill={video.salvo ? 'currentColor' : 'none'} />
      </button>
    </div>}
  </div>
}

function Detalhe({ video, ocupado, onFechar, onSalvar, onBaixar, onDrive, onVariacao, onCancelar, onExcluir }: {
  video: Video; ocupado: string | null; onFechar: () => void; onSalvar: () => void; onBaixar: () => void; onDrive: () => void
  onVariacao: () => void; onCancelar: () => void; onExcluir: () => void
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])
  const modelo = modeloVideo(video.modelo)?.nome ?? video.modelo
  const estilo = ESTILOS_VIDEO.find(e => e.id === video.estilo)?.nome
  return <div className={x.backdrop} onMouseDown={e => { if (e.target === e.currentTarget) onFechar() }}>
    <div className={x.detail} role="dialog" aria-modal="true" aria-label="Vídeo gerado">
      <div className={x.detailMedia}>
        {video.status === 'pronto' && video.url ? <video src={video.url} controls autoPlay loop playsInline />
          : <div className={x.pending} style={{ position: 'static', minHeight: 320, width: '100%' }}>
            {emAndamento(video.status) ? <><Loader2 size={22} className="animate-spin" /><b>Gerando…</b></> : <b>{video.status === 'erro' ? 'Não foi possível gerar' : 'Cancelado'}</b>}
          </div>}
      </div>
      <aside className={x.detailSide}>
        <header><h2>Vídeo gerado</h2><button type="button" className={x.close} aria-label="Fechar" onClick={onFechar}><X size={18} /></button></header>
        <p className={x.prompt}>{video.prompt}</p>
        <div className={x.meta}>
          <span>{modelo}</span><span>{video.formato}</span><span>{video.duracao_s}s</span>{estilo && video.estilo !== 'nenhum' && <span>{estilo}</span>}
          <span>{dataHora(video.criado_em)}</span>
        </div>
        {video.referencia_url && <img src={video.referencia_url} alt="Imagem de referência" style={{ width: 96, borderRadius: 10 }} />}
        {video.erro && <p className={x.error}>{video.erro}</p>}
        <div className={x.actions}>
          {video.status === 'pronto' && <>
            <button type="button" className={x.action} onClick={onSalvar}><Heart size={16} fill={video.salvo ? 'currentColor' : 'none'} />{video.salvo ? 'Tirar dos salvos' : 'Salvar'}</button>
            <button type="button" className={x.action} disabled={ocupado === 'baixar'} onClick={onBaixar}>{ocupado === 'baixar' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}Baixar</button>
            <button type="button" className={x.action} disabled={ocupado === 'drive'} onClick={onDrive}>{ocupado === 'drive' ? <Loader2 size={16} className="animate-spin" /> : <FolderInput size={16} />}Enviar para o Drive</button>
          </>}
          <button type="button" className={x.action} onClick={onVariacao}><Wand2 size={16} />Gerar variação</button>
          {emAndamento(video.status) && <button type="button" className={x.action} disabled={ocupado === 'cancelar'} onClick={onCancelar}><Ban size={16} />Cancelar geração</button>}
          <button type="button" className={`${x.action} ${x.danger}`} disabled={ocupado === 'excluir'} onClick={onExcluir}><Trash2 size={16} />Excluir</button>
        </div>
      </aside>
    </div>
  </div>
}

/** Marketing → Vídeos: galeria dos vídeos gerados por IA da empresa e a caixa de prompt para gerar novos. */
export function VideosView() {
  const [aba, setAba] = useState<Aba>('todos')
  const [filtros, setFiltros] = useState<Filtros>({})
  const [zoom, setZoom] = useState(1)
  const [videos, setVideos] = useState<Video[]>([])
  const [total, setTotal] = useState(0)
  const [cota, setCota] = useState<Cota | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [rascunho, setRascunho] = useState<Rascunho>(RASCUNHO_INICIAL)
  const [enviando, setEnviando] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t) }, [toast])

  const consulta = useCallback((inicio: number) => {
    const q = new URLSearchParams({ aba, inicio: String(inicio) })
    for (const [k, v] of Object.entries(filtros)) if (v) q.set(k, v)
    return api<{ videos: Video[]; total: number; cota: Cota }>(`/api/marketing/videos?${q}`)
  }, [aba, filtros])

  useEffect(() => {
    let ativo = true
    consulta(0)
      .then(r => { if (ativo) { setVideos(r.videos); setTotal(r.total); setCota(r.cota); setErro('') } })
      .catch(e => { if (ativo) setErro((e as Error).message) })
      .finally(() => { if (ativo) setCarregando(false) })
    return () => { ativo = false }
  }, [consulta])

  const trocar = (v: Video) => setVideos(lista => lista.map(item => item.id === v.id ? v : item))

  // Enquanto houver vídeo gerando, consulta cada um a cada 3 s até ficar pronto (ou dar erro).
  const pendentes = videos.filter(v => emAndamento(v.status)).map(v => v.id).join(',')
  useEffect(() => {
    if (!pendentes) return
    const timer = setInterval(() => {
      for (const id of pendentes.split(',')) {
        api<{ video: Video }>(`/api/marketing/videos/${id}`).then(r => {
          trocar(r.video)
          if (r.video.status === 'pronto') setToast('Seu vídeo ficou pronto.')
        }).catch(() => undefined)
      }
    }, CONSULTA_MS)
    return () => clearInterval(timer)
  }, [pendentes])

  const atualizarCota = () => consulta(0).then(r => setCota(r.cota)).catch(() => undefined)

  const gerar = async (pedido: Rascunho) => {
    setEnviando(true)
    try {
      const { video } = await api<{ video: Video }>('/api/marketing/videos', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: pedido.prompt, modelo: pedido.modelo, formato: pedido.formato, duracao: pedido.duracao, estilo: pedido.estilo, referenciaPath: pedido.referencia?.path ?? null }) })
      setVideos(lista => [video, ...lista]); setTotal(t => t + 1)
      setRascunho({ ...pedido, prompt: '', referencia: null })
      void atualizarCota()
    } catch (e) { setToast((e as Error).message) } finally { setEnviando(false) }
  }

  const acao = async (video: Video, nome: 'salvar' | 'tirar_dos_salvos' | 'cancelar') => {
    setOcupado(nome === 'cancelar' ? 'cancelar' : null)
    try {
      const { video: novo } = await api<{ video: Video }>(`/api/marketing/videos/${video.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ acao: nome }) })
      if (aba === 'salvos' && nome === 'tirar_dos_salvos') setVideos(lista => lista.filter(v => v.id !== video.id))
      else trocar(novo)
      if (nome === 'cancelar') void atualizarCota()
    } catch (e) { setToast((e as Error).message) } finally { setOcupado(null) }
  }
  const salvar = (v: Video) => acao(v, v.salvo ? 'tirar_dos_salvos' : 'salvar')

  const excluir = async (video: Video) => {
    if (!window.confirm('Excluir este vídeo da galeria? O arquivo será apagado.')) return
    setOcupado('excluir')
    try {
      await api(`/api/marketing/videos/${video.id}`, { method: 'DELETE' })
      setVideos(lista => lista.filter(v => v.id !== video.id)); setTotal(t => t - 1); setAberto(null); setToast('Vídeo excluído.')
    } catch (e) { setToast((e as Error).message) } finally { setOcupado(null) }
  }

  // As URLs assinadas valem uma hora: antes de baixar ou copiar, pede o vídeo de novo para ter uma URL nova.
  const urlNova = async (video: Video) => (await api<{ video: Video }>(`/api/marketing/videos/${video.id}`)).video.url
  const baixar = async (video: Video) => {
    setOcupado('baixar')
    try {
      const url = await urlNova(video)
      if (!url) throw new Error('Vídeo indisponível.')
      const blob = await (await fetch(url)).blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob); link.download = nomeArquivo(video); link.click()
      setTimeout(() => URL.revokeObjectURL(link.href), 5000)
    } catch (e) { setToast((e as Error).message) } finally { setOcupado(null) }
  }
  const paraDrive = async (video: Video) => {
    setOcupado('drive')
    try {
      const url = await urlNova(video)
      if (!url) throw new Error('Vídeo indisponível.')
      await copyVideoToDrive(url, nomeArquivo(video))
      setToast(`Enviado ao Drive, na pasta “${VIDEOS_FOLDER}”.`)
    } catch (e) { console.error('Vídeos: Drive', e); setToast('Não foi possível enviar ao Drive.') } finally { setOcupado(null) }
  }
  const variacao = (video: Video) => {
    const formato = video.formato, modelo = modeloVideo(video.modelo) ? video.modelo : RASCUNHO_INICIAL.modelo
    setRascunho({ prompt: video.prompt, modelo, formato, duracao: video.duracao_s, estilo: video.estilo, referencia: null })
    setAberto(null)
  }
  const refazer = (video: Video) => void gerar({ prompt: video.prompt, modelo: video.modelo, formato: video.formato, duracao: video.duracao_s, estilo: video.estilo, referencia: null })

  const carregarMais = async () => {
    try { const r = await consulta(videos.length); setVideos(lista => [...lista, ...r.videos.filter(v => !lista.some(l => l.id === v.id))]); setTotal(r.total) }
    catch (e) { setToast((e as Error).message) }
  }

  const restante = cota ? cota.limite_minutos * 60 - cota.usado_segundos : null
  const videoAberto = videos.find(v => v.id === aberto) ?? null
  const filtrado = Object.values(filtros).some(Boolean) || aba !== 'todos'

  return <section className={`${s.content} ${x.page}`}>
    <div className={x.head}>
      <h1>Vídeos</h1>
      {cota && restante != null && <span className={`${x.quota} ${restante <= 0 ? x.quotaLow : ''}`} title={`Cota do mês: ${cota.limite_minutos} min`}>
        <span className={x.quotaRing} style={{ background: `conic-gradient(var(--ink) ${Math.min(100, cota.usado_segundos / (cota.limite_minutos * 60) * 100)}%, var(--line) 0)` }} />
        {formatarMinutos(restante)} restantes
      </span>}
    </div>

    <div className={x.toolbar}>
      <div className={x.segment} role="tablist" aria-label="Quais vídeos">
        {ABAS.map(({ id, nome, Icone }) => <button key={id} type="button" role="tab" aria-selected={aba === id} className={aba === id ? x.on : ''}
          onClick={() => { setCarregando(true); setAba(id) }}><Icone size={15} />{nome}</button>)}
      </div>
      <div className={x.zoom}>
        <button type="button" aria-label="Diminuir miniaturas" disabled={zoom === 0} onClick={() => setZoom(z => Math.max(0, z - 1))}><ZoomOut size={16} /></button>
        <button type="button" aria-label="Aumentar miniaturas" disabled={zoom === ZOOM.length - 1} onClick={() => setZoom(z => Math.min(ZOOM.length - 1, z + 1))}><ZoomIn size={16} /></button>
      </div>
      <MenuFiltro filtros={filtros} setFiltros={f => { setCarregando(true); setFiltros(f) }} />
    </div>

    {erro && <p className={x.error} role="alert">{erro}</p>}

    {carregando && !videos.length ? <div className={x.empty}><Loader2 size={22} className="animate-spin" /></div>
      : !videos.length ? <div className={x.empty}>
        <span className={x.emptyIcon}>{filtrado ? <VideoIcon size={20} /> : <Sparkles size={20} />}</span>
        <b>{filtrado ? 'Nenhum vídeo neste filtro' : 'Nenhum vídeo ainda'}</b>
        {!filtrado && <span>Descreva uma cena na caixa abaixo para gerar o primeiro vídeo.</span>}
      </div>
      : <div className={x.grid} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${ZOOM[zoom]}px, 1fr))` }}>
        {videos.map(v => <Cartao key={v.id} video={v} onAbrir={() => setAberto(v.id)} onSalvar={() => void salvar(v)} onRefazer={() => refazer(v)} />)}
      </div>}
    {videos.length < total && <div className={x.more}><button type="button" className={x.chip} onClick={() => void carregarMais()}>Carregar mais</button></div>}

    <PromptBar rascunho={rascunho} setRascunho={setRascunho} enviando={enviando} onEnviar={() => void gerar(rascunho)} />

    {videoAberto && <Detalhe video={videoAberto} ocupado={ocupado} onFechar={() => setAberto(null)} onSalvar={() => void salvar(videoAberto)}
      onBaixar={() => void baixar(videoAberto)} onDrive={() => void paraDrive(videoAberto)} onVariacao={() => variacao(videoAberto)}
      onCancelar={() => void acao(videoAberto, 'cancelar')} onExcluir={() => void excluir(videoAberto)} />}

    {toast && <div className={s.toast} role="status">{toast}</div>}
  </section>
}
