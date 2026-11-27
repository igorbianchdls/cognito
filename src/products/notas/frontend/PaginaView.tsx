'use client'

import { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react'
import { useUser } from '@clerk/nextjs'
import * as Y from 'yjs'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronsRight, Columns3, Copy, Download, Globe, History, ImageIcon, LayoutTemplate, List, ListChecks, Link2, Lock, MessageSquare, Printer, Maximize2, MoreHorizontal, MoveVertical, Smile, Sparkles, Star, Table2, UserPlus,
  Trash2, Undo2, Unlock,
} from 'lucide-react'
import { caminho, textoDoConteudo, tituloExibido } from '@/products/notas/shared/arvore'
import { computar, type TipoVisao } from '@/products/notas/shared/bases'
import { gerarCsv } from '@/products/notas/shared/csv'
import { deBase64, ORIGEM_SERVIDOR, paraBase64 } from '@/products/notas/shared/colaboracao'
import { type BaseCompleta } from './api'
import { Comentarios, type Comentario } from './Comentarios'
import { Compartilhar } from './Compartilhar'
import { IconePagina } from './IconePagina'
import { useColaboracao, type Colaboracao, type Presente } from './tempoReal'
import type { ControleEditor } from './Editor'
import { editadoHa, ErroNotas, notasApi, type Pagina } from './api'
import { BaseView } from './base/BaseView'
import { PropriedadesItem } from './base/PropriedadesItem'
import { avisarItem } from './base/useBase'
import { MODELOS_PAGINA, conteudoDoModelo, type ModeloPagina } from '@/products/notas/shared/modelos'
import { Historico } from './Historico'
import { ArtefatoView } from './ArtefatoView'
import { estiloCapa } from './catalogo'
import { Chave, ItemMenu, Menu } from './Menu'
import { EVENTO_RENOMEAR, useNotas } from './NotasProvider'
import { useTituloDaAba } from './local'
import { SeletorCapa, SeletorIcone } from './Seletores'
import x from './notas.module.css'

// O editor usa o navegador (seleção, arrastar): só carrega no cliente.
const Editor = dynamic(() => import('./Editor'), { ssr: false, loading: () => <div style={{ height: 120 }} /> })

const ESPERA_SALVAR_MS = 700
type Estado = 'salvo' | 'salvando' | 'pendente' | 'erro'

/** Esqueleto enquanto a página carrega (em vez de uma tela vazia). */
function Esqueleto() {
  return <div className={x.doc}><div className={x.skeleton} aria-label="Carregando"><span /><span /><span style={{ width: '82%' }} /><span style={{ width: '64%' }} /></div></div>
}

/** Baixa um arquivo gerado na tela. */
function baixar(nome: string, conteudo: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a'); a.href = url; a.download = nome; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const nomeDeArquivo = (titulo: string) => (titulo.trim() || 'Sem título').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)

/**
 * O editor em edição simultânea: cria o documento colaborativo desta geração (com o estado salvo no servidor) e liga
 * ao canal da página. Entrega o documento e a presença para a página salvar e mostrar quem está junto.
 */
function EditorColaborativo({ pagina, aoConectar, aoPresentes, ...props }: Omit<ComponentProps<typeof Editor>, 'colaboracao'> & {
  pagina: Pagina; aoConectar: (c: Colaboracao | null) => void; aoPresentes: (p: Presente[]) => void
}) {
  const { user } = useUser()
  const pessoa = { id: user?.id ?? 'eu', nome: user?.fullName || user?.firstName || 'Alguém' }
  const c = useColaboracao(pagina.id, pagina.geracao_yjs, pagina.estado_yjs, pessoa, pagina.canal)
  useEffect(() => { aoConectar(c); return () => aoConectar(null) }, [c.sincronizador, aoConectar]) // eslint-disable-line react-hooks/exhaustive-deps -- reconecta quando o canal fica pronto
  useEffect(() => { aoPresentes(c.presentes) }, [c.presentes, aoPresentes])
  const [usuario] = useState(() => ({ name: pessoa.nome, color: '#2383e2' }))
  const [semear] = useState(() => !pagina.estado_yjs)
  return <Editor {...props} colaboracao={{ fragment: c.fragment, awareness: c.awareness, usuario, semear }} />
}

/**
 * Uma página: topo (caminho, editado, favoritar, ⋯), capa, ícone, título e o editor em blocos, salvando sozinha.
 * Se a página é uma base de dados, mostra a base no lugar do editor; se é item de uma base, mostra as propriedades.
 * `lateral`: aberta ao lado de uma base (topo com fechar e abrir como página).
 */
export function PaginaView({ id, lateral, onFechar }: { id: string; lateral?: boolean; onFechar?: () => void }) {
  const router = useRouter()
  const { arvore, ajustarLocal, recarregar, favoritar, duplicar, arquivar, avisar, recolhida, setRecolhida, semBarraLateral } = useNotas()
  const [pagina, setPagina] = useState<Pagina | null>(null)
  const [erro, setErro] = useState('')
  const [estado, setEstado] = useState<Estado>('salvo')
  const [conflito, setConflito] = useState(false)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const [seletorIcone, setSeletorIcone] = useState<HTMLElement | null>(null)
  const [seletorCapa, setSeletorCapa] = useState<HTMLElement | null>(null)
  const [reposicionando, setReposicionando] = useState<number | null>(null)
  const [vazia, setVazia] = useState(false)
  const [historico, setHistorico] = useState(false)
  const [menuModelos, setMenuModelos] = useState<HTMLElement | null>(null)
  const pendente = useRef<Partial<Pagina>>({})
  const versao = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const salvarDeNovo = useRef<() => Promise<void>>(async () => {})
  const titulo = useRef<HTMLTextAreaElement>(null)
  const arrastoCapa = useRef<{ y: number; inicio: number } | null>(null)
  const focarEditor = useRef(false)
  const colab = useRef<Colaboracao | null>(null)
  const geracao = useRef(0)
  const controle = useRef<ControleEditor | null>(null)
  const [presentes, setPresentes] = useState<Presente[]>([])
  const [comentarios, setComentarios] = useState<{ rascunho: { bloco_id: string; trecho: string } | null } | null>(null)
  const [discussoes, setDiscussoes] = useState<Comentario[]>([])
  const [compartilhar, setCompartilhar] = useState<HTMLElement | null>(null)
  const [sincronizador, setSincronizador] = useState<Colaboracao['sincronizador']>(null)
  // Ao desligar, o documento continua guardado: a última gravação (ao sair da página ou fechar a aba) ainda o envia.
  const aoConectar = useCallback((c: Colaboracao | null) => { if (c) colab.current = c; setSincronizador(c?.sincronizador ?? null) }, [])
  const { user } = useUser()
  useTituloDaAba(!lateral && pagina ? `${pagina.icone ? `${pagina.icone} ` : ''}${tituloExibido(pagina.titulo)} · Notas` : null)

  const aplicar = useCallback((nova: Pagina) => {
    versao.current = nova.versao; geracao.current = nova.geracao_yjs; pendente.current = {}
    setPagina(nova); setConflito(false); setErro(''); setEstado('salvo')
    setVazia(!textoDoConteudo(nova.conteudo).trim() && !(nova.conteudo as unknown[]).some(b => (b as { type?: string }).type !== 'paragraph'))
  }, [])
  /** Lê a página de novo (depois de um conflito, de restaurar…). */
  const carregar = useCallback(async () => {
    try { aplicar(await notasApi<Pagina>(`/paginas/${id}`)) } catch (e) { setErro((e as Error).message) }
  }, [id, aplicar])
  useEffect(() => {
    let ativo = true
    notasApi<Pagina>(`/paginas/${id}`).then(nova => { if (ativo) aplicar(nova) }).catch(e => { if (ativo) setErro((e as Error).message) })
    return () => { ativo = false }
  }, [id, aplicar])

  /** Grava o que está pendente (um pedido por vez; o que chegar no meio vai no próximo). */
  const ehColaborativa = useRef(false)
  const salvar = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const campos = pendente.current
    // Base de dados não tem texto: um conteúdo que chegue atrasado do editor (logo depois de virar base) é descartado.
    if (!ehColaborativa.current && pagina?.tipo === 'base') delete campos.conteudo
    if (!Object.keys(campos).length || conflito) return
    pendente.current = {}
    setEstado('salvando')
    try {
      // Edição simultânea: manda o documento colaborativo (o servidor funde) em vez da versão.
      const c = ehColaborativa.current ? colab.current : null
      const json = c ? { ...campos, estado_yjs: paraBase64(Y.encodeStateAsUpdate(c.doc)), geracao_yjs: geracao.current } : { versao: versao.current, ...campos }
      const salva = await notasApi<Pagina>(`/paginas/${id}`, { method: 'PATCH', json })
      if (c && salva.estado_yjs) Y.applyUpdate(c.doc, deBase64(salva.estado_yjs), ORIGEM_SERVIDOR)
      versao.current = salva.versao
      setPagina(atual => atual && { ...atual, versao: salva.versao, updated_at: salva.updated_at, updated_by: salva.updated_by })
      setEstado(Object.keys(pendente.current).length ? 'pendente' : 'salvo')
      if (Object.keys(pendente.current).length) void salvarDeNovo.current()
      if ('titulo' in campos || 'icone' in campos) {
        void recarregar()
        if (salva.base_id) avisarItem({ id, base_id: salva.base_id, titulo: salva.titulo, icone: salva.icone })
      }
    } catch (e) {
      if (e instanceof ErroNotas && e.status === 409 && e.atual) { setConflito(true); setEstado('erro'); return }
      pendente.current = { ...campos, ...pendente.current }
      setEstado('erro'); avisar((e as Error).message)
    }
  }, [id, conflito, recarregar, avisar, pagina?.tipo])
  useEffect(() => { salvarDeNovo.current = salvar }, [salvar])

  const mudar = useCallback((campos: Partial<Pagina>, imediato = false) => {
    setPagina(atual => atual && { ...atual, ...campos })
    pendente.current = { ...pendente.current, ...campos }
    if ('titulo' in campos || 'icone' in campos) ajustarLocal(id, { ...(campos.titulo !== undefined ? { titulo: campos.titulo } : {}), ...(campos.icone !== undefined ? { icone: campos.icone } : {}) })
    const { conteudo: _conteudo, ...meta } = campos
    if (Object.keys(meta).length) colab.current?.sincronizador?.enviarMeta(meta)
    setEstado('pendente')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void salvar(), imediato ? 0 : ESPERA_SALVAR_MS)
  }, [id, ajustarLocal, salvar])

  // Página de texto edita em conjunto; base de dados não (ela tem o próprio fluxo).
  useEffect(() => { ehColaborativa.current = pagina?.tipo === 'pagina' }, [pagina?.tipo])

  // Título, ícone, capa… mudados por quem está junto aparecem aqui na hora.
  useEffect(() => {
    if (!sincronizador) return
    return sincronizador.ouvirMeta(meta => {
      setPagina(atual => atual && { ...atual, ...meta })
      if ('titulo' in meta || 'icone' in meta) ajustarLocal(id, meta as Partial<Pagina>)
    })
  }, [sincronizador, id, ajustarLocal])

  // Fechar a aba: grava o que faltou com keepalive (o navegador termina o pedido mesmo saindo da página).
  // Sair da página dentro do Otto: grava normalmente.
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      const campos = pendente.current
      if (!Object.keys(campos).length || conflito) return
      const c = ehColaborativa.current ? colab.current : null
      const corpo = JSON.stringify(c ? { ...campos, estado_yjs: paraBase64(Y.encodeStateAsUpdate(c.doc)), geracao_yjs: geracao.current } : { versao: versao.current, ...campos })
      if (corpo.length < 60_000) {
        void fetch(`/api/notas/paginas/${id}`, { method: 'PATCH', keepalive: true, headers: { 'content-type': 'application/json' }, body: corpo }).catch(() => undefined)
        pendente.current = {}
      } else { void salvar(); e.preventDefault() }
    }
    window.addEventListener('beforeunload', antesDeSair)
    return () => { window.removeEventListener('beforeunload', antesDeSair); void salvar() }
  }, [id, conflito, salvar])

  // Renomear pela barra lateral enquanto a página está aberta: entra na fila de salvamento dela.
  useEffect(() => {
    const ouvir = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; titulo: string; tratado: boolean }>).detail
      if (d.id !== id || !pagina?.pode_editar) return
      d.tratado = true
      mudar({ titulo: d.titulo }, true)
    }
    window.addEventListener(EVENTO_RENOMEAR, ouvir)
    return () => window.removeEventListener(EVENTO_RENOMEAR, ouvir)
  }, [id, mudar, pagina?.pode_editar])

  // O título cresce com o texto.
  useEffect(() => {
    const t = titulo.current
    if (t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px` }
  }, [pagina])

  // Reposicionar a capa: arrastar para cima/baixo muda a posição vertical (0–100%).
  useEffect(() => {
    if (reposicionando === null) return
    const mover = (e: MouseEvent) => {
      const a = arrastoCapa.current; if (!a) return
      setReposicionando(Math.round(Math.max(0, Math.min(100, a.inicio - (e.clientY - a.y) / 2))))
    }
    const soltar = () => { arrastoCapa.current = null }
    window.addEventListener('mousemove', mover); window.addEventListener('mouseup', soltar)
    return () => { window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar) }
  }, [reposicionando])

  const criarSubpagina = useCallback(async (tituloNovo?: string) => {
    try {
      const nova = await notasApi<Pagina>('/paginas', { method: 'POST', json: { parent_id: id, ...(tituloNovo ? { titulo: tituloNovo } : {}) } })
      await recarregar()
      return { id: nova.id, titulo: nova.titulo, icone: nova.icone }
    } catch (e) { avisar((e as Error).message); return null }
  }, [id, recarregar, avisar])
  const criarBaseDentro = useCallback(async (modelo: 'vazia' | 'tarefas', visao: TipoVisao) => {
    try {
      const nova = await notasApi<{ base: Pagina }>('/bases', { method: 'POST', json: { parent_id: id, modelo, visao } })
      await recarregar()
      return { id: nova.base.id, titulo: nova.base.titulo, icone: nova.base.icone }
    } catch (e) { avisar((e as Error).message); return null }
  }, [id, recarregar, avisar])

  /** Página vazia → um modelo pronto (título se estiver vazio, ícone e conteúdo). O editor recomeça com o conteúdo novo. */
  const aplicarModelo = async (modelo: ModeloPagina) => {
    if (!pagina) return
    setMenuModelos(null)
    await salvar()
    try {
      // A versão do servidor muda com as gravações do editor em conjunto: lê a atual para não dar conflito.
      const agora = await notasApi<Pagina>(`/paginas/${id}`)
      await notasApi(`/paginas/${id}`, { method: 'PATCH', json: { versao: agora.versao, conteudo: conteudoDoModelo(modelo),
        ...(pagina.titulo ? {} : { titulo: modelo.titulo }), ...(pagina.icone ? {} : { icone: modelo.icone }) } })
      await Promise.all([carregar(), recarregar()])
    } catch (e) { avisar((e as Error).message) }
  }

  /** Página vazia → base ("Comece com: Tabela, Quadro, Lista, Tarefas"). */
  const virarBase = async (modelo: 'vazia' | 'tarefas', visao: TipoVisao) => {
    await salvar()
    // O que o editor ainda ia gravar perde o sentido: a página vira base (sem texto).
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    pendente.current = {}
    try { await notasApi('/bases', { method: 'POST', json: { converter: id, modelo, visao } }); await Promise.all([carregar(), recarregar()]) } catch (e) { avisar((e as Error).message) }
  }

  if (erro) return <div className={x.main}><div className={x.home}><h1>Não foi possível abrir</h1><p className={x.muted}>{erro}</p>
    {lateral && <button type="button" className={x.bannerBtn} onClick={onFechar}>Fechar</button>}</div></div>
  if (!pagina) return <div className={x.main}><Esqueleto /></div>

  const trilha = arvore ? caminho(arvore.paginas, id) : []
  const editavel = pagina.pode_editar && !pagina.bloqueada && !pagina.arquivada_em && !conflito
  const ehBase = pagina.tipo === 'base'
  const ehArtefato = pagina.tipo === 'artefato'
  const classes = [x.doc, pagina.largura_total || (ehBase && !lateral) ? x.docWide : '', pagina.capa ? x.withCover : '',
    pagina.fonte === 'serifa' ? x.serif : pagina.fonte === 'mono' ? x.mono : '', pagina.texto_pequeno ? x.small : ''].join(' ')

  const exportar = async (formato: 'md' | 'html' | 'csv') => {
    setMenu(null)
    const nome = nomeDeArquivo(pagina.titulo)
    if (formato === 'csv') {
      try {
        const d = await notasApi<BaseCompleta>(`/bases/${id}`)
        const itens = computar(d.itens.filter(i => !i.e_modelo), d.base.esquema, d.ligadas)
        baixar(`${nome}.csv`, gerarCsv(itens, d.base.esquema, d.base.visoes[0]?.visiveis ?? d.base.esquema.map(p => p.id)), 'text/csv;charset=utf-8')
      } catch (e) { avisar((e as Error).message) }
      return
    }
    const ctrl = controle.current
    if (!ctrl) return
    if (formato === 'md') baixar(`${nome}.md`, `# ${pagina.titulo || 'Sem título'}\n\n${ctrl.markdown()}`, 'text/markdown;charset=utf-8')
    else baixar(`${nome}.html`, `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${nome}</title><body><h1>${nome}</h1>${ctrl.html()}</body></html>`, 'text/html;charset=utf-8')
  }
  const abertas = discussoes.filter(c => !c.discussao_id && !c.resolvido)

  const restaurar = async () => {
    try { await notasApi(`/paginas/${id}/restaurar`, { method: 'POST' }); await Promise.all([carregar(), recarregar()]) } catch (e) { avisar((e as Error).message) }
  }
  const apagar = async () => {
    if (!window.confirm('Apagar de vez esta página e as subpáginas? Não dá para desfazer.')) return
    try { await notasApi(`/paginas/${id}?definitivo=1`, { method: 'DELETE' }); if (lateral) onFechar?.(); else router.push('/notas') } catch (e) { avisar((e as Error).message) }
  }
  const mandarParaLixeira = () => {
    setMenu(null)
    void salvar().then(() => arquivar(id)).then(() => {
      if (pagina.base_id) avisarItem({ id, base_id: pagina.base_id, arquivado: true })
      if (lateral) onFechar?.(); else void carregar()
    })
  }

  // Caminho longo: primeira, "…" e as duas últimas (como no Notion).
  const itensTrilha = trilha.length ? trilha : [pagina]
  const trilhaVisivel = itensTrilha.length > 4 ? [itensTrilha[0], null, ...itensTrilha.slice(-2)] : itensTrilha
  const posicaoCapa = reposicionando ?? pagina.capa_posicao

  return <div className={x.main}>
    <header className={x.top}>
      {lateral
        ? <>
          <button type="button" className={x.topBtn} aria-label="Fechar" title="Fechar" onClick={onFechar}><ChevronsRight size={18} /></button>
          <Link href={`/notas/${id}`} className={x.topBtn} aria-label="Abrir como página" title="Abrir como página"><Maximize2 size={16} /></Link>
          <span style={{ flex: 1 }} />
        </>
        : <>
          {recolhida && !semBarraLateral && <button type="button" className={`${x.topBtn} ${x.soComputadorFlex}`} aria-label="Mostrar a barra lateral" title="Mostrar a barra lateral (Ctrl+\)" onClick={() => setRecolhida(false)}><ChevronsRight size={18} /></button>}
          <nav className={x.crumbs} aria-label="Caminho">
            {semBarraLateral && <><Link href="/artefatos" className={x.crumb}><Sparkles size={14} /><span>Artefatos</span></Link><span className={x.crumbSep}>/</span></>}
            {trilhaVisivel.map((item, i, lista) => <span key={item?.id ?? 'reticencias'} style={{ display: 'contents' }}>
              {item
                ? <Link href={`/notas/${item.id}`} className={x.crumb}><IconePagina icone={item.icone} tipo={item.tipo} tamanho={14} /><span>{tituloExibido(item.titulo)}</span></Link>
                : <span className={x.crumb} title={itensTrilha.slice(1, -2).map(p => tituloExibido(p.titulo)).join(' / ')}>…</span>}
              {i < lista.length - 1 && <span className={x.crumbSep}>/</span>}
            </span>)}
          </nav>
        </>}
      {/* Um texto só: "Salvando…" enquanto grava, depois "Editado agora". */}
      <span className={estado === 'erro' && !conflito ? x.saving : x.edited} aria-live="polite">
        {estado === 'salvando' || estado === 'pendente' ? 'Salvando…' : estado === 'erro' && !conflito ? 'Não salvo' : editadoHa(pagina.updated_at)}
      </span>
      {presentes.length > 0 && <span className={x.presence} aria-label={`Também aqui: ${presentes.map(p => p.nome).join(', ')}`}>
        {presentes.slice(0, 5).map(p => <span key={p.clientId} title={p.nome} style={{ background: p.cor }}>{p.nome.slice(0, 1).toUpperCase()}</span>)}
      </span>}
      {(pagina.acesso === 'restrito' || pagina.restricao_id) && <span className={x.topBtn} title="Acesso restrito"><Lock size={14} /></span>}
      {pagina.publica && <span className={x.topBtn} title="Publicada na web"><Globe size={14} /></span>}
      {!lateral && <button type="button" className={x.topBtn} aria-label="Compartilhar" onClick={e => setCompartilhar(e.currentTarget)}>
        <UserPlus size={17} className={x.soCelular} /><span className={x.soComputador}>Compartilhar</span>
      </button>}
      {!ehBase && !ehArtefato && <button type="button" className={x.topBtn} aria-label="Comentários" title="Comentários (Ctrl+Alt+M comenta o bloco)"
        onClick={e => {
          // No item de uma base, os comentários já estão na página: o botão leva até eles.
          const embutidos = pagina.base_id ? e.currentTarget.closest(`.${x.main}`)?.querySelector<HTMLTextAreaElement>(`.${x.comentariosItem} textarea`) : null
          if (embutidos) { embutidos.scrollIntoView({ block: 'center', behavior: 'smooth' }); embutidos.focus(); return }
          setComentarios(comentarios ? null : { rascunho: null })
        }}><MessageSquare size={17} />{abertas.length > 0 && <small>{abertas.length}</small>}</button>}
      <button type="button" className={`${x.topBtn} ${pagina.favorita ? x.starOn : ''}`} aria-label={pagina.favorita ? 'Remover dos favoritos' : 'Favoritar'}
        onClick={() => { setPagina({ ...pagina, favorita: !pagina.favorita }); void favoritar(id, !pagina.favorita) }}>
        <Star size={18} fill={pagina.favorita ? 'currentColor' : 'none'} />
      </button>
      <button type="button" className={x.topBtn} aria-label="Mais ações" onClick={e => setMenu(e.currentTarget)}><MoreHorizontal size={18} /></button>
    </header>

    {menu && <Menu ancora={menu} onFechar={() => setMenu(null)} alinhar="fim">
      {!ehArtefato && <>
      <div className={x.menuLabel}>Estilo</div>
      <div className={x.fontChoices}>
        {(['padrao', 'serifa', 'mono'] as const).map(fonte => <button key={fonte} type="button" disabled={!editavel}
          className={`${x.fontChoice} ${pagina.fonte === fonte ? x.fontChoiceOn : ''}`} onClick={() => mudar({ fonte }, true)}>
          <b style={{ fontFamily: fonte === 'serifa' ? 'Georgia, serif' : fonte === 'mono' ? 'Menlo, monospace' : undefined }}>Ag</b>
          <span>{fonte === 'padrao' ? 'Padrão' : fonte === 'serifa' ? 'Serifa' : 'Mono'}</span>
        </button>)}
      </div>
      <div className={x.menuSep} />
      <ItemMenu onClick={() => editavel && mudar({ texto_pequeno: !pagina.texto_pequeno }, true)} direita={<Chave ligada={pagina.texto_pequeno} />}>Texto pequeno</ItemMenu>
      <ItemMenu onClick={() => editavel && mudar({ largura_total: !pagina.largura_total }, true)} direita={<Chave ligada={pagina.largura_total} />}>Largura total</ItemMenu>
      <div className={x.menuSep} />
      </>}
      {pagina.pode_editar && !pagina.arquivada_em && <ItemMenu icone={pagina.bloqueada ? Unlock : Lock} onClick={() => mudar({ bloqueada: !pagina.bloqueada }, true)}
        direita={<Chave ligada={pagina.bloqueada} />}>Bloquear página</ItemMenu>}
      <ItemMenu icone={Link2} onClick={() => { setMenu(null); void navigator.clipboard.writeText(`${location.origin}/notas/${id}`).then(() => avisar('Link copiado.')) }}>Copiar link</ItemMenu>
      {!pagina.base_id && <ItemMenu icone={Copy} onClick={() => { setMenu(null); void salvar().then(() => duplicar(id)) }}>Duplicar</ItemMenu>}
      {!ehBase && !ehArtefato && <ItemMenu icone={History} onClick={() => { setMenu(null); void salvar().then(() => setHistorico(true)) }}>Histórico de versões</ItemMenu>}
      <div className={x.menuSep} />
      {ehArtefato ? null : ehBase
        ? <ItemMenu icone={Download} onClick={() => void exportar('csv')}>Exportar CSV</ItemMenu>
        : <><ItemMenu icone={Download} onClick={() => void exportar('md')}>Exportar Markdown</ItemMenu>
          <ItemMenu icone={Download} onClick={() => void exportar('html')}>Exportar HTML</ItemMenu></>}
      <ItemMenu icone={Printer} onClick={() => { setMenu(null); setTimeout(() => window.print(), 50) }}>Imprimir ou salvar em PDF</ItemMenu>
      {pagina.pode_editar && !pagina.arquivada_em && <ItemMenu icone={Trash2} perigo onClick={mandarParaLixeira}>Mover para a lixeira</ItemMenu>}
    </Menu>}

    {pagina.arquivada_em && <div className={`${x.banner} ${x.trashBanner}`}>
      Esta página está na lixeira.
      {pagina.pode_editar && <><button type="button" className={x.bannerBtn} onClick={() => void restaurar()}><Undo2 size={14} /> Restaurar página</button>
        <button type="button" className={x.bannerBtn} onClick={() => void apagar()}>Apagar de vez</button></>}
    </div>}
    {pagina.e_modelo && <div className={`${x.banner} ${x.templateBanner}`}>Você está editando um modelo. Itens criados a partir dele começam com este conteúdo, ícone e valores.</div>}
    {conflito && <div className={x.banner}>
      Esta página foi alterada em outro lugar enquanto você editava. Suas últimas alterações não foram salvas.
      <button type="button" className={x.bannerBtn} onClick={() => void carregar()}>Recarregar</button>
    </div>}
    {pagina.bloqueada && !pagina.arquivada_em && <div className={x.banner}><Lock size={14} /> Página bloqueada.
      {pagina.pode_editar && <button type="button" className={x.bannerBtn} onClick={() => mudar({ bloqueada: false }, true)}>Desbloquear</button>}
    </div>}

    {ehArtefato ? <ArtefatoView key={id} paginaId={id} titulo={pagina.titulo} editavel={editavel} onMudou={() => void recarregar()} /> : <div className={x.scroll}>
      {pagina.capa && <div className={`${x.cover} ${reposicionando !== null ? x.coverMoving : ''}`} style={estiloCapa(pagina.capa, posicaoCapa)}
        onMouseDown={e => { if (reposicionando !== null) { e.preventDefault(); arrastoCapa.current = { y: e.clientY, inicio: posicaoCapa } } }}>
        {reposicionando !== null && <span className={x.coverHint}>Arraste a imagem para reposicionar</span>}
        {editavel && <div className={x.coverActions} style={reposicionando !== null ? { display: 'flex' } : undefined}>
          {reposicionando !== null
            ? <>
              <button type="button" onClick={() => { mudar({ capa_posicao: reposicionando }, true); setReposicionando(null) }}>Salvar posição</button>
              <button type="button" onClick={() => setReposicionando(null)}>Cancelar</button>
            </>
            : <>
              <button type="button" onClick={e => setSeletorCapa(e.currentTarget)}>Trocar capa</button>
              {!pagina.capa.startsWith('cor:') && <button type="button" onClick={() => setReposicionando(pagina.capa_posicao)}><MoveVertical size={12} style={{ display: 'inline', marginRight: 4 }} />Reposicionar</button>}
              <button type="button" onClick={() => mudar({ capa: null }, true)}>Remover</button>
            </>}
        </div>}
      </div>}
      <div className={classes}>
        <div className={x.head} style={{ paddingLeft: 0, paddingRight: 0, ...(lateral ? { paddingTop: pagina.capa ? 24 : 32 } : {}) }}>
          {pagina.icone && <button type="button" className={x.icon} disabled={!editavel} aria-label="Trocar ícone" onClick={e => setSeletorIcone(e.currentTarget)}>{pagina.icone}</button>}
          {editavel && <div className={x.addRow}>
            {!pagina.icone && <button type="button" className={x.addBtn} onClick={e => setSeletorIcone(e.currentTarget)}><Smile size={16} />Adicionar ícone</button>}
            {!pagina.capa && <button type="button" className={x.addBtn} onClick={e => setSeletorCapa(e.currentTarget)}><ImageIcon size={16} />Adicionar capa</button>}
          </div>}
          <textarea ref={titulo} className={x.title} rows={1} value={pagina.titulo} placeholder="Sem título" aria-label="Título da página" readOnly={!editavel} maxLength={500}
            onChange={e => mudar({ titulo: e.target.value.replace(/\n/g, '') })}
            onKeyDown={e => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              // Enter leva ao texto. Se o editor ainda está carregando, o foco vai para ele assim que ficar pronto.
              const editor = e.currentTarget.closest(`.${x.doc}`)?.querySelector('.bn-editor') as HTMLElement | null
              if (editor) editor.focus(); else { focarEditor.current = true; e.currentTarget.blur() }
            }} />
          {pagina.base_id && <PropriedadesItem pagina={pagina} editavel={editavel} />}
          {/* Item de base: os comentários ficam aqui, logo abaixo das propriedades (como no Notion). */}
          {pagina.base_id && !pagina.e_modelo && <Comentarios embutido paginaId={id} euId={user?.id ?? null} rascunho={null}
            onIrPara={b => controle.current?.irPara(b)} onMudou={setDiscussoes} />}
          {editavel && vazia && !ehBase && !pagina.base_id && <div className={x.starter}>
            Pressione Enter para escrever, ou comece com:
            <div>
              <button type="button" onClick={() => void virarBase('vazia', 'tabela')}><Table2 size={16} />Tabela</button>
              <button type="button" onClick={() => void virarBase('vazia', 'quadro')}><Columns3 size={16} />Quadro</button>
              <button type="button" onClick={() => void virarBase('vazia', 'lista')}><List size={16} />Lista</button>
              <button type="button" onClick={() => void virarBase('tarefas', 'quadro')}><ListChecks size={16} />Tarefas</button>
              <button type="button" onClick={e => setMenuModelos(e.currentTarget)}><LayoutTemplate size={16} />Modelos</button>
            </div>
          </div>}
        </div>
        {ehBase
          ? <BaseView key={id} id={id} />
          : <div className={x.editor}>
            <EditorColaborativo key={`${id}:${pagina.geracao_yjs}`} pagina={pagina} aoConectar={aoConectar} aoPresentes={setPresentes}
              chave={`${id}:${pagina.geracao_yjs}`} conteudo={pagina.conteudo} editavel={editavel} paginaId={id} controle={controle}
              destaques={abertas.map(c => c.bloco_id).filter((b): b is string => Boolean(b))}
              onComentar={(bloco_id, trecho) => setComentarios({ rascunho: { bloco_id, trecho } })}
              aoCarregar={() => { if (focarEditor.current) { focarEditor.current = false; (titulo.current?.closest(`.${x.doc}`)?.querySelector('.bn-editor') as HTMLElement | null)?.focus() } }} criarSubpagina={criarSubpagina} criarBase={criarBaseDentro}
              onMudar={blocos => { setVazia(false); mudar({ conteudo: blocos }) }} />
          </div>}
      </div>
    </div>}

    {menuModelos && <Menu ancora={menuModelos} onFechar={() => setMenuModelos(null)} className={x.menuWide}>
      <div className={x.menuLabel}>Modelos</div>
      {MODELOS_PAGINA.map(m => <ItemMenu key={m.id} onClick={() => void aplicarModelo(m)}>
        <span style={{ display: 'grid' }}><span>{m.icone} {m.nome}</span><small style={{ marginLeft: 0, color: 'var(--n-faint)' }}>{m.descricao}</small></span>
      </ItemMenu>)}
    </Menu>}
    {comentarios && !ehBase && <Comentarios paginaId={id} euId={user?.id ?? null} rascunho={comentarios.rascunho} onFechar={() => setComentarios(null)}
      onIrPara={b => controle.current?.irPara(b)} onMudou={setDiscussoes} />}
    {compartilhar && <Compartilhar ancora={compartilhar} paginaId={id} espaco={pagina.espaco} onFechar={() => setCompartilhar(null)}
      onMudou={c => setPagina(atual => atual && { ...atual, acesso: c.acesso, publica: c.publica })} />}
    {historico && <Historico pagina={pagina} podeRestaurar={editavel} onFechar={() => setHistorico(false)}
      onRestaurada={nova => { setHistorico(false); aplicar(nova); void recarregar(); avisar('Versão restaurada.') }} />}
    {seletorIcone && <SeletorIcone ancora={seletorIcone} onFechar={() => setSeletorIcone(null)} onEscolher={icone => mudar({ icone }, true)} />}
    {seletorCapa && <SeletorCapa ancora={seletorCapa} onFechar={() => setSeletorCapa(null)} onEscolher={capa => mudar({ capa }, true)} />}
  </div>
}
