// Copy and paste of clips, keeping their kinds and the gaps between them.
import { addClip } from './ops'
import type { Clip, Project, TrackKind } from './types'

export type ClipboardItem = { kind: TrackKind; clip: Clip }

export function copyClips(p: Project, ids: string[]): ClipboardItem[] {
  return p.tracks.flatMap(t => t.clips.filter(c => ids.includes(c.id)).map(clip => ({ kind: t.kind, clip })))
}

/** Pastes at `at`: the earliest copied clip lands there and the others keep their offsets. */
export function pasteClips(p: Project, items: ClipboardItem[], at: number): { project: Project; ids: string[] } {
  const base = Math.min(...items.map(i => i.clip.start))
  const ids: string[] = []
  let project = p
  for (const { kind, clip } of items) {
    const r = addClip(project, kind, { ...clip, group: undefined, start: at + clip.start - base })
    project = r.project
    ids.push(r.id)
  }
  return { project, ids }
}
