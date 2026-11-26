'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronsRight, Columns3, Copy, FileText, History, ImageIcon, LayoutTemplate, List, ListChecks, Link2, Lock, Maximize2, MoreHorizontal, MoveVertical, Smile, Star, Table2,
  Trash2, Undo2, Unlock,
} from 'lucide-react'
import { caminho, textoDoConteudo, tituloExibido } from '@/products/notas/shared/arvore'
import type { TipoVisao } from '@/products/notas/shared/bases'
import { editadoHa, ErroNotas, notasApi, type Pagina } from './api'
import { BaseView } from './base/BaseView'
import { PropriedadesItem } from './base/PropriedadesItem'
import { avisarItem } from './base/useBase'
import { MODELOS_PAGINA, type ModeloPagina } from '@/products/notas/shared/modelos'
import { Historico } from './Historico'
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

/**
 * Uma página: topo (caminho, editado, favoritar, ⋯), capa, ícone, título e o editor em blocos, salvando sozinha.
 * Se a página é uma base de dados, mostra a base no lugar do editor; se é item de uma base, mostra as propriedades.
 * `lateral`: aberta ao lado de uma base (topo com fechar e abrir como página).
 */
export function PaginaView({ id, lateral, onFechar }: { id: string; lateral?: boolean; onFechar?: () => void }) {
  const router = useRouter()
  const { arvore, ajustarLocal, recarregar, favoritar, duplicar, arquivar, avisar, recolhida, setRecolhida } = useNotas()
  const [pagina, setPagina] = useState<Pagina | null>(null)
  const [erro, setErro] = useState('')
  const [chave, setChave] = useState(id)
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
  useTituloDaAba(!lateral && pagina ? `${pagina.icone ? `${pagina.icone} ` : ''}${tituloExibido(pagina.titulo)} · Notas` : null)

  const aplicar = useCallback((nova: Pagina) => {
    versao.current = nova.versao; pendente.current = {}
    setPagina(nova); setChave(`${id}:${nova.versao}`); setConflito(false); setErro(''); setEstado('salvo')
    setVazia(!textoDoConteudo(nova.conteudo).trim() && !(nova.conteudo as unknown[]).some(b => (b as { type?: string }).type !== 'paragraph'))
  }, [id])
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
  const salvar = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const campos = pendente.current
    if (!Object.keys(campos).length || conflito) return
    pendente.current = {}
    setEstado('salvando')
    try {
      const salva = await notasApi<Pagina>(`/paginas/${id}`, { method: 'PATCH', json: { versao: versao.current, ...campos } })
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
  }, [id, conflito, recarregar, avisar])
  useEffect(() => { salvarDeNovo.current = salvar }, [salvar])

  const mudar = useCallback((campos: Partial<Pagina>, imediato = false) => {
    setPagina(atual => atual && { ...atual, ...campos })
    pendente.current = { ...pendente.current, ...campos }
    if ('titulo' in campos || 'icone' in campos) ajustarLocal(id, { ...(campos.titulo !== undefined ? { titulo: campos.titulo } : {}), ...(campos.icone !== undefined ? { icone: campos.icone } : {}) })
    setEstado('pendente')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void salvar(), imediato ? 0 : ESPERA_SALVAR_MS)
  }, [id, ajustarLocal, salvar])

  // Fechar a aba: grava o que faltou com keepalive (o navegador termina o pedido mesmo saindo da página).
  // Sair da página dentro do Otto: grava normalmente.
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => {
      const campos = pendente.current
      if (!Object.keys(campos).length || conflito) return
      const corpo = JSON.stringify({ versao: versao.current, ...campos })
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
  const aplicarModelo = (modelo: ModeloPagina) => {
    if (!pagina) return
    setMenuModelos(null)
    mudar({ conteudo: modelo.conteudo, ...(pagina.titulo ? {} : { titulo: modelo.titulo }), ...(pagina.icone ? {} : { icone: modelo.icone }) }, true)
    setChave(`${id}:modelo:${modelo.id}`); setVazia(false)
  }

  /** Página vazia → base ("Comece com: Tabela, Quadro, Lista, Tarefas"). */
  const virarBase = async (modelo: 'vazia' | 'tarefas', visao: TipoVisao) => {
    await salvar()
    try { await notasApi('/bases', { method: 'POST', json: { converter: id, modelo, visao } }); await Promise.all([carregar(), recarregar()]) } catch (e) { avisar((e as Error).message) }
  }

  if (erro) return <div className={x.main}><div className={x.home}><h1>Não foi possível abrir</h1><p className={x.muted}>{erro}</p>
    {lateral && <button type="button" className={x.bannerBtn} onClick={onFechar}>Fechar</button>}</div></div>
  if (!pagina) return <div className={x.main}><Esqueleto /></div>

  const trilha = arvore ? caminho(arvore.paginas, id) : []
  const editavel = pagina.pode_editar && !pagina.bloqueada && !pagina.arquivada_em && !conflito
  const ehBase = pagina.tipo === 'base'
  const classes = [x.doc, pagina.largura_total || (ehBase && !lateral) ? x.docWide : '', pagina.capa ? x.withCover : '',
    pagina.fonte === 'serifa' ? x.serif : pagina.fonte === 'mono' ? x.mono : '', pagina.texto_pequeno ? x.small : ''].join(' ')

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
          {recolhida && <button type="button" className={x.topBtn} aria-label="Mostrar a barra lateral" title="Mostrar a barra lateral (Ctrl+\)" onClick={() => setRecolhida(false)}><ChevronsRight size={18} /></button>}
          <nav className={x.crumbs} aria-label="Caminho">
            {trilhaVisivel.map((item, i, lista) => <span key={item?.id ?? 'reticencias'} style={{ display: 'contents' }}>
              {item
                ? <Link href={`/notas/${item.id}`} className={x.crumb}>{item.icone ? <span>{item.icone}</span> : <FileText size={14} />}<span>{tituloExibido(item.titulo)}</span></Link>
                : <span className={x.crumb} title={itensTrilha.slice(1, -2).map(p => tituloExibido(p.titulo)).join(' / ')}>…</span>}
              {i < lista.length - 1 && <span className={x.crumbSep}>/</span>}
            </span>)}
          </nav>
        </>}
      <span className={x.saving} aria-live="polite">{estado === 'salvando' || estado === 'pendente' ? 'Salvando…' : estado === 'erro' && !conflito ? 'Não salvo' : ''}</span>
      <span className={x.edited}>{editadoHa(pagina.updated_at)}</span>
      {!lateral && <button type="button" className={x.topBtn} onClick={() => void navigator.clipboard.writeText(location.href).then(() => avisar('Link copiado.'))}>Compartilhar</button>}
      <button type="button" className={`${x.topBtn} ${pagina.favorita ? x.starOn : ''}`} aria-label={pagina.favorita ? 'Remover dos favoritos' : 'Favoritar'}
        onClick={() => { setPagina({ ...pagina, favorita: !pagina.favorita }); void favoritar(id, !pagina.favorita) }}>
        <Star size={18} fill={pagina.favorita ? 'currentColor' : 'none'} />
      </button>
      <button type="button" className={x.topBtn} aria-label="Mais ações" onClick={e => setMenu(e.currentTarget)}><MoreHorizontal size={18} /></button>
    </header>

    {menu && <Menu ancora={menu} onFechar={() => setMenu(null)} alinhar="fim">
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
      {pagina.pode_editar && !pagina.arquivada_em && <ItemMenu icone={pagina.bloqueada ? Unlock : Lock} onClick={() => mudar({ bloqueada: !pagina.bloqueada }, true)}
        direita={<Chave ligada={pagina.bloqueada} />}>Bloquear página</ItemMenu>}
      <ItemMenu icone={Link2} onClick={() => { setMenu(null); void navigator.clipboard.writeText(`${location.origin}/notas/${id}`).then(() => avisar('Link copiado.')) }}>Copiar link</ItemMenu>
      {!pagina.base_id && <ItemMenu icone={Copy} onClick={() => { setMenu(null); void salvar().then(() => duplicar(id)) }}>Duplicar</ItemMenu>}
      {!ehBase && <ItemMenu icone={History} onClick={() => { setMenu(null); void salvar().then(() => setHistorico(true)) }}>Histórico de versões</ItemMenu>}
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

    <div className={x.scroll}>
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
            <Editor chave={chave} conteudo={pagina.conteudo} editavel={editavel} paginaId={id}
              aoCarregar={() => { if (focarEditor.current) { focarEditor.current = false; (titulo.current?.closest(`.${x.doc}`)?.querySelector('.bn-editor') as HTMLElement | null)?.focus() } }} criarSubpagina={criarSubpagina} criarBase={criarBaseDentro}
              onMudar={blocos => { setVazia(false); mudar({ conteudo: blocos }) }} />
          </div>}
      </div>
    </div>

    {menuModelos && <Menu ancora={menuModelos} onFechar={() => setMenuModelos(null)} className={x.menuWide}>
      <div className={x.menuLabel}>Modelos</div>
      {MODELOS_PAGINA.map(m => <ItemMenu key={m.id} onClick={() => aplicarModelo(m)}>
        <span style={{ display: 'grid' }}><span>{m.icone} {m.nome}</span><small style={{ marginLeft: 0, color: 'var(--n-faint)' }}>{m.descricao}</small></span>
      </ItemMenu>)}
    </Menu>}
    {historico && <Historico pagina={pagina} podeRestaurar={editavel} onFechar={() => setHistorico(false)}
      onRestaurada={nova => { setHistorico(false); aplicar(nova); void recarregar(); avisar('Versão restaurada.') }} />}
    {seletorIcone && <SeletorIcone ancora={seletorIcone} onFechar={() => setSeletorIcone(null)} onEscolher={icone => mudar({ icone }, true)} />}
    {seletorCapa && <SeletorCapa ancora={seletorCapa} onFechar={() => setSeletorCapa(null)} onEscolher={capa => mudar({ capa }, true)} />}
  </div>
}
