'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, CloudCheck, Download, History } from 'lucide-react'
import type { PlayerRef } from '@remotion/player'
import { formatDateTime } from '@/products/editor/frontend/lib/format'
import { Preview } from './preview/Preview'
import { Timeline } from './timeline/Timeline'
import { LeftPanel, type ChatMessage } from './panels/LeftPanel'
import { Properties } from './panels/Properties'
import { runCommand } from './ai/commands'
import { blankProject, defaultBox, fullBox, media, type MediaItem } from './project/data'
import { addClip, clipEnd, duplicateClip, groupClips, insertClip, isLocked, projectDuration, removeClips, rippleDelete, splitAt, toggleMarker, ungroupClips, withGroup } from './project/ops'
import { listVersions, saveVersion, type Version } from './project/store'
import { copyClips, pasteClips, type ClipboardItem } from './project/clipboard'
import { createFrameStore, useEditor } from './project/useEditor'
import { FPS, type ClipProps, type Project, type TrackKind } from './project/types'
import e from './editor.module.css'
import { ExportDialog } from './export/ExportDialog'

export function EditorView({ initial, fileIds }: { initial: Project; fileIds?: string[] }) {
  const { project, apply, transient, commit, undo, redo, canUndo, canRedo, externalChanges } = useEditor(initial, fileIds?.length ? () => blankProject(initial.id, fileIds) : undefined)
  const [selection, setSelection] = useState<string[]>([])
  const [insertMode, setInsertMode] = useState(false)
  const [loop, setLoop] = useState<{ start: number; end: number } | null>(null)
  const [rate, setRate] = useState(1)
  const [pane, setPane] = useState<'ferramentas' | 'propriedades'>('ferramentas')
  const [versions, setVersions] = useState<Version[] | null>(null)
  const clipboard = useRef<ClipboardItem[]>([])
  const [playing, setPlaying] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const playerRef = useRef<PlayerRef>(null)
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

  const ask = (text: string) => {
    const r = runCommand(project, text, frames.get())
    if (r.project) { const next = r.project; apply(() => next) }
    setChat(c => [...c, { from: 'voce', text }, { from: 'ia', text: r.reply }])
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

  return <div className={e.editor} data-editor>
    <header className={e.top}>
      <Link href="/editor" className={e.home} aria-label="Voltar ao início do Editor" title="Voltar ao início do Editor">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logoOttoIcon.svg" alt="" width={22} height={22} />
      </Link>
      <input className={e.name} value={project.name} onChange={ev => apply(p => ({ ...p, name: ev.target.value }), 'name')} aria-label="Nome do projeto" />
      <span className={e.saved}><CloudCheck size={15} />Salvo neste navegador</span>
      <span className={e.grow} />
      <span className={e.format}>{project.format}</span>
      <div className={e.versionsWrap}>
        <button className={e.versionsBtn} onClick={() => { if (versions) setVersions(null); else void listVersions(project.id).then(setVersions) }} aria-expanded={!!versions}><History size={16} />Versões</button>
        {versions && <div className={e.versions}>
          <button className={e.saveVersion} onClick={() => { void saveVersion(project, `Versão ${versions.length + 1}`).then(list => { setVersions(list); setToast('Versão salva.') }).catch(() => setToast('Não foi possível salvar a versão.')) }}>Salvar versão agora</button>
          {versions.length === 0 && <p className={e.hint}>Nenhuma versão salva ainda.</p>}
          {versions.map(v => <div key={v.at + v.label} className={e.versionRow}>
            <span><b>{v.label}</b><small>{formatDateTime(v.at)}</small></span>
            <button onClick={() => { void saveVersion(project, 'Antes de restaurar'); apply(() => ({ ...v.project, id: project.id })); setVersions(null); setToast(`${v.label} restaurada. A versão anterior foi guardada.`) }}>Restaurar</button>
          </div>)}
        </div>}
      </div>
      <button className={e.export} onClick={() => { playerRef.current?.pause(); setExporting(true) }}><Download size={16} />Exportar</button>
    </header>
    <div className={`${e.body} ${pane === 'propriedades' ? e.showProps : e.showTools}`}>
      <div className={e.paneSwitch}><button className={pane === 'ferramentas' ? e.segOn : ''} onClick={() => setPane('ferramentas')}>Ferramentas</button><button className={pane === 'propriedades' ? e.segOn : ''} onClick={() => setPane('propriedades')}>Propriedades</button></div>
      <LeftPanel onAddMedia={m => addMedia(m)} onAddPreset={addPreset} chat={chat} onAsk={ask} />
      <Preview project={project} playerRef={playerRef} frames={frames} selectedId={selected.length === 1 ? selected[0] : null} onSelect={id => select(id)} transient={transient} commit={commit} onPlaying={setPlaying} playbackRate={rate} />
      <Properties project={project} selectedIds={selected} frames={frames} apply={apply} seek={seek} onDuplicate={duplicate} onSplit={split} onDelete={remove} onRipple={ripple} onCopy={copy} onGroup={group} onUngroup={ungroup} />
    </div>
    <Timeline project={project} frames={frames} duration={duration} selectedIds={selected} playing={playing} onSelect={select} onSelectMany={setSelection} insertMode={insertMode} setInsertMode={setInsertMode} loop={loop} onToggleLoop={toggleLoop} onFullscreen={fullscreen} rate={rate} seek={seek} toggle={toggle}
      apply={apply} transient={transient} commit={commit} onSplit={split} onDelete={remove} onRipple={ripple} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo}
      onDropMedia={(id, frame, trackId) => { const m = media(id); if (m) addMedia(m, frame, trackId) }} />
    {toast && <div className={e.toast} role="status"><Check size={15} />{toast}</div>}
    {exporting && <ExportDialog project={project} onClose={() => setExporting(false)} />}
  </div>
}
