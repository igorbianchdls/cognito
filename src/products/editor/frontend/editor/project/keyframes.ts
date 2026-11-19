// Keyframes: the clip's motion (offset, scale, rotation, opacity) changing over time.
import { localStamp, type Clip, type Keyframe, type Motion, type Project } from './types'

const mapClip = (p: Project, id: string, fn: (c: Clip) => Clip): Project =>
  ({ ...p, updatedAt: localStamp(), tracks: p.tracks.map(t => ({ ...t, clips: t.clips.map(c => c.id === id ? fn(c) : c) })) })

export const restMotion: Motion = { dx: 0, dy: 0, scale: 1, rotation: 0, opacity: 1 }
const ease = (t: number) => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
const keys = Object.keys(restMotion) as (keyof Motion)[]

/** Motion at `frame` (relative to the clip start), eased between the two closest keyframes. */
export function motionAt(keyframes: Keyframe[] | undefined, frame: number): Motion {
  if (!keyframes?.length) return restMotion
  const list = [...keyframes].sort((a, b) => a.frame - b.frame)
  if (frame <= list[0].frame) return list[0]
  const last = list[list.length - 1]
  if (frame >= last.frame) return last
  const i = list.findIndex(k => k.frame > frame)
  const a = list[i - 1], b = list[i], t = ease((frame - a.frame) / (b.frame - a.frame))
  return Object.fromEntries(keys.map(k => [k, a[k] + (b[k] - a[k]) * t])) as Motion
}

const hex = (c: string) => { const h = c.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h.slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255] }
const mixColor = (a: string, b: string, t: number) => {
  if (!a.startsWith('#') || !b.startsWith('#')) return t < 0.5 ? a : b
  const [x, y] = [hex(a), hex(b)]
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`
}

/** Text color and size at `frame`, from the keyframes that set them; undefined when none do. */
export function textAt(keyframes: Keyframe[] | undefined, frame: number): { color?: string; fontSize?: number } {
  const pick = <K extends 'color' | 'fontSize'>(k: K) => {
    const list = (keyframes ?? []).filter(x => x[k] !== undefined).sort((a, b) => a.frame - b.frame)
    if (!list.length) return undefined
    const before = [...list].reverse().find(x => x.frame <= frame), after = list.find(x => x.frame > frame)
    if (!before) return list[0][k]
    if (!after) return before[k]
    const t = ease((frame - before.frame) / (after.frame - before.frame))
    return (k === 'color' ? mixColor(before.color!, after.color!, t) : before.fontSize! + (after.fontSize! - before.fontSize!) * t) as Keyframe[K]
  }
  return { color: pick('color'), fontSize: pick('fontSize') }
}

/** Sets values at `frame`: updates the keyframe there or adds one holding the current motion. */
export function setKeyframe(p: Project, clipId: string, frame: number, patch: Partial<Omit<Keyframe, 'frame'>>): Project {
  return mapClip(p, clipId, c => {
    const list = c.props.keyframes ?? []
    const at = list.find(k => k.frame === frame)
    const next = at ? list.map(k => k === at ? { ...k, ...patch } : k) : [...list, { ...motionAt(list, frame), ...patch, frame }]
    return { ...c, props: { ...c.props, keyframes: next.sort((a, b) => a.frame - b.frame) } }
  })
}

export const removeKeyframe = (p: Project, clipId: string, frame: number) =>
  mapClip(p, clipId, c => ({ ...c, props: { ...c.props, keyframes: (c.props.keyframes ?? []).filter(k => k.frame !== frame) } }))

export const clearKeyframes = (p: Project, clipId: string) => mapClip(p, clipId, c => ({ ...c, props: { ...c.props, keyframes: [] } }))

/** Keeps keyframes inside the clip after a trim or split. `shift` moves them left by that many frames. */
export const fitKeyframes = (keyframes: Keyframe[] | undefined, shift: number, duration: number) =>
  keyframes?.map(k => ({ ...k, frame: k.frame - shift })).filter(k => k.frame >= 0 && k.frame < duration)
