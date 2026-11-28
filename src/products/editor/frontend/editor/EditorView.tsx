'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CloudCheck, Download, History, MessageSquare, Plus, RectangleVertical } from 'lucide-react'
import type { PlayerRef } from '@remotion/player'
import { Preview } from './preview/Preview'
import { Timeline } from './timeline/Timeline'
import { LeftPanel, uploadToEditor, type ChatMessage } from './panels/LeftPanel'
import { Properties } from './panels/Properties'
import { runCommand } from './ai/commands'
import { aplicarAcoes, resumoParaIa, type Acao } from './ai/acoes'
import { clipesComFala, comLegendas, gerarLegendas } from './project/legendasAuto'
import { blankProject, defaultBox, fullBox, media, type MediaItem } from './project/data'
import { fromTemplate } from './project/templates'
import { addClip, clipEnd, duplicateClip, groupClips, insertClip, isLocked, projectDuration, removeClips, rippleDelete, splitAt, toggleMarker, ungroupClips, withGroup } from './project/ops'
import { addComment, deleteComment, linkExport, listComments, listVersions, newProjectId, setCommentResolved, storeProjectNow, type Comentario, type Version } from './project/store'
import { Comentarios } from './versions/Comentarios'
import { useVersoes } from './versions/useVersoes'
import { Historico } from './versions/Historico'
import { useRouter } from 'next/navigation'
import { copyClips, pasteClips, type ClipboardItem } from './project/clipboard'
import { createFrameStore, useEditor } from './project/useEditor'
import { FPS, localStamp, type ClipProps, type Project, type TrackKind } from './project/types'
import e from './editor.module.css'
import { ExportDialog } from './export/ExportDialog'

export function EditorView({ initial, fileIds }: { initial: Project; fileIds?: string[] }) {
  const { project, apply, transient, commit, undo, redo, canUndo, canRedo, externalChanges, carregado } = useEditor(initial, fileIds?.length ? () => blankProject(initial.id, fileIds) : undefined)
  const [selection, setSelection] = useState<string[]>([])
  const [insertMode, setInsertMode] = useState(false)
  const [loop, setLoop] = useState<{ start: number; end: number } | null>(null)
  const [rate, setRate] = useState(1)
  const [pane, setPane] = useState<'ferramentas' | 'propriedades'>('ferramentas')
  /** The project's settings (format, background) open on the right when nothing is selected. */
  const [projectOpen, setProjectOpen] = useState(false)
  const clipboard = useRef<ClipboardItem[]>([])
  const [playing, setPlaying] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const playerRef = useRef<PlayerRef>(null)
  const versoes = useVersoes(project, carregado)
  // Comentários no vídeo (revisão): a lista, o painel e as marcas na régua. Recarrega quando o assistente muda o
  // projeto (ele resolve os comentários que seguiu).
  const [comentarios, setComentarios] = useState<Comentario[] | null>(null)
  const [comentariosAbertos, setComentariosAbertos] = useState(false)
  const [rotulosVersao, setRotulosVersao] = useState<Record<string, string>>({})
  const recarregarComentarios = useCallback(() => { void listComments(project.id).then(setComentarios) }, [project.id])
  useEffect(() => { if (carregado) recarregarComentarios() }, [carregado, externalChanges, recarregarComentarios])
  const abrirComentarios = (destaque?: string) => {
    versoes.fechar(); setComentariosAbertos(true)
    void listVersions(project.id).then(l => setRotulosVersao(Object.fromEntries(l.map(v => [v.id, v.label]))))
    if (destaque) setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-comentario="${destaque}"]`)
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); el?.classList.add(e.comentarioDestaque); setTimeout(() => el?.classList.remove(e.comentarioDestaque), 1800)
    }, 60)
  }
  const comentarAqui = () => { abrirComentarios(); setTimeout(() => document.querySelector<HTMLTextAreaElement>('[aria-label="Comentário"]')?.focus(), 50) }
  const comentarAquiRef = useRef(comentarAqui)
  useEffect(() => { comentarAquiRef.current = comentarAqui })
  const router = useRouter()
  const restaurar = (v: Version, p: Project) => {
    void (async () => {
      await versoes.antes('Antes de restaurar')
      const novo = { ...p, id: project.id }
      apply(() => novo)
      await versoes.versionar('restauracao', `Restaurada: ${v.label}`, { projeto: novo })
      setToast(`“${v.label}” restaurada. O que havia antes ficou guardado no histórico.`)
    })()
  }
  const duplicarVersao = (v: Version, p: Project) => {
    void (async () => {
      const novo: Project = { ...p, id: newProjectId(), name: `${p.name} (${v.at.slice(8, 10)}/${v.at.slice(5, 7)} ${v.at.slice(11, 16)})`, updatedAt: localStamp() }
      await storeProjectNow(novo)
      router.push(`/editor/${novo.id}`)
    })()
  }
  const frames = useMemo(() => createFrameStore(), [])
  const duration = projectDuration(project)

  const seek = useCallback((f: number) => {
    const frame = Math.max(0, Math.min(duration - 1, Math.round(f)))
    frames.set(frame)
    playerRef.current?.seekTo(frame)
  }, [duration, frames])
  const toggle = useCallback(() => { setRate(1); playerRef.current?.toggle() }, [])
  const fullscreen = useCallback(() => playerRef.current?.requestFullscreen(), [])

  /** Loops between the markers around the playhead, or the whole video when there are none. */
  const toggleLoop = useCallback(() => {
    if (loop) return setLoop(null)
    const f = frames.get(), marks = project.markers ?? []
    setLoop({ start: [...marks].reverse().find(m => m <= f) ?? 0, end: marks.find(m => m > f) ?? duration })
  }, [loop, frames, project.markers, duration])
  useEffect(() => {
    if (!loop) return
    return frames.subscribe(() => {
      const f = frames.get()
      if (playing && (f >= loop.end - 1 || f < loop.start)) playerRef.current?.seekTo(loop.start)
    })
  }, [loop, playing, frames])
  // Player stops at the end of the video; while looping the whole video, start again.
  useEffect(() => {
    const pl = playerRef.current
    if (!pl || !loop) return
    const again = () => { pl.seekTo(loop.start); pl.play() }
    pl.addEventListener('ended', again)
    return () => pl.removeEventListener('ended', again)
  }, [loop])

  const addMedia = useCallback((m: MediaItem, frame = frames.get(), trackId?: string) => {
    const kind: TrackKind = m.kind
    const seconds = m.kind === 'imagem' ? 3 : Math.min(m.duration ?? 5, m.kind === 'audio' ? 30 : 10)
    const props: ClipProps = m.kind === 'audio' ? { fileId: m.id, volume: m.id === 'a-narr' ? 1 : 0.4 } : { fileId: m.id, box: m.kind === 'video' ? fullBox : defaultBox.imagem, opacity: 1, volume: 1 }
    const clip = { start: frame, duration: Math.round(seconds * FPS), trimStart: 0, props }
    const r = insertMode ? insertClip(project, kind, clip, frame, trackId) : addClip(project, kind, clip, trackId)
    apply(() => r.project)
    setSelection([r.id])
  }, [apply, frames, project, insertMode])

  /** Several media at once, one after the other from the playhead (built on the latest project, so all of them stay). */
  const addMediaMany = useCallback((list: MediaItem[]) => {
    if (!list.length) return
    let at = frames.get()
    const placed = list.map(m => {
      const seconds = m.kind === 'imagem' ? 3 : Math.min(m.duration ?? 5, m.kind === 'audio' ? 30 : 10)
      const props: ClipProps = m.kind === 'audio' ? { fileId: m.id, volume: 0.4 } : { fileId: m.id, box: m.kind === 'video' ? fullBox : defaultBox.imagem, opacity: 1, volume: 1 }
      const clip = { start: at, duration: Math.round(seconds * FPS), trimStart: 0, props }
      if (m.kind !== 'audio') at += clip.duration
      return { kind: m.kind as TrackKind, clip }
    })
    apply(p => placed.reduce((acc, x) => addClip(acc, x.kind, x.clip).project, p))
    setSelection([])
  }, [apply, frames])

  /** Swaps the project for a template (same id and name); Ctrl+Z brings the old one back. */
  const applyTemplate = useCallback(async (templateId: string) => {
    await versoes.antes('Antes de aplicar um modelo')
    apply(p => { const t = fromTemplate(p.id, templateId); return t ? { ...t, name: p.name } : p })
    setSelection([])
    setToast('Modelo aplicado. Ctrl+Z desfaz.')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- versoes.antes é estável o bastante (muda só com o autor)
  }, [apply])

  const uploadInput = useRef<HTMLInputElement>(null)
  /** Files picked or dropped on the empty preview: saved to the Drive and put in the video. */
  const uploadAndAdd = useCallback(async (list: File[]) => {
    const ids = await uploadToEditor(list, setToast)
    addMediaMany(ids.flatMap(id => media(id) ?? []))
  }, [addMediaMany])

  /** seconds 0 means the whole video (progress bar). */
  const addPreset = useCallback((kind: TrackKind, props: ClipProps, seconds: number) => {
    const r = seconds === 0 ? addClip(project, kind, { start: 0, duration: projectDuration(project), trimStart: 0, props }) : addClip(project, kind, { start: frames.get(), duration: seconds * FPS, trimStart: 0, props })
    apply(() => r.project)
    setSelection([r.id])
  }, [apply, frames, project])

  // Ids that still exist (undo can remove a selected clip).
  const allIds = useMemo(() => new Set(project.tracks.flatMap(t => t.clips.map(c => c.id))), [project])
  const selected = useMemo(() => selection.filter(id => allIds.has(id)), [selection, allIds])
  /** Selecting a grouped clip selects the whole group. */
  const select = useCallback((id: string | null, toggleIt = false) => {
    if (!id) return setSelection([])
    const ids = withGroup(project, id)
    if (window.matchMedia('(max-width: 960px)').matches) setPane('propriedades')
    setSelection(s => toggleIt ? (ids.every(x => s.includes(x)) ? s.filter(x => !ids.includes(x)) : [...new Set([...s, ...ids])]) : ids)
  }, [project])

  const split = useCallback(() => {
    if (selected.length !== 1) return
    const r = splitAt(project, selected[0], frames.get())
    if (!r) return setToast('Posicione a agulha dentro do clipe para dividir.')
    apply(() => r.project)
    setSelection([r.id])
  }, [apply, frames, project, selected])
  // Clips on locked tracks are never deleted.
  const editable = useMemo(() => selected.filter(id => !isLocked(project, id)), [selected, project])
  const remove = useCallback(() => { if (editable.length) { apply(p => removeClips(p, editable)); setSelection([]) } }, [apply, editable])
  const ripple = useCallback(() => { if (editable.length) { apply(p => rippleDelete(p, editable)); setSelection([]) } }, [apply, editable])
  const copy = useCallback(() => {
    if (!selected.length) return
    clipboard.current = copyClips(project, selected)
    setToast(`${selected.length} ${selected.length === 1 ? 'clipe copiado' : 'clipes copiados'}. Ctrl+V cola na agulha.`)
  }, [project, selected])
  const paste = useCallback(() => {
    if (!clipboard.current.length) return
    const r = pasteClips(project, clipboard.current, frames.get())
    apply(() => r.project)
    setSelection(r.ids)
  }, [apply, frames, project])
  const duplicate = useCallback(() => {
    if (selected.length === 1) {
      const r = duplicateClip(project, selected[0])
      if (r) { apply(() => r.project); setSelection([r.id]) }
    } else if (selected.length > 1) {
      const items = copyClips(project, selected)
      const r = pasteClips(project, items, Math.max(...items.map(i => clipEnd(i.clip))))
      apply(() => r.project)
      setSelection(r.ids)
    }
  }, [apply, project, selected])

  const group = useCallback(() => { if (editable.length > 1) { apply(p => groupClips(p, editable)); setToast('Clipes agrupados. Ctrl+Shift+G desagrupa.') } }, [apply, editable])
  const ungroup = useCallback(() => { if (selected.length) apply(p => ungroupClips(p, selected)) }, [apply, selected])

  // IA do editor: o servidor (Claude) escolhe as ações da linha do tempo; elas entram numa mudança só (um Ctrl+Z
  // desfaz). Sem a IA no servidor (ou se ela falhar), o leitor de comandos simples responde no lugar.
  const [pensando, setPensando] = useState(false)
  const ask = async (text: string) => {
    const frame = frames.get(), historico = chat.map(m => ({ de: m.from, texto: m.text }))
    setChat(c => [...c, { from: 'voce', text }])
    setPensando(true)
    try {
      const resposta = await fetch('/api/editor/ia', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pedido: text, projeto: resumoParaIa(project, frame, selected, f => media(f)?.name), historico }) })
      const corpo = await resposta.json().catch(() => ({})) as { resposta?: string; acoes?: Acao[]; erro?: string }
      if (!resposta.ok) throw new Error(corpo.erro ?? 'ia')
      let pediuLegendas = false
      if (corpo.acoes?.length) await versoes.antes('Antes da edição da IA')
      if (corpo.acoes?.length) apply(p => { const r = aplicarAcoes(p, corpo.acoes!, frame, selected, { ehMusica: f => media(f)?.role === 'musica' || (!!f?.startsWith('a-') && f !== 'a-narr') }); pediuLegendas = r.legendas; return r.project }, `ia:${Date.now()}`)
      setChat(c => [...c, { from: 'ia', text: corpo.resposta ?? 'Pronto.' }])
      if (pediuLegendas || corpo.acoes?.some(a => a.tipo === 'gerar_legendas')) {
        const clipes = clipesComFala(project, [])
        const legendas = clipes.length ? await gerarLegendas(clipes, () => {}) : []
        if (legendas.length) { apply(p => comLegendas(p, legendas), `legendas:${Date.now()}`); setChat(c => [...c, { from: 'ia', text: `${legendas.length} legendas criadas a partir da fala.` }]) }
      }
    } catch {
      const r = runCommand(project, text, frame)
      if (r.project) { const next = r.project; apply(() => next) }
      setChat(c => [...c, { from: 'ia', text: r.reply }])
    } finally { setPensando(false) }
  }

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return
      const mod = ev.ctrlKey || ev.metaKey
      if (ev.key === ' ') { ev.preventDefault(); toggle() }
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { ev.preventDefault(); seek(frames.get() + (ev.key === 'ArrowLeft' ? -1 : 1) * (ev.shiftKey ? FPS : 1)) }
      else if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); if (ev.shiftKey) redo(); else undo() }
      else if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo() }
      else if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicate() }
      else if (mod && ev.key.toLowerCase() === 'c') copy()
      else if (mod && ev.key.toLowerCase() === 'x') { copy(); remove() }
      else if (mod && ev.key.toLowerCase() === 'v') { ev.preventDefault(); paste() }
      else if (mod && ev.key.toLowerCase() === 'a') { ev.preventDefault(); setSelection([...allIds]) }
      else if (!mod && ev.key.toLowerCase() === 's') split()
      else if (!mod && ev.key.toLowerCase() === 'm') apply(p => toggleMarker(p, frames.get()))
      else if (!mod && ev.key.toLowerCase() === 'c') { ev.preventDefault(); comentarAquiRef.current() }
      else if (ev.key === 'Delete' || ev.key === 'Backspace') { if (ev.shiftKey) ripple(); else remove() }
      else if (ev.key === 'Escape') setSelection([])
      else if (mod && ev.key.toLowerCase() === 'g') { ev.preventDefault(); if (ev.shiftKey) ungroup(); else group() }
      else if (!mod && ev.key.toLowerCase() === 'f') fullscreen()
      else if (!mod && ev.key.toLowerCase() === 'k') { playerRef.current?.pause(); setRate(1) }
      else if (!mod && ev.key.toLowerCase() === 'l') {
        // Each L speeds up: 1x, 2x, 4x.
        const pl = playerRef.current
        if (!pl) return
        const next = pl.isPlaying() ? Math.min(4, rate * 2) : 1
        setRate(next)
        if (!pl.isPlaying()) pl.play()
      }
      else if (!mod && ev.key.toLowerCase() === 'j') { playerRef.current?.pause(); setRate(1); seek(frames.get() - FPS) }
      else if (ev.key === 'Home') seek(0)
      else if (ev.key === 'End') seek(duration - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, seek, frames, undo, redo, duplicate, split, remove, ripple, copy, paste, allIds, apply, group, ungroup, fullscreen, rate, duration])

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2600); return () => clearTimeout(t) }, [toast])
  useEffect(() => { if (externalChanges) setToast('O projeto foi alterado pelo assistente. Ctrl+Z desfaz.') }, [externalChanges])

  const empty = project.tracks.every(t => !t.clips.length)
  // Properties only show for a selection (or the project's settings), so the preview gets the room.
  const showProps = selected.length > 0 || projectOpen
  return <div className={e.editor} data-editor>
    <header className={e.top}>
      <input className={e.name} value={project.name} onChange={ev => apply(p => ({ ...p, name: ev.target.value }), 'name')} aria-label="Nome do projeto" />
      <span className={e.saved}><CloudCheck size={15} />Salvo neste navegador</span>
      <span className={e.grow} />
      <span className={e.format}>{project.format}</span>
      <div className={e.versionsWrap}>
        <button className={`${e.versionsBtn} ${e.botaoComentarios}`} onClick={() => comentariosAbertos ? setComentariosAbertos(false) : abrirComentarios()} aria-expanded={comentariosAbertos} aria-label="Comentários">
          <MessageSquare size={16} />Comentários{comentarios?.some(c => !c.resolvidoEm) ? <i>{comentarios.filter(c => !c.resolvidoEm).length}</i> : null}</button>
        <button className={e.versionsBtn} onClick={() => { setComentariosAbertos(false); if (versoes.aberto) versoes.fechar(); else versoes.abrir() }} aria-expanded={versoes.aberto}><History size={16} />Versões</button>
      </div>
      <button className={e.export} onClick={() => { playerRef.current?.pause(); setExporting(true) }}><Download size={16} />Exportar</button>
    </header>
    <LeftPanel project={project} selectedIds={selected} apply={apply} onApplyTemplate={t => void applyTemplate(t)} antes={versoes.antes} onAddMedia={m => addMedia(m)} onAddMediaMany={addMediaMany} onAddPreset={addPreset} onToast={setToast} chat={chat} onAsk={t => void ask(t)} pensando={pensando} />
    <div className={`${e.body} ${showProps ? e.withProps : ''} ${pane === 'propriedades' ? e.showProps : e.showTools}`}>
      <div className={e.paneSwitch}><button className={pane === 'ferramentas' ? e.segOn : ''} onClick={() => setPane('ferramentas')}>Ferramentas</button><button className={pane === 'propriedades' ? e.segOn : ''} onClick={() => setPane('propriedades')}>Propriedades</button></div>
      <div className={e.stage}>
        <button type="button" className={`${e.projectBtn} ${projectOpen && !selected.length ? e.projectBtnOn : ''}`} onClick={() => { setSelection([]); setProjectOpen(o => !(o && !selected.length)) }} aria-pressed={projectOpen && !selected.length} title="Formato e fundo do projeto"><RectangleVertical size={16} />Projeto</button>
        <Preview project={project} playerRef={playerRef} frames={frames} selectedId={selected.length === 1 ? selected[0] : null} onSelect={id => select(id)} transient={transient} commit={commit} onPlaying={setPlaying} playbackRate={rate} />
        {empty && <div className={e.emptyStage} onDragOver={ev => { if (ev.dataTransfer.types.includes('Files')) ev.preventDefault() }} onDrop={ev => { ev.preventDefault(); void uploadAndAdd([...ev.dataTransfer.files]) }}>
          <input ref={uploadInput} type="file" multiple accept="video/*,image/*,audio/*" hidden onChange={ev => { void uploadAndAdd([...(ev.target.files ?? [])]); ev.target.value = '' }} />
          <button type="button" className={e.emptyPlus} onClick={() => uploadInput.current?.click()} aria-label="Carregar mídia"><Plus size={30} /></button>
          <b>Clique para carregar</b><span>Ou arraste e solte um arquivo aqui</span>
        </div>}
      </div>
      {showProps && <Properties project={project} selectedIds={selected} frames={frames} apply={apply} seek={seek} onDuplicate={duplicate} onSplit={split} onDelete={remove} onRipple={ripple} onCopy={copy} onGroup={group} onUngroup={ungroup} />}
    </div>
    <Timeline project={project} frames={frames} duration={duration} selectedIds={selected} playing={playing} onSelect={select} onSelectMany={setSelection} insertMode={insertMode} setInsertMode={setInsertMode} loop={loop} onToggleLoop={toggleLoop} onFullscreen={fullscreen} rate={rate} seek={seek} toggle={toggle}
      apply={apply} transient={transient} commit={commit} onSplit={split} onDelete={remove} onRipple={ripple} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
      onDropMedia={(id, frame, trackId) => { const m = media(id); if (m) addMedia(m, frame, trackId) }}
      comentarios={(comentarios ?? []).filter(c => !c.resolvidoEm)} onComentario={id => abrirComentarios(id)} />
    {toast && <div className={e.toast} role="status"><Check size={15} />{toast}</div>}
    {exporting && <ExportDialog project={project} onClose={() => setExporting(false)} onExported={fileId => {
      // Cada exportação vira uma versão (para sempre), ligada ao arquivo de vídeo gerado.
      const agora = new Date()
      const quando = `${String(agora.getDate()).padStart(2, '0')}/${String(agora.getMonth() + 1).padStart(2, '0')} às ${agora.toTimeString().slice(0, 5)}`
      void versoes.versionar('exportacao', `Exportado em ${quando}`).then(v => { if (fileId) void linkExport(project.id, v.id, fileId) }).catch(() => undefined)
    }} />}
    {comentariosAbertos && <Comentarios lista={comentarios} frames={frames} pausar={() => playerRef.current?.pause()} irPara={s => seek(s * FPS)}
      onFechar={() => setComentariosAbertos(false)} versaoDe={id => (id ? rotulosVersao[id] : undefined)}
      onCriar={async (segundo, texto) => { const c = await addComment(project, segundo, texto, versoes.autor); setComentarios(l => [...(l ?? []), c].sort((a, b) => a.segundo - b.segundo)) }}
      onResolver={(c, r) => { void setCommentResolved(project.id, c.id, r).then(recarregarComentarios) }}
      onApagar={c => { void deleteComment(project.id, c.id).then(recarregarComentarios) }} />}
    {versoes.aberto && <Historico projectId={project.id} versoes={versoes.lista} onFechar={versoes.fechar} onRenomear={versoes.renomear}
      onSalvar={async nome => { await versoes.versionar('manual', nome, { nomeada: true }); setToast('Versão salva.') }}
      onRestaurar={restaurar} onDuplicar={duplicarVersao} />}
  </div>
}
