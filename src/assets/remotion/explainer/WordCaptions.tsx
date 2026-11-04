import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, Mark, ff, palette, progress, type ExplainerColors } from './theme'

/** A word of the narration and the frames when it is spoken. */
export type TimedWord = { text: string; start: number; end: number; key?: boolean }

/**
 * Times a script when there is no alignment from the voice yet: words in [[double brackets]] are keywords,
 * each word lasts a little longer the longer it is, and punctuation adds a pause.
 */
export function timeWords(script: string, startFrame = 10, framesPerChar = 1.6): TimedWord[] {
  const out: TimedWord[] = []
  let t = startFrame
  for (const part of script.split(/(\[\[.*?\]\])/).filter(Boolean)) {
    const key = part.startsWith('[[')
    for (const text of (key ? part.slice(2, -2) : part).trim().split(/\s+/).filter(Boolean)) {
      const len = Math.max(6, Math.round(text.length * framesPerChar + 3))
      out.push({ text, start: t, end: t + len, key })
      t += len + (/[.!?]$/.test(text) ? 10 : /[,;:]$/.test(text) ? 5 : 0)
    }
  }
  return out
}

/** Splits the words into caption pages: a new page after strong punctuation or every `max` words. */
function pages(words: TimedWord[], max: number) {
  const list: TimedWord[][] = [[]]
  for (const w of words) {
    const page = list[list.length - 1]
    page.push(w)
    if (page.length >= max || /[.!?]$/.test(w.text)) list.push([])
  }
  return list.filter((p) => p.length)
}

export type WordCaptionsProps = {
  /** Words with timings (from the voice's alignment, or timeWords(script)). */
  words: TimedWord[]
  /** What plays behind the captions (a scene, a photo, a video). */
  children?: ReactNode
  /** Most words on screen at once. */
  maxWords?: number
  /** "video": white words over footage. "paper": dark words for paper scenes (put them on a light strip). */
  variant?: 'video' | 'paper'
  /** Caption size and distance from the bottom, in px at 1080p. */
  size?: number
  bottom?: number
  colors?: Partial<ExplainerColors>
}

export const WORD_CAPTIONS_DURATION = 330

/**
 * Captions that follow the narration word by word: the page of words appears, the spoken word lights up,
 * and keywords get the highlighter, so the video still makes sense with the sound off.
 */
export function WordCaptions({ words, children, maxWords = 5, variant = 'video', size = 92, bottom = 110, colors }: WordCaptionsProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = Math.min(width, height) / 1080
  const page = pages(words, maxWords).find((p, i, all) => frame >= p[0].start - 2 && (i === all.length - 1 || frame < all[i + 1][0].start - 2))
  const pageIn = page ? progress(frame, page[0].start - 2, 6) : 0
  const pageOut = page ? 1 - progress(frame, page[page.length - 1].end + 14, 8) : 0

  return (
    <AbsoluteFill>
      {children}
      {page && <div style={{ position: 'absolute', left: 120 * s, right: 120 * s, bottom: bottom * s, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: `${6 * s}px ${22 * s}px`,
        opacity: pageIn * pageOut, transform: `translateY(${(1 - pageIn) * 18 * s}px)` }}>
        {page.map((w, i) => {
          const spoken = frame >= w.start
          const now = frame >= w.start && frame < w.end
          const pop = progress(frame, w.start, 5)
          const paper = variant === 'paper'
          const text = <span style={{ display: 'inline-block', ...ff(FONT.head), fontWeight: 800, fontSize: size * s, lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: 0.5 * s,
            color: paper ? (spoken ? c.ink : 'rgba(28,27,25,.3)') : spoken ? (w.key ? c.ink : '#FFFFFF') : 'rgba(255,255,255,.55)', transform: `scale(${now ? 1 + 0.08 * (1 - Math.abs(pop * 2 - 1)) : 1})`,
            textShadow: paper || (w.key && spoken) ? 'none' : `0 ${4 * s}px ${14 * s}px rgba(0,0,0,.55), 0 0 ${3 * s}px rgba(0,0,0,.8)` }}>{w.text}</span>
          return <span key={`${w.start}-${i}`}>{w.key ? <Mark amount={progress(frame, w.start, 6)} seed={`cap-${w.start}`} color={c.marker}>{text}</Mark> : text}</span>
        })}
      </div>}
    </AbsoluteFill>
  )
}
