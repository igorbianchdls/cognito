'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import {
  ChevronRight, ChevronsLeft, Copy, FileText, House, Link2, MoreHorizontal, Plus, Search, Star, StarOff, Trash2, Undo2,
} from 'lucide-react'
import { montarArvore, posicaoEntre, tituloExibido, type Espaco, type NoArvore } from '@/products/notas/shared/arvore'
import { notasApi, type ItemLixeira } from './api'
import { ItemMenu, Menu } from './Menu'
import { useLocal } from './local'
import { useNotas } from './NotasProvider'
import x from './notas.module.css'

const LARGURA_PADRAO = 248, LARGURA_MIN = 200, LARGURA_MAX = 480

type Soltar = { id: string; onde: 'antes' | 'dentro' | 'depois' } | null

/** Uma linha da árvore com as filhas (recuo de 12px por nível, como no Notion). */
function Linha({ no, nivel, abertas, alternar, atual, soltar, setSoltar, arrastando, setArrastando, onSoltar }: {
  no: NoArvore; nivel: number; abertas: Set<string>; alternar: (id: string) => void; atual: string | undefined
  soltar: Soltar; setSoltar: (s: Soltar) => void; arrastando: string | null; setArrastando: (id: string | null) => void
  onSoltar: (alvo: NoArvore, onde: 'antes' | 'dentro' | 'depois') => void
}) {
  const { criar, arquivar, duplicar, favoritar, arvore, avisar } = useNotas()
  const router = useRouter()
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const aberta = abertas.has(no.id)
  const favorita = arvore?.favoritos.includes(no.id) ?? false
  const marca = soltar?.id === no.id ? soltar.onde : null

  return <>
    <div role="treeitem" aria-expanded={no.filhos.length ? aberta : undefined} aria-selected={atual === no.id} tabIndex={0}
      className={`${x.row} ${atual === no.id ? x.rowOn : ''} ${menu ? x.rowMenuOpen : ''} ${marca === 'dentro' ? x.dropInside : marca === 'antes' ? x.dropBefore : marca === 'depois' ? x.dropAfter : ''}`}
      style={{ paddingLeft: 4 + nivel * 12 }} draggable
      onClick={() => router.push(`/notas/${no.id}`)} onKeyDown={e => { if (e.key === 'Enter') router.push(`/notas/${no.id}`) }}
      onDragStart={e => { setArrastando(no.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', no.id) }}
      onDragEnd={() => { setArrastando(null); setSoltar(null) }}
      onDragOver={e => {
        if (!arrastando || arrastando === no.id) return
        e.preventDefault()
        const r = e.currentTarget.getBoundingClientRect(), y = (e.clientY - r.top) / r.height
        setSoltar({ id: no.id, onde: y < .25 ? 'antes' : y > .75 ? 'depois' : 'dentro' })
      }}
      onDrop={e => { e.preventDefault(); if (marca) onSoltar(no, marca); setSoltar(null) }}>
      <span className={x.rowIcon}>
        {no.icone ? <span className={x.emoji}>{no.icone}</span> : <FileText size={16} className={x.glyph} />}
        <button type="button" className={`${x.toggle} ${aberta ? x.toggleOpen : ''}`} aria-label={aberta ? 'Recolher' : 'Expandir'}
          onClick={e => { e.stopPropagation(); alternar(no.id) }}><ChevronRight size={14} /></button>
      </span>
      <span className={x.rowTitle}>{tituloExibido(no.titulo)}</span>
      <span className={x.rowActions}>
        <button type="button" className={x.rowBtn} aria-label="Mais ações" title="Excluir, duplicar e mais…"
          onClick={e => { e.stopPropagation(); setMenu(e.currentTarget) }}><MoreHorizontal size={16} /></button>
        <button type="button" className={x.rowBtn} aria-label="Adicionar página dentro" title="Adicionar uma página dentro"
          onClick={e => { e.stopPropagation(); if (!aberta) alternar(no.id); void criar({ parent_id: no.id }) }}><Plus size={16} /></button>
      </span>
    </div>
    {menu && <Menu ancora={menu} onFechar={() => setMenu(null)}>
      <ItemMenu icone={favorita ? StarOff : Star} onClick={() => { setMenu(null); void favoritar(no.id, !favorita) }}>{favorita ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</ItemMenu>
      <div className={x.menuSep} />
      <ItemMenu icone={Link2} onClick={() => { setMenu(null); void navigator.clipboard.writeText(`${location.origin}/notas/${no.id}`).then(() => avisar('Link copiado.')) }}>Copiar link</ItemMenu>
      <ItemMenu icone={Copy} atalho="Ctrl+D" onClick={() => { setMenu(null); void duplicar(no.id) }}>Duplicar</ItemMenu>
      <ItemMenu icone={Trash2} perigo onClick={() => { setMenu(null); void arquivar(no.id) }}>Mover para a lixeira</ItemMenu>
    </Menu>}
    {aberta && (no.filhos.length
      ? no.filhos.map(filho => <Linha key={filho.id} no={filho} nivel={nivel + 1} abertas={abertas} alternar={alternar} atual={atual}
        soltar={soltar} setSoltar={setSoltar} arrastando={arrastando} setArrastando={setArrastando} onSoltar={onSoltar} />)
      : <div className={x.empty} style={{ paddingLeft: 30 + (nivel + 1) * 12 }}>Nenhuma página dentro</div>)}
  </>
}

/** Lixeira: busca, restaurar e apagar de vez. */
function Lixeira({ ancora, onFechar }: { ancora: HTMLElement; onFechar: () => void }) {
  const { recarregar, avisar } = useNotas()
  const router = useRouter()
  const [itens, setItens] = useState<ItemLixeira[] | null>(null)
  const [filtro, setFiltro] = useState('')
  const carregar = useCallback(() => notasApi<ItemLixeira[]>('/lixeira').then(setItens).catch(e => avisar((e as Error).message)), [avisar])
  useEffect(() => { void carregar() }, [carregar])
  const restaurar = async (id: string) => {
    try { await notasApi(`/paginas/${id}/restaurar`, { method: 'POST' }); await Promise.all([carregar(), recarregar()]); avisar('Página restaurada.') } catch (e) { avisar((e as Error).message) }
  }
  const apagar = async (id: string) => {
    if (!window.confirm('Apagar de vez esta página e as subpáginas? Não dá para desfazer.')) return
    try { await notasApi(`/paginas/${id}?definitivo=1`, { method: 'DELETE' }); await carregar() } catch (e) { avisar((e as Error).message) }
  }
  const visiveis = (itens ?? []).filter(i => tituloExibido(i.titulo).toLowerCase().includes(filtro.toLowerCase()))
  return <Menu ancora={ancora} onFechar={onFechar} className={x.trash}>
    <input autoFocus value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Filtrar por título da página…" aria-label="Filtrar a lixeira" />
    <div className={x.trashList}>
      {itens === null ? <div className={x.searchEmpty}>Carregando…</div> : !visiveis.length ? <div className={x.searchEmpty}>A lixeira está vazia.</div>
        : visiveis.map(i => <div key={i.id} className={x.trashRow}>
          <span>{i.icone ?? <FileText size={16} />}</span>
          <span role="button" tabIndex={0} onClick={() => { onFechar(); router.push(`/notas/${i.id}`) }} onKeyDown={e => { if (e.key === 'Enter') router.push(`/notas/${i.id}`) }}>
            {tituloExibido(i.titulo)} {i.mae && <small>· {tituloExibido(i.mae)}</small>}
          </span>
          <button type="button" className={x.rowBtn} aria-label="Restaurar" title="Restaurar" onClick={() => void restaurar(i.id)}><Undo2 size={16} /></button>
          <button type="button" className={x.rowBtn} aria-label="Apagar de vez" title="Apagar de vez" onClick={() => void apagar(i.id)}><Trash2 size={16} /></button>
        </div>)}
    </div>
  </Menu>
}

/** Barra lateral das Notas: empresa, Buscar, Início, Favoritos, Equipe, Particular, Lixeira e Nova página. */
export function Sidebar() {
  const { arvore, erro, criar, mover, setBuscaAberta, recarregar, recolhida, setRecolhida } = useNotas()
  const { organization } = useOrganization()
  const params = useParams<{ id?: string }>()
  const pathname = usePathname()
  const [larguraSalva, salvarLargura] = useLocal('notas:largura', LARGURA_PADRAO)
  const [arrastandoLargura, setArrastandoLargura] = useState<number | null>(null)
  const largura = arrastandoLargura ?? larguraSalva
  const [abertasSalvas, salvarAbertas] = useLocal<string[]>('notas:abertas', [])
  const [soltar, setSoltar] = useState<Soltar>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [lixeira, setLixeira] = useState<HTMLElement | null>(null)
  const [redimensionando, setRedimensionando] = useState(false)
  const inicio = useRef<{ x: number; largura: number } | null>(null)

  // A página aberta fica visível: as mães dela aparecem expandidas.
  const abertas = useMemo(() => {
    const conjunto = new Set(abertasSalvas)
    if (arvore && params.id) {
      const porId = new Map(arvore.paginas.map(p => [p.id, p]))
      for (let mae = porId.get(params.id)?.parent_id; mae && !conjunto.has(mae); mae = porId.get(mae)?.parent_id) conjunto.add(mae)
    }
    return conjunto
  }, [abertasSalvas, arvore, params.id])
  const alternar = (id: string) => {
    const nova = new Set(abertas); if (nova.has(id)) nova.delete(id); else nova.add(id)
    salvarAbertas([...nova])
  }

  const equipe = useMemo(() => arvore ? montarArvore(arvore.paginas, 'equipe') : [], [arvore])
  const particular = useMemo(() => arvore ? montarArvore(arvore.paginas, 'particular') : [], [arvore])
  const favoritos = useMemo(() => {
    if (!arvore) return []
    const todas = [...equipe, ...particular]
    const achar = (nos: NoArvore[], id: string): NoArvore | undefined => { for (const n of nos) { if (n.id === id) return n; const f = achar(n.filhos, id); if (f) return f } }
    return arvore.favoritos.map(id => achar(todas, id)).filter((n): n is NoArvore => Boolean(n))
  }, [arvore, equipe, particular])

  /** Soltar uma página arrastada antes, depois ou dentro de outra. */
  const onSoltar = (alvo: NoArvore, onde: 'antes' | 'dentro' | 'depois') => {
    if (!arvore || !arrastando || arrastando === alvo.id) return
    if (onde === 'dentro') {
      const irmas = arvore.paginas.filter(p => p.parent_id === alvo.id).sort((a, b) => a.posicao - b.posicao)
      if (!abertas.has(alvo.id)) alternar(alvo.id)
      void mover(arrastando, { parent_id: alvo.id, espaco: alvo.espaco, posicao: posicaoEntre(irmas.at(-1)?.posicao ?? null, null) })
      return
    }
    const irmas = arvore.paginas.filter(p => p.parent_id === alvo.parent_id && p.espaco === alvo.espaco && p.id !== arrastando).sort((a, b) => a.posicao - b.posicao)
    const indice = irmas.findIndex(p => p.id === alvo.id)
    const antes = onde === 'antes' ? irmas[indice - 1]?.posicao ?? null : alvo.posicao
    const depois = onde === 'antes' ? alvo.posicao : irmas[indice + 1]?.posicao ?? null
    void mover(arrastando, { parent_id: alvo.parent_id, espaco: alvo.espaco, posicao: posicaoEntre(antes, depois) })
  }

  // Arrastar a borda muda a largura (como no Notion).
  useEffect(() => {
    if (!redimensionando) return
    let ultima: number | null = null
    const mover = (e: MouseEvent) => { if (inicio.current) { ultima = Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, inicio.current.largura + e.clientX - inicio.current.x)); setArrastandoLargura(ultima) } }
    const soltarBorda = () => { setRedimensionando(false); if (ultima != null) salvarLargura(ultima); setArrastandoLargura(null) }
    window.addEventListener('mousemove', mover); window.addEventListener('mouseup', soltarBorda)
    return () => { window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltarBorda) }
  }, [redimensionando, salvarLargura])

  const props = { abertas, alternar, atual: params.id, soltar, setSoltar, arrastando, setArrastando, onSoltar }
  const secao = (titulo: string, espaco: Espaco, nos: NoArvore[]) => <div role="group" aria-label={titulo}>
    <div className={x.sectionHead}
      onDragOver={e => { if (arrastando) e.preventDefault() }}
      onDrop={e => { e.preventDefault(); if (arrastando && arvore) void mover(arrastando, { parent_id: null, espaco, posicao: posicaoEntre(nos.at(-1)?.posicao ?? null, null) }) }}>
      <span>{titulo}</span>
      <button type="button" className={x.sectionAdd} aria-label={`Nova página em ${titulo}`} title="Adicionar uma página" onClick={() => void criar({ espaco })}><Plus size={14} /></button>
    </div>
    {nos.length ? nos.map(no => <Linha key={no.id} no={no} nivel={0} {...props} />)
      : <div className={x.empty} style={{ paddingLeft: 12 }}>{espaco === 'particular' ? 'Só você vê as páginas daqui.' : 'Nenhuma página ainda.'}</div>}
  </div>

  if (recolhida) return null

  return <aside className={x.side} style={{ width: largura }} aria-label="Notas">
    <div className={x.sideScroll}>
      <div className={x.workspace}>
        <span className={x.workspaceMark}>{(organization?.name ?? 'O').slice(0, 1).toUpperCase()}</span>
        <span className={x.workspaceName}>{organization?.name ?? 'Notas'}</span>
        <button type="button" className={x.collapse} aria-label="Recolher a barra lateral" title="Recolher a barra lateral" onClick={() => setRecolhida(true)}><ChevronsLeft size={18} /></button>
      </div>
      <button type="button" className={x.navItem} onClick={() => setBuscaAberta(true)}><Search size={16} />Buscar<kbd>Ctrl+K</kbd></button>
      <Link href="/notas" className={`${x.navItem} ${pathname === '/notas' ? x.navOn : ''}`}><House size={16} />Início</Link>

      {erro && <div className={x.empty} style={{ padding: '0 16px', height: 'auto' }}>
        <span>{erro} <button type="button" onClick={() => void recarregar()} style={{ textDecoration: 'underline' }}>Tentar de novo</button></span>
      </div>}
      {favoritos.length > 0 && <div role="group" aria-label="Favoritos">
        <div className={x.sectionHead}><span>Favoritos</span></div>
        {favoritos.map(no => <Linha key={`fav-${no.id}`} no={no} nivel={0} {...props} />)}
      </div>}
      {arvore && <div role="tree" aria-label="Páginas">
        {secao('Equipe', 'equipe', equipe)}
        {secao('Particular', 'particular', particular)}
      </div>}
    </div>
    <div className={x.sideFoot}>
      <button type="button" className={x.navItem} onClick={e => setLixeira(e.currentTarget)}><Trash2 size={16} />Lixeira</button>
      <button type="button" className={x.navItem} onClick={() => void criar({ espaco: arvore?.pode_editar_equipe === false ? 'particular' : 'equipe' })}><Plus size={16} />Nova página</button>
    </div>
    {lixeira && <Lixeira ancora={lixeira} onFechar={() => setLixeira(null)} />}
    <div className={`${x.resizer} ${redimensionando ? x.resizing : ''}`} role="separator" aria-orientation="vertical" aria-label="Largura da barra lateral"
      onMouseDown={e => { e.preventDefault(); inicio.current = { x: e.clientX, largura }; setRedimensionando(true) }}
      onDoubleClick={() => salvarLargura(LARGURA_PADRAO)} />
  </aside>
}

