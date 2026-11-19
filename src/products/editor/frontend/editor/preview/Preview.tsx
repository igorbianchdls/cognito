'use client'

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import { EditorComposition } from '../remotion/Composition'
import { clipEnd, findClip, projectDuration, updateProps } from '../project/ops'
import { useFrame, type FrameStore } from '../project/useEditor'
import { FPS, canvasSize, kindLabel, type Box, type Clip, type Project } from '../project/types'
import { motionAt } from '../project/keyframes'
import { motionTransform } from '../remotion/animate'
import e from '../editor.module.css'

type Props = {
  project: Project; playerRef: RefObject<PlayerRef | null>; frames: FrameStore; selectedId: string | null
  onSelect: (id: string | null) => void; transient: (p: Project) => void; commit: (before: Project) => void
  onPlaying: (playing: boolean) => void; playbackRate: number
}

/** Fits a w:h box inside the element and returns its size. */
function useFit(ref: RefObject<HTMLDivElement | null>, ratio: number) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      const cs = getComputedStyle(el)
      const width = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const height = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const w = Math.max(0, Math.min(width, height * ratio))
      setSize({ width: Math.floor(w), height: Math.floor(w / ratio) })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, ratio])
  return size
}

export function Preview({ project, playerRef, frames, selectedId, onSelect, transient, commit, onPlaying, playbackRate }: Props) {
  const area = useRef<HTMLDivElement>(null)
  const { width, height } = canvasSize[project.format]
  const size = useFit(area, width / height)
  const duration = projectDuration(project)

  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    const onFrame = (ev: { detail: { frame: number } }) => frames.set(ev.detail.frame)
    const onPlay = () => onPlaying(true), onPause = () => onPlaying(false)
    p.addEventListener('frameupdate', onFrame)
    p.addEventListener('seeked', onFrame)
    p.addEventListener('play', onPlay)
    p.addEventListener('pause', onPause)
    p.addEventListener('ended', onPause)
    return () => {
      p.removeEventListener('frameupdate', onFrame); p.removeEventListener('seeked', onFrame)
      p.removeEventListener('play', onPlay); p.removeEventListener('pause', onPause); p.removeEventListener('ended', onPause)
    }
  }, [playerRef, frames, onPlaying, size.width])

  return <div className={e.previewArea} ref={area}>
    {size.width > 0 && <div className={e.canvas} style={{ width: size.width, height: size.height }}>
      <Player ref={playerRef} component={EditorComposition} inputProps={{ project }} durationInFrames={duration} fps={FPS}
        compositionWidth={width} compositionHeight={height} style={{ width: '100%', height: '100%' }}
        playbackRate={playbackRate} controls={false} clickToPlay={false} doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false} acknowledgeRemotionLicense />
      <Overlay project={project} frames={frames} selectedId={selectedId} onSelect={onSelect} transient={transient} commit={commit} size={size} />
    </div>}
  </div>
}

/** Click and drag elements right on the video. Only clips under the playhead are shown. */
function Overlay({ project, frames, selectedId, onSelect, transient, commit, size }: Pick<Props, 'project' | 'frames' | 'selectedId' | 'onSelect' | 'transient' | 'commit'> & { size: { width: number; height: number } }) {
  const frame = useFrame(frames)
  const visible = [...project.tracks].reverse().filter(t => t.kind !== 'audio' && !t.hidden)
    .flatMap(t => t.clips.filter(c => frame >= c.start && frame < clipEnd(c)).map(c => ({ track: t, clip: c })))
  const selected = findClip(project, selectedId)
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })

  /**
   * Snaps the moving box's edges and center to the canvas edges and center and to the other visible
   * elements, like Canva/CapCut, and returns the snapped box plus the guide lines to draw.
   */
  const snapBox = (b: Box, id: string) => {
    const others = visible.filter(v => v.clip.id !== id && v.clip.props.box).map(v => v.clip.props.box!)
    const xs = [0, 50, 100, ...others.flatMap(o => [o.x, o.x + o.w / 2, o.x + o.w])]
    const ys = [0, 50, 100, ...others.flatMap(o => [o.y, o.y + o.h / 2, o.y + o.h])]
    const fit = (pos: number, size: number, lines: number[]) => {
      let best: { shift: number; line: number } | null = null
      for (const anchor of [pos, pos + size / 2, pos + size]) for (const line of lines) {
        const d = line - anchor
        if (Math.abs(d) <= 1.2 && (!best || Math.abs(d) < Math.abs(best.shift))) best = { shift: d, line }
      }
      return best
    }
    const sx = fit(b.x, b.w, xs), sy = fit(b.y, b.h, ys)
    return { box: { ...b, x: b.x + (sx?.shift ?? 0), y: b.y + (sy?.shift ?? 0) }, guides: { x: sx?.line ?? null, y: sy?.line ?? null } }
  }

  const drag = (ev: React.PointerEvent, id: string, mode: 'move' | 'resize') => {
    ev.stopPropagation()
    onSelect(id)
    const found = findClip(project, id)
    if (!found?.clip.props.box || found.track.locked) return
    const before = project, origin = found.clip.props.box, x0 = ev.clientX, y0 = ev.clientY
    const el = ev.currentTarget as HTMLElement
    el.setPointerCapture(ev.pointerId)
    let moved = false
    const move = (m: PointerEvent) => {
      const dx = (m.clientX - x0) / size.width * 100, dy = (m.clientY - y0) / size.height * 100
      if (!moved && Math.abs(m.clientX - x0) + Math.abs(m.clientY - y0) < 3) return
      moved = true
      let box: Box = mode === 'move'
        ? { ...origin, x: Math.round((origin.x + dx) * 10) / 10, y: Math.round((origin.y + dy) * 10) / 10 }
        : { ...origin, w: Math.max(3, Math.round((origin.w + dx) * 10) / 10), h: Math.max(3, Math.round((origin.h + dy) * 10) / 10) }
      if (mode === 'move' && !m.altKey) { const s = snapBox(box, id); box = s.box; setGuides(s.guides) }
      transient(updateProps(before, id, { box }))
    }
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); setGuides({ x: null, y: null }); if (moved) commit(before) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
  }

  // Follows the keyframes so the selection stays on the element while it moves.
  const boxCss = (b: Box, c: Clip) => ({ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, transform: motionTransform(motionAt(c.props.keyframes, frame - c.start), size.width, size.height) })
  return <div className={e.overlay} onPointerDown={() => onSelect(null)}>
    {visible.map(({ track, clip }) => clip.props.box && <div key={clip.id} className={`${e.hit} ${clip.id === selectedId ? e.hitOn : ''}`} style={boxCss(clip.props.box, clip)}
      onPointerDown={ev => drag(ev, clip.id, 'move')} title={kindLabel[track.kind]} />)}
    {selected?.clip.props.box && frame >= selected.clip.start && frame < clipEnd(selected.clip) && <div className={e.selBox} style={boxCss(selected.clip.props.box, selected.clip)}>
      <span className={e.selTag}>{kindLabel[selected.track.kind]}</span>
      <span className={e.resize} onPointerDown={ev => drag(ev, selected.clip.id, 'resize')} />
    </div>}
    {guides.x !== null && <span className={e.vGuide} style={{ left: `${guides.x}%` }} />}
    {guides.y !== null && <span className={e.hGuide} style={{ top: `${guides.y}%` }} />}
  </div>
}
