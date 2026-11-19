// Volume over time: clip volume, fade in/out and ducking (music gets quieter while someone talks).
import { media } from './data'
import { clipEnd } from './ops'
import type { Clip, Project } from './types'

export const isVoice = (c: Clip) => media(c.props.fileId)?.role === 'voz'
export const isMusic = (c: Clip) => media(c.props.fileId)?.role === 'musica'

/** Timeline ranges [start, end) where a voice clip plays. */
export function voiceRanges(p: Project): [number, number][] {
  return p.tracks.filter(t => t.kind === 'audio' && !t.muted).flatMap(t => t.clips.filter(isVoice).map(c => [c.start, clipEnd(c)] as [number, number]))
}

/** Volume 0–1 of a clip at `frame` (relative to the clip start). */
export function volumeAt(p: Project, c: Clip, frame: number, voices = voiceRanges(p)): number {
  let v = c.props.volume ?? 1
  const fi = c.props.fadeIn ?? 0, fo = c.props.fadeOut ?? 0
  if (fi > 0 && frame < fi) v *= frame / fi
  if (fo > 0 && frame > c.duration - fo) v *= Math.max(0, (c.duration - frame) / fo)
  if (p.ducking?.on && isMusic(c)) {
    const t = c.start + frame
    if (voices.some(([a, b]) => t >= a && t < b)) v *= p.ducking.level
  }
  return Math.max(0, Math.min(1, v))
}
