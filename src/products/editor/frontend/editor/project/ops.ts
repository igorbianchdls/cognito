// Pure edits on a project. The timeline, the properties panel and the AI all go through these.
import { media } from './data'
import { fitKeyframes } from './keyframes'
import { FPS, kindRank, localStamp, type Clip, type ClipProps, type Project, type Track, type TrackKind } from './types'

export const MIN_CLIP = 5
export const uid = (p = 'c') => p + Math.random().toString(36).slice(2, 9)
export const clipEnd = (c: Clip) => c.start + c.duration
export const projectDuration = (p: Project) => Math.max(FPS, ...p.tracks.flatMap(t => t.clips.map(clipEnd)))

export function findClip(p: Project, id: string | null): { track: Track; clip: Clip } | null {
  if (!id) return null
  for (const track of p.tracks) { const clip = track.clips.find(c => c.id === id); if (clip) return { track, clip } }
  return null
}

/** Longest a media clip can be, from its trim point to the end of the file. Infinity for text, shapes and images. */
export function maxDuration(kind: TrackKind, c: Clip) {
  if (kind !== 'video' && kind !== 'audio') return Infinity
  const m = media(c.props.fileId)
  return m?.duration ? Math.floor((Math.round(m.duration * FPS) - c.trimStart) / (c.speed ?? 1)) : Infinity
}

const touch = (p: Project): Project => ({ ...p, updatedAt: localStamp() })
const mapTracks = (p: Project, fn: (t: Track) => Track) => touch({ ...p, tracks: p.tracks.map(fn) })
export const mapClip = (p: Project, id: string, fn: (c: Clip, t: Track) => Clip) =>
  mapTracks(p, t => t.clips.some(c => c.id === id) ? { ...t, clips: t.clips.map(c => c.id === id ? fn(c, t) : c) } : t)

export const updateProps = (p: Project, id: string, patch: Partial<ClipProps>) => mapClip(p, id, c => ({ ...c, props: { ...c.props, ...patch } }))
export const updateTrack = (p: Project, id: string, patch: Partial<Track>) => mapTracks(p, t => t.id === id ? { ...t, ...patch } : t)

export function overlaps(t: Track, start: number, duration: number, ignoreId?: string) {
  return t.clips.some(c => c.id !== ignoreId && start < clipEnd(c) && c.start < start + duration)
}

/** Closest start to `start` where the clip fits on the track without overlapping. */
export function freeStart(t: Track, start: number, duration: number, ignoreId?: string) {
  const others = t.clips.filter(c => c.id !== ignoreId)
  const candidates = [start, ...others.map(clipEnd), ...others.map(c => c.start - duration)].filter(x => x >= 0 && !overlaps(t, x, duration, ignoreId))
  return candidates.sort((a, b) => Math.abs(a - start) - Math.abs(b - start))[0] ?? Math.max(start, ...others.map(clipEnd))
}

/** Drops empty tracks and sorts clips. */
export const normalize = (p: Project): Project => ({ ...p, tracks: p.tracks.filter(t => t.clips.length).map(t => ({ ...t, clips: [...t.clips].sort((a, b) => a.start - b.start) })) })

/** Adds a clip on the first track of its kind that has room, or on a new track. */
export function addClip(p: Project, kind: TrackKind, clip: Omit<Clip, 'id'>, trackId?: string): { project: Project; id: string } {
  const id = uid()
  const c: Clip = { ...clip, id, start: Math.max(0, Math.round(clip.start)) }
  const preferred = p.tracks.find(t => t.id === trackId && t.kind === kind)
  const target = (preferred && !overlaps(preferred, c.start, c.duration) ? preferred : undefined)
    ?? p.tracks.find(t => t.kind === kind && !overlaps(t, c.start, c.duration))
  if (target) return { project: touch({ ...p, tracks: p.tracks.map(t => t === target ? { ...t, clips: [...t.clips, c] } : t) }), id }
  const at = p.tracks.findIndex(t => kindRank[t.kind] > kindRank[kind])
  const tracks = [...p.tracks]
  tracks.splice(at === -1 ? tracks.length : at, 0, { id: uid('t'), kind, clips: [c] })
  return { project: touch({ ...p, tracks }), id }
}

/** Moves a clip in time and, if the target track has the same kind, to that track. Overlaps are resolved by `settle`. */
export function moveClip(p: Project, id: string, start: number, targetTrackId?: string): Project {
  const found = findClip(p, id)
  if (!found) return p
  const target = p.tracks.find(t => t.id === targetTrackId && t.kind === found.track.kind) ?? found.track
  const c = { ...found.clip, start: Math.max(0, Math.round(start)) }
  return touch({ ...p, tracks: p.tracks.map(t => {
    const clips = t.clips.filter(x => x.id !== id)
    return t === target ? { ...t, clips: [...clips, c] } : t === found.track ? { ...t, clips } : t
  }) })
}

/** After a drop: pushes the clip to the closest free spot on its track and drops empty tracks. */
export function settle(p: Project, id: string): Project {
  const found = findClip(p, id)
  if (!found) return normalize(p)
  const start = freeStart(found.track, found.clip.start, found.clip.duration, id)
  return normalize(start === found.clip.start ? p : mapClip(p, id, c => ({ ...c, start })))
}

export function trimLeft(p: Project, id: string, newStart: number): Project {
  const found = findClip(p, id)
  if (!found) return p
  const { clip, track } = found
  const isMedia = track.kind === 'video' || track.kind === 'audio'
  const speed = clip.speed ?? 1
  const lowest = isMedia ? clip.start - Math.floor(clip.trimStart / speed) : 0
  const start = Math.round(Math.min(clipEnd(clip) - MIN_CLIP, Math.max(lowest, 0, newStart)))
  const delta = start - clip.start
  const duration = clip.duration - delta
  return mapClip(p, id, c => ({ ...c, start, duration, trimStart: isMedia ? Math.max(0, c.trimStart + Math.round(delta * speed)) : c.trimStart, props: { ...c.props, keyframes: fitKeyframes(c.props.keyframes, delta, duration) } }))
}

export function trimRight(p: Project, id: string, newEnd: number): Project {
  const found = findClip(p, id)
  if (!found) return p
  const { clip, track } = found
  const duration = Math.round(Math.min(maxDuration(track.kind, clip), Math.max(MIN_CLIP, newEnd - clip.start)))
  return mapClip(p, id, c => ({ ...c, duration }))
}

export function splitAt(p: Project, id: string, frame: number): { project: Project; id: string } | null {
  const found = findClip(p, id)
  if (!found) return null
  const { clip, track } = found
  if (frame <= clip.start + 1 || frame >= clipEnd(clip) - 1) return null
  const isMedia = track.kind === 'video' || track.kind === 'audio'
  const rightId = uid()
  const cut = frame - clip.start, rest = clipEnd(clip) - frame
  const left: Clip = { ...clip, duration: cut, props: { ...clip.props, transOut: undefined, keyframes: fitKeyframes(clip.props.keyframes, 0, cut) } }
  const right: Clip = { ...clip, id: rightId, start: frame, duration: rest, trimStart: isMedia ? clip.trimStart + Math.round(cut * (clip.speed ?? 1)) : clip.trimStart, props: { ...clip.props, transIn: undefined, keyframes: fitKeyframes(clip.props.keyframes, cut, rest) } }
  return { project: touch({ ...p, tracks: p.tracks.map(t => t === track ? { ...t, clips: t.clips.flatMap(c => c.id === id ? [left, right] : [c]) } : t) }), id: rightId }
}

export const removeClip = (p: Project, id: string) => normalize(touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== id) })) }))

export function duplicateClip(p: Project, id: string): { project: Project; id: string } | null {
  const found = findClip(p, id)
  if (!found) return null
  const copy = { ...found.clip, group: undefined, start: freeStart(found.track, clipEnd(found.clip), found.clip.duration) }
  return addClip(p, found.track.kind, copy, found.track.id)
}

/** Removes the first `frames` of the whole video and pulls everything back. */
export function cutHead(p: Project, frames: number): Project {
  return normalize(touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.flatMap(c => {
    if (clipEnd(c) <= frames) return []
    if (c.start >= frames) return [{ ...c, start: c.start - frames }]
    const cut = frames - c.start
    const isMedia = t.kind === 'video' || t.kind === 'audio'
    return [{ ...c, start: 0, duration: c.duration - cut, trimStart: isMedia ? c.trimStart + Math.round(cut * (c.speed ?? 1)) : c.trimStart, props: { ...c.props, keyframes: fitKeyframes(c.props.keyframes, cut, c.duration - cut) } }]
  }) })) }))
}

/** Ends the whole video at `frames`. */
export function limitTo(p: Project, frames: number): Project {
  return normalize(touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.filter(c => c.start < frames - MIN_CLIP).map(c => ({ ...c, duration: Math.min(c.duration, frames - c.start) })) })) }))
}

export const removeClips = (p: Project, ids: string[]) => normalize(touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.filter(c => !ids.includes(c.id)) })) }))

/** Deletes and closes the gap: later clips on the same track move left. */
export function rippleDelete(p: Project, ids: string[]): Project {
  return normalize(touch({ ...p, tracks: p.tracks.map(t => {
    const gone = t.clips.filter(c => ids.includes(c.id))
    if (!gone.length) return t
    return { ...t, clips: t.clips.filter(c => !ids.includes(c.id)).map(c => ({ ...c, start: Math.max(0, c.start - gone.filter(g => g.start < c.start).reduce((n, g) => n + g.duration, 0)) })) }
  }) }))
}

/** Moves several clips by the same amount, each on its own track. */
export function moveClips(p: Project, ids: string[], df: number): Project {
  const moving = p.tracks.flatMap(t => t.clips).filter(c => ids.includes(c.id))
  const shift = Math.max(df, -Math.min(...moving.map(c => c.start)))
  return touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.map(c => ids.includes(c.id) ? { ...c, start: c.start + shift } : c) })) })
}

const groupOverlaps = (p: Project, ids: string[]) =>
  p.tracks.some(t => t.clips.some(c => ids.includes(c.id) && overlaps(t, c.start, c.duration, c.id)))

/** Like moveClips, but stops short of the first position where a moved clip would overlap another. */
export function moveClipsClamped(p: Project, ids: string[], df: number): Project {
  const step = df > 0 ? -1 : 1
  for (let s = df; s !== 0; s += step) {
    const next = moveClips(p, ids, s)
    if (!groupOverlaps(next, ids)) return next
  }
  return p
}

export const settleAll = (p: Project, ids: string[]) => ids.reduce((acc, id) => settle(acc, id), p)

/** Changes speed keeping the same part of the file: 2x halves the clip on the timeline. */
export function setSpeed(p: Project, id: string, speed: number): Project {
  const found = findClip(p, id)
  if (!found) return p
  const old = found.clip.speed ?? 1
  const next = { ...found.clip, speed }
  const duration = Math.max(MIN_CLIP, Math.min(maxDuration(found.track.kind, next), Math.round(found.clip.duration * old / speed)))
  return settle(mapClip(p, id, c => ({ ...c, speed, duration })), id)
}

/**
 * Adds a clip at the cut nearest to `at` on the first track of its kind and pushes the later clips right,
 * like inserting on CapCut's main track. Falls back to addClip when there is no track of that kind.
 */
export function insertClip(p: Project, kind: TrackKind, clip: Omit<Clip, 'id'>, at: number, trackId?: string): { project: Project; id: string } {
  const track = p.tracks.find(t => t.id === trackId && t.kind === kind) ?? p.tracks.find(t => t.kind === kind)
  if (!track) return addClip(p, kind, { ...clip, start: at })
  const under = track.clips.find(c => at > c.start && at < clipEnd(c))
  const point = under ? (at - under.start < clipEnd(under) - at ? under.start : clipEnd(under)) : at
  const id = uid()
  const shifted = { ...track, clips: [...track.clips.map(c => c.start >= point ? { ...c, start: c.start + clip.duration } : c), { ...clip, id, start: point }] }
  return { project: normalize(touch({ ...p, tracks: p.tracks.map(t => t === track ? shifted : t) })), id }
}

export function moveTrack(p: Project, from: number, to: number): Project {
  if (from === to || to < 0 || to >= p.tracks.length) return p
  const tracks = [...p.tracks]
  const [t] = tracks.splice(from, 1)
  tracks.splice(to, 0, t)
  return touch({ ...p, tracks })
}

export const isLocked = (p: Project, clipId: string) => !!findClip(p, clipId)?.track.locked

export function toggleMarker(p: Project, frame: number): Project {
  const list = p.markers ?? []
  const near = list.find(m => Math.abs(m - frame) <= 2)
  return touch({ ...p, markers: near !== undefined ? list.filter(m => m !== near) : [...list, frame].sort((a, b) => a - b) })
}

/** Ties clips together: clicking one selects all, and they move as one. */
export function groupClips(p: Project, ids: string[]): Project {
  if (ids.length < 2) return p
  const group = uid('g')
  return touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.map(c => ids.includes(c.id) ? { ...c, group } : c) })) })
}

export function ungroupClips(p: Project, ids: string[]): Project {
  const groups = new Set(p.tracks.flatMap(t => t.clips.filter(c => ids.includes(c.id) && c.group).map(c => c.group)))
  return touch({ ...p, tracks: p.tracks.map(t => ({ ...t, clips: t.clips.map(c => c.group && groups.has(c.group) ? { ...c, group: undefined } : c) })) })
}

/** The clip and every clip grouped with it. */
export function withGroup(p: Project, id: string): string[] {
  const c = findClip(p, id)?.clip
  return c?.group ? p.tracks.flatMap(t => t.clips.filter(x => x.group === c.group).map(x => x.id)) : [id]
}
