'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, CornerDownLeft, MessageSquare, MoreHorizontal, RotateCcw, X } from 'lucide-react'
import { notasApi } from './api'
import { ItemMenu, Menu } from './Menu'
import { useNotas } from './NotasProvider'
import { usePessoas, type Pessoa } from './base/pessoas'
import { saidaPainel } from './saida'
import x from './notas.module.css'

export type Comentario = {
  id: string; discussao_id: string | null; bloco_id: string | null; trecho: string | null; texto: string
  resolvido: boolean; autor: string; created_at: string; editado_em: string | null
}
const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Autor({ id, pessoas, euId }: { id: string; pessoas: Pessoa[]; euId: string | null }) {
  const p = pessoas.find(q => q.id === id)
  const nome = id === euId ? 'Você' : p?.nome ?? 'Alguém da empresa'
  return <span className={x.person}><span className={x.avatar}>{nome.slice(0, 1).toUpperCase()}</span><b style={{ fontWeight: 600 }}>{nome}</b></span>
}

function Caixa({ placeholder, onEnviar, inicial = '', autoFocus }: { placeholder: string; onEnviar: (texto: string) => Promise<boolean>; inicial?: string; autoFocus?: boolean }) {
  const [texto, setTexto] = useState(inicial)
  const enviar = async () => { if (texto.trim() && await onEnviar(texto)) setTexto('') }
  return <div className={x.commentBox}>
    <textarea autoFocus={autoFocus} value={texto} rows={1} placeholder={placeholder} aria-label={placeholder} maxLength={5000}
      onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void enviar() } }} />
    <button type="button" aria-label="Enviar comentário" disabled={!texto.trim()} onClick={() => void enviar()}><CornerDownLeft size={14} /></button>
  </div>
}

/**
 * Comentários da página: discussões (na página ou num bloco, com o trecho citado), respostas, resolver/reabrir,
 * editar e apagar os próprios. Ctrl+Alt+M no texto comenta o bloco do cursor.
 */
export function Comentarios({ paginaId, euId, rascunho, onFechar, onIrPara, onMudou, embutido }: {
  paginaId: string; euId: string | null; rascunho: { bloco_id: string; trecho: string } | null
  onFechar?: () => void; onIrPara: (blocoId: string) => void; onMudou: (lista: Comentario[]) => void
  /** Dentro do item de uma base, logo abaixo das propriedades (como no Notion), em vez do painel lateral. */
  embutido?: boolean
}) {
  const { avisar } = useNotas()
  const pessoas = usePessoas()
  const [lista, setLista] = useState<Comentario[] | null>(null)
  const [aba, setAba] = useState<'abertos' | 'resolvidos'>('abertos')
  const [editando, setEditando] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ ancora: HTMLElement; c: Comentario } | null>(null)

  const aplicar = useCallback((nova: Comentario[]) => { setLista(nova); onMudou(nova) }, [onMudou])
  const carregar = useCallback(() => notasApi<Comentario[]>(`/paginas/${paginaId}/comentarios`).then(aplicar).catch(e => avisar((e as Error).message)), [paginaId, aplicar, avisar])
  useEffect(() => {
    let ativo = true
    notasApi<Comentario[]>(`/paginas/${paginaId}/comentarios`).then(l => { if (ativo) aplicar(l) }).catch(e => { if (ativo) avisar((e as Error).message) })
    return () => { ativo = false }
  }, [paginaId, aplicar, avisar])

  const enviar = async (json: Record<string, unknown>) => {
    try { await notasApi(`/paginas/${paginaId}/comentarios`, { method: 'POST', json }); await carregar(); return true } catch (e) { avisar((e as Error).message); return false }
  }
  const alterar = async (id: string, json: Record<string, unknown>) => {
    try { await notasApi(`/comentarios/${id}`, { method: 'PATCH', json }); await carregar(); return true } catch (e) { avisar((e as Error).message); return false }
  }
  const apagar = async (id: string) => { try { await notasApi(`/comentarios/${id}`, { method: 'DELETE' }); await carregar() } catch (e) { avisar((e as Error).message) } }

  const discussoes = (lista ?? []).filter(c => !c.discussao_id && (aba === 'resolvidos') === c.resolvido)
  const respostas = (id: string) => (lista ?? []).filter(c => c.discussao_id === id)
  const comentario = (c: Comentario) => <div key={c.id} className={x.comment}>
    <div className={x.commentHead}>
      <Autor id={c.autor} pessoas={pessoas} euId={euId} /><small>{quando(c.created_at)}{c.editado_em ? ' (editado)' : ''}</small>
      {c.autor === euId && <button type="button" className={x.rowBtn} aria-label="Opções do comentário" onClick={e => setMenu({ ancora: e.currentTarget, c })}><MoreHorizontal size={14} /></button>}
    </div>
    {editando === c.id
      ? <Caixa autoFocus inicial={c.texto} placeholder="Editar comentário" onEnviar={async t => { const ok = await alterar(c.id, { texto: t }); if (ok) setEditando(null); return ok }} />
      : <p className={x.commentText}>{c.texto}</p>}
  </div>

  const resolvidas = (lista ?? []).filter(c => !c.discussao_id && c.resolvido).length
  const Moldura = embutido ? 'section' : 'aside'
  return <Moldura ref={embutido ? undefined : saidaPainel} className={embutido ? x.comentariosItem : x.comments} aria-label="Comentários">
    {embutido
      ? <div className={x.comentariosItemTopo}>
        <b>Comentários</b>
        {(resolvidas > 0 || aba === 'resolvidos') && <button type="button" className={x.barBtn} onClick={() => setAba(aba === 'abertos' ? 'resolvidos' : 'abertos')}>
          {aba === 'abertos' ? `Ver resolvidos (${resolvidas})` : 'Ver abertos'}
        </button>}
      </div>
      : <>
        <div className={x.historyHead}>
          <b><MessageSquare size={14} style={{ display: 'inline', marginRight: 6 }} />Comentários</b>
          <button type="button" className={x.topBtn} aria-label="Fechar comentários" onClick={onFechar}><X size={16} /></button>
        </div>
        <div className={x.pickerTabs} style={{ padding: '0 12px 6px' }}>
          <button type="button" className={aba === 'abertos' ? x.tabOn : ''} onClick={() => setAba('abertos')}>Abertos</button>
          <button type="button" className={aba === 'resolvidos' ? x.tabOn : ''} onClick={() => setAba('resolvidos')}>Resolvidos</button>
        </div>
      </>}
    <div className={embutido ? x.comentariosItemLista : x.commentList}>
      {aba === 'abertos' && <div className={x.thread}>
        {rascunho && <blockquote className={x.commentQuote}>{rascunho.trecho || 'Bloco selecionado'}</blockquote>}
        <Caixa key={rascunho?.bloco_id ?? 'pagina'} autoFocus={Boolean(rascunho)} placeholder={rascunho ? 'Comentar este trecho…' : embutido ? 'Adicionar um comentário…' : 'Comentar a página…'}
          onEnviar={t => enviar({ texto: t, ...(rascunho ? { bloco_id: rascunho.bloco_id, trecho: rascunho.trecho } : {}) })} />
      </div>}
      {lista === null && <div className={x.muted} style={{ padding: 16 }}>Carregando…</div>}
      {lista && !discussoes.length && !(embutido && aba === 'abertos') && <div className={x.muted} style={{ padding: 16, fontSize: 13 }}>
        {aba === 'abertos' ? 'Nenhuma discussão aberta. Dica: Ctrl+Alt+M comenta o bloco onde está o cursor.' : 'Nenhuma discussão resolvida.'}
      </div>}
      {discussoes.map(d => <div key={d.id} className={x.thread}>
        {d.trecho !== null && d.bloco_id && <blockquote className={x.commentQuote} role="button" tabIndex={0} title="Ir para o trecho"
          onClick={() => onIrPara(d.bloco_id!)} onKeyDown={e => { if (e.key === 'Enter') onIrPara(d.bloco_id!) }}>{d.trecho || 'Bloco'}</blockquote>}
        {comentario(d)}
        {respostas(d.id).map(comentario)}
        <div className={x.threadActions}>
          {!d.resolvido && <Caixa placeholder="Responder…" onEnviar={t => enviar({ texto: t, discussao_id: d.id })} />}
          <button type="button" className={x.barBtn} onClick={() => void alterar(d.id, { resolvido: !d.resolvido })}>
            {d.resolvido ? <><RotateCcw size={14} />Reabrir</> : <><Check size={14} />Resolver</>}
          </button>
        </div>
      </div>)}
    </div>
    {menu && <Menu ancora={menu.ancora} onFechar={() => setMenu(null)} alinhar="fim">
      <ItemMenu onClick={() => { setEditando(menu.c.id); setMenu(null) }}>Editar</ItemMenu>
      <ItemMenu perigo onClick={() => { const c = menu.c; setMenu(null); if (window.confirm('Apagar este comentário?')) void apagar(c.id) }}>Apagar</ItemMenu>
    </Menu>}
  </Moldura>
}
