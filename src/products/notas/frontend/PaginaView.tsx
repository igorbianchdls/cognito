'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronsRight, Copy, FileText, ImageIcon, Link2, Loader2, Lock, MoreHorizontal, Smile, Star, Trash2, Undo2, Unlock } from 'lucide-react'
import { caminho, tituloExibido } from '@/products/notas/shared/arvore'
import { editadoHa, ErroNotas, notasApi, type Pagina } from './api'
import { estiloCapa } from './catalogo'
import { Chave, ItemMenu, Menu } from './Menu'
import { useNotas } from './NotasProvider'
import { SeletorCapa, SeletorIcone } from './Seletores'
import x from './notas.module.css'

// O editor usa o navegador (seleção, arrastar): só carrega no cliente.
const Editor = dynamic(() => import('./Editor'), { ssr: false, loading: () => <div style={{ height: 120 }} /> })

const ESPERA_SALVAR_MS = 700
type Estado = 'salvo' | 'salvando' | 'pendente' | 'erro'

/** Uma página: topo (caminho, editado, favoritar, ⋯), capa, ícone, título e o editor em blocos, salvando sozinha. */
export function PaginaView({ id }: { id: string }) {
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
  const pendente = useRef<Partial<Pagina>>({})
  const versao = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const salvarDeNovo = useRef<() => Promise<void>>(async () => {})
  const titulo = useRef<HTMLTextAreaElement>(null)

  const aplicar = useCallback((nova: Pagina) => {
    versao.current = nova.versao; pendente.current = {}
    setPagina(nova); setChave(`${id}:${nova.versao}`); setConflito(false); setErro(''); setEstado('salvo')
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
      if ('titulo' in campos || 'icone' in campos) void recarregar()
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

  // Sair da página ou fechar a aba: grava o que faltou.
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => { if (Object.keys(pendente.current).length) { void salvar(); e.preventDefault() } }
    window.addEventListener('beforeunload', antesDeSair)
    return () => { window.removeEventListener('beforeunload', antesDeSair); void salvar() }
  }, [salvar])

  // O título cresce com o texto.
  useEffect(() => {
    const t = titulo.current
    if (t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px` }
  }, [pagina?.titulo])

  const criarSubpagina = useCallback(async (tituloNovo?: string) => {
    try {
      const nova = await notasApi<Pagina>('/paginas', { method: 'POST', json: { parent_id: id, ...(tituloNovo ? { titulo: tituloNovo } : {}) } })
      await recarregar()
      return { id: nova.id, titulo: nova.titulo, icone: nova.icone }
    } catch (e) { avisar((e as Error).message); return null }
  }, [id, recarregar, avisar])

  if (erro) return <div className={x.main}><div className={x.home}><h1>Não foi possível abrir</h1><p className={x.muted}>{erro}</p></div></div>
  if (!pagina) return <div className={x.main}><div className={x.home}><Loader2 size={20} className={x.spin} /></div></div>

  const trilha = arvore ? caminho(arvore.paginas, id) : []
  const editavel = pagina.pode_editar && !pagina.bloqueada && !pagina.arquivada_em && !conflito
  const classes = [x.doc, pagina.largura_total ? x.docWide : '', pagina.capa ? x.withCover : '',
    pagina.fonte === 'serifa' ? x.serif : pagina.fonte === 'mono' ? x.mono : '', pagina.texto_pequeno ? x.small : ''].join(' ')

  const restaurar = async () => {
    try { await notasApi(`/paginas/${id}/restaurar`, { method: 'POST' }); await Promise.all([carregar(), recarregar()]) } catch (e) { avisar((e as Error).message) }
  }
  const apagar = async () => {
    if (!window.confirm('Apagar de vez esta página e as subpáginas? Não dá para desfazer.')) return
    try { await notasApi(`/paginas/${id}?definitivo=1`, { method: 'DELETE' }); router.push('/notas') } catch (e) { avisar((e as Error).message) }
  }

  return <div className={x.main}>
    <header className={x.top}>
      {recolhida && <button type="button" className={x.topBtn} aria-label="Mostrar a barra lateral" title="Mostrar a barra lateral" onClick={() => setRecolhida(false)}><ChevronsRight size={18} /></button>}
      <nav className={x.crumbs} aria-label="Caminho">
        {(trilha.length ? trilha : [pagina]).map((item, i, lista) => <span key={item.id} style={{ display: 'contents' }}>
          <Link href={`/notas/${item.id}`} className={x.crumb}>{item.icone ? <span>{item.icone}</span> : <FileText size={14} />}<span>{tituloExibido(item.titulo)}</span></Link>
          {i < lista.length - 1 && <span className={x.crumbSep}>/</span>}
        </span>)}
      </nav>
      <span className={x.saving} aria-live="polite">{estado === 'salvando' || estado === 'pendente' ? 'Salvando…' : estado === 'erro' && !conflito ? 'Não salvo' : ''}</span>
      <span className={x.edited}>{editadoHa(pagina.updated_at)}</span>
      <button type="button" className={x.topBtn} onClick={() => void navigator.clipboard.writeText(location.href).then(() => avisar('Link copiado.'))}>Compartilhar</button>
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
      <ItemMenu icone={Link2} onClick={() => { setMenu(null); void navigator.clipboard.writeText(location.href).then(() => avisar('Link copiado.')) }}>Copiar link</ItemMenu>
      <ItemMenu icone={Copy} onClick={() => { setMenu(null); void salvar().then(() => duplicar(id)) }}>Duplicar</ItemMenu>
      {pagina.pode_editar && !pagina.arquivada_em && <ItemMenu icone={Trash2} perigo onClick={() => { setMenu(null); void salvar().then(() => arquivar(id)).then(carregar) }}>Mover para a lixeira</ItemMenu>}
    </Menu>}

    {pagina.arquivada_em && <div className={`${x.banner} ${x.trashBanner}`}>
      Esta página está na lixeira.
      {pagina.pode_editar && <><button type="button" className={x.bannerBtn} onClick={() => void restaurar()}><Undo2 size={14} /> Restaurar página</button>
        <button type="button" className={x.bannerBtn} onClick={() => void apagar()}>Apagar de vez</button></>}
    </div>}
    {conflito && <div className={x.banner}>
      Esta página foi alterada em outro lugar enquanto você editava. Suas últimas alterações não foram salvas.
      <button type="button" className={x.bannerBtn} onClick={() => void carregar()}>Recarregar</button>
    </div>}
    {pagina.bloqueada && !pagina.arquivada_em && <div className={x.banner}><Lock size={14} /> Página bloqueada.
      {pagina.pode_editar && <button type="button" className={x.bannerBtn} onClick={() => mudar({ bloqueada: false }, true)}>Desbloquear</button>}
    </div>}

    <div className={x.scroll}>
      {pagina.capa && <div className={x.cover} style={estiloCapa(pagina.capa, pagina.capa_posicao)}>
        {editavel && <div className={x.coverActions}>
          <button type="button" onClick={e => setSeletorCapa(e.currentTarget)}>Trocar capa</button>
          <button type="button" onClick={() => mudar({ capa: null }, true)}>Remover</button>
        </div>}
      </div>}
      <div className={classes}>
        <div className={x.head} style={{ paddingLeft: 0, paddingRight: 0 }}>
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
              ;(document.querySelector('.bn-editor') as HTMLElement | null)?.focus()
            }} />
        </div>
        <div className={x.editor}>
          <Editor chave={chave} conteudo={pagina.conteudo} editavel={editavel} onMudar={blocos => mudar({ conteudo: blocos })} criarSubpagina={criarSubpagina} paginaId={id} />
        </div>
      </div>
    </div>

    {seletorIcone && <SeletorIcone ancora={seletorIcone} onFechar={() => setSeletorIcone(null)} onEscolher={icone => mudar({ icone }, true)} />}
    {seletorCapa && <SeletorCapa ancora={seletorCapa} onFechar={() => setSeletorCapa(null)} onEscolher={capa => mudar({ capa }, true)} />}
  </div>
}
