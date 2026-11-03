import { useCurrentFrame, useVideoConfig } from 'remotion'
import { FONT, ff, Mark, Paper, palette, progress, type ExplainerColors, type MarkKind } from './theme'

export type HighlightHeadlineProps = {
  /** Small line above the headline, like a section label. */
  kicker?: string
  /** The headline. Wrap the words to mark in [[double brackets]]: "O ChatGPT agora [[emite nota fiscal]]". */
  text: string
  /** How the marked words are drawn. */
  mark?: MarkKind
  markColor?: string
  /** Line under the headline (serif, smaller). */
  dek?: string
  align?: 'left' | 'center'
  colors?: Partial<ExplainerColors>
}

export const HIGHLIGHT_HEADLINE_DURATION = 150

type Segment = { words: string[]; marked: boolean }
function parse(text: string): Segment[] {
  return text.split(/(\[\[.*?\]\])/).filter(Boolean).map((part) => {
    const marked = part.startsWith('[[') && part.endsWith(']]')
    return { marked, words: (marked ? part.slice(2, -2) : part).trim().split(/\s+/).filter(Boolean) }
  }).filter((s) => s.words.length)
}

/**
 * Headline that appears word by word, then a hand-made mark (highlighter, underline,
 * circle or strike-through) is drawn on the marked words, one phrase after another.
 */
export function HighlightHeadline({ kicker, text, mark = 'marcador', markColor, dek, align = 'left', colors }: HighlightHeadlineProps) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const c = palette(colors)
  const s = width / 1080
  const segments = parse(text)
  const wordCount = segments.reduce((n, seg) => n + seg.words.length, 0)
  const wordsDone = 10 + wordCount * 3
  let wordIndex = 0
  let markIndex = 0

  const word = (w: string, key: string, gap = true) => {
    const i = wordIndex++
    const p = progress(frame, 10 + i * 3, 10)
    return <span key={key} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 30 * s}px)`, marginRight: gap ? '0.24em' : 0 }}>{w}</span>
  }

  return (
    <Paper color={c.paper}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, padding: `0 ${90 * s}px`, gap: 34 * s }}>
        {kicker && <div style={{ display: 'flex', alignItems: 'center', gap: 16 * s, opacity: progress(frame, 0, 10) }}>
          <span style={{ width: 54 * s * progress(frame, 0, 14), height: 6 * s, background: c.red }} />
          <span style={{ ...ff(FONT.head), fontWeight: 700, fontSize: 40 * s, letterSpacing: 4 * s, textTransform: 'uppercase', color: c.red }}>{kicker}</span>
        </div>}
        <h1 style={{ margin: 0, ...ff(FONT.head), fontWeight: 800, fontSize: (height > width ? 120 : 108) * s, lineHeight: 1.04, letterSpacing: -1 * s, color: c.ink, maxWidth: '100%' }}>
          {segments.map((seg, si) => {
            if (!seg.marked) return seg.words.map((w, wi) => word(w, `${si}-${wi}`))
            const start = wordsDone + 6 + markIndex++ * 14
            const color = markColor ?? (mark === 'marcador' ? c.marker : c.red)
            // A circle goes around the whole phrase; the other marks sweep word by word, so a long phrase can wrap.
            if (mark === 'circulo') return <span key={si} style={{ marginRight: '0.24em' }}>
              <Mark amount={progress(frame, start, 16)} kind={mark} color={color} seed={`${text}-${si}`}>
                {seg.words.map((w, wi) => word(w, `${si}-${wi}`, wi < seg.words.length - 1))}
              </Mark>
            </span>
            const per = 16 / seg.words.length
            return seg.words.map((w, wi) => {
              const last = wi === seg.words.length - 1
              return <span key={`${si}-${wi}`} style={{ marginRight: last ? '0.24em' : 0 }}>
                <Mark amount={progress(frame, start + wi * per, per, (t) => t)} kind={mark} color={color} seed={`${text}-${si}-${wi}`}>
                  <span style={{ paddingRight: last ? 0 : '0.24em' }}>{word(w, 'w', false)}</span>
                </Mark>
              </span>
            })
          })}
        </h1>
        {dek && <p style={{ margin: 0, ...ff(FONT.serif), fontSize: 46 * s, lineHeight: 1.35, color: c.text, maxWidth: 860 * s, opacity: progress(frame, wordsDone + 20, 14), transform: `translateY(${(1 - progress(frame, wordsDone + 20, 14)) * 16 * s}px)` }}>{dek}</p>}
      </div>
    </Paper>
  )
}
