'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRightToLine, BetweenHorizontalStart, Bookmark, Expand, Repeat, Eye, EyeOff, GripVertical, Lock, LockOpen, Magnet, Pause, Play, Redo2, Scissors, SkipBack, SkipForward, Sparkle, Trash2, Undo2, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react'
import { clipEnd, moveClip, moveClipsClamped, moveTrack, settle, settleAll, toggleMarker, trimLeft, trimRight, updateProps, updateTrack, withGroup } from '../project/ops'
import { voiceRanges } from '../project/audio'
import { ClipView, kindIcon, type DragMode } from './Clip'
import { useFrame, type FrameStore } from '../project/useEditor'
import { FPS, kindLabel, visualKinds, type Clip, type Project, type Track, type TrackKind, type TransitionType } from '../project/types'
import e from '../editor.module.css'

export const MEDIA_MIME = 'application/x-otto-editor-media'
const ROW = 46
const SNAP_PX = 8

export { kindIcon }

export function timecode(frame: number) {
  const sec = Math.floor(frame / FPS)
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}.${String(frame % FPS).padStart(2, '0')}`
}

type Props = {
  project: Project; frames: FrameStore; duration: number; selectedIds: string[]; playing: boolean
  onSelect: (id: string | null, toggle?: boolean) => void; onSelectMany: (ids: string[]) => void; seek: (frame: number) => void; toggle: () => void
  apply: (fn: (p: Project) => Project) => void; transient: (p: Project) => void; commit: (before: Project) => void
  onSplit: () => void; onDelete: () => void; onRipple: () => void; undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean
  onDropMedia: (mediaId: string, frame: number, trackId?: string) => void
  insertMode: boolean; setInsertMode: (on: boolean) => void
  loop: { start: number; end: number } | null; onToggleLoop: () => void; onFullscreen: () => void; rate: number
  /** Comentários abertos (marcas amarelas na régua; clicar leva ao momento e abre os comentários). */
  comentarios?: { id: string; segundo: number; texto: string }[]; onComentario?: (id: string) => void
}

type CutMenu = { a: string; b: string; x: number; y: number; current?: TransitionType }
const cutTypes: { id: TransitionType; label: string }[] = [{ id: 'fade', label: 'Fade' }, { id: 'deslizar', label: 'Deslizar' }, { id: 'zoom', label: 'Zoom' }, { id: 'desfoque', label: 'Desfoque' }]

export function Timeline(props: Props) {
  const { project, frames, duration, selectedIds, playing, onSelect, seek, toggle, apply, transient, commit } = props
  const [pps, setPps] = useState(60)
  const [snap, setSnap] = useState(true)
  const [guide, setGuide] = useState<number | null>(null)
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [cutMenu, setCutMenu] = useState<CutMenu | null>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  // Track header width; matches .head in the CSS (narrower on phones).
  const [HEAD, setHead] = useState(168)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 960px)')
    const set = () => setHead(mq.matches ? 92 : 168)
    set()
    mq.addEventListener('change', set)
    return () => mq.removeEventListener('change', set)
  }, [])
  // Ctrl/Cmd + wheel zooms the timeline (needs a non-passive listener to stop the browser zoom).
  useEffect(() => {
    const el = scroll.current
    if (!el) return
    const onWheel = (ev: WheelEvent) => {
      if (!ev.ctrlKey && !ev.metaKey) return
      ev.preventDefault()
      setPps(v => Math.max(15, Math.min(300, Math.round(v * (ev.deltaY > 0 ? 0.88 : 1.14)))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  const ppf = pps / FPS
  const width = (duration + 10 * FPS) * ppf
  const voices = voiceRanges(project)

  const frameAt = (clientX: number, el: Element) => Math.max(0, Math.round((clientX - el.getBoundingClientRect().left) / ppf))

  const scrub = (ev: React.PointerEvent<HTMLDivElement>) => {
    const el = ev.currentTarget
    el.setPointerCapture(ev.pointerId)
    seek(frameAt(ev.clientX, el))
    const move = (m: PointerEvent) => seek(frameAt(m.clientX, el))
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  /**
   * Drag a clip body (move; alone it can also change track) or one of its edges (trim).
   * Shift/Ctrl/Cmd-click adds to the selection; dragging a selected clip moves the whole selection.
   * Clips on locked tracks can be selected but not moved.
   */
  const dragClip = (ev: React.PointerEvent, clip: Clip, mode: DragMode) => {
    ev.stopPropagation()
    if (ev.button !== 0) return
    setCutMenu(null)
    if (ev.shiftKey || ev.ctrlKey || ev.metaKey) { onSelect(clip.id, true); return }
    const lockedIds = new Set(project.tracks.filter(t => t.locked).flatMap(t => t.clips.map(c => c.id)))
    // A grouped clip always drags its whole group; otherwise a selected clip drags the selection.
    const members = withGroup(project, clip.id)
    const base = selectedIds.includes(clip.id) && selectedIds.length > 1 ? [...new Set([...selectedIds, ...members])] : members
    const group = mode === 'move' ? base.filter(id => !lockedIds.has(id)) : [clip.id]
    if (!selectedIds.includes(clip.id)) onSelect(clip.id)
    if (lockedIds.has(clip.id) || !group.length) return
    const before = project, x0 = ev.clientX
    const el = ev.currentTarget as HTMLElement
    el.setPointerCapture(ev.pointerId)
    const points = snap ? [0, frames.get(), ...(project.markers ?? []), ...project.tracks.flatMap(t => t.clips.filter(c => !group.includes(c.id)).flatMap(c => [c.start, clipEnd(c)]))] : []
    const snapTo = (f: number) => {
      let best: number | null = null
      for (const p of points) if (Math.abs(p - f) * ppf <= SNAP_PX && (best === null || Math.abs(p - f) < Math.abs(best - f))) best = p
      return best
    }
    let moved = false, last = before
    const show = (p: Project) => { last = p; transient(p) }
    const move = (m: PointerEvent) => {
      const df = Math.round((m.clientX - x0) / ppf)
      if (!moved && Math.abs(m.clientX - x0) < 3) return
      moved = true
      if (mode === 'move') {
        let start = clip.start + df, g: number | null = null
        const s1 = snapTo(start), s2 = snapTo(start + clip.duration)
        if (s1 !== null && (s2 === null || Math.abs(s1 - start) <= Math.abs(s2 - start - clip.duration))) { start = s1; g = s1 }
        else if (s2 !== null) { start = s2 - clip.duration; g = s2 }
        if (group.length > 1) show(moveClipsClamped(before, group, start - clip.start))
        else {
          const lane = document.elementsFromPoint(m.clientX, m.clientY).find(x => (x as HTMLElement).dataset?.trackId) as HTMLElement | undefined
          const target = before.tracks.find(t => t.id === lane?.dataset.trackId)
          show(moveClip(before, clip.id, start, target && !target.locked ? target.id : undefined))
        }
        setGuide(g)
      } else {
        const edge = (mode === 'left' ? clip.start : clipEnd(clip)) + df
        const s = snapTo(edge)
        show(mode === 'left' ? trimLeft(before, clip.id, s ?? edge) : trimRight(before, clip.id, s ?? edge))
        setGuide(s)
      }
    }
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up)
      setGuide(null)
      if (!moved) return
      transient(group.length > 1 ? settleAll(last, group) : settle(last, clip.id))
      commit(before)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  /** Empty space: a click moves the playhead, a drag draws a box that selects the clips it touches. */
  const laneDown = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.target !== ev.currentTarget || ev.button !== 0) return
    setCutMenu(null)
    // On touch, dragging the empty area scrolls the timeline; a tap moves the playhead.
    if (ev.pointerType === 'touch') { onSelect(null); seek(frameAt(ev.clientX, ev.currentTarget)); return }
    const box = inner.current!.getBoundingClientRect()
    const x0 = ev.clientX, y0 = ev.clientY, lane = ev.currentTarget
    const additive = ev.shiftKey || ev.ctrlKey || ev.metaKey
    const startSel = additive ? selectedIds : []
    let moved = false
    const move = (m: PointerEvent) => {
      if (!moved && Math.abs(m.clientX - x0) + Math.abs(m.clientY - y0) < 5) return
      moved = true
      const l = Math.min(x0, m.clientX), r = Math.max(x0, m.clientX), t = Math.min(y0, m.clientY), b = Math.max(y0, m.clientY)
      setMarquee({ x: l - box.left, y: t - box.top, w: r - l, h: b - t })
      const hit = [...inner.current!.querySelectorAll<HTMLElement>('[data-clip-id]')].filter(el => {
        const c = el.getBoundingClientRect()
        return c.left < r && c.right > l && c.top < b && c.bottom > t
      }).map(el => el.dataset.clipId!)
      props.onSelectMany([...new Set([...startSel, ...hit])])
    }
    const up = (u: PointerEvent) => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up)
      setMarquee(null)
      if (!moved) { if (!additive) onSelect(null); seek(frameAt(u.clientX, lane)) }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /** Drag a track header up or down to change the layer order. */
  const dragTrack = (ev: React.PointerEvent, index: number) => {
    ev.preventDefault()
    const before = project, y0 = ev.clientY
    const el = ev.currentTarget as HTMLElement
    el.setPointerCapture(ev.pointerId)
    let to = index
    const move = (m: PointerEvent) => {
      const next = Math.max(0, Math.min(before.tracks.length - 1, index + Math.round((m.clientY - y0) / ROW)))
      if (next !== to) { to = next; transient(moveTrack(before, index, to)) }
    }
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); if (to !== index) commit(before) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  const setCut = (menu: CutMenu, type: TransitionType | null) => {
    const t = type ? { type, frames: 9 } : undefined
    apply(p => updateProps(updateProps(p, menu.a, { transOut: t }), menu.b, { transIn: t }))
    setCutMenu(null)
  }

  const drop = (ev: React.DragEvent<HTMLDivElement>, trackId?: string) => {
    const id = ev.dataTransfer.getData(MEDIA_MIME)
    if (!id) return
    ev.preventDefault()
    props.onDropMedia(id, frameAt(ev.clientX, ev.currentTarget), trackId)
  }
  const allowDrop = (ev: React.DragEvent) => { if (ev.dataTransfer.types.includes(MEDIA_MIME)) ev.preventDefault() }

  const counts: Partial<Record<TrackKind, number>> = {}
  const hasSelection = selectedIds.length > 0
  return <div className={e.timeline}>
    <div className={e.tlBar}>
      <button className={e.tool} onClick={() => seek(0)} aria-label="Voltar ao início"><SkipBack size={16} /></button>
      <button className={`${e.tool} ${e.play}`} onClick={toggle} aria-label={playing ? 'Pausar' : 'Tocar'}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
      <button className={e.tool} onClick={() => seek(duration - 1)} aria-label="Ir para o fim"><SkipForward size={16} /></button>
      <TimeDisplay frames={frames} duration={duration} />
      <span className={e.sep} />
      <button className={e.tool} onClick={props.onSplit} disabled={selectedIds.length !== 1} title="Dividir na agulha (S)"><Scissors size={16} />Dividir</button>
      <button className={e.tool} onClick={props.onDelete} disabled={!hasSelection} title="Excluir (Delete)"><Trash2 size={16} /></button>
      <button className={e.tool} onClick={props.onRipple} disabled={!hasSelection} title="Excluir e fechar o buraco (Shift+Delete)"><BetweenHorizontalStart size={16} /></button>
      <button className={e.tool} onClick={() => apply(p => toggleMarker(p, frames.get()))} title="Marcador na agulha (M)"><Bookmark size={16} /></button>
      <button className={`${e.tool} ${props.loop ? e.toolOn : ''}`} onClick={props.onToggleLoop} aria-pressed={!!props.loop} title="Repetir o trecho entre os marcadores em volta da agulha (sem marcadores, o vídeo todo)"><Repeat size={16} /></button>
      <button className={e.tool} onClick={props.onFullscreen} title="Prévia em tela cheia (F)"><Expand size={16} /></button>
      {props.rate !== 1 && <span className={e.rate}>{props.rate}x</span>}
      <button className={e.tool} onClick={props.undo} disabled={!props.canUndo} title="Desfazer (Ctrl+Z)"><Undo2 size={16} /></button>
      <button className={e.tool} onClick={props.redo} disabled={!props.canRedo} title="Refazer (Ctrl+Shift+Z)"><Redo2 size={16} /></button>
      <span className={e.grow} />
      <button className={`${e.tool} ${props.insertMode ? e.toolOn : ''}`} onClick={() => props.setInsertMode(!props.insertMode)} aria-pressed={props.insertMode} title="Inserir empurrando: mídia nova abre espaço e empurra o resto para a direita"><ArrowRightToLine size={16} />Inserir</button>
      <button className={`${e.tool} ${snap ? e.toolOn : ''}`} onClick={() => setSnap(!snap)} aria-pressed={snap} title="Ímã: gruda nos cortes, marcadores e agulha"><Magnet size={16} /></button>
      <span className={e.zoom}><ZoomOut size={15} /><input type="range" min={15} max={300} value={pps} onChange={ev => setPps(+ev.target.value)} aria-label="Zoom da linha do tempo" /><ZoomIn size={15} /></span>
    </div>
    <div className={e.tlScroll} ref={scroll}>
      <div className={e.tlInner} style={{ width: HEAD + width }} ref={inner}>
        <div className={e.rulerRow}>
          <div className={e.corner} />
          <div className={e.ruler} onPointerDown={scrub}>
            <Ruler pps={pps} width={width} />
            {props.loop && <span className={e.loopRange} style={{ left: props.loop.start * ppf, width: (props.loop.end - props.loop.start) * ppf }} />}
            {(project.markers ?? []).map(m => <button key={m} className={e.marker} style={{ left: m * ppf }} title={`Marcador em ${timecode(m)} · clique duplo remove`}
              onPointerDown={ev => { ev.stopPropagation(); seek(m) }} onDoubleClick={() => apply(p => toggleMarker(p, m))}><Bookmark size={11} /></button>)}
            {(props.comentarios ?? []).map(c => <button key={c.id} type="button" className={e.marcaComentario} style={{ left: c.segundo * FPS * ppf }} title={`${Math.floor(c.segundo / 60)}:${String(Math.floor(c.segundo % 60)).padStart(2, '0')} · ${c.texto}`}
              aria-label={`Comentário: ${c.texto}`} onPointerDown={ev => { ev.stopPropagation(); seek(Math.round(c.segundo * FPS)); props.onComentario?.(c.id) }} />)}
          </div>
        </div>
        {project.tracks.map((t: Track, index) => {
          const Icon = kindIcon[t.kind]
          counts[t.kind] = (counts[t.kind] ?? 0) + 1
          const sound = t.kind === 'video' || t.kind === 'audio'
          const cuts = visualKinds.includes(t.kind) ? t.clips.slice(1).map((b, i) => ({ a: t.clips[i], b })).filter(({ a, b }) => Math.abs(clipEnd(a) - b.start) <= 1) : []
          return <div key={t.id} className={e.row}>
            <div className={e.head}>
              <span className={e.grip} onPointerDown={ev => dragTrack(ev, index)} title="Arraste para mudar a ordem das faixas"><GripVertical size={13} /></span>
              <Icon size={15} /><span>{kindLabel[t.kind]} {counts[t.kind]}</span>
              <button className={`${e.mini} ${t.locked ? e.miniOn : ''}`} onClick={() => apply(p => updateTrack(p, t.id, { locked: !t.locked }))} aria-label={t.locked ? 'Destravar faixa' : 'Travar faixa'} title={t.locked ? 'Destravar faixa' : 'Travar faixa'}>{t.locked ? <Lock size={13} /> : <LockOpen size={13} />}</button>
              {sound ? <button className={e.mini} onClick={() => apply(p => updateTrack(p, t.id, { muted: !t.muted }))} aria-label={t.muted ? 'Ativar som' : 'Silenciar'}>{t.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
                : <button className={e.mini} onClick={() => apply(p => updateTrack(p, t.id, { hidden: !t.hidden }))} aria-label={t.hidden ? 'Mostrar faixa' : 'Ocultar faixa'}>{t.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
            </div>
            <div className={`${e.lane} ${t.hidden || t.muted ? e.laneOff : ''} ${t.locked ? e.laneLocked : ''}`} data-track-id={t.id} onPointerDown={laneDown} onDragOver={allowDrop} onDrop={ev => drop(ev, t.id)}>
              {t.clips.map(c => <ClipView key={c.id} clip={c} kind={t.kind} ppf={ppf} on={selectedIds.includes(c.id)} onDrag={dragClip} onSeek={seek} project={project} voices={voices} />)}
              {!t.locked && cuts.map(({ a, b }) => {
                const both = a.props.transOut && b.props.transIn ? b.props.transIn.type : undefined
                return <button key={b.id} className={`${e.cut} ${both ? e.cutOn : ''}`} style={{ left: b.start * ppf }} title="Transição no corte"
                  onPointerDown={ev => { ev.stopPropagation(); const r = ev.currentTarget.getBoundingClientRect(), box = inner.current!.getBoundingClientRect(); setCutMenu({ a: a.id, b: b.id, x: r.left - box.left, y: r.bottom - box.top + 4, current: both }) }}><Sparkle size={11} /></button>
              })}
            </div>
          </div>
        })}
        <div className={e.row}>
          <div className={e.head} />
          <div className={`${e.lane} ${e.dropLane}`} onDragOver={allowDrop} onDrop={ev => drop(ev)}>
            {project.tracks.length ? 'Solte aqui para criar uma faixa nova' : 'Arraste vídeos, imagens ou áudios da esquerda para começar'}
          </div>
        </div>
        {guide !== null && <span className={e.guide} style={{ left: HEAD + guide * ppf }} />}
        {marquee && <span className={e.marquee} style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />}
        {cutMenu && <div className={e.cutMenu} style={{ left: cutMenu.x, top: cutMenu.y }} role="menu">
          <b>Transição no corte</b>
          {cutTypes.map(c => <button key={c.id} role="menuitem" className={cutMenu.current === c.id ? e.segOn : ''} onClick={() => setCut(cutMenu, c.id)}>{c.label}</button>)}
          <button role="menuitem" onClick={() => setCut(cutMenu, null)}>Nenhuma</button>
        </div>}
        <Playhead frames={frames} ppf={ppf} scroll={scroll} playing={playing} head={HEAD} />
      </div>
    </div>
  </div>
}

function TimeDisplay({ frames, duration }: { frames: FrameStore; duration: number }) {
  const frame = useFrame(frames)
  return <span className={e.time}><b>{timecode(frame)}</b> / {timecode(duration)}</span>
}

function Playhead({ frames, ppf, scroll, playing, head }: { frames: FrameStore; ppf: number; scroll: React.RefObject<HTMLDivElement | null>; playing: boolean; head: number }) {
  const frame = useFrame(frames)
  const x = head + frame * ppf
  useEffect(() => {
    const el = scroll.current
    if (playing && el && (x > el.scrollLeft + el.clientWidth - 40 || x < el.scrollLeft + head)) el.scrollTo({ left: x - head - 60 })
  }, [x, playing, scroll, head])
  return <span className={e.playhead} style={{ left: x }}><i /></span>
}

function Ruler({ pps, width }: { pps: number; width: number }) {
  const step = [1, 2, 5, 10, 15, 30, 60].find(s => s * pps >= 70) ?? 60
  const minor = step >= 10 ? step / 5 : step / 2
  const ticks: React.ReactNode[] = []
  for (let t = 0; t * pps <= width; t += minor) {
    const major = Math.abs(t / step - Math.round(t / step)) < 1e-6
    ticks.push(<span key={t} className={major ? e.tickMajor : e.tick} style={{ left: t * pps }}>{major && <em>{Math.floor(t / 60)}:{String(Math.round(t % 60)).padStart(2, '0')}</em>}</span>)
  }
  return <>{ticks}</>
}
